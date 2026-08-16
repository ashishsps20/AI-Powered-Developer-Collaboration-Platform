import Task from '../models/Task.js';

/**
 * Middleware to check if user can create a task.
 * Allowed: OWNER (via bypass), PROJECT_MANAGER.
 * Not Allowed: DEVELOPER.
 */
export const requireTaskCreatePermission = (req, res, next) => {
  if (
    req.organizationMembership.role === 'OWNER' ||
    (req.projectMembership && req.projectMembership.role === 'PROJECT_MANAGER')
  ) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Only Project Managers or Organization Owners can create tasks',
    });
  }
};

/**
 * Middleware to check if user can update a task.
 * Allowed: OWNER, PROJECT_MANAGER can update ANY task.
 * DEVELOPER can update ONLY tasks assigned to them, or tasks they created.
 * We must fetch the task first to check its assignee/creator.
 */
export const requireTaskUpdatePermission = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findOne({ _id: taskId, project: req.project._id });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found in this project',
      });
    }

    const isOwnerOrManager =
      req.organizationMembership.role === 'OWNER' ||
      (req.projectMembership && req.projectMembership.role === 'PROJECT_MANAGER');

    const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user.id.toString();
    const isCreator = task.createdBy && task.createdBy.toString() === req.user.id.toString();

    if (isOwnerOrManager || isAssignee || isCreator) {
      req.task = task; // Attach task to req to avoid refetching
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to update this task',
      });
    }
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Invalid task ID',
      });
    }
    next(error);
  }
};

/**
 * Middleware to check if user can delete a task.
 * Allowed: OWNER, PROJECT_MANAGER.
 * Not Allowed: DEVELOPER.
 */
export const requireTaskDeletePermission = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findOne({ _id: taskId, project: req.project._id });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found in this project',
      });
    }

    if (
      req.organizationMembership.role === 'OWNER' ||
      (req.projectMembership && req.projectMembership.role === 'PROJECT_MANAGER')
    ) {
      req.task = task;
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Only Project Managers or Organization Owners can delete tasks',
      });
    }
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Invalid task ID',
      });
    }
    next(error);
  }
};
