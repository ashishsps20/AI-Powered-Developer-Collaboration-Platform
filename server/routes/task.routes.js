import express from 'express';
import taskController from '../controllers/task.controller.js';
import {
  requireTaskCreatePermission,
  requireTaskUpdatePermission,
  requireTaskDeletePermission,
} from '../middleware/task.middleware.js';

// mounted at /api/organizations/:organizationId/projects/:projectId/tasks
// We need mergeParams to access projectId and organizationId
const router = express.Router({ mergeParams: true });

// GET all tasks for project
router.get('/', taskController.getTasks);

// GET single task
router.get('/:taskId', taskController.getTask);

// POST create task (Requires Project Manager or Owner)
router.post('/', requireTaskCreatePermission, taskController.createTask);

// PATCH update task (Permissions checked inside middleware based on task)
router.patch('/:taskId', requireTaskUpdatePermission, taskController.updateTask);

// PATCH update task status
router.patch('/:taskId/status', requireTaskUpdatePermission, taskController.updateTaskStatus);

// PATCH update task position (Kanban)
router.patch('/:taskId/position', requireTaskUpdatePermission, taskController.updateTaskPosition);

// DELETE task (Requires Project Manager or Owner)
router.delete('/:taskId', requireTaskDeletePermission, taskController.deleteTask);

export default router;
