import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Issue from '../models/Issue.js';
import TaskGitHubLink from '../models/TaskGitHubLink.js';
import IssueGitHubLink from '../models/IssueGitHubLink.js';
import ProjectGitHubSettings from '../models/ProjectGitHubSettings.js';
import { githubService } from './github.service.js';
import { activityService } from './activity.service.js';

class GithubSyncService {
  async getSyncSettings(projectId) {
    let settings = await ProjectGitHubSettings.findOne({ project: projectId });
    if (!settings) {
      settings = await ProjectGitHubSettings.create({ project: projectId });
    }
    return settings;
  }

  async updateSyncSettings(projectId, updates) {
    const settings = await ProjectGitHubSettings.findOneAndUpdate(
      { project: projectId },
      { $set: updates },
      { new: true, upsert: true }
    );
    return settings;
  }

  async linkTaskToPullRequest(projectId, taskId, pullRequestNumber, userId, orgMembership, projectMembership) {
    const task = await Task.findOne({ _id: taskId, project: projectId });
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    const isOwner = orgMembership && orgMembership.role === 'OWNER';
    const isPM = projectMembership && projectMembership.role === 'PROJECT_MANAGER';
    const isAssignee = task.assignedTo && task.assignedTo.toString() === userId.toString();

    if (!isOwner && !isPM && !isAssignee) {
      const error = new Error('Not authorized to link PRs to this task');
      error.statusCode = 403;
      throw error;
    }

    const project = await Project.findById(projectId);
    if (!project || !project.githubRepository) {
      const error = new Error('No GitHub repository connected to this project');
      error.statusCode = 400;
      throw error;
    }

    const { owner, name: repo } = project.githubRepository;

    let pr;
    try {
      pr = await githubService.getPullRequest(userId, owner, repo, pullRequestNumber);
    } catch (e) {
      const error = new Error('Pull request not found in the connected repository');
      error.statusCode = 404;
      throw error;
    }

    try {
      const link = await TaskGitHubLink.create({
        task: taskId,
        project: projectId,
        githubRepositoryId: project.githubRepository.githubRepositoryId,
        githubPullRequestNumber: pr.number,
        githubPullRequestId: pr.id,
        githubUrl: pr.html_url,
        linkedBy: userId,
      });

      await activityService.createActivity({
        projectId,
        actorId: userId,
        action: 'TASK_GITHUB_PR_LINKED',
        entityType: 'TASK',
        entityId: taskId,
        metadata: {
          pullRequestNumber: pr.number,
          pullRequestUrl: pr.html_url,
        }
      });

      return {
        taskId,
        githubPullRequestNumber: pr.number,
        githubUrl: pr.html_url,
        linkedAt: link.createdAt,
      };
    } catch (error) {
      if (error.code === 11000) {
        const customError = new Error('This pull request is already linked to a task in this project');
        customError.statusCode = 409;
        throw customError;
      }
      throw error;
    }
  }

  async unlinkTaskFromPullRequest(projectId, taskId, pullRequestNumber, userId, orgMembership, projectMembership) {
    const task = await Task.findOne({ _id: taskId, project: projectId });
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    const isOwner = orgMembership && orgMembership.role === 'OWNER';
    const isPM = projectMembership && projectMembership.role === 'PROJECT_MANAGER';
    const isAssignee = task.assignedTo && task.assignedTo.toString() === userId.toString();

    if (!isOwner && !isPM && !isAssignee) {
      const error = new Error('Not authorized to unlink PRs from this task');
      error.statusCode = 403;
      throw error;
    }

    const link = await TaskGitHubLink.findOneAndDelete({
      task: taskId,
      project: projectId,
      githubPullRequestNumber: pullRequestNumber,
    });

    if (!link) {
      const error = new Error('Link not found');
      error.statusCode = 404;
      throw error;
    }

    await activityService.createActivity({
      projectId,
      actorId: userId,
      action: 'TASK_GITHUB_PR_UNLINKED',
      entityType: 'TASK',
      entityId: taskId,
      metadata: {
        pullRequestNumber: link.githubPullRequestNumber,
        pullRequestUrl: link.githubUrl,
      }
    });

    return { success: true };
  }

