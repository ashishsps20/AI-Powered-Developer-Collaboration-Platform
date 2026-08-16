import { activityService } from '../services/activity.service.js';

class ActivityController {
  async getProjectActivity(req, res, next) {
    try {
      const { projectId } = req.params;
      const { page, limit } = req.query;

      const result = await activityService.getProjectActivity(
        projectId,
        page ? parseInt(page) : 1,
        limit ? Math.min(parseInt(limit), 50) : 20
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ActivityController();
