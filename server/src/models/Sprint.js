import mongoose from 'mongoose';
import { SPRINT_STATUSES } from '../utils/constants.js';

const sprintSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    goal: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: SPRINT_STATUSES,
      default: 'PLANNED',
    },
  },
  { timestamps: true }
);

sprintSchema.index({ project: 1, status: 1 });

export const Sprint = mongoose.model('Sprint', sprintSchema);
