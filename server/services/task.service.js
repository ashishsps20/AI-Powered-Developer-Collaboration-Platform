import Task from '../models/Task.js';
import ProjectMember from '../models/ProjectMember.js';
import { activityService } from './activity.service.js';

class TaskService {
  async createTask(projectId, userId, data) {
    const { title, description, priority, assignedTo, dueDate, labels, status } = data;

    // Validate assignedTo
    if (assignedTo) {
      const isMember = await ProjectMember.findOne({ project: projectId, user: assignedTo, isActive: true });
      if (!isMember) {
        throw { status: 400, message: 'Assigned user is not a member of this project' };
      }
    }

    // Determine position (append to end of TODO by default)
    const lastTask = await Task.findOne({ project: projectId, status: 'TODO' }).sort('-position');
    const position = lastTask ? lastTask.position + 1000 : 1000;

    const task = new Task({
      project: projectId,
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate,
      labels,
      createdBy: userId,
      position,
    });

    await task.save();
    
    await activityService.createActivity({
      projectId,
      actorId: userId,
      action: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: task._id
    });

    return task.populate('assignedTo createdBy', 'name email avatar');
  }

  async getTasks(projectId, filters = {}) {
    const query = { project: projectId };

    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;

    return Task.find(query)
      .populate('assignedTo', 'name email avatar')
      .sort({ position: 1, createdAt: -1 });
  }

  async getTaskById(taskId, projectId) {
    const task = await Task.findOne({ _id: taskId, project: projectId })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (!task) {
      throw { status: 404, message: 'Task not found' };
    }
    return task;
  }

  async updateTask(task, data, userId) {
    const allowedFields = ['title', 'description', 'priority', 'assignedTo', 'dueDate', 'labels', 'status'];
    let statusChangedToDone = false;
    let statusChangedFromDone = false;

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'status') {
          if (data.status === 'DONE' && task.status !== 'DONE') {
            statusChangedToDone = true;
          } else if (data.status !== 'DONE' && task.status === 'DONE') {
            statusChangedFromDone = true;
          }
        }
        
        if (field === 'assignedTo' && data[field]) {
          const isMember = await ProjectMember.findOne({ project: task.project, user: data[field], isActive: true });
          if (!isMember) {
            throw { status: 400, message: 'Assigned user is not a member of this project' };
          }
        }

        task[field] = data[field];
      }
    }

    if (statusChangedToDone) {
      task.completedAt = new Date();
    } else if (statusChangedFromDone) {
      task.completedAt = undefined;
    }

    const oldAssignee = task.assignedTo;

    await task.save();

    if (data.assignedTo && data.assignedTo.toString() !== oldAssignee?.toString()) {
      await activityService.createActivity({
        projectId: task.project,
        actorId: userId,
        action: 'TASK_ASSIGNED',
        entityType: 'TASK',
        entityId: task._id,
        metadata: {
          previousAssigneeId: oldAssignee ? oldAssignee.toString() : null,
          newAssigneeId: data.assignedTo.toString()
        }
      });
    }

    await activityService.createActivity({
      projectId: task.project,
      actorId: userId,
      action: 'TASK_UPDATED',
      entityType: 'TASK',
      entityId: task._id
    });

    return task.populate('assignedTo', 'name email avatar');
  }

  async updateTaskStatus(task, status, userId) {
    if (!['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].includes(status)) {
      throw { status: 400, message: 'Invalid status' };
    }

    if (status === 'DONE' && task.status !== 'DONE') {
      task.completedAt = new Date();
    } else if (status !== 'DONE' && task.status === 'DONE') {
      task.completedAt = undefined;
    }

    const oldStatus = task.status;
    task.status = status;
    await task.save();

    await activityService.createActivity({
      projectId: task.project,
      actorId: userId,
      action: 'TASK_STATUS_CHANGED',
      entityType: 'TASK',
      entityId: task._id,
      metadata: {
        oldStatus,
        newStatus: status
      }
    });

    return task.populate('assignedTo', 'name email avatar');
  }

  async updateTaskPosition(task, status, position, userId) {
    if (status && !['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].includes(status)) {
      throw { status: 400, message: 'Invalid status' };
    }

    const oldStatus = task.status;
    
    if (status) {
      if (status === 'DONE' && task.status !== 'DONE') {
        task.completedAt = new Date();
      } else if (status !== 'DONE' && task.status === 'DONE') {
        task.completedAt = undefined;
      }
      task.status = status;
    }
    
    if (position !== undefined) {
      task.position = Number(position);
    }

    await task.save();

    if (status && status !== oldStatus) {
      await activityService.createActivity({
        projectId: task.project,
        actorId: userId,
        action: 'TASK_STATUS_CHANGED',
        entityType: 'TASK',
        entityId: task._id,
        metadata: {
          oldStatus,
          newStatus: status
        }
      });
    }

    return task.populate('assignedTo', 'name email avatar');
  }

  async deleteTask(task, userId) {
    await Task.deleteOne({ _id: task._id });

    await activityService.createActivity({
      projectId: task.project,
      actorId: userId,
      action: 'TASK_DELETED',
      entityType: 'TASK',
      entityId: task._id
    });
  }
}

export default new TaskService();
