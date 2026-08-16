import Issue from '../models/Issue.js';
import ProjectMember from '../models/ProjectMember.js';
import { activityService } from './activity.service.js';

class IssueService {
  async createIssue(projectId, userId, data) {
    const { title, description, type, priority, assignedTo, labels } = data;

    if (assignedTo) {
      const isMember = await ProjectMember.findOne({ project: projectId, user: assignedTo, isActive: true });
      if (!isMember) {
        throw { status: 400, message: 'Assigned user is not a member of this project' };
      }
    }

    const issue = new Issue({
      project: projectId,
      title,
      description,
      type,
      priority,
      assignedTo,
      labels,
      reportedBy: userId,
    });

    await issue.save();

    await activityService.createActivity({
      projectId,
      actorId: userId,
      action: 'ISSUE_CREATED',
      entityType: 'ISSUE',
      entityId: issue._id
    });

    return issue.populate('assignedTo reportedBy', 'name email avatar');
  }

  async getIssues(projectId, filters = {}) {
    const query = { project: projectId };

    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.type) query.type = filters.type;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;

    return Issue.find(query)
      .populate('assignedTo reportedBy', 'name email avatar')
      .sort({ createdAt: -1 });
  }

  async getIssueById(issueId, projectId) {
    const issue = await Issue.findOne({ _id: issueId, project: projectId })
      .populate('assignedTo reportedBy', 'name email avatar');

    if (!issue) {
      throw { status: 404, message: 'Issue not found' };
    }
    return issue;
  }

  async updateIssue(issue, data, userId) {
    const allowedFields = ['title', 'description', 'status', 'priority', 'type', 'assignedTo', 'labels'];
    let statusChangedToResolved = false;
    let statusChangedFromResolved = false;

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'status') {
          if (data.status === 'RESOLVED' && issue.status !== 'RESOLVED') {
            statusChangedToResolved = true;
          } else if (data.status !== 'RESOLVED' && issue.status === 'RESOLVED') {
            statusChangedFromResolved = true;
          }
        }
        
        if (field === 'assignedTo' && data[field]) {
          const isMember = await ProjectMember.findOne({ project: issue.project, user: data[field], isActive: true });
          if (!isMember) {
            throw { status: 400, message: 'Assigned user is not a member of this project' };
          }
        }

        issue[field] = data[field];
      }
    }

    if (statusChangedToResolved) {
      issue.resolvedAt = new Date();
    } else if (statusChangedFromResolved) {
      issue.resolvedAt = undefined;
    }

    const oldStatus = issue.status;
    const oldAssignee = issue.assignedTo;

    await issue.save();

    if (data.assignedTo && data.assignedTo.toString() !== oldAssignee?.toString()) {
      await activityService.createActivity({
        projectId: issue.project,
        actorId: userId,
        action: 'ISSUE_ASSIGNED',
        entityType: 'ISSUE',
        entityId: issue._id,
        metadata: {
          previousAssigneeId: oldAssignee ? oldAssignee.toString() : null,
          newAssigneeId: data.assignedTo.toString()
        }
      });
    }

    if (data.status && data.status !== oldStatus) {
      await activityService.createActivity({
        projectId: issue.project,
        actorId: userId,
        action: 'ISSUE_STATUS_CHANGED',
        entityType: 'ISSUE',
        entityId: issue._id,
        metadata: {
          oldStatus,
          newStatus: data.status
        }
      });
    }

    await activityService.createActivity({
      projectId: issue.project,
      actorId: userId,
      action: 'ISSUE_UPDATED',
      entityType: 'ISSUE',
      entityId: issue._id
    });

    return issue.populate('assignedTo reportedBy', 'name email avatar');
  }

  async deleteIssue(issue, userId) {
    await Issue.deleteOne({ _id: issue._id });

    await activityService.createActivity({
      projectId: issue.project,
      actorId: userId,
      action: 'ISSUE_DELETED',
      entityType: 'ISSUE',
      entityId: issue._id
    });
  }
}

export default new IssueService();
