import express from 'express';
import issueController from '../controllers/issue.controller.js';
import {
  requireIssueUpdatePermission,
  requireIssueDeletePermission,
} from '../middleware/issue.middleware.js';

// mounted at /api/organizations/:organizationId/projects/:projectId/issues
const router = express.Router({ mergeParams: true });

// GET all issues for project
router.get('/', issueController.getIssues);

// GET single issue
router.get('/:issueId', issueController.getIssue);

// POST create issue (Any project member can create an issue)
router.post('/', issueController.createIssue);

// PATCH update issue (Any project member can update an issue, but we still use middleware to fetch issue)
router.patch('/:issueId', requireIssueUpdatePermission, issueController.updateIssue);

// DELETE issue (Requires Project Manager or Owner)
router.delete('/:issueId', requireIssueDeletePermission, issueController.deleteIssue);

export default router;
