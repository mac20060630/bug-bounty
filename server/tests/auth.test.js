import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';

let mongoServer;

describe('BugBounty Authentication & Authorization Suite', () => {
  before(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_key_for_unit_tests_32_characters!';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.NODE_ENV = 'test';

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  const testUser = {
    name: 'Alice Security',
    email: 'alice@security.io',
    password: 'Password123!',
  };

  let researcherToken = '';
  let adminToken = '';

  it('1. Should register a new researcher successfully with safe defaults', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.name, testUser.name);
    assert.equal(res.body.data.user.email, testUser.email);
    assert.equal(res.body.data.user.role, 'researcher');
    assert.equal(res.body.data.user.reputation, 0);
    assert.equal(res.body.data.user.password, undefined); // Password never exposed!
    assert.ok(res.body.data.token, 'Token must be returned');

    researcherToken = res.body.data.token;

    // Verify password is encrypted in database
    const dbUser = await User.findOne({ email: testUser.email }).select('+password');
    assert.notEqual(dbUser.password, testUser.password);
    assert.ok(dbUser.password.startsWith('$2'), 'Bcrypt hash should start with $2');
  });

  it('2. Should reject registration with duplicate email (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /already exists/i);
  });

  it('3. Should reject registration with invalid email or weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bad Input',
        email: 'not-an-email',
        password: 'short',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.errors.email);
    assert.ok(res.body.errors.password);
  });

  it('4. Should log in registered researcher with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, testUser.email);
    assert.equal(res.body.data.user.password, undefined);
  });

  it('5. Should reject login with wrong password (401 Unauthorized)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword999!',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Invalid email or password/i);
  });

  it('6. Should return user profile for authenticated request', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${researcherToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, testUser.email);
    assert.equal(res.body.data.user.role, 'researcher');
  });

  it('7. Should reject unauthenticated profile request (401 Missing/Bad Token)', async () => {
    const resNoToken = await request(app).get('/api/auth/profile');
    assert.equal(resNoToken.status, 401);

    const resBadToken = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer invalid_token_xyz');
    assert.equal(resBadToken.status, 401);
  });

  it('8. Should reject researcher trying to access admin-protected route (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/auth/admin-check')
      .set('Authorization', `Bearer ${researcherToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Forbidden/i);
  });

  it('9. Should allow admin user to access admin-protected route (200 OK)', async () => {
    // Register an admin user
    const adminUser = {
      name: 'Super Admin',
      email: 'admin@bugbounty.io',
      password: 'AdminPassword123!',
      role: 'admin',
    };

    const regRes = await request(app)
      .post('/api/auth/register')
      .send(adminUser);

    assert.equal(regRes.status, 201);
    adminToken = regRes.body.data.token;

    const res = await request(app)
      .get('/api/auth/admin-check')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.verified, true);
    assert.equal(res.body.data.user.role, 'admin');
  });

  it('10. Should confirm logout response (200 OK)', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${researcherToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
