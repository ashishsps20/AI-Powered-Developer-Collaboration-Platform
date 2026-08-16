import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import OrganizationMember from '../models/OrganizationMember.js';
import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import Task from '../models/Task.js';
import Issue from '../models/Issue.js';
import Comment from '../models/Comment.js';
import Activity from '../models/Activity.js';

describe('Activity API', () => {
  jest.setTimeout(30000);

  let user1Token, user2Token, user3Token;
  let user1, user2, user3;
  let organization;
  let project;
  let project2;

  beforeEach(async () => {
    // 1. Create Users
    user1 = await User.create({ name: 'User One', email: 'user1@example.com', password: 'password123' });
    user2 = await User.create({ name: 'User Two', email: 'user2@example.com', password: 'password123' });
    user3 = await User.create({ name: 'User Three', email: 'user3@example.com', password: 'password123' });

    // 2. Login to get tokens
    const res1 = await request(app).post('/api/auth/login').send({ email: 'user1@example.com', password: 'password123' });
    user1Token = res1.body.data.token;
    const res2 = await request(app).post('/api/auth/login').send({ email: 'user2@example.com', password: 'password123' });
    user2Token = res2.body.data.token;
    const res3 = await request(app).post('/api/auth/login').send({ email: 'user3@example.com', password: 'password123' });
    user3Token = res3.body.data.token;

    // 3. Create Organization
    organization = await Organization.create({ name: 'Test Org', slug: 'test-org', owner: user1._id });
    await OrganizationMember.create({ organization: organization._id, user: user1._id, role: 'OWNER' });
    await OrganizationMember.create({ organization: organization._id, user: user2._id, role: 'MEMBER' });
    await OrganizationMember.create({ organization: organization._id, user: user3._id, role: 'MEMBER' });

    // 4. Create Project
    const resProj = await request(app)
      .post(`/api/organizations/${organization._id}/projects`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Test Project', description: 'Desc', projectManagerId: user1._id });
    project = resProj.body.data.project;

    // Second project to test isolation
    const resProj2 = await request(app)
      .post(`/api/organizations/${organization._id}/projects`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Test Project 2', description: 'Desc 2', projectManagerId: user1._id });
    project2 = resProj2.body.data.project;

    await ProjectMember.create({ project: project._id, user: user2._id, role: 'DEVELOPER' });
  });

  describe('Activity Generation', () => {
    it('should log TASK_CREATED when task is created', async () => {
      const res = await request(app)
        .post(`/api/organizations/${organization._id}/projects/${project.id}/tasks`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'New Task' });
      
      const activity = await Activity.findOne({ project: project.id, action: 'TASK_CREATED' });
      expect(activity).not.toBeNull();
      expect(activity.actor.toString()).toBe(user1._id.toString());
      expect(activity.entityId.toString()).toBe(res.body.data.task._id);
    });

    it('should log TASK_ASSIGNED when task assignee changes', async () => {
      const task = await Task.create({ project: project.id, title: 'Task', createdBy: user1._id });
      
      await request(app)
        .patch(`/api/organizations/${organization._id}/projects/${project.id}/tasks/${task._id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ assignedTo: user2._id });

      const activity = await Activity.findOne({ project: project.id, action: 'TASK_ASSIGNED' });
      expect(activity).not.toBeNull();
      expect(activity.metadata.newAssigneeId).toBe(user2._id.toString());
    });

    it('should log TASK_STATUS_CHANGED when task status changes', async () => {
      const task = await Task.create({ project: project.id, title: 'Task', createdBy: user1._id });
      
      await request(app)
        .patch(`/api/organizations/${organization._id}/projects/${project.id}/tasks/${task._id}/status`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'IN_PROGRESS' });

      const activity = await Activity.findOne({ project: project.id, action: 'TASK_STATUS_CHANGED' });
      expect(activity).not.toBeNull();
      expect(activity.metadata.oldStatus).toBe('TODO');
      expect(activity.metadata.newStatus).toBe('IN_PROGRESS');
    });

    it('should log ISSUE_CREATED when issue is created', async () => {
      await request(app)
        .post(`/api/organizations/${organization._id}/projects/${project.id}/issues`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'New Issue', type: 'BUG' });
      
      const activity = await Activity.findOne({ project: project.id, action: 'ISSUE_CREATED' });
      expect(activity).not.toBeNull();
    });

    it('should log ISSUE_STATUS_CHANGED when issue status changes', async () => {
      const issue = await Issue.create({ project: project.id, title: 'Issue', reportedBy: user1._id, type: 'BUG' });
      
      await request(app)
        .patch(`/api/organizations/${organization._id}/projects/${project.id}/issues/${issue._id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'RESOLVED' });

      const activity = await Activity.findOne({ project: project.id, action: 'ISSUE_STATUS_CHANGED' });
      expect(activity).not.toBeNull();
      expect(activity.metadata.newStatus).toBe('RESOLVED');
    });

    it('should log PROJECT_MEMBER_ADDED when member is added', async () => {
      await request(app)
        .post(`/api/organizations/${organization._id}/projects/${project.id}/members`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ userId: user3._id, role: 'DEVELOPER' });
      
      const activity = await Activity.findOne({ project: project.id, action: 'PROJECT_MEMBER_ADDED' });
      expect(activity).not.toBeNull();
      expect(activity.metadata.userId).toBe(user3._id.toString());
    });

    it('should log PROJECT_MANAGER_CHANGED when manager changes', async () => {
      await request(app)
        .patch(`/api/organizations/${organization._id}/projects/${project.id}/manager`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ userId: user2._id });
      
      const activity = await Activity.findOne({ project: project.id, action: 'PROJECT_MANAGER_CHANGED' });
      expect(activity).not.toBeNull();
      expect(activity.metadata.newManagerUserId).toBe(user2._id.toString());
    });

    it('should log COMMENT_CREATED, COMMENT_UPDATED, and COMMENT_DELETED', async () => {
      const task = await Task.create({ project: project.id, title: 'Task', createdBy: user1._id });

      // Create
      const res = await request(app)
        .post(`/api/organizations/${organization._id}/projects/${project.id}/comments`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ entityType: 'TASK', entityId: task._id, content: 'Comment' });
      
      const commentId = res.body.data.comment._id;
      
      let activity = await Activity.findOne({ project: project.id, action: 'COMMENT_CREATED' });
      expect(activity).not.toBeNull();

      // Update
      await request(app)
        .patch(`/api/organizations/${organization._id}/projects/${project.id}/comments/${commentId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ content: 'Updated comment' });
      
      activity = await Activity.findOne({ project: project.id, action: 'COMMENT_UPDATED' });
      expect(activity).not.toBeNull();

      // Delete
      await request(app)
        .delete(`/api/organizations/${organization._id}/projects/${project.id}/comments/${commentId}`)
        .set('Authorization', `Bearer ${user1Token}`);
      
      activity = await Activity.findOne({ project: project.id, action: 'COMMENT_DELETED' });
      expect(activity).not.toBeNull();
    });
  });

  describe('Activity Feed API', () => {
    it('should retrieve project activity feed and paginate properly', async () => {
      // Seed 25 activities
      const acts = [];
      for (let i = 0; i < 25; i++) {
        acts.push({
          project: project.id,
          actor: user1._id,
          action: 'TEST_ACTION',
          entityType: 'PROJECT',
          entityId: project.id,
        });
      }
      await Activity.insertMany(acts);

      const res = await request(app)
        .get(`/api/organizations/${organization._id}/projects/${project.id}/activity?page=2&limit=10`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.activities.length).toBe(10);
      // Wait, there's also the PROJECT_CREATED activity that was generated when creating the project!
      // And PROJECT_MEMBER_ADDED. Total is 25 + 2 = 27
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(25);
      expect(res.body.data.pagination.page).toBe(2);
    });

    it('should not allow user from another project to see activity', async () => {
      const res = await request(app)
        .get(`/api/organizations/${organization._id}/projects/${project.id}/activity`)
        .set('Authorization', `Bearer ${user3Token}`); // user3 is not in project1

      expect(res.statusCode).toBe(403);
    });
  });
});
