import mongoose from 'mongoose';
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from '../utils/constants.js';

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      maxlength: 10000,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    priority: {
      type: String,
      enum: ISSUE_PRIORITIES,
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ISSUE_STATUSES,
      default: 'OPEN',
    },
    labels: {
      type: [String],
      default: [],
    },
    relatedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    githubIssueReference: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

issueSchema.index({ project: 1, status: 1 });

export const Issue = mongoose.model('Issue', issueSchema);
