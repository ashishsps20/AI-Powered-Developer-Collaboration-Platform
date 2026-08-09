import mongoose from 'mongoose';
import { CHANNEL_TYPES } from '../utils/constants.js';

const channelSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: CHANNEL_TYPES,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

channelSchema.index({ project: 1, type: 1 });
channelSchema.index({ participants: 1 });

export const Channel = mongoose.model('Channel', channelSchema);
