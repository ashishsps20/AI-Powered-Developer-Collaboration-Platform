import express from 'express';
import aiController from '../controllers/ai.controller.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

// mounted at /api/organizations/:organizationId/projects/:projectId/ai
// We need mergeParams to access projectId and organizationId
const router = express.Router({ mergeParams: true });

// Apply AI specific rate limiter to all AI routes
router.use(aiLimiter);

// Chat endpoints
router.post('/chat', aiController.chat);

// Conversation management
router.post('/conversations', aiController.createConversation);
router.get('/conversations', aiController.getConversations);
router.get('/conversations/:conversationId/messages', aiController.getMessages);
router.delete('/conversations/:conversationId', aiController.deleteConversation);

export default router;
