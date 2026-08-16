import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
      // Optional, as system-generated events may not have an actor
    },
    action: {
      type: String,
      required: true
      // E.g. TASK_CREATED, TASK_STATUS_CHANGED, COMMENT_CREATED, etc.
    },
    entityType: {
      type: String,
      enum: ['PROJECT', 'TASK', 'ISSUE', 'COMMENT', 'PROJECT_MEMBER', 'GITHUB'],
      required: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Indexes for activity feeds
activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ project: 1, entityType: 1, entityId: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
