import './setup.js';
import { jest } from '@jest/globals';
jest.setTimeout(30000);
import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import OrganizationMember from '../models/OrganizationMember.js';
import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import Task from '../models/Task.js';
import Issue from '../models/Issue.js';

let ownerToken, orgMemberNotProjectToken, otherOrgToken;
let organizationId, projectId, otherOrgId;
let taskId, issueId;

beforeEach(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await OrganizationMember.deleteMany({});
  await Project.deleteMany({});
  await ProjectMember.deleteMany({});
  await Task.deleteMany({});
  await Issue.deleteMany({});

  const registerUser = async (name, email) => {
    const res = await request(app).post('/api/auth/register').send({
      name, email, password: 'Password123!', confirmPassword: 'Password123!',
    });
    const login = await request(app).post('/api/auth/login').send({ email, password: 'Password123!' });
    return { id: res.body.data.user.id, token: login.headers['set-cookie'][0] };
  };

  const owner = await registerUser('Owner', 'owner@test.com');
  const orgMemNotProj = await registerUser('OrgMem', 'orgmem@test.com');
  const otherUser = await registerUser('Other', 'other@test.com');

  ownerToken = owner.token;
  orgMemberNotProjectToken = orgMemNotProj.token;
  otherOrgToken = otherUser.token;

  const orgRes = await request(app).post('/api/organizations').set('Cookie', ownerToken).send({ name: 'TechNova' });
  organizationId = orgRes.body.data.organization.id;

  const otherOrgRes = await request(app).post('/api/organizations').set('Cookie', otherOrgToken).send({ name: 'OtherOrg' });
  otherOrgId = otherOrgRes.body.data.organization.id;

  await OrganizationMember.create([
    { organization: organizationId, user: orgMemNotProj.id, role: 'MEMBER', isActive: true },
  ]);

  const projRes = await request(app)
    .post(`/api/organizations/${organizationId}/projects`)
    .set('Cookie', ownerToken)
    .send({ name: 'Project 1', projectManagerId: owner.id });
  projectId = projRes.body.data.project.id;

  const taskRes = await request(app).post(`/api/organizations/${organizationId}/projects/${projectId}/tasks`).set('Cookie', ownerToken).send({ title: 'Task 1' });
  taskId = taskRes.body.data.task._id;

  // The owner needs to be a project member to create an issue, but wait, owner bypasses this. Let's see.
  // Wait, owner bypasses ProjectMember check for issues! Let's check issue creation.
  const issueRes = await request(app).post(`/api/organizations/${organizationId}/projects/${projectId}/issues`).set('Cookie', ownerToken).send({ title: 'Issue 1', type: 'BUG' });
  issueId = issueRes.body.data.issue._id;
});

describe('Authorization Tests', () => {
  it('31. User from another organization cannot access tasks', async () => {
    const res = await request(app).get(`/api/organizations/${organizationId}/projects/${projectId}/tasks`).set('Cookie', otherOrgToken);
    expect(res.statusCode).toBe(403);
  });

  it('32. User from another organization cannot access issues', async () => {
    const res = await request(app).get(`/api/organizations/${organizationId}/projects/${projectId}/issues`).set('Cookie', otherOrgToken);
    expect(res.statusCode).toBe(403);
  });

  it('33. Non-project member cannot modify project tasks', async () => {
    const res = await request(app)
      .patch(`/api/organizations/${organizationId}/projects/${projectId}/tasks/${taskId}`)
      .set('Cookie', orgMemberNotProjectToken)
      .send({ title: 'Hacked' });
    expect(res.statusCode).toBe(403); // because not a project member
  });

  it('34. Invalid project/task/issue IDs handled correctly', async () => {
    const res = await request(app).get(`/api/organizations/${organizationId}/projects/invalid123/tasks`).set('Cookie', ownerToken);
    expect(res.statusCode).toBe(404);

    const res2 = await request(app).get(`/api/organizations/${organizationId}/projects/${projectId}/tasks/invalid123`).set('Cookie', ownerToken);
    expect(res2.statusCode).toBe(404);

    const res3 = await request(app).get(`/api/organizations/${organizationId}/projects/${projectId}/issues/invalid123`).set('Cookie', ownerToken);
    expect(res3.statusCode).toBe(404);
  });
});
