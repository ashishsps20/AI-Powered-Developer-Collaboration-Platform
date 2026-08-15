import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import './setup.js';

describe('Auth Session API', () => {
  const validUser = {
    name: 'Session User',
    email: 'session.user@example.com',
    password: 'password123',
  };

  let authCookie;
  let createdUserId;

  beforeEach(async () => {
    // 1. Register user
    const resReg = await request(app).post('/api/auth/register').send({
      ...validUser,
      confirmPassword: validUser.password
    });
    createdUserId = resReg.body.data.user.id;

    // 2. Login to get cookie
    const resLogin = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: validUser.password
    });
    authCookie = resLogin.headers['set-cookie'];
  });

  it('Test 1: GET /me without cookie should return 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('Authentication required');
  });

  it('Test 2: Login successfully, then GET /me using returned cookie returns 200', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookie);
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.user.email).toBe(validUser.email);
  });

  it('Test 3: GET /me with invalid cookie returns 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', ['jwt=invalid_token_string']);
      
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('Authentication required');
  });

  it('Test 4: GET /me with expired JWT returns 401', async () => {
    // Generate an expired token manually
    const expiredToken = jwt.sign(
      { sub: createdUserId, platformRole: 'USER' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '-1s' }
    );
    
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`jwt=${expiredToken}`]);
      
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('Authentication required');
  });

  it('Test 5: GET /me after user is deactivated returns 401', async () => {
    // Deactivate the user
    await User.findByIdAndUpdate(createdUserId, { isActive: false });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookie);
      
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('Authentication required');
  });

  it('Test 6: GET /me after user no longer exists returns 401', async () => {
    // Delete the user completely
    await User.findByIdAndDelete(createdUserId);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookie);
      
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('Authentication required');
  });

  it('Test 7: Authenticated user receives correct safe user data without password', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookie);
      
    const user = res.body.data.user;
    expect(user.name).toBe(validUser.name);
    expect(user.email).toBe(validUser.email);
    expect(user.platformRole).toBeDefined();
    
    // Password hash should definitely NOT be returned
    expect(user.password).toBeUndefined();
    expect(user.passwordHash).toBeUndefined();
  });

  it('Test 8: Logout clears cookie correctly', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', authCookie);
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Logged out successfully');
    
    const cookie = res.headers['set-cookie'][0];
    // Check if the cookie is being cleared by matching maxAge/expires or an empty value
    expect(cookie).toMatch(/jwt=;/);
  });

  it('Test 9: Logout without authentication returns 200', async () => {
    const res = await request(app).post('/api/auth/logout');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Logged out successfully');
  });

  it('Test 10: Protected test route without authentication returns 401', async () => {
    const res = await request(app).get('/api/auth/protected-test');
    
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('Authentication required');
  });

  it('Test 11: Protected test route with valid authentication returns 200', async () => {
    const res = await request(app)
      .get('/api/auth/protected-test')
      .set('Cookie', authCookie);
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Authentication successful');
    expect(res.body.data.userId).toBe(createdUserId);
  });
});
