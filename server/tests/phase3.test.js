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

describe('BugBounty Phase 3: Triage Workflow, Severity, Rewards, Reputation & Leaderboard Suite', () => {
  let adminToken = '';
  let researcherToken = '';
  let researcher2Token = '';
  let programId = '';
  let reportId = '';
  let researcherUserId = '';

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
        name: 'SecOps Director',
        email: 'director@secops.io',
        password: 'AdminPassword123!',
        role: 'admin',
      });
    adminToken = adminRes.body.data.token;

    // Register primary researcher
    const r1Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Grace Hopper',
        email: 'grace@cyberpioneer.org',
        password: 'HunterPassword123!',
        role: 'researcher',
      });
    researcherToken = r1Res.body.data.token;
    researcherUserId = r1Res.body.data.user.id;

    // Register secondary researcher
    const r2Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alan Turing',
        email: 'alan@cyberpioneer.org',
        password: 'HunterPassword123!',
        role: 'researcher',
      });
    researcher2Token = r2Res.body.data.token;

    // Create a Bounty Program
    const progRes = await request(app)
      .post('/api/programs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyName: 'Global Cyber Defense Corp',
        title: 'Enterprise Perimeter Bounty Program',
        description: 'Testing authentication, access controls, and core APIs.',
        scope: {
          inScope: [{ target: '*.defense.corp', type: 'web', description: 'Web application portals' }],
        },
        rules: 'Standard responsible disclosure guidelines apply.',
        rewardRange: { min: 200, max: 10000, currency: 'USD' },
        status: 'active',
      });
    programId = progRes.body.data.program._id;

    // Submit a Vulnerability Report as Grace Hopper
    const repRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${researcherToken}`)
      .send({
        programId,
        title: 'Authentication Bypass via JWT Algorithm Confusion',
        description:
          'The authentication gateway accepts RS256 tokens verified with HMAC using public key.',
        category: 'broken_auth',
        affectedAsset: 'https://auth.defense.corp/v1/verify',
        reproductionSteps:
          '1. Craft JWT with alg HS256 using RS256 public key as secret HMAC key.\n2. Submit Bearer token.\n3. Gateway authenticates forged token as admin.',
        impact: 'Full administrative takeover across all cloud resources.',
        suggestedRemediation: 'Explicitly enforce allowed algorithms whitelist on jwt.verify().',
        severity: 'medium', // Researcher suggests medium initially
      });
    reportId = repRes.body.data.report._id;
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  /* -------------------------------------------------------------
     1. WORKFLOW TRANSITIONS & INVALID JUMPS
  ------------------------------------------------------------- */

  it('1. Should REJECT invalid state transition (e.g. submitted directly to resolved) (400)', async () => {
    const res = await request(app)
      .patch(`/api/reports/${reportId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'resolved',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Invalid workflow transition/i);
  });

  it('2. Admin should transition report: submitted -> under_review (200)', async () => {
    const res = await request(app)
      .patch(`/api/reports/${reportId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'under_review',
        note: 'SecOps has begun validating algorithm confusion PoC.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.report.status, 'under_review');
  });

  it('3. Admin should transition report: under_review -> triaged (200)', async () => {
    const res = await request(app)
      .patch(`/api/reports/${reportId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'triaged',
        note: 'Vulnerability confirmed reproducible on staging environment.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.report.status, 'triaged');
  });

  /* -------------------------------------------------------------
     2. SEVERITY ADJUSTMENT & AUDITING
  ------------------------------------------------------------- */

  it('4. Admin should upgrade severity from medium to critical with CVSS update (200)', async () => {
    const res = await request(app)
      .patch(`/api/reports/${reportId}/severity`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        severity: 'critical',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.report.severity, 'critical');
    assert.equal(res.body.data.report.originalSeverity, 'medium'); // Preserved original
    assert.equal(res.body.data.report.riskScore, 9.5); // Updated CVSS score
  });

  it('5. Non-admin (researcher) should be REJECTED from updating severity (403)', async () => {
    const res = await request(app)
      .patch(`/api/reports/${reportId}/severity`)
      .set('Authorization', `Bearer ${researcherToken}`)
      .send({
        severity: 'critical',
      });

    assert.equal(res.status, 403);
  });

  /* -------------------------------------------------------------
     3. ACCEPTANCE & REPUTATION ENGINE
  ------------------------------------------------------------- */

  it('6. Admin transitions report: triaged -> accepted; researcher gains +100 reputation points', async () => {
    // Check initial reputation
    const userBefore = await User.findById(researcherUserId);
    assert.equal(userBefore.reputation, 0);

    const res = await request(app)
      .patch(`/api/reports/${reportId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'accepted',
        note: 'Report accepted as valid Critical vulnerability.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.report.status, 'accepted');

    // Verify reputation increased by +100 for critical finding
    const userAfter = await User.findById(researcherUserId);
    assert.equal(userAfter.reputation, 100);
  });

  /* -------------------------------------------------------------
     4. REWARD ASSIGNMENT
  ------------------------------------------------------------- */

  it('7. Admin assigns $3,000 bounty reward; transitions report to reward_assigned', async () => {
    const res = await request(app)
      .post('/api/rewards')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reportId,
        amount: 3000,
        currency: 'USD',
        notes: 'Awarded top tier bounty for critical auth bypass.',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.reward.amount, 3000);
    assert.equal(res.body.data.report.status, 'reward_assigned');
    assert.equal(res.body.data.report.reward.amount, 3000);
  });

  it('8. Non-admin should be REJECTED from assigning rewards (403)', async () => {
    const res = await request(app)
      .post('/api/rewards')
      .set('Authorization', `Bearer ${researcherToken}`)
      .send({
        reportId,
        amount: 5000,
      });

    assert.equal(res.status, 403);
  });

  /* -------------------------------------------------------------
     5. RESOLUTION
  ------------------------------------------------------------- */

  it('9. Admin transitions report: reward_assigned -> resolved', async () => {
    const res = await request(app)
      .patch(`/api/reports/${reportId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'resolved',
        note: 'Patch deployed in production v2.4.1.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.report.status, 'resolved');
  });

  /* -------------------------------------------------------------
     6. COMMENTS & INTERNAL SECURITY NOTES PRIVACY
  ------------------------------------------------------------- */

  it('10. Researcher posts public comment; Admin posts internal note; internal note hidden from researcher', async () => {
    // Researcher posts public comment
    const c1 = await request(app)
      .post(`/api/reports/${reportId}/comments`)
      .set('Authorization', `Bearer ${researcherToken}`)
      .send({
        message: 'Thank you for the quick triage and bounty award!',
        isInternal: false,
      });
    assert.equal(c1.status, 201);

    // Admin posts internal security note
    const c2 = await request(app)
      .post(`/api/reports/${reportId}/comments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        message: 'INTERNAL NOTE: Audit PR #142 for similar token verification issues.',
        isInternal: true,
      });
    assert.equal(c2.status, 201);

    // Researcher fetches comments: MUST NOT SEE INTERNAL NOTE
    const resResearcher = await request(app)
      .get(`/api/reports/${reportId}/comments`)
      .set('Authorization', `Bearer ${researcherToken}`);

    assert.equal(resResearcher.status, 200);
    const researcherComments = resResearcher.body.data.comments;
    assert.equal(researcherComments.length, 1);
    assert.equal(researcherComments[0].message, 'Thank you for the quick triage and bounty award!');
    assert.equal(researcherComments[0].isInternal, false);

    // Admin fetches comments: SEES BOTH COMMENTS
    const resAdmin = await request(app)
      .get(`/api/reports/${reportId}/comments`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(resAdmin.status, 200);
    assert.equal(resAdmin.body.data.comments.length, 2);
  });

  /* -------------------------------------------------------------
     7. LEADERBOARD & REPUTATION RANKINGS
  ------------------------------------------------------------- */

  it('11. Leaderboard query should return Grace Hopper at #1 with 100 reputation', async () => {
    const res = await request(app).get('/api/leaderboard');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const leaderboard = res.body.data.leaderboard;
    assert.ok(leaderboard.length >= 2);

    const leader = leaderboard[0];
    assert.equal(leader.rank, 1);
    assert.equal(leader.name, 'Grace Hopper');
    assert.equal(leader.reputation, 100);
    assert.equal(leader.acceptedReportsCount, 1);
    assert.equal(leader.totalEarnings, 3000);
    assert.equal(leader.email, undefined); // Private data protected!
  });

  /* -------------------------------------------------------------
     8. DASHBOARD ANALYTICS ENDPOINTS
  ------------------------------------------------------------- */

  it('12. Admin stats endpoint should compute real dynamic platform metrics', async () => {
    const res = await request(app)
      .get('/api/stats/admin')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    const stats = res.body.data.stats;
    assert.equal(stats.totalPrograms, 1);
    assert.equal(stats.totalReports, 1);
    assert.equal(stats.resolvedReports, 1);
    assert.equal(stats.totalRewards, 3000);
    assert.equal(stats.resolutionRate, 100);
  });

  it('13. Researcher stats endpoint should compute real personalized metrics', async () => {
    const res = await request(app)
      .get('/api/stats/researcher')
      .set('Authorization', `Bearer ${researcherToken}`);

    assert.equal(res.status, 200);
    const stats = res.body.data.stats;
    assert.equal(stats.reputation, 100);
    assert.equal(stats.totalReports, 1);
    assert.equal(stats.acceptedReports, 1);
    assert.equal(stats.totalRewards, 3000);
    assert.ok(stats.recentReports.length >= 1);
    assert.ok(stats.reputationActivity.length >= 1);
  });
});
