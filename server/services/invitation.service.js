import crypto from 'crypto';
import mongoose from 'mongoose';
import OrganizationInvitation from '../models/OrganizationInvitation.js';
import OrganizationMember from '../models/OrganizationMember.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import emailService from './email.service.js';

class InvitationService {
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async createInvitation(organizationId, targetEmail, inviterUser) {
    const email = targetEmail.toLowerCase().trim();

    // 1. Check if user already exists and is already a member
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const existingMember = await OrganizationMember.findOne({
        organization: organizationId,
        user: existingUser._id,
        isActive: true,
      });

      if (existingMember) {
        const error = new Error('This user is already a member of the organization');
        error.statusCode = 409;
        throw error;
      }
    }

    // 2. Check for duplicate active pending invitations
    const existingInvitation = await OrganizationInvitation.findOne({
      organization: organizationId,
      email,
      status: 'PENDING',
      expiresAt: { $gt: new Date() } // Still valid
    });

    if (existingInvitation) {
      const error = new Error('A pending invitation already exists for this email');
      error.statusCode = 409;
      throw error;
    }

    // 3. Generate raw token and hash it
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    // 4. Create the invitation record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const invitation = await OrganizationInvitation.create({
      organization: organizationId,
      email,
      invitedBy: inviterUser.id || inviterUser._id,
      role: 'MEMBER',
      tokenHash,
      expiresAt,
      status: 'PENDING',
    });

    // 5. Send Email
    const org = await Organization.findById(organizationId);
    await emailService.sendInvitationEmail(email, inviterUser.name, org.name, rawToken);

    // Note: Do NOT return tokenHash or rawToken to frontend in production responses.
    return {
      id: invitation._id,
      email: invitation.email,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      role: invitation.role
    };
  }

  async checkAndGetInvitation(rawToken, currentUserEmail) {
    const tokenHash = this.hashToken(rawToken);
    
    const invitation = await OrganizationInvitation.findOne({ tokenHash })
      .populate('organization')
      .populate('invitedBy', 'name');

    if (!invitation) {
      const error = new Error('Invalid invitation token');
      error.statusCode = 400;
      throw error;
    }

    // Email match check
    if (invitation.email !== currentUserEmail.toLowerCase().trim()) {
      const error = new Error('This invitation was sent to a different email address');
      error.statusCode = 403;
      throw error;
    }

    // Status check
    if (invitation.status === 'ACCEPTED') {
      const error = new Error('This invitation has already been accepted');
      error.statusCode = 400;
      throw error;
    }

    if (invitation.status === 'CANCELLED') {
      const error = new Error('This invitation has been cancelled');
      error.statusCode = 400;
      throw error;
    }

    if (invitation.status === 'REJECTED') {
      const error = new Error('This invitation has been rejected');
      error.statusCode = 400;
      throw error;
    }

    // Expiration check
    if (invitation.status === 'PENDING' && new Date() > invitation.expiresAt) {
      invitation.status = 'EXPIRED';
      await invitation.save();
      const error = new Error('This invitation has expired');
      error.statusCode = 400;
      throw error;
    }
    
    if (invitation.status === 'EXPIRED') {
      const error = new Error('This invitation has expired');
      error.statusCode = 400;
      throw error;
    }

    return invitation;
  }

  async acceptInvitation(userId, currentUserEmail, rawToken) {
    const invitation = await this.checkAndGetInvitation(rawToken, currentUserEmail);

    // Verify user is not already a member
    const existingMember = await OrganizationMember.findOne({
      user: userId,
      organization: invitation.organization._id,
    });

    if (existingMember) {
      // User is already a member - return conflict, but mark invitation accepted
      invitation.status = 'ACCEPTED';
      invitation.acceptedAt = new Date();
      await invitation.save();

      const error = new Error('User is already a member of this organization');
      error.statusCode = 409;
      throw error;
    }

    let session = null;
    let transactionSupported = false;

    // Use transactions if supported (skip in test environment without replica sets)
    if (process.env.NODE_ENV !== 'test') {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        transactionSupported = true;
      } catch (e) {
        console.warn('MongoDB transactions not supported, using non-atomic fallback.');
      }
    }

    try {
      const orgOptions = transactionSupported ? { session } : {};

      const [membership] = await OrganizationMember.create([{
        user: userId,
        organization: invitation.organization._id,
        role: 'MEMBER',
        isActive: true,
      }], orgOptions);

      invitation.status = 'ACCEPTED';
      invitation.acceptedAt = new Date();
      await invitation.save(orgOptions);

      if (transactionSupported) {
        await session.commitTransaction();
        session.endSession();
      }

      return {
        organization: {
          id: invitation.organization._id,
          name: invitation.organization.name,
          slug: invitation.organization.slug
        },
        membership: {
          role: membership.role
        }
      };

    } catch (error) {
      if (transactionSupported && session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw error;
    }
  }

  async rejectInvitation(currentUserEmail, rawToken) {
    const invitation = await this.checkAndGetInvitation(rawToken, currentUserEmail);

    invitation.status = 'REJECTED';
    invitation.rejectedAt = new Date();
    await invitation.save();

    return true;
  }

  async getPendingInvitations(currentUserEmail) {
    const email = currentUserEmail.toLowerCase().trim();
    
    const invitations = await OrganizationInvitation.find({
      email,
      status: 'PENDING',
    })
      .populate('organization', 'name slug')
      .populate('invitedBy', 'name');

    // Filter out expired ones and update them in background
    const validInvitations = [];
    const now = new Date();

    for (const inv of invitations) {
      if (now > inv.expiresAt) {
        inv.status = 'EXPIRED';
        await inv.save();
      } else {
        validInvitations.push(inv);
      }
    }

    return validInvitations.map(inv => ({
      id: inv._id,
      organization: {
        id: inv.organization._id,
        name: inv.organization.name,
        slug: inv.organization.slug
      },
      invitedBy: {
        id: inv.invitedBy._id,
        name: inv.invitedBy.name
      },
      role: inv.role,
      expiresAt: inv.expiresAt
    }));
  }

  async cancelInvitation(organizationId, invitationId) {
    if (!mongoose.Types.ObjectId.isValid(invitationId)) {
      const error = new Error('Invalid invitation ID');
      error.statusCode = 400;
      throw error;
    }

    const invitation = await OrganizationInvitation.findOne({
      _id: invitationId,
      organization: organizationId
    });

    if (!invitation) {
      const error = new Error('Invitation not found');
      error.statusCode = 404;
      throw error;
    }

    if (invitation.status !== 'PENDING') {
      const error = new Error('Only pending invitations can be cancelled');
      error.statusCode = 400;
      throw error;
    }

    invitation.status = 'CANCELLED';
    invitation.cancelledAt = new Date();
    await invitation.save();

    return true;
  }
}

export default new InvitationService();
