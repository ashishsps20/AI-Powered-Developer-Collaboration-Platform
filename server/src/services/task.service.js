import { Task } from '../models/Task.js';
import { ApiError } from '../utils/ApiError.js';
import { assertProjectAccess, assertProjectMemberUser } from './access.service.js';
import { logActivity } from './activity.service.js';
import { createNotification } from './notification.service.js';

async function nextTaskKey(projectId) {
  const count = await Task.countDocuments({ project: projectId });
  return `TASK-${count + 1}`;
}

export async function createTask(projectId, user, payload) {
  await assertProjectAccess(projectId, user, 'PROJECT_MANAGER');

  if (payload.assignee) {
    await assertProjectMemberUser(projectId, payload.assignee);
  }

  const task = await Task.create({
    title: payload.title,
    description: payload.description || '',
    project: projectId,
    creator: user.id,
    assignee: payload.assignee || null,
    priority: payload.priority || 'MEDIUM',
    status: payload.status || 'TODO',
    labels: payload.labels || [],
    dueDate: payload.dueDate,
    estimatedMinutes: payload.estimatedMinutes,
    actualMinutes: payload.actualMinutes,
    sprint: payload.sprint || null,
    taskKey: await nextTaskKey(projectId),
  });

  await logActivity({
    type: 'TASK_CREATED',
    message: `Task "${task.title}" was created`,
    actorId: user.id,
    projectId,
    metadata: { taskId: task._id.toString() },
  });

  if (task.assignee) {
    await logActivity({
      type: 'TASK_ASSIGNED',
      message: `Task "${task.title}" was assigned`,
      actorId: user.id,
      projectId,
      metadata: { taskId: task._id.toString(), assigneeId: task.assignee.toString() },
    });
    await createNotification({
      userId: task.assignee.toString(),
      type: 'TASK_ASSIGNED',
      title: 'Task assigned',
      message: `You were assigned: ${task.title}`,
      data: { taskId: task._id.toString(), projectId: projectId.toString() },
    });
  }

  return task;
}

export async function listTasksByProject(projectId, user) {
  await assertProjectAccess(projectId, user, 'DEVELOPER');
  return Task.find({ project: projectId })
    .sort({ createdAt: -1 })
    .populate('assignee', 'name email avatar')
    .populate('creator', 'name email avatar');
}

export async function getTaskById(taskId, user) {
  const task = await Task.findById(taskId)
    .populate('assignee', 'name email avatar')
    .populate('creator', 'name email avatar');
  if (!task) throw new ApiError(404, 'Task not found');
  await assertProjectAccess(task.project.toString(), user, 'DEVELOPER');
  return task;
}

export async function updateTask(taskId, user, payload) {
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');

  const access = await assertProjectAccess(task.project.toString(), user, 'DEVELOPER');
  const isManager = access.role === 'PROJECT_MANAGER' || access.role === 'ADMIN';
  const isAssignee = task.assignee?.toString() === user.id;

  if (!isManager && !isAssignee) {
    throw new ApiError(403, 'You cannot update this task');
  }

  const previousStatus = task.status;
  const previousAssignee = task.assignee?.toString();

  if (isManager) {
    if (payload.title !== undefined) task.title = payload.title;
    if (payload.description !== undefined) task.description = payload.description;
    if (payload.priority !== undefined) task.priority = payload.priority;
    if (payload.labels !== undefined) task.labels = payload.labels;
    if (payload.dueDate !== undefined) task.dueDate = payload.dueDate;
    if (payload.estimatedMinutes !== undefined) task.estimatedMinutes = payload.estimatedMinutes;
    if (payload.actualMinutes !== undefined) task.actualMinutes = payload.actualMinutes;
    if (payload.sprint !== undefined) task.sprint = payload.sprint;
    if (payload.assignee !== undefined) {
      if (payload.assignee) await assertProjectMemberUser(task.project.toString(), payload.assignee);
      task.assignee = payload.assignee || null;
    }
  }

  if (payload.status !== undefined) {
    if (!isManager && !['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'].includes(payload.status)) {
      throw new ApiError(403, 'Invalid status update');
    }
    task.status = payload.status;
  }

  await task.save();

  if (payload.assignee && payload.assignee !== previousAssignee) {
    await logActivity({
      type: 'TASK_ASSIGNED',
      message: `Task "${task.title}" was assigned`,
      actorId: user.id,
      projectId: task.project,
      metadata: { taskId: task._id.toString() },
    });
    await createNotification({
      userId: payload.assignee,
      type: 'TASK_ASSIGNED',
      title: 'Task assigned',
      message: `You were assigned: ${task.title}`,
      data: { taskId: task._id.toString(), projectId: task.project.toString() },
    });
  }

  if (task.status === 'COMPLETED' && previousStatus !== 'COMPLETED') {
    await logActivity({
      type: 'TASK_COMPLETED',
      message: `Task "${task.title}" was completed`,
      actorId: user.id,
      projectId: task.project,
      metadata: { taskId: task._id.toString() },
    });
  }

  return task;
}

export async function deleteTask(taskId, user) {
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');
  await assertProjectAccess(task.project.toString(), user, 'PROJECT_MANAGER');
  await task.deleteOne();
  return { deleted: true };
}
