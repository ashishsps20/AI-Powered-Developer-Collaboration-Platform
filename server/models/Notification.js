import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    type: {
      type: String,
      enum: [
        'TASK_ASSIGNED',
        'ISSUE_ASSIGNED',
        'MENTION',
        'PROJECT_INVITATION',
        'PROJECT_MANAGER_CHANGED',
        'TASK_STATUS_CHANGED',
        'COMMENT_ON_TASK',
        'COMMENT_ON_ISSUE',
        'GITHUB_PR_LINKED',
        'GITHUB_PR_MERGED',
        'GITHUB_SYNC',
        'PROJECT_MEMBER_ADDED'
      ],
      required: true,
    },
    entityType: {
      type: String,
      enum: [
        'TASK',
        'ISSUE',
        'COMMENT',
        'PROJECT',
        'GITHUB_PR',
        'GITHUB_ISSUE',
        'PROJECT_MEMBER'
      ],
    },
    entityId: {
      type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ project: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
