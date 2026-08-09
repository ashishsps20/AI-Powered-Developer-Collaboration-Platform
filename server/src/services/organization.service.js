import { Organization } from '../models/Organization.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { assertOrganizationAccess } from './access.service.js';
import { logActivity } from './activity.service.js';
import { createNotification } from './notification.service.js';

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function uniqueSlug(base) {
  let slug = base;
  let counter = 1;
  while (await Organization.findOne({ slug })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

export async function createOrganization(user, payload) {
  const baseSlug = slugify(payload.name);
  if (!baseSlug) throw new ApiError(400, 'Invalid organization name');

  const slug = await uniqueSlug(baseSlug);
  const organization = await Organization.create({
    name: payload.name,
    slug,
    description: payload.description || '',
    owner: user.id,
  });

  await OrganizationMember.create({
    organization: organization._id,
    user: user.id,
    role: 'ADMIN',
    invitedBy: user.id,
  });

  await logActivity({
    type: 'MEMBER_ADDED',
    message: `${user.name} created organization ${organization.name}`,
    actorId: user.id,
    organizationId: organization._id,
    metadata: { organizationId: organization._id.toString() },
  });

  return organization;
}

export async function listOrganizationsForUser(user) {
  if (user.role === 'ADMIN') {
    return Organization.find({ isActive: true }).sort({ createdAt: -1 });
  }
  const memberships = await OrganizationMember.find({ user: user.id }).select('organization');
  const orgIds = memberships.map((m) => m.organization);
  return Organization.find({ _id: { $in: orgIds }, isActive: true }).sort({ createdAt: -1 });
}

export async function getOrganizationById(orgId, user) {
  await assertOrganizationAccess(orgId, user, 'DEVELOPER');
  const organization = await Organization.findById(orgId);
  if (!organization || !organization.isActive) {
    throw new ApiError(404, 'Organization not found');
  }
  return organization;
}

export async function updateOrganization(orgId, user, payload) {
  await assertOrganizationAccess(orgId, user, 'PROJECT_MANAGER');
  const organization = await Organization.findById(orgId);
  if (!organization || !organization.isActive) {
    throw new ApiError(404, 'Organization not found');
  }

  if (payload.name) organization.name = payload.name;
  if (payload.description !== undefined) organization.description = payload.description;
  await organization.save();
  return organization;
}

export async function listOrganizationMembers(orgId, user) {
  await assertOrganizationAccess(orgId, user, 'DEVELOPER');
  return OrganizationMember.find({ organization: orgId })
    .populate('user', 'name email avatar role isActive')
    .sort({ createdAt: 1 });
}

export async function inviteOrganizationMember(orgId, user, { email, role }) {
  await assertOrganizationAccess(orgId, user, 'PROJECT_MANAGER');

  const targetUser = await User.findOne({ email: email.toLowerCase() });
  if (!targetUser) {
    throw new ApiError(404, 'User with this email was not found');
  }

  const existing = await OrganizationMember.findOne({
    organization: orgId,
    user: targetUser._id,
  });
  if (existing) {
    throw new ApiError(409, 'User is already a member of this organization');
  }

  const member = await OrganizationMember.create({
    organization: orgId,
    user: targetUser._id,
    role: role || 'DEVELOPER',
    invitedBy: user.id,
  });

  await logActivity({
    type: 'MEMBER_ADDED',
    message: `${targetUser.name} was added to the organization`,
    actorId: user.id,
    organizationId: orgId,
    metadata: { userId: targetUser._id.toString(), role: member.role },
  });

  await createNotification({
    userId: targetUser._id.toString(),
    type: 'ORG_INVITE',
    title: 'Organization invitation',
    message: `You were added to an organization by ${user.name}`,
    data: { organizationId: orgId.toString() },
  });

  return member.populate('user', 'name email avatar role');
}

export async function updateOrganizationMemberRole(orgId, user, memberId, role) {
  await assertOrganizationAccess(orgId, user, 'ADMIN');
  const member = await OrganizationMember.findOne({ _id: memberId, organization: orgId });
  if (!member) throw new ApiError(404, 'Member not found');
  member.role = role;
  await member.save();
  return member.populate('user', 'name email avatar role');
}

export async function removeOrganizationMember(orgId, user, memberId) {
  await assertOrganizationAccess(orgId, user, 'ADMIN');
  const member = await OrganizationMember.findOne({ _id: memberId, organization: orgId });
  if (!member) throw new ApiError(404, 'Member not found');

  const organization = await Organization.findById(orgId);
  if (organization.owner.toString() === member.user.toString()) {
    throw new ApiError(400, 'Cannot remove the organization owner');
  }

  await member.deleteOne();
  return { removed: true };
}
