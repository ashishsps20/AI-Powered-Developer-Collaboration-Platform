import { OrganizationMember } from '../models/OrganizationMember.js';
import { ProjectMember } from '../models/ProjectMember.js';
import { Project } from '../models/Project.js';
import { ApiError } from '../utils/ApiError.js';
import { meetsRoleRequirement } from '../utils/constants.js';

export function isPlatformAdmin(user) {
  return user?.role === 'ADMIN';
}

export async function getOrganizationMembership(organizationId, userId) {
  return OrganizationMember.findOne({ organization: organizationId, user: userId }).populate(
    'user',
    'name email avatar role'
  );
}

export async function assertOrganizationAccess(
  organizationId,
  user,
  minimumRole = 'DEVELOPER'
) {
  if (isPlatformAdmin(user)) {
    return { role: 'ADMIN', organization: organizationId };
  }

  const membership = await getOrganizationMembership(organizationId, user.id);
  if (!membership) {
    throw new ApiError(403, 'You are not a member of this organization');
  }
  if (!meetsRoleRequirement(membership.role, minimumRole)) {
    throw new ApiError(403, 'Insufficient organization permissions');
  }
  return membership;
}

export async function getProjectMembership(projectId, userId) {
  return ProjectMember.findOne({ project: projectId, user: userId }).populate(
    'user',
    'name email avatar role'
  );
}

export async function assertProjectAccess(projectId, user, minimumRole = 'DEVELOPER') {
  if (isPlatformAdmin(user)) {
    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, 'Project not found');
    return { role: 'ADMIN', project };
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const orgMembership = await getOrganizationMembership(
    project.organization,
    user.id
  );
  if (orgMembership?.role === 'ADMIN') {
    return { role: 'ADMIN', project, orgMembership };
  }

  const projectMembership = await getProjectMembership(projectId, user.id);
  if (!projectMembership) {
    throw new ApiError(403, 'You are not a member of this project');
  }
  if (!meetsRoleRequirement(projectMembership.role, minimumRole)) {
    throw new ApiError(403, 'Insufficient project permissions');
  }

  return { ...projectMembership.toObject(), project };
}

export async function assertProjectMemberUser(projectId, targetUserId) {
  const membership = await ProjectMember.findOne({
    project: projectId,
    user: targetUserId,
  });
  if (!membership) {
    throw new ApiError(400, 'Assignee must be a member of this project');
  }
}
