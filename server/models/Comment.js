import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    entityType: {
      type: String,
      enum: ['TASK', 'ISSUE'],
      required: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 5000
    },
    mentions: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: []
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying comments on a specific entity within a project
commentSchema.index({ project: 1, entityType: 1, entityId: 1, createdAt: -1 });

// Index for finding comments mentioning specific users
commentSchema.index({ mentions: 1 });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
