import { Activity } from '../models/Activity.js';

export async function logActivity({
  type,
  message,
  actorId,
  organizationId,
  projectId,
  metadata = {},
}) {
  return Activity.create({
    type,
    message,
    actor: actorId,
    organization: organizationId,
    project: projectId,
    metadata,
  });
}

export async function listProjectActivities(projectId, limit = 30) {
  return Activity.find({ project: projectId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actor', 'name email avatar');
}
