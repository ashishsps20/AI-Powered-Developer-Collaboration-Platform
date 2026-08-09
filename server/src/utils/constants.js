export const PLATFORM_ROLES = ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'];
export const ORG_ROLES = ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'];
export const PROJECT_ROLES = ['PROJECT_MANAGER', 'DEVELOPER'];

export const PROJECT_STATUSES = [
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'ARCHIVED',
];
export const PROJECT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'];

export const ISSUE_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const ISSUE_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export const SPRINT_STATUSES = ['PLANNED', 'ACTIVE', 'COMPLETED'];

export const COMMENT_TARGETS = ['TASK', 'ISSUE', 'PROJECT'];

export const ACTIVITY_TYPES = [
  'TASK_CREATED',
  'TASK_ASSIGNED',
  'TASK_COMPLETED',
  'ISSUE_CREATED',
  'ISSUE_RESOLVED',
  'PROJECT_CREATED',
  'MEMBER_ADDED',
  'SPRINT_STARTED',
  'PR_CREATED',
  'PR_MERGED',
];

export const CHANNEL_TYPES = ['PROJECT', 'DM'];

export const ROLE_RANK = {
  DEVELOPER: 1,
  PROJECT_MANAGER: 2,
  ADMIN: 3,
};

export function meetsRoleRequirement(userRole, minimumRole) {
  return (ROLE_RANK[userRole] || 0) >= (ROLE_RANK[minimumRole] || 0);
}
