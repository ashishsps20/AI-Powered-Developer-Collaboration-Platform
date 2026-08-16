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

let ownerToken, managerToken, developer1Token, developer2Token, otherOrgToken;
let ownerId, managerId, developer1Id, developer2Id, otherOrgIdUserId;
let organizationId, projectId, otherOrgId;

beforeEach(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await OrganizationMember.deleteMany({});
  await Project.deleteMany({});
  await ProjectMember.deleteMany({});
  await Task.deleteMany({});

  // Users
  const registerUser = async (name, email) => {
    const res = await request(app).post('/api/auth/register').send({
      name, email, password: 'Password123!', confirmPassword: 'Password123!',
    });
    const login = await request(app).post('/api/auth/login').send({ email, password: 'Password123!' });
    return { id: res.body.data.user.id, token: login.headers['set-cookie'][0] };
  };

  const owner = await registerUser('Owner', 'owner@test.com');
  const manager = await registerUser('Manager', 'manager@test.com');
  const dev1 = await registerUser('Dev1', 'dev1@test.com');
  const dev2 = await registerUser('Dev2', 'dev2@test.com');
  const otherUser = await registerUser('Other', 'other@test.com');

  ownerId = owner.id; ownerToken = owner.token;
  managerId = manager.id; managerToken = manager.token;
  developer1Id = dev1.id; developer1Token = dev1.token;
  developer2Id = dev2.id; developer2Token = dev2.token;
  otherOrgIdUserId = otherUser.id; otherOrgToken = otherUser.token;

  // Organizations
  const orgRes = await request(app).post('/api/organizations').set('Cookie', ownerToken).send({ name: 'TechNova' });
  organizationId = orgRes.body.data.organization.id;

  const otherOrgRes = await request(app).post('/api/organizations').set('Cookie', otherOrgToken).send({ name: 'OtherOrg' });
  otherOrgId = otherOrgRes.body.data.organization.id;

  // Add members to org
  await OrganizationMember.create([
    { organization: organizationId, user: managerId, role: 'MEMBER', isActive: true },
    { organization: organizationId, user: developer1Id, role: 'MEMBER', isActive: true },
    { organization: organizationId, user: developer2Id, role: 'MEMBER', isActive: true },
  ]);

  // Project
  const projRes = await request(app)
    .post(`/api/organizations/${organizationId}/projects`)
    .set('Cookie', ownerToken)
    .send({ name: 'Project 1', projectManagerId: managerId });
  projectId = projRes.body.data.project.id;

  // Add Project Members
  await request(app)
    .post(`/api/organizations/${organizationId}/projects/${projectId}/members`)
    .set('Cookie', managerToken)
    .send({ userId: developer1Id, role: 'DEVELOPER' });
  
  await request(app)
    .post(`/api/organizations/${organizationId}/projects/${projectId}/members`)
    .set('Cookie', managerToken)
    .send({ userId: developer2Id, role: 'DEVELOPER' });
});

