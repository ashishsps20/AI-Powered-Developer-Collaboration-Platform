import mongoose from 'mongoose';

const organizationInvitationSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['MEMBER'],
      default: 'MEMBER',
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
      default: 'PENDING',
      required: true,
    },
    acceptedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    }
  },
  { timestamps: true }
);

// Indexes
// For fast lookup of pending invitations for a specific email in an org
organizationInvitationSchema.index({ organization: 1, email: 1, status: 1 });
// For fast lookup by raw token hash (when accepting/rejecting)
organizationInvitationSchema.index({ tokenHash: 1 });
// Optional index on expiresAt for cleanup jobs
organizationInvitationSchema.index({ expiresAt: 1 });

const OrganizationInvitation = mongoose.model('OrganizationInvitation', organizationInvitationSchema);

export default OrganizationInvitation;
