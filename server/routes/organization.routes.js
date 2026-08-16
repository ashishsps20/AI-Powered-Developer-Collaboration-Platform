import express from 'express';
import organizationController from '../controllers/organization.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireOrganizationMember, requireOrganizationOwner } from '../middleware/organization.middleware.js';
import invitationController from '../controllers/invitation.controller.js';
import projectRoutes from './project.routes.js';

const router = express.Router();

router.use(requireAuth); // All org routes require auth

router.post('/', organizationController.createOrganization);
router.get('/', organizationController.getUserOrganizations);

// Global user invitations (No :organizationId needed)
// These routes must be defined before /:organizationId so they aren't parsed as an ID
router.post('/invitations/accept', invitationController.acceptInvitation);
router.post('/invitations/reject', invitationController.rejectInvitation);
router.get('/invitations/pending', invitationController.getPendingInvitations);

// Organization specific routes
router.get('/:organizationId', requireOrganizationMember, organizationController.getOrganization);
router.get('/:organizationId/members', requireOrganizationMember, organizationController.getMembers);

// Mount Project routes
router.use('/:organizationId/projects', projectRoutes);

// Owner only routes
router.get('/:organizationId/invitations', requireOrganizationMember, requireOrganizationOwner, invitationController.getOrganizationInvitations);
router.post('/:organizationId/invitations', requireOrganizationMember, requireOrganizationOwner, invitationController.createInvitation);
router.delete('/:organizationId/invitations/:invitationId', requireOrganizationMember, requireOrganizationOwner, invitationController.cancelInvitation);
router.delete('/:organizationId/members/:userId', requireOrganizationMember, requireOrganizationOwner, organizationController.removeMember);

export default router;
