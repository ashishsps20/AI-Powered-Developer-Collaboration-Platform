import issueService from '../services/issue.service.js';

class IssueController {
  async createIssue(req, res, next) {
    try {
      const issue = await issueService.createIssue(req.project._id, req.user.id, req.body);
      res.status(201).json({ success: true, data: { issue } });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async getIssues(req, res, next) {
    try {
      const issues = await issueService.getIssues(req.project._id, req.query);
      res.status(200).json({ success: true, data: { issues } });
    } catch (error) {
      next(error);
    }
  }

  async getIssue(req, res, next) {
    try {
      const issue = await issueService.getIssueById(req.params.issueId, req.project._id);
      res.status(200).json({ success: true, data: { issue } });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ success: false, message: 'Invalid issue ID' });
      }
      next(error);
    }
  }

  async updateIssue(req, res, next) {
    try {
      // req.issue is set by requireIssueUpdatePermission
      const updatedIssue = await issueService.updateIssue(req.issue, req.body, req.user.id);
      res.status(200).json({ success: true, data: { issue: updatedIssue } });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async deleteIssue(req, res, next) {
    try {
      await issueService.deleteIssue(req.issue, req.user.id);
      res.status(200).json({ success: true, message: 'Issue deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new IssueController();
