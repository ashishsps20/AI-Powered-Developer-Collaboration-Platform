import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';

/**
 * Middleware to ensure the authenticated user is a member of the project
 * Expects req.user, req.organizationMembership, and req.params.projectId to be set.
 * Should be placed AFTER requireOrganizationMember.
 */
export const requireProjectMember = async (req, res, next) => {
  try {
    const { projectId, organizationId } = req.params;

    // Verify project exists and belongs to the organization
    const project = await Project.findOne({
      _id: projectId,
      organization: organizationId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found in this organization',
      });
    }

    // Check project membership
    const membership = await ProjectMember.findOne({
      project: projectId,
      user: req.user.id,
      isActive: true,
    });

    // If they are the organization owner, they should still be able to access the project
    // even if they don't have a specific project membership record, 
    // OR we can strictly require them to add themselves. 
    // The instructions say: "Organization Owner can: view project, manage project, manage project members..."
    // So if they are an OWNER, they bypass the strictly required ProjectMember record for viewing/managing.
    
    if (!membership && req.organizationMembership.role !== 'OWNER') {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this project',
      });
    }

    // Attach project and membership to request for downstream use
    req.project = project;
    req.projectMembership = membership || { role: 'OWNER_BYPASS' };

    next();
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Invalid project ID',
      });
    }
    next(error);
  }
};

/**
 * Middleware to ensure the authenticated user is a PROJECT_MANAGER or ORGANIZATION OWNER.
 * Must be used AFTER requireProjectMember.
 */
export const requireProjectManager = (req, res, next) => {
  if (
    req.organizationMembership.role === 'OWNER' ||
    (req.projectMembership && req.projectMembership.role === 'PROJECT_MANAGER')
  ) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'This action requires Project Manager or Organization Owner role',
    });
  }
};
