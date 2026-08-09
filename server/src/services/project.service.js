import { OrganizationMember } from '../models/OrganizationMember.js';
import { Project } from '../models/Project.js';
import { ProjectMember } from '../models/ProjectMember.js';
import { ApiError } from '../utils/ApiError.js';
import {
  assertOrganizationAccess,
  assertProjectAccess,
  getOrganizationMembership,
  getProjectMembership,
} from './access.service.js';
import { logActivity } from './activity.service.js';
import { createNotification } from './notification.service.js';

export async function createProject(user, payload) {
  await assertOrganizationAccess(payload.organizationId, user, 'PROJECT_MANAGER');

  const project = await Project.create({
    name: payload.name,
    description: payload.description || '',
    owner: user.id,
    organization: payload.organizationId,
    startDate: payload.startDate,
    deadline: payload.deadline,
    status: payload.status || 'PLANNING',
    priority: payload.priority || 'MEDIUM',
    technologyStack: payload.technologyStack || [],
  });

  await ProjectMember.create({
    project: project._id,
    user: user.id,
    role: 'PROJECT_MANAGER',
  });

  if (payload.memberIds?.length) {
    for (const memberId of payload.memberIds) {
      if (memberId === user.id) continue;
      await ProjectMember.updateOne(
        { project: project._id, user: memberId },
        { project: project._id, user: memberId, role: 'DEVELOPER' },
        { upsert: true }
      );
    }
  }

  await logActivity({
    type: 'PROJECT_CREATED',
    message: `Project "${project.name}" was created`,
    actorId: user.id,
    organizationId: project.organization,
    projectId: project._id,
    metadata: { projectId: project._id.toString() },
  });

  return project;
}

export async function listProjects(user, { organizationId } = {}) {
  if (user.role === 'ADMIN') {
    const filter = organizationId
      ? { organization: organizationId, isArchived: false }
      : { isArchived: false };
    return Project.find(filter).sort({ updatedAt: -1 });
  }

  if (organizationId) {
    const orgMembership = await getOrganizationMembership(organizationId, user.id);
    if (!orgMembership) {
      throw new ApiError(403, 'You are not a member of this organization');
    }
    if (orgMembership.role === 'ADMIN') {
      return Project.find({ organization: organizationId, isArchived: false }).sort({
        updatedAt: -1,
      });
    }
    const memberships = await ProjectMember.find({ user: user.id }).select('project');
    const projectIds = memberships.map((m) => m.project);
    return Project.find({
      _id: { $in: projectIds },
      organization: organizationId,
      isArchived: false,
    }).sort({ updatedAt: -1 });
  }

  const memberships = await ProjectMember.find({ user: user.id }).select('project');
  const projectIds = memberships.map((m) => m.project);
  return Project.find({ _id: { $in: projectIds }, isArchived: false }).sort({ updatedAt: -1 });
}

export async function getProjectById(projectId, user) {
  await assertProjectAccess(projectId, user, 'DEVELOPER');
  const project = await Project.findById(projectId);
  if (!project || project.isArchived) {
    throw new ApiError(404, 'Project not found');
  }
  return project;
}

export async function updateProject(projectId, user, payload) {
  await assertProjectAccess(projectId, user, 'PROJECT_MANAGER');
  const project = await Project.findById(projectId);
  if (!project || project.isArchived) throw new ApiError(404, 'Project not found');

  const fields = [
    'name',
    'description',
    'startDate',
    'deadline',
    'status',
    'priority',
    'technologyStack',
  ];
  for (const field of fields) {
    if (payload[field] !== undefined) project[field] = payload[field];
  }
  await project.save();
  return project;
}

export async function deleteProject(projectId, user) {
  await assertProjectAccess(projectId, user, 'PROJECT_MANAGER');
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  project.isArchived = true;
  project.status = 'ARCHIVED';
  await project.save();
  return project;
}

export async function addProjectMember(projectId, user, { userId, role }) {
  await assertProjectAccess(projectId, user, 'PROJECT_MANAGER');
  const existing = await getProjectMembership(projectId, userId);
  if (existing) throw new ApiError(409, 'User is already a project member');

  const member = await ProjectMember.create({
    project: projectId,
    user: userId,
    role: role || 'DEVELOPER',
  });

  await createNotification({
    userId,
    type: 'PROJECT_ADDED',
    title: 'Added to project',
    message: `You were added to a project by ${user.name}`,
    data: { projectId: projectId.toString() },
  });

  return member;
}
