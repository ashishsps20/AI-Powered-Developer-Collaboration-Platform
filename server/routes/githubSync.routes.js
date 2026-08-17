import express from 'express';
import { githubSyncController } from '../controllers/githubSync.controller.js';
import { requireProjectManager } from '../middleware/project.middleware.js';

const router = express.Router({ mergeParams: true });

// Settings
router.get('/github/settings', githubSyncController.getSettings);
router.patch('/github/settings', requireProjectManager, githubSyncController.updateSettings);

// Tasks
router.post('/tasks/:taskId/github/pull-request', githubSyncController.linkTaskToPullRequest);
router.get('/tasks/:taskId/github', githubSyncController.getTaskGitHubLinks);
router.delete('/tasks/:taskId/github/pull-request/:pullRequestNumber', githubSyncController.unlinkTaskFromPullRequest);

// Issues
router.post('/issues/:issueId/github/issue', githubSyncController.linkIssueToGithubIssue);
router.get('/issues/:issueId/github', githubSyncController.getIssueGitHubLinks);
router.delete('/issues/:issueId/github/issue/:issueNumber', githubSyncController.unlinkIssueFromGithubIssue);

export default router;
