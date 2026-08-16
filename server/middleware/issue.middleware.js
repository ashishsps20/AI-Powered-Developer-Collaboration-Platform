import Issue from '../models/Issue.js';

/**
 * Middleware to check if user can update an issue.
 * Any project member can update an issue.
 * We fetch the issue here and attach it to req.
 */
export const requireIssueUpdatePermission = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const issue = await Issue.findOne({ _id: issueId, project: req.project._id });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found in this project',
      });
    }

    req.issue = issue;
    next();
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Invalid issue ID',
      });
    }
    next(error);
  }
};

/**
 * Middleware to check if user can delete an issue.
 * Allowed: OWNER, PROJECT_MANAGER.
 * Not Allowed: DEVELOPER.
 */
export const requireIssueDeletePermission = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const issue = await Issue.findOne({ _id: issueId, project: req.project._id });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found in this project',
      });
    }

    if (
      req.organizationMembership.role === 'OWNER' ||
      (req.projectMembership && req.projectMembership.role === 'PROJECT_MANAGER')
    ) {
      req.issue = issue;
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Only Project Managers or Organization Owners can delete issues',
      });
    }
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Invalid issue ID',
      });
    }
    next(error);
  }
};