  async getTaskGitHubLinks(projectId, taskId, userId) {
    const links = await TaskGitHubLink.find({ task: taskId, project: projectId, isActive: true });
    if (!links.length) return { pullRequests: [] };

    const project = await Project.findById(projectId);
    const { owner, name: repo } = project.githubRepository;

    const pullRequests = [];
    for (const link of links) {
      try {
        const pr = await githubService.getPullRequest(userId, owner, repo, link.githubPullRequestNumber);
        pullRequests.push({
          number: pr.number,
          title: pr.title,
          state: pr.state,
          url: pr.html_url,
          author: pr.user.login,
          sourceBranch: pr.head.ref,
          targetBranch: pr.base.ref,
        });
      } catch (e) {
        pullRequests.push({
          number: link.githubPullRequestNumber,
          url: link.githubUrl,
          state: 'unknown',
        });
      }
    }
    return { pullRequests };
  }

  async linkIssueToGithubIssue(projectId, issueId, githubIssueNumber, userId, orgMembership, projectMembership) {
    const issue = await Issue.findOne({ _id: issueId, project: projectId });
    if (!issue) {
      const error = new Error('Internal issue not found');
      error.statusCode = 404;
      throw error;
    }

    const isOwner = orgMembership && orgMembership.role === 'OWNER';
    const isPM = projectMembership && projectMembership.role === 'PROJECT_MANAGER';
    const isAssignee = issue.assignedTo && issue.assignedTo.toString() === userId.toString();
    const isReporter = issue.reportedBy && issue.reportedBy.toString() === userId.toString();

    if (!isOwner && !isPM && !isAssignee && !isReporter) {
      const error = new Error('Not authorized to link GitHub issues to this issue');
      error.statusCode = 403;
      throw error;
    }

    const project = await Project.findById(projectId);
    if (!project || !project.githubRepository) {
      const error = new Error('No GitHub repository connected to this project');
      error.statusCode = 400;
      throw error;
    }

    const { owner, name: repo } = project.githubRepository;

    let ghIssue;
    try {
      ghIssue = await githubService.getIssue(userId, owner, repo, githubIssueNumber);
    } catch (e) {
      const error = new Error('GitHub Issue not found in the connected repository');
      error.statusCode = 404;
      throw error;
    }

    try {
      const link = await IssueGitHubLink.create({
        issue: issueId,
        project: projectId,
        githubRepositoryId: project.githubRepository.githubRepositoryId,
        githubIssueNumber: ghIssue.number,
        githubIssueId: ghIssue.id,
        githubUrl: ghIssue.html_url,
        linkedBy: userId,
      });

      await activityService.createActivity({
        projectId,
        actorId: userId,
        action: 'ISSUE_GITHUB_ISSUE_LINKED',
        entityType: 'ISSUE',
        entityId: issueId,
        metadata: {
          issueNumber: ghIssue.number,
          issueUrl: ghIssue.html_url,
        }
      });

      return {
        issueId,
        githubIssueNumber: ghIssue.number,
        githubUrl: ghIssue.html_url,
        linkedAt: link.createdAt,
      };
    } catch (error) {
      if (error.code === 11000) {
        const customError = new Error('This GitHub Issue is already linked to an internal issue in this project');
        customError.statusCode = 409;
        throw customError;
      }
      throw error;
    }
  }

  async unlinkIssueFromGithubIssue(projectId, issueId, githubIssueNumber, userId, orgMembership, projectMembership) {
    const issue = await Issue.findOne({ _id: issueId, project: projectId });
    if (!issue) {
      const error = new Error('Internal issue not found');
      error.statusCode = 404;
      throw error;
    }

    const isOwner = orgMembership && orgMembership.role === 'OWNER';
    const isPM = projectMembership && projectMembership.role === 'PROJECT_MANAGER';
    const isAssignee = issue.assignedTo && issue.assignedTo.toString() === userId.toString();
    const isReporter = issue.reportedBy && issue.reportedBy.toString() === userId.toString();

    if (!isOwner && !isPM && !isAssignee && !isReporter) {
      const error = new Error('Not authorized to unlink GitHub issues from this issue');
      error.statusCode = 403;
      throw error;
    }

    const link = await IssueGitHubLink.findOneAndDelete({
      issue: issueId,
      project: projectId,
      githubIssueNumber,
    });

    if (!link) {
      const error = new Error('Link not found');
      error.statusCode = 404;
      throw error;
    }

    await activityService.createActivity({
      projectId,
      actorId: userId,
      action: 'ISSUE_GITHUB_ISSUE_UNLINKED',
      entityType: 'ISSUE',
      entityId: issueId,
      metadata: {
        issueNumber: link.githubIssueNumber,
        issueUrl: link.githubUrl,
      }
    });

    return { success: true };
  }

