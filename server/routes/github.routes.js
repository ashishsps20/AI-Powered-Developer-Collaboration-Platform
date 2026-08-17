import express from 'express';
import { githubController } from '../controllers/github.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireProjectManager } from '../middleware/project.middleware.js';

export const globalGithubRouter = express.Router();
export const projectGithubRouter = express.Router({ mergeParams: true });

// ==========================================
// WEBHOOK (No JWT authentication)
// ==========================================
globalGithubRouter.post('/webhook', githubController.handleWebhook);

// ==========================================
// OAUTH
// ==========================================
globalGithubRouter.get('/oauth', requireAuth, githubController.getOAuthUrl);
globalGithubRouter.get('/oauth/callback', requireAuth, githubController.oauthCallback);

// ==========================================
// GLOBAL REPOSITORIES
// ==========================================
globalGithubRouter.get('/repositories', requireAuth, githubController.getRepositories);

// ==========================================
// PROJECT LEVEL GITHUB
// Mounted at: /api/organizations/:organizationId/projects/:projectId/github
// ==========================================
projectGithubRouter.post('/repository', requireProjectManager, githubController.connectRepository);
projectGithubRouter.delete('/repository', requireProjectManager, githubController.disconnectRepository);

projectGithubRouter.get('/repository', githubController.getProjectRepositoryInfo);
projectGithubRouter.get('/branches', githubController.getBranches);
projectGithubRouter.get('/commits', githubController.getCommits);
projectGithubRouter.get('/pull-requests', githubController.getPullRequests);
projectGithubRouter.get('/issues', githubController.getIssues);
