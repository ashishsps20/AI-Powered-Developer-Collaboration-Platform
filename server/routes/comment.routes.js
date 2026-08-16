import express from 'express';
import commentController from '../controllers/comment.controller.js';

// Note: mergeParams is required because the router is mounted with /:organizationId/projects/:projectId/comments
const router = express.Router({ mergeParams: true });

// Create a comment
router.post('/', commentController.createComment);

// Get comments for an entity (task or issue)
router.get('/', commentController.getComments);

// Update a comment
router.patch('/:commentId', commentController.updateComment);

// Delete a comment
router.delete('/:commentId', commentController.deleteComment);

export default router;