  async getIssueGitHubLinks(projectId, issueId, userId) {
    const links = await IssueGitHubLink.find({ issue: issueId, project: projectId, isActive: true });
    if (!links.length) return { issues: [] };

    const project = await Project.findById(projectId);
    const { owner, name: repo } = project.githubRepository;

    const issues = [];
    for (const link of links) {
      try {
        const ghIssue = await githubService.getIssue(userId, owner, repo, link.githubIssueNumber);
        issues.push({
          number: ghIssue.number,
          title: ghIssue.title,
          state: ghIssue.state,
          url: ghIssue.html_url,
          author: ghIssue.user.login,
        });
      } catch (e) {
        issues.push({
          number: link.githubIssueNumber,
          url: link.githubUrl,
          state: 'unknown',
        });
      }
    }
    return { issues };
  }

  // Webhook Processors
  async handlePullRequestSync(project, payload) {
    const { action, pull_request: pr } = payload;
    const links = await TaskGitHubLink.find({
      project: project._id,
      githubRepositoryId: payload.repository.id,
      githubPullRequestId: pr.id,
    });

    if (!links.length) {
      // Create regular GitHub activity since no tasks are linked
      // This is handled normally by github.controller.js, so we can just return
      return;
    }

    const settings = await this.getSyncSettings(project._id);

    for (const link of links) {
      await this.applyTaskSync(project, link, pr, action, settings);
    }
  }

  async handleGithubIssueSync(project, payload) {
    const { action, issue: ghIssue } = payload;
    const links = await IssueGitHubLink.find({
      project: project._id,
      githubRepositoryId: payload.repository.id,
      githubIssueId: ghIssue.id,
    });

    if (!links.length) {
      return;
    }

    const settings = await this.getSyncSettings(project._id);

    for (const link of links) {
      await this.applyIssueSync(project, link, ghIssue, action, settings);
    }
  }

  async applyTaskSync(project, link, pr, action, settings) {
    const task = await Task.findById(link.task);
    if (!task) return;

    if (action === 'opened' && settings.autoUpdateTaskOnPROpen) {
      // Only advance if TODO or IN_PROGRESS
      if (task.status === 'TODO' || task.status === 'IN_PROGRESS') {
        const oldStatus = task.status;
        task.status = 'IN_REVIEW';
        await task.save();

        await activityService.createActivity({
          projectId: project._id,
          actorId: project.createdBy, // System action, but actor required
          action: 'TASK_STATUS_AUTO_SYNCED',
          entityType: 'TASK',
          entityId: task._id,
          metadata: {
            source: 'GITHUB',
            githubPullRequestNumber: pr.number,
            oldStatus,
            newStatus: 'IN_REVIEW',
          }
        });
      }
    }

    if (action === 'closed' && pr.merged && settings.autoCompleteTaskOnPRMerge) {
      if (task.status !== 'DONE' && task.status !== 'ARCHIVED') {
        const oldStatus = task.status;
        task.status = 'DONE';
        task.completedAt = new Date();
        await task.save();

        await activityService.createActivity({
          projectId: project._id,
          actorId: project.createdBy,
          action: 'TASK_STATUS_AUTO_SYNCED',
          entityType: 'TASK',
          entityId: task._id,
          metadata: {
            source: 'GITHUB',
            githubPullRequestNumber: pr.number,
            oldStatus,
            newStatus: 'DONE',
          }
        });
      }
    }
  }

  async applyIssueSync(project, link, ghIssue, action, settings) {
    const internalIssue = await Issue.findById(link.issue);
    if (!internalIssue) return;

    if (action === 'closed' && settings.autoUpdateIssueOnGitHubIssueClose) {
      if (internalIssue.status !== 'CLOSED' && internalIssue.status !== 'RESOLVED') {
        const oldStatus = internalIssue.status;
        internalIssue.status = 'CLOSED';
        await internalIssue.save();

        await activityService.createActivity({
          projectId: project._id,
          actorId: project.createdBy,
          action: 'ISSUE_STATUS_AUTO_SYNCED',
          entityType: 'ISSUE',
          entityId: internalIssue._id,
          metadata: {
            source: 'GITHUB',
            githubIssueNumber: ghIssue.number,
            oldStatus,
            newStatus: 'CLOSED',
          }
        });
      }
    }
  }
}

export const githubSyncService = new GithubSyncService();
