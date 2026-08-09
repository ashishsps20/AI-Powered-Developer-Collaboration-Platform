import { Comment } from '../models/Comment.js';
import { Issue } from '../models/Issue.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { ApiError } from '../utils/ApiError.js';
import { assertProjectAccess } from './access.service.js';

async function resolveCommentTarget(targetType, targetId) {
  if (targetType === 'PROJECT') {
    const project = await Project.findById(targetId);
    if (!project) throw new ApiError(404, 'Project not found');
    return { projectId: project._id.toString() };
  }
  if (targetType === 'TASK') {
    const task = await Task.findById(targetId);
    if (!task) throw new ApiError(404, 'Task not found');
    return { projectId: task.project.toString() };
  }
  if (targetType === 'ISSUE') {
    const issue = await Issue.findById(targetId);
    if (!issue) throw new ApiError(404, 'Issue not found');
    return { projectId: issue.project.toString() };
  }
  throw new ApiError(400, 'Invalid comment target type');
}

export async function createComment(user, payload) {
  const { projectId } = await resolveCommentTarget(payload.targetType, payload.targetId);
  await assertProjectAccess(projectId, user, 'DEVELOPER');

  return Comment.create({
    author: user.id,
    content: payload.content,
    targetType: payload.targetType,
    targetId: payload.targetId,
    project: projectId,
  });
}

export async function listComments(user, { targetType, targetId }) {
  const { projectId } = await resolveCommentTarget(targetType, targetId);
  await assertProjectAccess(projectId, user, 'DEVELOPER');

  return Comment.find({ targetType, targetId })
    .sort({ createdAt: 1 })
    .populate('author', 'name email avatar');
}

export async function updateComment(commentId, user, payload) {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, 'Comment not found');
  if (comment.author.toString() !== user.id) {
    throw new ApiError(403, 'You can only edit your own comments');
  }
  await assertProjectAccess(comment.project.toString(), user, 'DEVELOPER');

  comment.content = payload.content;
  comment.isEdited = true;
  await comment.save();
  return comment;
}

export async function deleteComment(commentId, user) {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, 'Comment not found');

  const access = await assertProjectAccess(comment.project.toString(), user, 'DEVELOPER');
  const isAuthor = comment.author.toString() === user.id;
  const isManager = access.role === 'PROJECT_MANAGER' || access.role === 'ADMIN';

  if (!isAuthor && !isManager) {
    throw new ApiError(403, 'You cannot delete this comment');
  }

  await comment.deleteOne();
  return { deleted: true };
}
