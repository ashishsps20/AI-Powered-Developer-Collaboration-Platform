import mongoose from 'mongoose';
import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
} from '../utils/constants.js';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      default: '',
      maxlength: 5000,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    startDate: { type: Date },
    deadline: { type: Date },
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: 'PLANNING',
    },
    priority: {
      type: String,
      enum: PROJECT_PRIORITIES,
      default: 'MEDIUM',
    },
    technologyStack: {
      type: [String],
      default: [],
    },
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

projectSchema.index({ organization: 1, name: 1 });
projectSchema.index({ organization: 1, status: 1 });

export const Project = mongoose.model('Project', projectSchema);
