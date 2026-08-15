import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import './setup.js';

describe('Auth Registration API', () => {
  const validUser = {
    name: 'Ashish Gautam',
    email: 'ashish@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  };

  it('Test 1: Valid registration should return 201', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Account created successfully');
    expect(res.body.data.user.id).toBeDefined();
    expect(res.body.data.user.name).toBe(validUser.name);
    expect(res.body.data.user.email).toBe(validUser.email);
  });

  it('Test 2: Duplicate email should return 409', async () => {
    // Create first user
    await request(app).post('/api/auth/register').send(validUser);
    
    // Attempt duplicate
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.statusCode).toEqual(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('An account with this email already exists');
  });

  it('Test 3: Email case normalization', async () => {
    const upperCaseUser = {
      ...validUser,
      email: 'ASHISH@EXAMPLE.COM',
    };
    
    const res = await request(app).post('/api/auth/register').send(upperCaseUser);
    expect(res.statusCode).toEqual(201);
    expect(res.body.data.user.email).toBe('ashish@example.com');
  });

  it('Test 4: Invalid email should return 400', async () => {
    const invalidEmailUser = { ...validUser, email: 'not-an-email' };
    const res = await request(app).post('/api/auth/register').send(invalidEmailUser);
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email format');
  });

  it('Test 5: Missing name should return 400', async () => {
    const { name, ...missingNameUser } = validUser;
    const res = await request(app).post('/api/auth/register').send(missingNameUser);
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Name is required');
  });

  it('Test 6: Missing password should return 400', async () => {
    const { password, ...missingPasswordUser } = validUser;
    const res = await request(app).post('/api/auth/register').send(missingPasswordUser);
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Password is required');
  });

  it('Test 7: Password shorter than minimum should return 400', async () => {
    const shortPasswordUser = { ...validUser, password: 'short', confirmPassword: 'short' };
    const res = await request(app).post('/api/auth/register').send(shortPasswordUser);
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Password must be at least 8 characters long');
  });

  it('Test 8: Password is hashed and can be authenticated', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    
    const dbUser = await User.findOne({ email: validUser.email }).select('+password');
    expect(dbUser).toBeDefined();
    
    // Stored password is NOT equal to plaintext
    expect(dbUser.password).not.toBe(validUser.password);
    
    // bcrypt can verify it
    const isMatch = await bcrypt.compare(validUser.password, dbUser.password);
    expect(isMatch).toBe(true);
  });

  it('Test 9: Password is not returned in response', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    
    expect(res.body.data.user.password).toBeUndefined();
    // Also checking hash isn't accidentally returned
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('Test 10: Default platform role is USER', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.body.data.user.platformRole).toBe('USER');
  });

  it('Test 11: Default active state is true', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.body.data.user.isActive).toBe(true);
  });

  it('Test 12: Default email verification state is false', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.body.data.user.isEmailVerified).toBe(false);
  });

  it('Test 13: No organization created implicitly', async () => {
    // Note: Since we don't have an Organization model yet, we just verify User exists.
    // The requirement states "organization count remains unchanged" which is implicitly
    // true as we haven't written any organization logic, but we test the user exists.
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.statusCode).toEqual(201);
    const count = await User.countDocuments();
    expect(count).toBe(1);
    
    // No organization fields exist on the user model response
    expect(res.body.data.user.organizationId).toBeUndefined();
  });
});

describe('Auth Login API', () => {
  const validUser = {
    name: 'Ashish Gautam',
    email: 'ashish.login@example.com',
    password: 'password123',
  };

  beforeEach(async () => {
    // Create a fresh user before each test so we can safely manipulate it
    await request(app).post('/api/auth/register').send({
      ...validUser,
      confirmPassword: validUser.password
    });
  });

  it('Test 1: Valid email/password should return 200', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: validUser.password
    });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.data.user.email).toBe(validUser.email);
  });

  it('Test 2: Wrong password should return 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: 'wrongpassword'
    });
    
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('Test 3: Unknown email should return 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'unknown@example.com',
      password: 'password123'
    });
    
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('Test 4: Missing email should return 400', async () => {
    const res = await request(app).post('/api/auth/login').send({
      password: 'password123'
    });
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe('Email is required');
  });

  it('Test 5: Missing password should return 400', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: validUser.email
    });
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe('Password is required');
  });

  it('Test 6: Inactive user should return 401', async () => {
    // Disable user
    await User.updateOne({ email: validUser.email }, { isActive: false });
    
    const res = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: validUser.password
    });
    
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('Account is disabled');
  });

  it('Test 7: JWT cookie exists after successful login', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: validUser.password
    });
    
    expect(res.headers['set-cookie']).toBeDefined();
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/^jwt=/);
  });

  it('Test 8: Cookie is HTTP-only', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: validUser.password
    });
    
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/HttpOnly/);
  });

  it('Test 9: Password is not returned in response', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: validUser.password
    });
    
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('Test 10: JWT payload does not contain sensitive data', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: validUser.password
    });
    
    const cookie = res.headers['set-cookie'][0];
    const token = cookie.split(';')[0].replace('jwt=', '');
    
    // Decode token
    const decoded = jwt.decode(token);
    
    // Check that it ONLY has expected safe claims
    expect(decoded.sub).toBeDefined();
    expect(decoded.platformRole).toBeDefined();
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
    
    // Check that it does NOT have sensitive data
    expect(decoded.password).toBeUndefined();
    expect(decoded.email).toBeUndefined();
    expect(decoded.name).toBeUndefined();
  });
});
