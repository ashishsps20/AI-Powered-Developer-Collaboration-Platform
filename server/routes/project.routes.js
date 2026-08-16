import express from 'express';
import projectController from '../controllers/project.controller.js';
import { requireOrganizationMember, requireOrganizationOwner } from '../middleware/organization.middleware.js';
import { requireProjectMember, requireProjectManager } from '../middleware/project.middleware.js';

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

export default router;
