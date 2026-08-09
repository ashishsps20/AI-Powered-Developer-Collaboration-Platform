import mongoose from 'mongoose';
import { ORG_ROLES } from '../utils/constants.js';

const organizationMemberSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ORG_ROLES,
      default: 'DEVELOPER',
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

organizationMemberSchema.index({ organization: 1, user: 1 }, { unique: true });

export const OrganizationMember = mongoose.model(
  'OrganizationMember',
  organizationMemberSchema
);
