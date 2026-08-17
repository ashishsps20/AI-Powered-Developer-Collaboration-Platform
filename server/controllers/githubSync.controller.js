import { githubSyncService } from '../services/githubSync.service.js';

class GithubSyncController {
  async getSettings(req, res, next) {
    try {
      const { projectId } = req.params;
      const settings = await githubSyncService.getSyncSettings(projectId);
      res.status(200).json({ success: true, data: { settings } });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const { projectId } = req.params;
      const updates = req.body;
      const settings = await githubSyncService.updateSyncSettings(projectId, updates);
      res.status(200).json({ success: true, data: { settings } });
    } catch (error) {
      next(error);
    }
  }

  async linkTaskToPullRequest(req, res, next) {
    try {
      const { projectId, taskId } = req.params;
      const { pullRequestNumber } = req.body;
      const userId = req.user.id;
      const { organizationMembership, projectMembership } = req;
      
      const link = await githubSyncService.linkTaskToPullRequest(
        projectId, taskId, pullRequestNumber, userId, organizationMembership, projectMembership
      );
      res.status(200).json({ success: true, data: { link } });
    } catch (error) {
      next(error);
    }
  }

  async unlinkTaskFromPullRequest(req, res, next) {
    try {
      const { projectId, taskId, pullRequestNumber } = req.params;
      const userId = req.user.id;
      const { organizationMembership, projectMembership } = req;
      
      await githubSyncService.unlinkTaskFromPullRequest(
        projectId, taskId, pullRequestNumber, userId, organizationMembership, projectMembership
      );
      res.status(200).json({ success: true, message: 'Successfully unlinked' });
    } catch (error) {
      next(error);
    }
  }

  async getTaskGitHubLinks(req, res, next) {
    try {
      const { projectId, taskId } = req.params;
      const data = await githubSyncService.getTaskGitHubLinks(projectId, taskId, req.user.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async linkIssueToGithubIssue(req, res, next) {
    try {
      const { projectId, issueId } = req.params;
      const { issueNumber } = req.body;
      const userId = req.user.id;
      const { organizationMembership, projectMembership } = req;
      
      const link = await githubSyncService.linkIssueToGithubIssue(
        projectId, issueId, issueNumber, userId, organizationMembership, projectMembership
      );
      res.status(200).json({ success: true, data: { link } });
    } catch (error) {
      next(error);
    }
  }

  async unlinkIssueFromGithubIssue(req, res, next) {
    try {
      const { projectId, issueId, issueNumber } = req.params;
      const userId = req.user.id;
      const { organizationMembership, projectMembership } = req;
      
      await githubSyncService.unlinkIssueFromGithubIssue(
        projectId, issueId, issueNumber, userId, organizationMembership, projectMembership
      );
      res.status(200).json({ success: true, message: 'Successfully unlinked' });
    } catch (error) {
      next(error);
    }
  }

  async getIssueGitHubLinks(req, res, next) {
    try {
      const { projectId, issueId } = req.params;
      const data = await githubSyncService.getIssueGitHubLinks(projectId, issueId, req.user.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const githubSyncController = new GithubSyncController();
