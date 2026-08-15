import mongoose from 'mongoose';
import organizationService from '../services/organization.service.js';

export const requireOrganizationMember = async (req, res, next) => {
  try {
    const organizationId = req.params.organizationId;
    
    if (!organizationId || !mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization ID'
      });
    }

    const membership = await organizationService.getMembership(req.user.id, organizationId);

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this organization'
      });
    }

    req.organizationMembership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireOrganizationOwner = async (req, res, next) => {
  // Can be combined with requireOrganizationMember or ran sequentially
  if (!req.organizationMembership) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this organization'
    });
  }

  if (req.organizationMembership.role !== 'OWNER') {
    return res.status(403).json({
      success: false,
      message: 'Organization Owner permission required'
    });
  }

  next();
};