describe('Task Tests', () => {
  it('1. Owner creates task', async () => {
    const res = await request(app)
      .post(`/api/organizations/${organizationId}/projects/${projectId}/tasks`)
      .set('Cookie', ownerToken)
      .send({ title: 'Task 1' });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.task.title).toBe('Task 1');
  });

  it('2. Project manager creates task', async () => {
    const res = await request(app)
      .post(`/api/organizations/${organizationId}/projects/${projectId}/tasks`)
      .set('Cookie', managerToken)
      .send({ title: 'Task 1' });
    expect(res.statusCode).toBe(201);
  });

  it('3. Developer cannot create task', async () => {
    const res = await request(app)
      .post(`/api/organizations/${organizationId}/projects/${projectId}/tasks`)
      .set('Cookie', developer1Token)
      .send({ title: 'Task 1' });
    expect(res.statusCode).toBe(403);
  });

  it('4. Task can be unassigned', async () => {
    const res = await request(app)
      .post(`/api/organizations/${organizationId}/projects/${projectId}/tasks`)
      .set('Cookie', ownerToken)
      .send({ title: 'Task 1' });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.task.assignedTo).toBeUndefined();
  });

  it('5. Task can be assigned to project member', async () => {
    const res = await request(app)
      .post(`/api/organizations/${organizationId}/projects/${projectId}/tasks`)
      .set('Cookie', ownerToken)
      .send({ title: 'Task 1', assignedTo: developer1Id });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.task.assignedTo._id.toString()).toBe(developer1Id.toString());
  });

  it('6. Cannot assign to non-project member', async () => {
    // otherUser is in another org, so definitely not in project
    const res = await request(app)
      .post(`/api/organizations/${organizationId}/projects/${projectId}/tasks`)
      .set('Cookie', ownerToken)
      .send({ title: 'Task 1', assignedTo: otherOrgIdUserId });
    expect(res.statusCode).toBe(400);
  });

  it('7. Cannot assign to user from another organization', async () => {
    const res = await request(app)
      .post(`/api/organizations/${organizationId}/projects/${projectId}/tasks`)
      .set('Cookie', ownerToken)
      .send({ title: 'Task 1', assignedTo: otherOrgIdUserId });
    expect(res.statusCode).toBe(400);
  });

  describe('Queries & Updates', () => {
    let taskId1, taskId2;
    beforeEach(async () => {
      const res1 = await request(app).post(`/api/organizations/${organizationId}/projects/${projectId}/tasks`).set('Cookie', ownerToken).send({ title: 'Task 1', status: 'IN_PROGRESS', priority: 'HIGH', assignedTo: developer1Id });
      taskId1 = res1.body.data.task._id;
      const res2 = await request(app).post(`/api/organizations/${organizationId}/projects/${projectId}/tasks`).set('Cookie', ownerToken).send({ title: 'Task 2', status: 'TODO', priority: 'LOW', assignedTo: developer2Id });
      taskId2 = res2.body.data.task._id;
    });

    it('8. Get tasks', async () => {
      const res = await request(app).get(`/api/organizations/${organizationId}/projects/${projectId}/tasks`).set('Cookie', ownerToken);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.tasks.length).toBe(2);
    });

    it('9. Filter tasks by status', async () => {
      const res = await request(app).get(`/api/organizations/${organizationId}/projects/${projectId}/tasks?status=IN_PROGRESS`).set('Cookie', ownerToken);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].title).toBe('Task 1');
    });

    it('10. Filter tasks by priority', async () => {
      const res = await request(app).get(`/api/organizations/${organizationId}/projects/${projectId}/tasks?priority=LOW`).set('Cookie', ownerToken);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].title).toBe('Task 2');
    });

    it('11. Update task (Owner)', async () => {
      const res = await request(app)
        .patch(`/api/organizations/${organizationId}/projects/${projectId}/tasks/${taskId1}`)
        .set('Cookie', ownerToken)
        .send({ title: 'Updated Task 1' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.task.title).toBe('Updated Task 1');
    });

    it('12. Developer can update own assigned task', async () => {
      const res = await request(app)
        .patch(`/api/organizations/${organizationId}/projects/${projectId}/tasks/${taskId1}`)
        .set('Cookie', developer1Token)
        .send({ title: 'Dev Update' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.task.title).toBe('Dev Update');
    });

    it('13. Developer cannot update another developer\'s task', async () => {
      const res = await request(app)
        .patch(`/api/organizations/${organizationId}/projects/${projectId}/tasks/${taskId2}`)
        .set('Cookie', developer1Token)
        .send({ title: 'Hacked' });
      expect(res.statusCode).toBe(403);
    });

    it('14. Update status', async () => {
      const res = await request(app)
        .patch(`/api/organizations/${organizationId}/projects/${projectId}/tasks/${taskId1}/status`)
        .set('Cookie', developer1Token)
        .send({ status: 'IN_REVIEW' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.task.status).toBe('IN_REVIEW');
    });

    it('15. completedAt is set when DONE', async () => {
      const res = await request(app)
        .patch(`/api/organizations/${organizationId}/projects/${projectId}/tasks/${taskId1}/status`)
        .set('Cookie', developer1Token)
        .send({ status: 'DONE' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.task.completedAt).toBeDefined();
    });

    it('16. completedAt clears when leaving DONE', async () => {
      await request(app).patch(`/api/organizations/${organizationId}/projects/${projectId}/tasks/${taskId1}/status`).set('Cookie', ownerToken).send({ status: 'DONE' });
      const res = await request(app).patch(`/api/organizations/${organizationId}/projects/${projectId}/tasks/${taskId1}/status`).set('Cookie', ownerToken).send({ status: 'IN_PROGRESS' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.task.completedAt).toBeUndefined();
    });

    it('17. Reorder task', async () => {
      const res = await request(app)
        .patch(`/api/organizations/${organizationId}/projects/${projectId}/tasks/${taskId1}/position`)
        .set('Cookie', ownerToken)
        .send({ position: 500, status: 'TODO' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.task.position).toBe(500);
      expect(res.body.data.task.status).toBe('TODO');
    });

    it('18. Delete task (Owner)', async () => {
      const res = await request(app).delete(`/api/organizations/${organizationId}/projects/${projectId}/tasks/${taskId1}`).set('Cookie', ownerToken);
      expect(res.statusCode).toBe(200);
    });

    it('19. Developer cannot delete task', async () => {
      const res = await request(app).delete(`/api/organizations/${organizationId}/projects/${projectId}/tasks/${taskId1}`).set('Cookie', developer1Token);
      expect(res.statusCode).toBe(403);
    });
  });
});
