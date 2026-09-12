import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import BountyProgram from '../models/BountyProgram.js';
import VulnerabilityReport from '../models/VulnerabilityReport.js';

let mongoServer;

describe('BugBounty Phase 2: Bounty Programs & Vulnerability Reports Suite', () => {
  let adminToken = '';
  let researcher1Token = '';
  let researcher2Token = '';
  let activeProgramId = '';
  let closedProgramId = '';
  let submittedReportId = '';

  before(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_key_for_unit_tests_32_characters!';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.NODE_ENV = 'test';

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Register admin user
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'SecOps Administrator',
        email: 'admin.secops@enterprise.io',
        password: 'AdminPassword123!',
        role: 'admin',
      });
    adminToken = adminRes.body.data.token;

    // Register Researcher 1
    const r1Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Hunter Alice',
        email: 'hunter.alice@bugbounty.io',
        password: 'HunterPassword123!',
        role: 'researcher',
      });
    researcher1Token = r1Res.body.data.token;

    // Register Researcher 2
    const r2Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Hunter Bob',
        email: 'hunter.bob@bugbounty.io',
        password: 'HunterPassword123!',
        role: 'researcher',
      });
    researcher2Token = r2Res.body.data.token;
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  /* -------------------------------------------------------------
     BOUNTY PROGRAM TESTS
  ------------------------------------------------------------- */

  it('1. Admin should create a new Bounty Program successfully', async () => {
    const res = await request(app)
      .post('/api/programs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyName: 'Acme Cloud Services',
        title: 'Acme Global Infrastructure Bug Bounty',
        description:
          'Help secure Acme cloud infrastructure, public web applications, and authentication APIs.',
        scope: {
          inScope: [
            { target: '*.acme.com', type: 'web', description: 'All core web applications' },
            { target: 'api.acme.com', type: 'api', description: 'Production API gateways' },
          ],
          outOfScope: [
            { target: 'blog.acme.com', description: 'Third-party hosted marketing blog' },
          ],
        },
        rules:
          '1. Do not alter user data.\n2. Do not conduct DoS attacks.\n3. Report promptly.',
        rewardRange: {
          min: 250,
          max: 10000,
          currency: 'USD',
        },
        status: 'active',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.program.companyName, 'Acme Cloud Services');
    assert.equal(res.body.data.program.status, 'active');
    activeProgramId = res.body.data.program._id;
  });

  it('2. Researcher should be REJECTED from creating a Bounty Program (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/programs')
      .set('Authorization', `Bearer ${researcher1Token}`)
      .send({
        companyName: 'Unauthorized Corp',
        title: 'Unauthorized Program',
        description: 'Should fail validation and role guard.',
        rewardRange: { min: 100, max: 1000 },
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it('3. Anyone should be able to browse and search active Bounty Programs', async () => {
    const res = await request(app).get('/api/programs?search=Acme');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.programs.length >= 1);
    assert.equal(res.body.data.programs[0].companyName, 'Acme Cloud Services');
  });

  it('4. Admin should be able to update Bounty Program details', async () => {
    const res = await request(app)
      .put(`/api/programs/${activeProgramId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyName: 'Acme Cloud Services Inc.',
        title: 'Acme Global Infrastructure Bug Bounty v2',
        description: 'Updated program guidelines with enhanced rewards.',
        rewardRange: { min: 300, max: 12000, currency: 'USD' },
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.program.companyName, 'Acme Cloud Services Inc.');
    assert.equal(res.body.data.program.rewardRange.max, 12000);
  });

  it('5. Admin can create a paused/closed program; non-admin cannot view it', async () => {
    const createClosed = await request(app)
      .post('/api/programs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyName: 'Secret Beta Corp',
        title: 'Internal Closed Program',
        description: 'Private testing only.',
        rewardRange: { min: 50, max: 500 },
        status: 'closed',
      });

    closedProgramId = createClosed.body.data.program._id;

    // Researcher attempts to fetch closed program -> 403 Forbidden
    const res = await request(app)
      .get(`/api/programs/${closedProgramId}`)
      .set('Authorization', `Bearer ${researcher1Token}`);

    assert.equal(res.status, 403);
  });

  /* -------------------------------------------------------------
     FILE UPLOAD TESTS
  ------------------------------------------------------------- */

  it('6. File upload endpoint should accept valid image evidence', async () => {
    const fakeImageBuffer = Buffer.from('fake png binary content');

    const res = await request(app)
      .post('/api/upload/evidence')
      .set('Authorization', `Bearer ${researcher1Token}`)
      .attach('evidence', fakeImageBuffer, {
        filename: 'poc_screenshot.png',
        contentType: 'image/png',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.files.length === 1);
    assert.ok(res.body.data.files[0].url);
  });

  it('7. File upload should reject dangerous executable file extensions (400)', async () => {
    const fakeScriptBuffer = Buffer.from('echo malicious script');

    const res = await request(app)
      .post('/api/upload/evidence')
      .set('Authorization', `Bearer ${researcher1Token}`)
      .attach('evidence', fakeScriptBuffer, {
        filename: 'exploit.sh',
        contentType: 'application/x-sh',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  /* -------------------------------------------------------------
     VULNERABILITY REPORT TESTS & IDOR DEFENSE
  ------------------------------------------------------------- */

  it('8. Researcher 1 should submit a vulnerability report against active program', async () => {
    const reportData = {
      programId: activeProgramId,
      title: 'SQL Injection in /api/v1/billing endpoint',
      description:
        'Unsanitized user input in the transaction query parameter permits arbitrary SQL command execution.',
      category: 'injection',
      affectedAsset: 'https://api.acme.com/v1/billing',
      reproductionSteps:
        '1. Send GET request to /api/v1/billing?query=1%27%20OR%201=1--\n2. Observe database error returning full user records.',
      impact:
        'Full administrative database disclosure and potential data manipulation.',
      suggestedRemediation:
        'Implement parameterized prepared statements using Prisma/Mongoose.',
      severity: 'critical',
      evidence: [
        {
          url: '/uploads/evidence/poc_screenshot.png',
          fileName: 'poc_screenshot.png',
          fileType: 'image/png',
          fileSize: 1024,
        },
      ],
    };

    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${researcher1Token}`)
      .send(reportData);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.report.title, reportData.title);
    assert.equal(res.body.data.report.status, 'submitted');
    assert.equal(res.body.data.report.severity, 'critical');
    assert.equal(res.body.data.report.riskScore, 9.5);

    submittedReportId = res.body.data.report._id;
  });

  it('9. Submitting report to closed or nonexistent program should be REJECTED (400/404)', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${researcher1Token}`)
      .send({
        programId: closedProgramId,
        title: 'Report on closed program',
        description: 'Should fail because program is closed.',
        category: 'xss',
        affectedAsset: 'https://secret.corp',
        reproductionSteps: 'Step 1, step 2, step 3 detailed reproduction.',
        impact: 'Low impact description.',
        severity: 'low',
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /closed/i);
  });

  it('10. Researcher 1 should be able to view their own submitted report', async () => {
    const res = await request(app)
      .get(`/api/reports/${submittedReportId}`)
      .set('Authorization', `Bearer ${researcher1Token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.report._id, submittedReportId);
    assert.equal(res.body.data.report.title, 'SQL Injection in /api/v1/billing endpoint');
  });

  it('11. IDOR DEFENSE: Researcher 2 attempting to view Researcher 1 report MUST be BLOCKED (403)', async () => {
    const res = await request(app)
      .get(`/api/reports/${submittedReportId}`)
      .set('Authorization', `Bearer ${researcher2Token}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not authorized/i);
  });

  it('12. Admin should be able to view report and transition status to under_review', async () => {
    // Admin retrieves report
    const getRes = await request(app)
      .get(`/api/reports/${submittedReportId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(getRes.status, 200);

    // Admin transitions status to 'under_review'
    const updateRes = await request(app)
      .put(`/api/reports/${submittedReportId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'under_review',
        statusNote: 'Security engineering team has begun validating PoC.',
      });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.report.status, 'under_review');
    assert.equal(updateRes.body.data.report.statusHistory.length, 2);
    assert.equal(updateRes.body.data.report.statusHistory[1].toStatus, 'under_review');
  });

  it('13. Researcher list reports query should return only their own reports', async () => {
    const res = await request(app)
      .get('/api/reports')
      .set('Authorization', `Bearer ${researcher1Token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.reports.length, 1);
    assert.equal(res.body.data.reports[0]._id, submittedReportId);

    // Researcher 2 should have 0 reports
    const res2 = await request(app)
      .get('/api/reports')
      .set('Authorization', `Bearer ${researcher2Token}`);

    assert.equal(res2.status, 200);
    assert.equal(res2.body.data.reports.length, 0);
  });
});
