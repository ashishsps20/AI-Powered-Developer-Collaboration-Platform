import aiService from '../services/ai/ai.service.js';

class AIController {
  async chat(req, res, next) {
    try {
      const response = await aiService.chat(
        req.project.organization,
        req.project._id,
        req.user.id,
        req.body
      );
      
      res.status(200).json({
        success: true,
        data: response
      });
    } catch (error) {
      if (error.message === 'Conversation not found or unauthorized') {
        return res.status(403).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async createConversation(req, res, next) {
    try {
      // Actually handled internally by chat if conversationId is omitted, 
      // but we can expose a dedicated one if needed for the UI.
      const conversation = await aiService.createConversation(
        req.project.organization,
        req.project._id,
        req.user.id,
        req.body.title || 'New Conversation'
      );
      
      res.status(201).json({
        success: true,
        data: { conversation }
      });
    } catch (error) {
      next(error);
    }
  }

  async getConversations(req, res, next) {
    try {
      const conversations = await aiService.getConversations(
        req.project._id,
        req.user.id
      );
      
      res.status(200).json({
        success: true,
        data: { conversations }
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {
      const { conversationId } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const skip = parseInt(req.query.skip) || 0;

      const messages = await aiService.getMessages(
        req.project._id,
        req.user.id,
        conversationId,
        limit,
        skip
      );
      
      res.status(200).json({
        success: true,
        data: { messages }
      });
    } catch (error) {
      if (error.message === 'Conversation not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async deleteConversation(req, res, next) {
    try {
      const { conversationId } = req.params;
      
      await aiService.deleteConversation(
        req.project._id,
        req.user.id,
        conversationId
      );
      
      res.status(200).json({
        success: true,
        message: 'Conversation deleted successfully'
      });
    } catch (error) {
      if (error.status === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }
}

export default new AIController();
