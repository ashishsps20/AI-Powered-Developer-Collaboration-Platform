import mongoose from 'mongoose';

const organizationMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    role: {
      type: String,
      enum: ['OWNER', 'MEMBER'],
      default: 'MEMBER',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate membership
organizationMemberSchema.index({ user: 1, organization: 1 }, { unique: true });

const OrganizationMember = mongoose.model('OrganizationMember', organizationMemberSchema);

export default OrganizationMember;
