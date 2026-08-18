import express from 'express';
import projectController from '../controllers/project.controller.js';
import { requireOrganizationMember, requireOrganizationOwner } from '../middleware/organization.middleware.js';
import { requireProjectMember, requireProjectManager } from '../middleware/project.middleware.js';
import taskRoutes from './task.routes.js';
import issueRoutes from './issue.routes.js';
import commentRoutes from './comment.routes.js';
import activityRoutes from './activity.routes.js';
import { projectGithubRouter } from './github.routes.js';
import githubSyncRoutes from './githubSync.routes.js';
import aiRoutes from './ai.routes.js';
import knowledgeRoutes from './knowledge.routes.js';

// Note: mergeParams is required because the router is mounted with /:organizationId/projects
const router = express.Router({ mergeParams: true });

// All routes require the user to be a member of the organization
router.use(requireOrganizationMember);

// List all projects in the organization
router.get('/', projectController.getOrganizationProjects);

// Create a new project (Owner only)
router.post('/', requireOrganizationOwner, projectController.createProject);

// View a specific project
router.get('/:projectId', requireProjectMember, projectController.getProject);

// List members of a specific project
router.get('/:projectId/members', requireProjectMember, projectController.getProjectMembers);

// Add a member to a project (Project Manager or Owner only)
router.post('/:projectId/members', requireProjectMember, requireProjectManager, projectController.addProjectMember);

// Remove a member from a project (Project Manager or Owner only)
router.delete('/:projectId/members/:userId', requireProjectMember, requireProjectManager, projectController.removeProjectMember);

// Reassign Project Manager (Project Manager or Owner only)
router.patch('/:projectId/manager', requireProjectMember, requireProjectManager, projectController.reassignProjectManager);

// Mount Task routes
router.use('/:projectId/tasks', requireProjectMember, taskRoutes);

// Mount Issue routes
router.use('/:projectId/issues', requireProjectMember, issueRoutes);

// Mount Comment routes
router.use('/:projectId/comments', requireProjectMember, commentRoutes);

// Mount Activity routes
router.use('/:projectId/activity', requireProjectMember, activityRoutes);

// Mount GitHub project routes
router.use('/:projectId/github', requireProjectMember, projectGithubRouter);

// Mount GitHub Sync routes
router.use('/:projectId', requireProjectMember, githubSyncRoutes);

// Mount AI routes
router.use('/:projectId/ai', requireProjectMember, aiRoutes);

// Mount Knowledge routes
router.use('/:projectId/knowledge', requireProjectMember, knowledgeRoutes);

export default router;
