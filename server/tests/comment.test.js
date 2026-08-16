import './setup.js';
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

import { jest } from '@jest/globals';

describe('Comment API', () => {
  jest.setTimeout(30000);

  let user1Token, user2Token, user3Token;
  let user1, user2, user3;
  let organization;
  let project;
  let task;
  let issue;

  beforeEach(async () => {
    // 1. Create Users
    user1 = await User.create({
      name: 'User One',
      email: 'user1@example.com',
      password: 'password123',
    });
    user2 = await User.create({
      name: 'User Two',
      email: 'user2@example.com',
      password: 'password123',
    });
    user3 = await User.create({ // Non-project member
      name: 'User Three',
      email: 'user3@example.com',
      password: 'password123',
    });

    // 2. Login to get tokens
    const res1 = await request(app).post('/api/auth/login').send({ email: 'user1@example.com', password: 'password123' });
    user1Token = res1.body.data.token;
    
    const res2 = await request(app).post('/api/auth/login').send({ email: 'user2@example.com', password: 'password123' });
    user2Token = res2.body.data.token;

    const res3 = await request(app).post('/api/auth/login').send({ email: 'user3@example.com', password: 'password123' });
    user3Token = res3.body.data.token;

    // 3. Create Organization
    organization = await Organization.create({
      name: 'Test Org',
      slug: 'test-org',
      owner: user1._id,
    });

    await OrganizationMember.create({
      organization: organization._id,
      user: user1._id,
      role: 'OWNER',
    });

    await OrganizationMember.create({
      organization: organization._id,
      user: user2._id,
      role: 'MEMBER',
    });

    await OrganizationMember.create({
      organization: organization._id,
      user: user3._id,
      role: 'MEMBER',
    });

    // 4. Create Project
    project = await Project.create({
      organization: organization._id,
      name: 'Test Project',
      slug: 'test-project',
      createdBy: user1._id,
    });

    // Project Members
    await ProjectMember.create({
      project: project._id,
      user: user1._id,
      role: 'PROJECT_MANAGER',
    });

    await ProjectMember.create({
      project: project._id,
      user: user2._id,
      role: 'DEVELOPER',
    });
    // user3 is in the org but not in the project

    // 5. Create Task
    task = await Task.create({
      project: project._id,
      title: 'Test Task',
      createdBy: user1._id,
    });

    // 6. Create Issue
    issue = await Issue.create({
      project: project._id,
      title: 'Test Issue',
      type: 'BUG',
      priority: 'HIGH',
      reportedBy: user1._id,
    });
  });

  describe('Comment Creation', () => {
    it('should allow project member to comment on task', async () => {
      const res = await request(app)
        .post(`/api/organizations/${organization._id}/projects/${project._id}/comments`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          entityType: 'TASK',
          entityId: task._id,
          content: 'This is a test comment on a task'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment.content).toBe('This is a test comment on a task');
      expect(res.body.data.comment.author._id.toString()).toBe(user2._id.toString());
    });

    it('should allow project member to comment on issue', async () => {
      const res = await request(app)
        .post(`/api/organizations/${organization._id}/projects/${project._id}/comments`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          entityType: 'ISSUE',
          entityId: issue._id,
          content: 'This is a test comment on an issue'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
    });

    it('should not allow non-project member to comment', async () => {
      const res = await request(app)
        .post(`/api/organizations/${organization._id}/projects/${project._id}/comments`)
        .set('Authorization', `Bearer ${user3Token}`)
        .send({
          entityType: 'TASK',
          entityId: task._id,
          content: 'Should not work'
        });

      expect(res.statusCode).toEqual(403); // Forbidden
    });

    it('should reject invalid entity type', async () => {
      const res = await request(app)
        .post(`/api/organizations/${organization._id}/projects/${project._id}/comments`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          entityType: 'UNKNOWN',
          entityId: task._id,
          content: 'Test content'
        });

      expect(res.statusCode).not.toEqual(201);
    });

    it('should reject non-existent task', async () => {
      const res = await request(app)
        .post(`/api/organizations/${organization._id}/projects/${project._id}/comments`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          entityType: 'TASK',
          entityId: new mongoose.Types.ObjectId(),
          content: 'Test content'
        });

      expect(res.statusCode).not.toEqual(201);
    });

    it('should reject task from another project', async () => {
      // Create another project and task
      const project2 = await Project.create({ organization: organization._id, name: 'Project 2', slug: 'p2', createdBy: user1._id });
      const task2 = await Task.create({ project: project2._id, title: 'Task 2', createdBy: user1._id });

      const res = await request(app)
        .post(`/api/organizations/${organization._id}/projects/${project._id}/comments`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          entityType: 'TASK',
          entityId: task2._id, // trying to comment on project2's task within project1
          content: 'Test content'
        });

      expect(res.statusCode).not.toEqual(201);
    });

    it('should validate comment content', async () => {
      const res = await request(app)
        .post(`/api/organizations/${organization._id}/projects/${project._id}/comments`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          entityType: 'TASK',
          entityId: task._id,
          content: '   ' // empty content after trim
        });

      expect(res.statusCode).not.toEqual(201);
    });
  });

  describe('Comment Update & Delete', () => {
    let comment;

    beforeEach(async () => {
      comment = await Comment.create({
        project: project._id,
        entityType: 'TASK',
        entityId: task._id,
        author: user2._id,
        content: 'Original comment',
      });
    });

    it('should allow author to edit own comment', async () => {
      const res = await request(app)
        .patch(`/api/organizations/${organization._id}/projects/${project._id}/comments/${comment._id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'Edited comment' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.comment.content).toBe('Edited comment');
      expect(res.body.data.comment.isEdited).toBe(true);
    });

    it('should not allow another user to edit comment', async () => {
      const res = await request(app)
        .patch(`/api/organizations/${organization._id}/projects/${project._id}/comments/${comment._id}`)
        .set('Authorization', `Bearer ${user1Token}`) // user1 is PM but not author
        .send({ content: 'Edited comment' });

      expect(res.statusCode).not.toEqual(200);
    });

    it('should allow author to delete own comment', async () => {
      const res = await request(app)
        .delete(`/api/organizations/${organization._id}/projects/${project._id}/comments/${comment._id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toEqual(200);
      
      const dbComment = await Comment.findById(comment._id);
      expect(dbComment.isDeleted).toBe(true);
      expect(dbComment.deletedAt).toBeDefined();
    });

    it('should not expose deleted comment content', async () => {
      await Comment.findByIdAndUpdate(comment._id, { isDeleted: true, deletedAt: new Date() });

      const res = await request(app)
        .get(`/api/organizations/${organization._id}/projects/${project._id}/comments?entityType=TASK&entityId=${task._id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.comments[0].content).toBe('Comment deleted');
    });
  });

  describe('Pagination', () => {
    beforeEach(async () => {
      const commentsToInsert = [];
      for (let i = 0; i < 25; i++) {
        commentsToInsert.push({
          project: project._id,
          entityType: 'TASK',
          entityId: task._id,
          author: user1._id,
          content: `Comment ${i}`,
        });
      }
      await Comment.insertMany(commentsToInsert);
    });

    it('should paginate comments properly', async () => {
      const res = await request(app)
        .get(`/api/organizations/${organization._id}/projects/${project._id}/comments?entityType=TASK&entityId=${task._id}&page=2&limit=10`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.comments.length).toBe(10);
      expect(res.body.data.pagination.total).toBe(25);
      expect(res.body.data.pagination.page).toBe(2);
    });
  });

  describe('Mentions', () => {
    it('should extract and validate multiple mentions', async () => {
      const res = await request(app)
        .post(`/api/organizations/${organization._id}/projects/${project._id}/comments`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          entityType: 'TASK',
          entityId: task._id,
          content: 'Hello',
          mentions: [user2._id, user1._id, user2._id] // duplicate handled
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.comment.mentions.length).toBe(2);
    });

    it('should reject non-project user mentions', async () => {
      const res = await request(app)
        .post(`/api/organizations/${organization._id}/projects/${project._id}/comments`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          entityType: 'TASK',
          entityId: task._id,
          content: 'Hello',
          mentions: [user3._id] // user3 is not in project
        });

      expect(res.statusCode).toEqual(201);
      // user3 mention should be stripped out since it's invalid
      expect(res.body.data.comment.mentions.length).toBe(0);
    });
  });
});
