import { commentService } from '../services/comment.service.js';

class CommentController {
  async createComment(req, res, next) {
    try {
      const { projectId } = req.params;
      const data = req.body;

      const comment = await commentService.createComment(projectId, req.user.id, data);

      res.status(201).json({
        success: true,
        data: { comment }
      });
    } catch (error) {
      next(error);
    }
  }

  async getComments(req, res, next) {
    try {
      const { projectId } = req.params;
      const { entityType, entityId, page, limit } = req.query;

      if (!entityType || !entityId) {
        return res.status(400).json({
          success: false,
          message: 'entityType and entityId are required parameters'
        });
      }

      const result = await commentService.getComments(
        projectId,
        entityType,
        entityId,
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

  async updateComment(req, res, next) {
    try {
      const { projectId, commentId } = req.params;
      const { content } = req.body;

      const comment = await commentService.updateComment(projectId, commentId, req.user.id, content);

      res.status(200).json({
        success: true,
        data: { comment }
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req, res, next) {
    try {
      const { projectId, commentId } = req.params;

      const comment = await commentService.deleteComment(projectId, commentId, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully',
        data: { comment }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CommentController();
