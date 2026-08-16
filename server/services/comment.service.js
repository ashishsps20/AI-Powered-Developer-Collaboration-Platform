import mongoose from 'mongoose';
import Comment from '../models/Comment.js';
import Task from '../models/Task.js';
import Issue from '../models/Issue.js';
import ProjectMember from '../models/ProjectMember.js';
import { activityService } from './activity.service.js';

class CommentService {
  /**
   * Helper to verify if the entity exists and belongs to the project
   */
  async verifyEntity(projectId, entityType, entityId) {
    if (entityType === 'TASK') {
      const task = await Task.findOne({ _id: entityId, project: projectId });
      if (!task) throw new Error('Task not found or does not belong to this project');
      return task;
    } else if (entityType === 'ISSUE') {
      const issue = await Issue.findOne({ _id: entityId, project: projectId });
      if (!issue) throw new Error('Issue not found or does not belong to this project');
      return issue;
    }
    throw new Error('Invalid entity type');
  }

  /**
   * Verify mentions are valid project members
   */
  async validateMentions(projectId, userIds) {
    if (!userIds || !userIds.length) return [];
    
    // Ensure unique IDs
    const uniqueIds = [...new Set(userIds)];
    
    const members = await ProjectMember.find({
      project: projectId,
      user: { $in: uniqueIds }
    });
    
    // We only return the IDs that actually exist in the project
    return members.map(m => m.user.toString());
  }

  /**
   * Create a new comment
   */
  async createComment(projectId, authorId, data) {
    const { entityType, entityId, content, mentions = [] } = data;
    
    if (!content || !content.trim()) {
      throw new Error('Content is required');
    }

    if (content.length > 5000) {
      throw new Error('Content cannot exceed 5000 characters');
    }

    if (!['TASK', 'ISSUE'].includes(entityType)) {
      throw new Error('Invalid entityType');
    }

    await this.verifyEntity(projectId, entityType, entityId);
    const validMentions = await this.validateMentions(projectId, mentions);

    let session = null;
    let transactionSupported = false;

    if (process.env.NODE_ENV !== 'test') {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        transactionSupported = true;
      } catch (e) {
        console.warn('MongoDB transactions not supported, using non-atomic fallback.');
      }
    }

    let comment;
    
    try {
      const options = transactionSupported ? { session } : {};
      
      const newComments = await Comment.create([{
        project: projectId,
        entityType,
        entityId,
        author: authorId,
        content: content.trim(),
        mentions: validMentions
      }], options);
      
      comment = newComments[0];

      if (transactionSupported) {
        await activityService.createActivity({
          projectId,
          actorId: authorId,
          action: 'COMMENT_CREATED',
          entityType: 'COMMENT',
          entityId: comment._id,
          metadata: {
            commentEntityType: entityType,
            commentEntityId: entityId
          },
          session
        });
        await session.commitTransaction();
        session.endSession();
      } else {
        await activityService.createActivity({
          projectId,
          actorId: authorId,
          action: 'COMMENT_CREATED',
          entityType: 'COMMENT',
          entityId: comment._id,
          metadata: {
            commentEntityType: entityType,
            commentEntityId: entityId
          }
        });
      }
    } catch (error) {
      if (transactionSupported && session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw error;
    }

    return await Comment.findById(comment._id).populate('author', 'name avatar email');
  }

  /**
   * Get paginated comments for an entity
   */
  async getComments(projectId, entityType, entityId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const query = {
      project: projectId,
      entityType,
      entityId
    };

    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatar email')
      .populate('mentions', 'name email');

    // Filter soft-deleted content for response
    const formattedComments = comments.map(comment => {
      const doc = comment.toObject();
      if (doc.isDeleted) {
        doc.content = 'Comment deleted';
      }
      return doc;
    });

    const total = await Comment.countDocuments(query);

    return {
      comments: formattedComments,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update a comment (author only)
   */
  async updateComment(projectId, commentId, authorId, content) {
    if (!content || !content.trim()) {
      throw new Error('Content is required');
    }

    if (content.length > 5000) {
      throw new Error('Content cannot exceed 5000 characters');
    }

    const comment = await Comment.findOne({ _id: commentId, project: projectId });
    if (!comment) throw new Error('Comment not found');
    
    if (comment.author.toString() !== authorId.toString()) {
      throw new Error('Not authorized to edit this comment');
    }
    
    if (comment.isDeleted) {
      throw new Error('Cannot edit a deleted comment');
    }

    let session = null;
    let transactionSupported = false;

    if (process.env.NODE_ENV !== 'test') {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        transactionSupported = true;
      } catch (e) {
        console.warn('MongoDB transactions not supported, using non-atomic fallback.');
      }
    }

    try {
      const options = transactionSupported ? { session } : {};

      comment.content = content.trim();
      comment.isEdited = true;
      comment.editedAt = new Date();
      await comment.save(options);

      if (transactionSupported) {
        await activityService.createActivity({
          projectId,
          actorId: authorId,
          action: 'COMMENT_UPDATED',
          entityType: 'COMMENT',
          entityId: comment._id,
          metadata: {
            commentEntityType: comment.entityType,
            commentEntityId: comment.entityId
          },
          session
        });
        await session.commitTransaction();
        session.endSession();
      } else {
        await activityService.createActivity({
          projectId,
          actorId: authorId,
          action: 'COMMENT_UPDATED',
          entityType: 'COMMENT',
          entityId: comment._id,
          metadata: {
            commentEntityType: comment.entityType,
            commentEntityId: comment.entityId
          }
        });
      }
    } catch (error) {
      if (transactionSupported && session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw error;
    }

    return await Comment.findById(comment._id).populate('author', 'name avatar email');
  }

  /**
   * Soft delete a comment (author only initially)
   */
  async deleteComment(projectId, commentId, authorId) {
    const comment = await Comment.findOne({ _id: commentId, project: projectId });
    if (!comment) throw new Error('Comment not found');
    
    if (comment.author.toString() !== authorId.toString()) {
      throw new Error('Not authorized to delete this comment');
    }

    if (comment.isDeleted) {
      return comment; // Already deleted
    }

    let session = null;
    let transactionSupported = false;

    if (process.env.NODE_ENV !== 'test') {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        transactionSupported = true;
      } catch (e) {
        console.warn('MongoDB transactions not supported, using non-atomic fallback.');
      }
    }

    try {
      const options = transactionSupported ? { session } : {};

      comment.isDeleted = true;
      comment.deletedAt = new Date();
      await comment.save(options);

      if (transactionSupported) {
        await activityService.createActivity({
          projectId,
          actorId: authorId,
          action: 'COMMENT_DELETED',
          entityType: 'COMMENT',
          entityId: comment._id,
          metadata: {
            commentEntityType: comment.entityType,
            commentEntityId: comment.entityId
          },
          session
        });
        await session.commitTransaction();
        session.endSession();
      } else {
        await activityService.createActivity({
          projectId,
          actorId: authorId,
          action: 'COMMENT_DELETED',
          entityType: 'COMMENT',
          entityId: comment._id,
          metadata: {
            commentEntityType: comment.entityType,
            commentEntityId: comment.entityId
          }
        });
      }
    } catch (error) {
      if (transactionSupported && session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw error;
    }

    return comment;
  }
}

export const commentService = new CommentService();
export default commentService;
