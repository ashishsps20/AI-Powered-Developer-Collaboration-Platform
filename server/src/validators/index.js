import { z } from 'zod';
import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  ORG_ROLES,
  PROJECT_PRIORITIES,
  PROJECT_ROLES,
  PROJECT_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  COMMENT_TARGETS,
  SPRINT_STATUSES,
} from '../utils/constants.js';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER']).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().max(2000).optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().max(2000).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(ORG_ROLES).optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(ORG_ROLES),
});

export const createProjectSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().trim().min(2).max(160),
  description: z.string().max(5000).optional(),
  startDate: z.coerce.date().optional(),
  deadline: z.coerce.date().optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  priority: z.enum(PROJECT_PRIORITIES).optional(),
  technologyStack: z.array(z.string()).optional(),
  memberIds: z.array(z.string()).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  description: z.string().max(5000).optional(),
  startDate: z.coerce.date().optional(),
  deadline: z.coerce.date().optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  priority: z.enum(PROJECT_PRIORITIES).optional(),
  technologyStack: z.array(z.string()).optional(),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().max(10000).optional(),
  assignee: z.string().optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  labels: z.array(z.string()).optional(),
  dueDate: z.coerce.date().optional(),
  estimatedMinutes: z.number().int().min(0).optional(),
  actualMinutes: z.number().int().min(0).optional(),
  sprint: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const createIssueSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().max(10000).optional(),
  assignee: z.string().optional(),
  priority: z.enum(ISSUE_PRIORITIES).optional(),
  status: z.enum(ISSUE_STATUSES).optional(),
  labels: z.array(z.string()).optional(),
  relatedTask: z.string().optional(),
  githubIssueReference: z.string().optional(),
});

export const updateIssueSchema = createIssueSchema.partial();

export const createSprintSchema = z.object({
  name: z.string().trim().min(2).max(120),
  goal: z.string().max(2000).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.enum(SPRINT_STATUSES).optional(),
});

export const updateSprintSchema = createSprintSchema.partial();

export const createCommentSchema = z.object({
  targetType: z.enum(COMMENT_TARGETS),
  targetId: z.string().min(1),
  content: z.string().trim().min(1).max(5000),
});

export const updateCommentSchema = z.object({
  content: z.string().trim().min(1).max(5000),
});

export const createChannelSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

export const createMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
});

export const updateMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
});

export const dmChannelSchema = z.object({
  participantId: z.string().min(1),
});

export const addProjectMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(PROJECT_ROLES).optional(),
});
