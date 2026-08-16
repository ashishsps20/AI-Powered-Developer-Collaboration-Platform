import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    type: {
      type: String,
      enum: ['BUG', 'FEATURE', 'IMPROVEMENT', 'QUESTION'],
      default: 'BUG',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    labels: [
      {
        type: String,
        trim: true,
      }
    ],
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
issueSchema.index({ project: 1, status: 1 });
issueSchema.index({ project: 1, assignedTo: 1 });
issueSchema.index({ project: 1, priority: 1 });

const Issue = mongoose.model('Issue', issueSchema);

export default Issue;
