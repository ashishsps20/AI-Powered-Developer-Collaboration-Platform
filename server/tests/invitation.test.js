import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import OrganizationMember from '../models/OrganizationMember.js';
import OrganizationInvitation from '../models/OrganizationInvitation.js';
import crypto from 'crypto';
import { jest } from '@jest/globals';
import './setup.js'; // DB setup

describe('Organization Invitation API', () => {
  let ownerCookie, memberCookie, outsiderCookie, unauthCookie;
  let ownerId, memberId, outsiderId;
  let orgId;
  
  // Helper to extract token from mock console.log if needed, 
  // but for tests we can just query the DB for the tokenHash or we can mock emailService.
  // Actually, we can't easily retrieve the raw token if the controller doesn't return it and we don't mock it.
  // We'll mock the emailService to capture the raw token!
  let lastRawToken = null;

  beforeEach(async () => {
    // Override the crypto.randomBytes to spy or we just spy on emailService.
    const emailService = await import('../services/email.service.js');
    jest.spyOn(emailService.default, 'sendInvitationEmail').mockImplementation(async (toEmail, inviterName, organizationName, rawToken) => {
      lastRawToken = rawToken;
      return true;
    });

    // 1. Create Owner User
    const resRegOwner = await request(app).post('/api/auth/register').send({
      name: 'Owner User',
      email: 'owner@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    ownerId = resRegOwner.body.data.user.id;
    const resLoginOwner = await request(app).post('/api/auth/login').send({ email: 'owner@example.com', password: 'password123' });
    ownerCookie = resLoginOwner.headers['set-cookie'];

    // 2. Create Member User
    const resRegMember = await request(app).post('/api/auth/register').send({
      name: 'Member User',
      email: 'member@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    memberId = resRegMember.body.data.user.id;
    const resLoginMember = await request(app).post('/api/auth/login').send({ email: 'member@example.com', password: 'password123' });
    memberCookie = resLoginMember.headers['set-cookie'];

    // 3. Create Outsider User
    const resRegOutsider = await request(app).post('/api/auth/register').send({
      name: 'Outsider',
      email: 'outsider@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    outsiderId = resRegOutsider.body.data.user.id;
    const resLoginOutsider = await request(app).post('/api/auth/login').send({ email: 'outsider@example.com', password: 'password123' });
    outsiderCookie = resLoginOutsider.headers['set-cookie'];

    // 4. Create Organization (Owned by Owner)
    const resOrg = await request(app).post('/api/organizations').set('Cookie', ownerCookie).send({ name: 'Test Org' });
    orgId = resOrg.body.data.organization.id;

    // Manually add Member User
    await OrganizationMember.create({
      user: memberId,
      organization: orgId,
      role: 'MEMBER'
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    lastRawToken = null;
  });

  describe('Invitation Creation', () => {
    it('1. Owner can invite', async () => {
      const res = await request(app).post(`/api/organizations/${orgId}/invitations`)
        .set('Cookie', ownerCookie)
        .send({ email: 'newguy@example.com' });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invitation.role).toBe('MEMBER');
      
      const dbInv = await OrganizationInvitation.findById(res.body.data.invitation.id);
      expect(dbInv.email).toBe('newguy@example.com');
      // 9. invitedBy comes from authenticated user
      expect(dbInv.invitedBy.toString()).toBe(ownerId);
    });

    it('2. Member cannot invite', async () => {
      const res = await request(app).post(`/api/organizations/${orgId}/invitations`)
        .set('Cookie', memberCookie)
        .send({ email: 'newguy@example.com' });
      expect(res.statusCode).toBe(403);
    });

    it('3. Unauthenticated user cannot invite', async () => {
      const res = await request(app).post(`/api/organizations/${orgId}/invitations`)
        .send({ email: 'newguy@example.com' });
      expect(res.statusCode).toBe(401);
    });

    it('4. Invalid email rejected', async () => {
      const res = await request(app).post(`/api/organizations/${orgId}/invitations`)
        .set('Cookie', ownerCookie)
        .send({ email: 'notanemail' });
      expect(res.statusCode).toBe(400);
    });

    it('5. Existing member cannot be invited', async () => {
      const res = await request(app).post(`/api/organizations/${orgId}/invitations`)
        .set('Cookie', ownerCookie)
        .send({ email: 'member@example.com' });
      expect(res.statusCode).toBe(409);
      expect(res.body.message).toMatch(/already a member/i);
    });

    it('6. Duplicate pending invitation rejected', async () => {
      await request(app).post(`/api/organizations/${orgId}/invitations`).set('Cookie', ownerCookie).send({ email: 'dup@example.com' });
      const res = await request(app).post(`/api/organizations/${orgId}/invitations`).set('Cookie', ownerCookie).send({ email: 'dup@example.com' });
      expect(res.statusCode).toBe(409);
      expect(res.body.message).toMatch(/pending invitation already exists/i);
    });

    it('7. Expired old invitation can be replaced', async () => {
      // Insert an expired invitation manually
      await OrganizationInvitation.create({
        organization: orgId,
        email: 'expiretest@example.com',
        invitedBy: ownerId,
        role: 'MEMBER',
        tokenHash: 'hashtest',
        expiresAt: new Date(Date.now() - 100000), // in the past
        status: 'PENDING' // still marked pending in DB, but expired in time
      });

      const res = await request(app).post(`/api/organizations/${orgId}/invitations`)
        .set('Cookie', ownerCookie)
        .send({ email: 'expiretest@example.com' });
      expect(res.statusCode).toBe(201); // Can replace because it checks expiresAt: { $gt: new Date() }
    });

    it('8. Invitation role is always MEMBER', async () => {
      const res = await request(app).post(`/api/organizations/${orgId}/invitations`)
        .set('Cookie', ownerCookie)
        .send({ email: 'newguy@example.com', role: 'OWNER' }); // Try to hack it
      expect(res.statusCode).toBe(201);
      
      const dbInv = await OrganizationInvitation.findById(res.body.data.invitation.id);
      expect(dbInv.role).toBe('MEMBER'); // Should force MEMBER
    });
  });

  describe('Acceptance', () => {
    let token, invId;

    beforeEach(async () => {
      const res = await request(app).post(`/api/organizations/${orgId}/invitations`)
        .set('Cookie', ownerCookie)
        .send({ email: 'outsider@example.com' });
      if (res.statusCode !== 201) {
        console.log('BEFORE EACH ERROR:', res.body);
      }
      invId = res.body.data.invitation.id;
      token = lastRawToken;
    });

    it('10. Correct user accepts invitation & 17, 18, 19', async () => {
      const res = await request(app).post('/api/organizations/invitations/accept')
        .set('Cookie', outsiderCookie)
        .send({ token });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.organization.id).toBe(orgId);

      const dbInv = await OrganizationInvitation.findById(invId);
      expect(dbInv.status).toBe('ACCEPTED'); // 17

      const newMember = await OrganizationMember.findOne({ user: outsiderId, organization: orgId });
      expect(newMember).not.toBeNull(); // 18
      expect(newMember.role).toBe('MEMBER');
    });

    it('11. Wrong user cannot accept', async () => {
      const res = await request(app).post('/api/organizations/invitations/accept')
        .set('Cookie', memberCookie) // member@example.com trying to accept outsider@example.com's invite
        .send({ token });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/different email address/i);
    });

    it('12. Expired invitation rejected', async () => {
      await OrganizationInvitation.findByIdAndUpdate(invId, { expiresAt: new Date(Date.now() - 1000) });
      const res = await request(app).post('/api/organizations/invitations/accept').set('Cookie', outsiderCookie).send({ token });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/expired/i);
    });

    it('13. Already accepted invitation rejected', async () => {
      await OrganizationInvitation.findByIdAndUpdate(invId, { status: 'ACCEPTED' });
      const res = await request(app).post('/api/organizations/invitations/accept').set('Cookie', outsiderCookie).send({ token });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already been accepted/i);
    });

    it('14. Cancelled invitation rejected', async () => {
      await OrganizationInvitation.findByIdAndUpdate(invId, { status: 'CANCELLED' });
      const res = await request(app).post('/api/organizations/invitations/accept').set('Cookie', outsiderCookie).send({ token });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/cancelled/i);
    });

    it('15. Rejected invitation rejected', async () => {
      await OrganizationInvitation.findByIdAndUpdate(invId, { status: 'REJECTED' });
      const res = await request(app).post('/api/organizations/invitations/accept').set('Cookie', outsiderCookie).send({ token });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/rejected/i);
    });

    it('16. User cannot become duplicate member', async () => {
      // Make outsider a member directly
      await OrganizationMember.create({ user: outsiderId, organization: orgId, role: 'MEMBER' });
      
      const res = await request(app).post('/api/organizations/invitations/accept').set('Cookie', outsiderCookie).send({ token });
      expect(res.statusCode).toBe(409); // Conflict

      // Invitation should be marked accepted still based on instructions (or left pending, instructions said: "The invitation may optionally be marked ACCEPTED if business logic requires it")
      const dbInv = await OrganizationInvitation.findById(invId);
      expect(dbInv.status).toBe('ACCEPTED');

      const memCount = await OrganizationMember.countDocuments({ user: outsiderId, organization: orgId });
      expect(memCount).toBe(1); // No duplicates
    });
  });

  describe('Rejection', () => {
    let token, invId;

    beforeEach(async () => {
      const res = await request(app).post(`/api/organizations/${orgId}/invitations`)
        .set('Cookie', ownerCookie)
        .send({ email: 'outsider@example.com' });
      if (res.statusCode !== 201) {
        console.log('BEFORE EACH ERROR:', res.body);
      }
      invId = res.body.data.invitation.id;
      token = lastRawToken;
    });

    it('20. Correct user rejects', async () => {
      const res = await request(app).post('/api/organizations/invitations/reject')
        .set('Cookie', outsiderCookie)
        .send({ token });
      expect(res.statusCode).toBe(200);

      const dbInv = await OrganizationInvitation.findById(invId);
      expect(dbInv.status).toBe('REJECTED');
      expect(dbInv.rejectedAt).toBeDefined();
    });

    it('21. Wrong user cannot reject', async () => {
      const res = await request(app).post('/api/organizations/invitations/reject')
        .set('Cookie', memberCookie)
        .send({ token });
      expect(res.statusCode).toBe(403);
    });

    it('22. Rejected invitation cannot be accepted', async () => {
      await request(app).post('/api/organizations/invitations/reject').set('Cookie', outsiderCookie).send({ token });
      const res = await request(app).post('/api/organizations/invitations/accept').set('Cookie', outsiderCookie).send({ token });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/rejected/i);
    });
  });

  describe('Members Management', () => {
    it('23. Member list works', async () => {
      const res = await request(app).get(`/api/organizations/${orgId}/members`).set('Cookie', ownerCookie);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.members).toHaveLength(2); // Owner + Member
      const roles = res.body.data.members.map(m => m.role).sort();
      expect(roles).toEqual(['MEMBER', 'OWNER']);
    });

    it('24. Non-member cannot list members', async () => {
      const res = await request(app).get(`/api/organizations/${orgId}/members`).set('Cookie', outsiderCookie);
      expect(res.statusCode).toBe(403);
    });

    it('25. Owner can remove member & 28. Removing member does not delete User', async () => {
      const res = await request(app).delete(`/api/organizations/${orgId}/members/${memberId}`).set('Cookie', ownerCookie);
      expect(res.statusCode).toBe(200);

      // Verify membership is gone
      const membership = await OrganizationMember.findOne({ user: memberId, organization: orgId });
      expect(membership).toBeNull();

      // Verify user is not deleted (28)
      const user = await User.findById(memberId);
      expect(user).not.toBeNull();
    });

    it('26. Member cannot remove member', async () => {
      const res = await request(app).delete(`/api/organizations/${orgId}/members/${ownerId}`).set('Cookie', memberCookie);
      expect(res.statusCode).toBe(403); // requireOrganizationOwner should catch this
    });

    it('27. Owner cannot remove owner', async () => {
      const res = await request(app).delete(`/api/organizations/${orgId}/members/${ownerId}`).set('Cookie', ownerCookie);
      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/owner cannot be removed/i);
    });
  });

  describe('Cancellation', () => {
    let token, invId;

    beforeEach(async () => {
      const res = await request(app).post(`/api/organizations/${orgId}/invitations`)
        .set('Cookie', ownerCookie)
        .send({ email: 'outsider@example.com' });
      if (res.statusCode !== 201) {
        console.log('BEFORE EACH ERROR:', res.body);
      }
      invId = res.body.data.invitation.id;
      token = lastRawToken;
    });

    it('29. Owner can cancel pending invitation', async () => {
      const res = await request(app).delete(`/api/organizations/${orgId}/invitations/${invId}`).set('Cookie', ownerCookie);
      expect(res.statusCode).toBe(200);

      const dbInv = await OrganizationInvitation.findById(invId);
      expect(dbInv.status).toBe('CANCELLED');
      expect(dbInv.cancelledAt).toBeDefined();
    });

    it('30. Member cannot cancel invitation', async () => {
      const res = await request(app).delete(`/api/organizations/${orgId}/invitations/${invId}`).set('Cookie', memberCookie);
      expect(res.statusCode).toBe(403);
    });

    it('31. Cancelled invitation cannot be accepted', async () => {
      await request(app).delete(`/api/organizations/${orgId}/invitations/${invId}`).set('Cookie', ownerCookie);
      const res = await request(app).post('/api/organizations/invitations/accept').set('Cookie', outsiderCookie).send({ token });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/cancelled/i);
    });
  });

  describe('Pending Invitations GET', () => {
    it('Should fetch pending invitations for a user', async () => {
      await request(app).post(`/api/organizations/${orgId}/invitations`).set('Cookie', ownerCookie).send({ email: 'outsider@example.com' });
      
      const res = await request(app).get('/api/organizations/invitations/pending').set('Cookie', outsiderCookie);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.invitations.length).toBe(1);
      expect(res.body.data.invitations[0].organization.name).toBe('Test Org');
      expect(res.body.data.invitations[0].role).toBe('MEMBER');
      
      // Shouldn't leak tokens
      expect(res.body.data.invitations[0].tokenHash).toBeUndefined();
    });
  });
});
