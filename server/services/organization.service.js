import mongoose from 'mongoose';
import Organization from '../models/Organization.js';
import OrganizationMember from '../models/OrganizationMember.js';
import slugify from '../utils/slugify.js';

class OrganizationService {
  async generateUniqueSlug(name) {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;

    while (await Organization.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  async createOrganization(userId, data) {
    const { name, description } = data;
    const slug = await this.generateUniqueSlug(name);

    let session = null;
    let transactionSupported = false;

    // Local/test MongoDB without replica sets does not support transactions or retryable writes
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
      // 1. Create Organization
      const orgOptions = transactionSupported ? { session } : {};
      const [organization] = await Organization.create(
        [
          {
            name,
            slug,
            description: description || '',
            createdBy: userId,
            isActive: true,
          },
        ],
        orgOptions
      );

      // 2. Create Membership (Owner)
      const [membership] = await OrganizationMember.create(
        [
          {
            user: userId,
            organization: organization._id,
            role: 'OWNER',
            isActive: true,
          },
        ],
        orgOptions
      );

      if (transactionSupported) {
        await session.commitTransaction();
        session.endSession();
      }

      return {
        organization: {
          id: organization._id,
          name: organization.name,
          slug: organization.slug,
          description: organization.description,
          createdBy: organization.createdBy,
          isActive: organization.isActive,
        },
        membership: {
          role: membership.role,
        },
      };
    } catch (error) {
      if (transactionSupported && session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw error;
    }
  }

  async getUserOrganizations(userId) {
    const memberships = await OrganizationMember.find({ user: userId, isActive: true })
      .populate('organization')
      .lean();

    const organizations = memberships
      .filter((m) => m.organization && m.organization.isActive)
      .map((m) => ({
        id: m.organization._id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
      }));

    return organizations;
  }

  async getOrganizationById(organizationId) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      const error = new Error('Invalid organization ID');
      error.statusCode = 400;
      throw error;
    }

    const organization = await Organization.findOne({ _id: organizationId, isActive: true }).lean();
    if (!organization) {
      const error = new Error('Organization not found');
      error.statusCode = 404;
      throw error;
    }

    return organization;
  }

  async getMembership(userId, organizationId) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return null;
    }
    
    return await OrganizationMember.findOne({
      user: userId,
      organization: organizationId,
      isActive: true,
    }).lean();
  }

  async getMembers(organizationId) {
    const memberships = await OrganizationMember.find({ 
      organization: organizationId,
      isActive: true
    })
      .populate('user', 'name email avatar')
      .lean();

    return memberships.map(m => ({
      id: m.user._id,
      user: {
        id: m.user._id,
        name: m.user.name,
        email: m.user.email,
        avatar: m.user.avatar || null
      },
      role: m.role,
      joinedAt: m.createdAt
    }));
  }

  async removeMember(organizationId, userIdToRemove) {
    if (!mongoose.Types.ObjectId.isValid(userIdToRemove)) {
      const error = new Error('Invalid user ID');
      error.statusCode = 400;
      throw error;
    }

    const membership = await OrganizationMember.findOne({
      organization: organizationId,
      user: userIdToRemove
    });

    if (!membership) {
      const error = new Error('User is not a member of this organization');
      error.statusCode = 404;
      throw error;
    }

    if (membership.role === 'OWNER') {
      const error = new Error('The organization owner cannot be removed');
      error.statusCode = 403;
      throw error;
    }

    await OrganizationMember.deleteOne({ _id: membership._id });

    return true;
  }
}

export default new OrganizationService();
