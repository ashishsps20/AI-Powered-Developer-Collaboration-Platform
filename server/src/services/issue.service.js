import { Issue } from '../models/Issue.js';
import { ApiError } from '../utils/ApiError.js';
import { assertProjectAccess, assertProjectMemberUser } from './access.service.js';
import { logActivity } from './activity.service.js';
import { createNotification } from './notification.service.js';

export async function createIssue(projectId, user, payload) {
  await assertProjectAccess(projectId, user, 'DEVELOPER');

  if (payload.assignee) {
    await assertProjectMemberUser(projectId, payload.assignee);
  }

  const issue = await Issue.create({
    title: payload.title,
    description: payload.description || '',
    project: projectId,
    creator: user.id,
    assignee: payload.assignee || null,
    priority: payload.priority || 'MEDIUM',
    status: payload.status || 'OPEN',
    labels: payload.labels || [],
    relatedTask: payload.relatedTask || null,
    githubIssueReference: payload.githubIssueReference || '',
  });

  await logActivity({
    type: 'ISSUE_CREATED',
    message: `Issue "${issue.title}" was created`,
    actorId: user.id,
    projectId,
    metadata: { issueId: issue._id.toString() },
  });

  if (issue.assignee) {
    await createNotification({
      userId: issue.assignee.toString(),
      type: 'ISSUE_ASSIGNED',
      title: 'Issue assigned',
      message: `You were assigned issue: ${issue.title}`,
      data: { issueId: issue._id.toString(), projectId: projectId.toString() },
    });
  }

  return issue;
}

export async function listIssuesByProject(projectId, user) {
  await assertProjectAccess(projectId, user, 'DEVELOPER');
  return Issue.find({ project: projectId })
    .sort({ createdAt: -1 })
    .populate('assignee', 'name email avatar')
    .populate('creator', 'name email avatar')
    .populate('relatedTask', 'title taskKey status');
}

export async function getIssueById(issueId, user) {
  const issue = await Issue.findById(issueId)
    .populate('assignee', 'name email avatar')
    .populate('creator', 'name email avatar')
    .populate('relatedTask', 'title taskKey status');
  if (!issue) throw new ApiError(404, 'Issue not found');
  await assertProjectAccess(issue.project.toString(), user, 'DEVELOPER');
  return issue;
}

export async function updateIssue(issueId, user, payload) {
  const issue = await Issue.findById(issueId);
  if (!issue) throw new ApiError(404, 'Issue not found');
  await assertProjectAccess(issue.project.toString(), user, 'DEVELOPER');

  const previousStatus = issue.status;

  const fields = [
    'title',
    'description',
    'priority',
    'status',
    'labels',
    'relatedTask',
    'githubIssueReference',
    'assignee',
  ];
  for (const field of fields) {
    if (payload[field] !== undefined) {
      if (field === 'assignee' && payload.assignee) {
        await assertProjectMemberUser(issue.project.toString(), payload.assignee);
      }
      issue[field] = payload[field];
    }
  }

  await issue.save();

  if (
    (issue.status === 'RESOLVED' || issue.status === 'CLOSED') &&
    previousStatus !== issue.status
  ) {
    await logActivity({
      type: 'ISSUE_RESOLVED',
      message: `Issue "${issue.title}" was ${issue.status.toLowerCase()}`,
      actorId: user.id,
      projectId: issue.project,
      metadata: { issueId: issue._id.toString() },
    });
  }

  if (payload.assignee) {
    await createNotification({
      userId: payload.assignee,
      type: 'ISSUE_ASSIGNED',
      title: 'Issue assigned',
      message: `You were assigned issue: ${issue.title}`,
      data: { issueId: issue._id.toString(), projectId: issue.project.toString() },
    });
  }

  return issue;
}

export async function deleteIssue(issueId, user) {
  const issue = await Issue.findById(issueId);
  if (!issue) throw new ApiError(404, 'Issue not found');
  await assertProjectAccess(issue.project.toString(), user, 'PROJECT_MANAGER');
  await issue.deleteOne();
  return { deleted: true };
}
