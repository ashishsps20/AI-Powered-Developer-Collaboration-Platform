import express from 'express';
import activityController from '../controllers/activity.controller.js';

// Note: mergeParams is required because the router is mounted with /:organizationId/projects/:projectId/activity
const router = express.Router({ mergeParams: true });

// Get project activity feed
router.get('/', activityController.getProjectActivity);

export default router;
