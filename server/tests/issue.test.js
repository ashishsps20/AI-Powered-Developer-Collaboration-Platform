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
import Issue from '../models/Issue.js';

let ownerToken, managerToken, developer1Token, developer2Token, otherOrgToken, orgMemberNotProjectToken;
let ownerId, managerId, developer1Id, developer2Id, otherOrgIdUserId, orgMemberNotProjectId;
let organizationId, projectId, otherOrgId;

beforeEach(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await OrganizationMember.deleteMany({});
  await Project.deleteMany({});
  await ProjectMember.deleteMany({});
  await Issue.deleteMany({});

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
  const orgMemNotProj = await registerUser('OrgMem', 'orgmem@test.com');

  ownerId = owner.id; ownerToken = owner.token;
  managerId = manager.id; managerToken = manager.token;
  developer1Id = dev1.id; developer1Token = dev1.token;
  developer2Id = dev2.id; developer2Token = dev2.token;
  otherOrgIdUserId = otherUser.id; otherOrgToken = otherUser.token;
  orgMemberNotProjectId = orgMemNotProj.id; orgMemberNotProjectToken = orgMemNotProj.token;

  const orgRes = await request(app).post('/api/organizations').set('Cookie', ownerToken).send({ name: 'TechNova' });
  organizationId = orgRes.body.data.organization.id;

  const otherOrgRes = await request(app).post('/api/organizations').set('Cookie', otherOrgToken).send({ name: 'OtherOrg' });
  otherOrgId = otherOrgRes.body.data.organization.id;

  await OrganizationMember.create([
    { organization: organizationId, user: managerId, role: 'MEMBER', isActive: true },
    { organization: organizationId, user: developer1Id, role: 'MEMBER', isActive: true },
    { organization: organizationId, user: developer2Id, role: 'MEMBER', isActive: true },
    { organization: organizationId, user: orgMemberNotProjectId, role: 'MEMBER', isActive: true },
  ]);

  const projRes = await request(app)
    .post(`/api/organizations/${organizationId}/projects`)
    .set('Cookie', ownerToken)
    .send({ name: 'Project 1', projectManagerId: managerId });
  projectId = projRes.body.data.project.id;

  await request(app).post(`/api/organizations/${organizationId}/projects/${projectId}/members`).set('Cookie', managerToken).send({ userId: developer1Id, role: 'DEVELOPER' });
  await request(app).post(`/api/organizations/${organizationId}/projects/${projectId}/members`).set('Cookie', managerToken).send({ userId: developer2Id, role: 'DEVELOPER' });
});

describe('Issue Tests', () => {
  it('20. Project member creates issue', async () => {
    const res = await request(app)
      .post(`/api/organizations/${organizationId}/projects/${projectId}/issues`)
      .set('Cookie', developer1Token)
      .send({ title: 'Bug 1', type: 'BUG' });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.issue.title).toBe('Bug 1');
  });

  it('21. Non-project member cannot create issue', async () => {
    const res = await request(app)
      .post(`/api/organizations/${organizationId}/projects/${projectId}/issues`)
      .set('Cookie', orgMemberNotProjectToken)
      .send({ title: 'Bug 1', type: 'BUG' });
    expect(res.statusCode).toBe(403);
  });

  describe('Queries & Updates', () => {
    let issueId1, issueId2;
    beforeEach(async () => {
      const res1 = await request(app).post(`/api/organizations/${organizationId}/projects/${projectId}/issues`).set('Cookie', developer1Token).send({ title: 'Issue 1', status: 'OPEN', priority: 'HIGH', type: 'BUG' });
      issueId1 = res1.body.data.issue._id;
      const res2 = await request(app).post(`/api/organizations/${organizationId}/projects/${projectId}/issues`).set('Cookie', developer1Token).send({ title: 'Issue 2', status: 'IN_PROGRESS', priority: 'LOW', type: 'FEATURE' });
      issueId2 = res2.body.data.issue._id;
    });

    it('22. Get issues', async () => {
      const res = await request(app).get(`/api/organizations/${organizationId}/projects/${projectId}/issues`).set('Cookie', ownerToken);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.issues.length).toBe(2);
    });

    it('23. Filter issues', async () => {
      const res = await request(app).get(`/api/organizations/${organizationId}/projects/${projectId}/issues?type=FEATURE`).set('Cookie', ownerToken);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.issues.length).toBe(1);
      expect(res.body.data.issues[0].title).toBe('Issue 2');
    });

    it('24. Update issue', async () => {
      const res = await request(app)
        .patch(`/api/organizations/${organizationId}/projects/${projectId}/issues/${issueId1}`)
        .set('Cookie', developer1Token)
        .send({ title: 'Updated Issue' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.issue.title).toBe('Updated Issue');
    });

    it('25. Assign issue to project member', async () => {
      const res = await request(app)
        .patch(`/api/organizations/${organizationId}/projects/${projectId}/issues/${issueId1}`)
        .set('Cookie', developer1Token)
        .send({ assignedTo: developer2Id });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.issue.assignedTo._id.toString()).toBe(developer2Id.toString());
    });

    it('26. Cannot assign issue outside project', async () => {
      const res = await request(app)
        .patch(`/api/organizations/${organizationId}/projects/${projectId}/issues/${issueId1}`)
        .set('Cookie', developer1Token)
        .send({ assignedTo: orgMemberNotProjectId });
      expect(res.statusCode).toBe(400);
    });

    it('27. Resolve issue', async () => {
      const res = await request(app)
        .patch(`/api/organizations/${organizationId}/projects/${projectId}/issues/${issueId1}`)
        .set('Cookie', developer1Token)
        .send({ status: 'RESOLVED' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.issue.status).toBe('RESOLVED');
    });

    it('28. resolvedAt is set', async () => {
      const res = await request(app)
        .patch(`/api/organizations/${organizationId}/projects/${projectId}/issues/${issueId1}`)
        .set('Cookie', developer1Token)
        .send({ status: 'RESOLVED' });
      expect(res.body.data.issue.resolvedAt).toBeDefined();
    });

    it('29. Delete issue (Owner)', async () => {
      const res = await request(app).delete(`/api/organizations/${organizationId}/projects/${projectId}/issues/${issueId1}`).set('Cookie', ownerToken);
      expect(res.statusCode).toBe(200);
    });

    it('30. Developer cannot delete issue', async () => {
      const res = await request(app).delete(`/api/organizations/${organizationId}/projects/${projectId}/issues/${issueId1}`).set('Cookie', developer1Token);
      expect(res.statusCode).toBe(403);
    });
  });
});
