import { Sprint } from '../models/Sprint.js';
import { Task } from '../models/Task.js';
import { ApiError } from '../utils/ApiError.js';
import { assertProjectAccess } from './access.service.js';
import { logActivity } from './activity.service.js';

export function calculateSprintMetrics(tasks, sprint) {
  const now = new Date();
  const sprintTasks = tasks.filter(
    (t) => t.sprint && t.sprint.toString() === sprint._id.toString()
  );

  const totalTasks = sprintTasks.length;
  const completedTasks = sprintTasks.filter((t) => t.status === 'COMPLETED').length;
  const pendingTasks = totalTasks - completedTasks;
  const overdueTasks = sprintTasks.filter(
    (t) => t.dueDate && t.status !== 'COMPLETED' && new Date(t.dueDate) < now
  ).length;
  const completionPercentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const completedStoryPoints = sprintTasks
    .filter((t) => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);

  const sprintDurationDays = Math.max(
    1,
    (new Date(sprint.endDate) - new Date(sprint.startDate)) / (1000 * 60 * 60 * 24)
  );
  const sprintVelocity = Math.round((completedStoryPoints / sprintDurationDays) * 10) / 10;

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    completionPercentage,
    sprintVelocity,
  };
}

export async function enrichSprint(sprint) {
  const tasks = await Task.find({ project: sprint.project, sprint: sprint._id });
  return {
    ...sprint.toObject(),
    metrics: calculateSprintMetrics(tasks, sprint),
  };
}

export async function createSprint(projectId, user, payload) {
  await assertProjectAccess(projectId, user, 'PROJECT_MANAGER');

  if (new Date(payload.endDate) <= new Date(payload.startDate)) {
    throw new ApiError(400, 'Sprint end date must be after start date');
  }

  const sprint = await Sprint.create({
    name: payload.name,
    project: projectId,
    goal: payload.goal || '',
    startDate: payload.startDate,
    endDate: payload.endDate,
    status: payload.status || 'PLANNED',
  });

  if (sprint.status === 'ACTIVE') {
    await logActivity({
      type: 'SPRINT_STARTED',
      message: `Sprint "${sprint.name}" started`,
      actorId: user.id,
      projectId,
      metadata: { sprintId: sprint._id.toString() },
    });
  }

  return enrichSprint(sprint);
}

export async function listSprintsByProject(projectId, user) {
  await assertProjectAccess(projectId, user, 'DEVELOPER');
  const sprints = await Sprint.find({ project: projectId }).sort({ startDate: -1 });
  return Promise.all(sprints.map((sprint) => enrichSprint(sprint)));
}

export async function updateSprint(sprintId, user, payload) {
  const sprint = await Sprint.findById(sprintId);
  if (!sprint) throw new ApiError(404, 'Sprint not found');
  await assertProjectAccess(sprint.project.toString(), user, 'PROJECT_MANAGER');

  const wasActive = sprint.status === 'ACTIVE';

  if (payload.name !== undefined) sprint.name = payload.name;
  if (payload.goal !== undefined) sprint.goal = payload.goal;
  if (payload.startDate !== undefined) sprint.startDate = payload.startDate;
  if (payload.endDate !== undefined) sprint.endDate = payload.endDate;
  if (payload.status !== undefined) sprint.status = payload.status;

  if (sprint.endDate <= sprint.startDate) {
    throw new ApiError(400, 'Sprint end date must be after start date');
  }

  await sprint.save();

  if (!wasActive && sprint.status === 'ACTIVE') {
    await logActivity({
      type: 'SPRINT_STARTED',
      message: `Sprint "${sprint.name}" started`,
      actorId: user.id,
      projectId: sprint.project,
      metadata: { sprintId: sprint._id.toString() },
    });
  }

  return enrichSprint(sprint);
}

export async function deleteSprint(sprintId, user) {
  const sprint = await Sprint.findById(sprintId);
  if (!sprint) throw new ApiError(404, 'Sprint not found');
  await assertProjectAccess(sprint.project.toString(), user, 'PROJECT_MANAGER');

  await Task.updateMany({ sprint: sprint._id }, { $set: { sprint: null } });
  await sprint.deleteOne();
  return { deleted: true };
}
