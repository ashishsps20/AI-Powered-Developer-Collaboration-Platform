import taskService from '../services/task.service.js';

class TaskController {
  async createTask(req, res, next) {
    try {
      const task = await taskService.createTask(req.project._id, req.user.id, req.body);
      res.status(201).json({ success: true, data: { task } });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async getTasks(req, res, next) {
    try {
      const tasks = await taskService.getTasks(req.project._id, req.query);
      res.status(200).json({ success: true, data: { tasks } });
    } catch (error) {
      next(error);
    }
  }

  async getTask(req, res, next) {
    try {
      const task = await taskService.getTaskById(req.params.taskId, req.project._id);
      res.status(200).json({ success: true, data: { task } });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ success: false, message: 'Invalid task ID' });
      }
      next(error);
    }
  }

  async updateTask(req, res, next) {
    try {
      // req.task is set by the requireTaskUpdatePermission middleware
      const updatedTask = await taskService.updateTask(req.task, req.body, req.user.id);
      res.status(200).json({ success: true, data: { task: updatedTask } });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async updateTaskStatus(req, res, next) {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
      }
      
      const updatedTask = await taskService.updateTaskStatus(req.task, status, req.user.id);
      res.status(200).json({ success: true, data: { task: updatedTask } });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async updateTaskPosition(req, res, next) {
    try {
      const { status, position } = req.body;
      const updatedTask = await taskService.updateTaskPosition(req.task, status, position, req.user.id);
      res.status(200).json({ success: true, data: { task: updatedTask } });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async deleteTask(req, res, next) {
    try {
      await taskService.deleteTask(req.task, req.user.id);
      res.status(200).json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new TaskController();
