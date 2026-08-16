import Issue from '../models/Issue.js';
import ProjectMember from '../models/ProjectMember.js';

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

  async updateIssue(issue, data) {
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

    await issue.save();
    return issue.populate('assignedTo reportedBy', 'name email avatar');
  }

  async deleteIssue(issue) {
    await Issue.deleteOne({ _id: issue._id });
  }
}

export default new IssueService();
