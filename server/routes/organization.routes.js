import express from 'express';
import organizationController from '../controllers/organization.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireOrganizationMember } from '../middleware/organization.middleware.js';

const router = express.Router();

router.use(requireAuth); // All org routes require auth

router.post('/', organizationController.createOrganization);
router.get('/', organizationController.getUserOrganizations);
router.get('/:organizationId', requireOrganizationMember, organizationController.getOrganization);

export default router;
