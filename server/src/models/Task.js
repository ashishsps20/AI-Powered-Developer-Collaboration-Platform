import mongoose from 'mongoose';
import { TASK_PRIORITIES, TASK_STATUSES } from '../utils/constants.js';

const taskSchema = new mongoose.Schema(
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
      enum: TASK_PRIORITIES,
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'TODO',
    },
    labels: {
      type: [String],
      default: [],
    },
    dueDate: { type: Date },
    estimatedMinutes: { type: Number, min: 0 },
    actualMinutes: { type: Number, min: 0 },
    sprint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
      default: null,
    },
    githubReferences: {
      type: [String],
      default: [],
    },
    taskKey: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ project: 1, assignee: 1 });
taskSchema.index({ sprint: 1 });

export const Task = mongoose.model('Task', taskSchema);
