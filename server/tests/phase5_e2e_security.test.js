import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import BountyProgram from '../models/BountyProgram.js';
import VulnerabilityReport from '../models/VulnerabilityReport.js';

let mongoServer;

describe('BugBounty Phase 5: Comprehensive E2E Workflows & Security Verification Suite', () => {
  const JWT_SECRET = 'phase5_production_audit_test_jwt_secret_key_32_chars!';
  
  before(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.JWT_EXPIRES_IN = '2h';
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

  // Test Actors
  const researcherUser = {
    name: 'Ada Lovelace',
    email: 'ada.lovelace@security.net',
    password: 'SecurePassword123!',
    role: 'researcher',
  };

  const researcher2User = {
    name: 'Charles Babbage',
    email: 'charles.babbage@security.net',
    password: 'SecurePassword123!',
    role: 'researcher',
  };

  const adminUser = {
    name: 'Security Director',
    email: 'sec-director@apexcorp.com',
    password: 'DirectorPassword123!',
    role: 'admin',
  };

  let researcherToken = '';
  let researcherId = '';
  let researcher2Token = '';
  let researcher2Id = '';
  let adminToken = '';
  let adminId = '';

  let programId = '';
  let acceptedReportId = '';
  let rejectedReportId = '';

  // ==========================================
  // SECTION 1: END-TO-END ACCEPTED REPORT WORKFLOW
  // ==========================================
  describe('1. End-to-End Business Workflow (Accepted Finding Lifecycle)', () => {
    it('Step 1: Researcher registers and receives JWT with safe defaults', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(researcherUser);

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.equal(res.body.data.user.role, 'researcher');
      assert.equal(res.body.data.user.reputation, 0);
      assert.equal(res.body.data.user.password, undefined);

      researcherToken = res.body.data.token;
      researcherId = res.body.data.user.id;
    });

    it('Step 2: Researcher logs in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: researcherUser.email,
          password: researcherUser.password,
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.token);
      researcherToken = res.body.data.token;
    });

    it('Step 3: Setup - Admin registers and logs in', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(adminUser);

      assert.equal(res.status, 201);
      adminToken = res.body.data.token;
      adminId = res.body.data.user.id;

      // Also register second researcher for IDOR tests
      const res2 = await request(app)
        .post('/api/auth/register')
        .send(researcher2User);
      researcher2Token = res2.body.data.token;
      researcher2Id = res2.body.data.user.id;
    });

    it('Step 4: Admin creates a bounty program with scope and rules', async () => {
      const res = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          companyName: 'Apex Cloud Systems',
          title: 'Apex Cloud Public Bug Bounty',
          description: 'Help secure our primary cloud infrastructure and customer-facing APIs.',
          scope: {
            inScope: [
              { target: 'https://api.apexcorp.com', type: 'api', description: 'Core REST API' },
              { target: 'https://app.apexcorp.com', type: 'web', description: 'Web Dashboard' },
            ],
            outOfScope: [
              { target: 'https://blog.apexcorp.com', description: 'Third-party hosted blog' },
            ],
          },
          rules: 'Test only targets in scope. No DoS, automated spamming, or social engineering.',
          rewardRange: { min: 200, max: 10000, currency: 'USD' },
          status: 'active',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      programId = res.body.data.program._id;
      assert.ok(programId);
    });

    it('Step 5: Researcher browses and inspects program details', async () => {
      const listRes = await request(app).get('/api/programs');
      assert.equal(listRes.status, 200);
      assert.ok(listRes.body.data.programs.length >= 1);

      const detailRes = await request(app)
        .get(`/api/programs/${programId}`)
        .set('Authorization', `Bearer ${researcherToken}`);
      assert.equal(detailRes.status, 200);
      assert.equal(detailRes.body.data.program.companyName, 'Apex Cloud Systems');
    });

    let uploadedEvidence = [];
    it('Step 6: Researcher uploads proof-of-concept evidence', async () => {
      const dummyPng = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2d', 'hex');

      const res = await request(app)
        .post('/api/upload/evidence')
        .set('Authorization', `Bearer ${researcherToken}`)
        .attach('evidence', dummyPng, 'sqli_poc.png');

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.files.length, 1);
      assert.ok(res.body.data.files[0].url);
      uploadedEvidence = res.body.data.files;
    });

    it('Step 7: Researcher submits vulnerability report; risk score and duplicate check are generated', async () => {
      const reportPayload = {
        programId,
        title: 'Blind SQL Injection in User Account Search API',
        description: 'The search endpoint fails to sanitize user parameters before passing them to the database query handler.',
        category: 'injection',
        affectedAsset: 'https://api.apexcorp.com/v1/users/search',
        reproductionSteps: '1. Send GET request to /v1/users/search?q=test\' UNION SELECT NULL, password FROM users--\n2. Observe response with database schema details.\n3. Verify blind extraction delay with SLEEP(5).',
        impact: 'Full database read access allowing unauthorized extraction of customer credentials and PII.',
        suggestedRemediation: 'Implement parameterized prepared statements or utilize Mongoose/ORM abstractions without raw string concatenation.',
        severity: 'critical',
        evidence: uploadedEvidence,
        impactRating: 'critical',
        exploitability: 'functional',
        attackVector: 'network',
        dataExposure: 'credentials_financial',
        authRequirements: 'authenticated_user',
      };

      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${researcherToken}`)
        .send(reportPayload);

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      const report = res.body.data.report;
      acceptedReportId = report._id;

      // Verify status starts at 'submitted'
      assert.equal(report.status, 'submitted');

      // Verify risk engine output
      assert.ok(report.riskAssessment, 'Risk assessment must be computed');
      assert.ok(report.riskScore >= 7.0, 'Critical finding should have high risk score');
      assert.ok(report.riskAssessment.riskBand);
      assert.ok(report.riskAssessment.breakdown);

      // Verify duplicate check engine ran
      assert.ok(report.duplicateCheck);
      assert.equal(report.duplicateCheck.recommendation, 'unique');
    });

    it('Step 8: Admin receives notification of new submission', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.ok(res.body.data.notifications.length >= 1);
      const latest = res.body.data.notifications[0];
      assert.equal(latest.type, 'report_submitted');
      assert.match(latest.message, /Blind SQL Injection/);
    });

    it('Step 9: Admin reviews report (submitted -> under_review)', async () => {
      const res = await request(app)
        .patch(`/api/reports/${acceptedReportId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'under_review',
          note: 'Security team has begun triage and reproduction.',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.report.status, 'under_review');
    });

    it('Step 10: Admin confirms reproduction and triages (under_review -> triaged)', async () => {
      const res = await request(app)
        .patch(`/api/reports/${acceptedReportId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'triaged',
          note: 'Vulnerability successfully reproduced on staging environment.',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.report.status, 'triaged');
    });

    it('Step 11: Admin assigns final severity rating', async () => {
      const res = await request(app)
        .patch(`/api/reports/${acceptedReportId}/severity`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          severity: 'critical',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.report.severity, 'critical');
      assert.equal(res.body.data.report.riskScore, 9.5);
    });

    it('Step 12: Admin accepts report (triaged -> accepted) and reputation is credited', async () => {
      const res = await request(app)
        .patch(`/api/reports/${acceptedReportId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'accepted',
          note: 'Validated by engineering team. Patch in progress.',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.report.status, 'accepted');

      // Verify researcher received reputation points
      const profileRes = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${researcherToken}`);

      assert.equal(profileRes.status, 200);
      assert.equal(profileRes.body.data.user.reputation, 100); // Critical severity = 100 points
    });

    it('Step 13: Admin assigns bounty reward of $5,000 (status -> reward_assigned)', async () => {
      const res = await request(app)
        .post('/api/rewards')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId: acceptedReportId,
          amount: 5000,
          currency: 'USD',
          notes: 'Maximum severity reward for critical blind SQL injection discovery.',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.reward.amount, 5000);
      assert.equal(res.body.data.report.status, 'reward_assigned');
      assert.equal(res.body.data.report.reward.amount, 5000);
    });

    it('Step 14: Researcher verifies notification of reward assignment', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${researcherToken}`);

      assert.equal(res.status, 200);
      const notifications = res.body.data.notifications;
      const bountyNotif = notifications.find((n) => n.type === 'bounty_assigned');
      assert.ok(bountyNotif, 'Researcher must receive bounty_assigned notification');
      assert.match(bountyNotif.message, /\$5,000/);
    });

    it('Step 15: Admin marks report as resolved (reward_assigned -> resolved)', async () => {
      const res = await request(app)
        .patch(`/api/reports/${acceptedReportId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'resolved',
          note: 'Fix deployed to production and verified by security team.',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.report.status, 'resolved');
    });

    it('Step 16: Platform analytics reflect resolved finding, bounty payout, and metrics', async () => {
      const adminAnalytics = await request(app)
        .get('/api/analytics/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(adminAnalytics.status, 200);
      const aData = adminAnalytics.body.data.analytics;
      assert.ok(aData.rewards.totalAmount >= 5000);
      assert.ok(aData.statusDist.length >= 1);
      assert.ok(aData.resolution.totalResolved >= 1);

      const researcherAnalytics = await request(app)
        .get('/api/analytics/researcher')
        .set('Authorization', `Bearer ${researcherToken}`);

      assert.equal(researcherAnalytics.status, 200);
      const rData = researcherAnalytics.body.data.analytics;
      assert.ok(rData.counts.total >= 1);
      assert.ok(rData.acceptanceRate >= 100);
      assert.ok(rData.rewardsOverTime.length >= 1);

      const adminStats = await request(app)
        .get('/api/stats/admin')
        .set('Authorization', `Bearer ${adminToken}`);
      assert.equal(adminStats.status, 200);
      assert.ok(adminStats.body.data.stats.totalReports >= 1);
    });
  });

  // ==========================================
  // SECTION 2: END-TO-END REJECTED REPORT WORKFLOW
  // ==========================================
  describe('2. End-to-End Business Workflow (Rejected Finding Lifecycle)', () => {
    it('Step 1: Researcher submits an invalid / out-of-scope report', async () => {
      const payload = {
        programId,
        title: 'Missing HTTP Header on Third-Party Blog',
        description: 'The blog is missing X-Content-Type-Options header.',
        category: 'security_misconfiguration',
        affectedAsset: 'https://blog.apexcorp.com',
        reproductionSteps: '1. Send curl -I request to https://blog.apexcorp.com\n2. Inspect response headers and notice missing header.',
        impact: 'Minor browser sniffing risk.',
        suggestedRemediation: 'Add X-Content-Type-Options: nosniff header.',
        severity: 'low',
        impactRating: 'low',
        exploitability: 'unproven',
        attackVector: 'network',
        dataExposure: 'none',
        authRequirements: 'none_unauthenticated',
      };

      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${researcherToken}`)
        .send(payload);

      assert.equal(res.status, 201);
      rejectedReportId = res.body.data.report._id;
      assert.equal(res.body.data.report.status, 'submitted');
    });

    it('Step 2: Admin reviews and rejects the report (submitted -> rejected)', async () => {
      const res = await request(app)
        .patch(`/api/reports/${rejectedReportId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'rejected',
          note: 'Target blog.apexcorp.com is explicitly listed as out-of-scope in program guidelines.',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.report.status, 'rejected');

      // Check statusHistory and timeline
      const report = res.body.data.report;
      const lastHistory = report.statusHistory[report.statusHistory.length - 1];
      assert.equal(lastHistory.toStatus, 'rejected');
      assert.match(lastHistory.note, /out-of-scope/i);
    });

    it('Step 3: Researcher receives rejection notification', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${researcherToken}`);

      assert.equal(res.status, 200);
      const notifications = res.body.data.notifications;
      const rejectNotif = notifications.find((n) => n.type === 'report_rejected');
      assert.ok(rejectNotif, 'Researcher must receive report_rejected notification');
      assert.match(rejectNotif.message, /rejected/i);
    });

    it('Step 4: Researcher reputation is NOT incremented for rejected report', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${researcherToken}`);

      assert.equal(res.status, 200);
      // Reputation remains 100 from the single accepted critical finding
      assert.equal(res.body.data.user.reputation, 100);
    });

    it('Step 5: Admin cannot assign reward to a rejected report (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/rewards')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId: rejectedReportId,
          amount: 500,
          currency: 'USD',
          notes: 'Attempting invalid reward on rejected report',
        });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /Cannot assign reward to a report with status 'rejected'/i);
    });
  });

  // ==========================================
  // SECTION 3: EXHAUSTIVE SECURITY AUDIT TESTS
  // ==========================================
  describe('3. Exhaustive Security Audit Verification', () => {
    it('Sec-1: Unauthorized API calls (Missing Bearer Token) -> 401', async () => {
      const endpoints = [
        { method: 'get', url: '/api/auth/profile' },
        { method: 'get', url: '/api/reports' },
        { method: 'post', url: '/api/reports' },
        { method: 'post', url: '/api/upload/evidence' },
        { method: 'get', url: '/api/notifications' },
        { method: 'get', url: '/api/analytics/admin' },
        { method: 'get', url: '/api/analytics/researcher' },
      ];

      for (const ep of endpoints) {
        const res = await request(app)[ep.method](ep.url);
        assert.equal(res.status, 401, `Endpoint ${ep.method.toUpperCase()} ${ep.url} must return 401 when unauthenticated`);
        assert.equal(res.body.success, false);
      }
    });

    it('Sec-2: Invalid JWT (Tampered token / Bad signature) -> 401', async () => {
      const tamperedToken = researcherToken.slice(0, -5) + 'xxxxx';
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${tamperedToken}`);

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    it('Sec-3: Expired JWT -> 401', async () => {
      const expiredToken = jwt.sign(
        { id: researcherId, role: 'researcher', email: researcherUser.email, exp: Math.floor(Date.now() / 1000) - 3600 },
        JWT_SECRET
      );

      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      assert.equal(res.status, 401);
      assert.match(res.body.message, /expired/i);
    });

    it('Sec-4: Cross-Role Privilege Escalation (Researcher attempting Admin routes) -> 403 Forbidden', async () => {
      // 1. Create bounty program
      const pRes = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ companyName: 'Hack Corp', title: 'Hacked', description: 'desc', rewardRange: { max: 1000 } });
      assert.equal(pRes.status, 403);

      // 2. Adjust severity
      const sRes = await request(app)
        .patch(`/api/reports/${acceptedReportId}/severity`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ severity: 'critical' });
      assert.equal(sRes.status, 403);

      // 3. Assign bounty reward
      const rRes = await request(app)
        .post('/api/rewards')
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ reportId: acceptedReportId, amount: 99999 });
      assert.equal(rRes.status, 403);

      // 4. Access admin analytics
      const aRes = await request(app)
        .get('/api/analytics/admin')
        .set('Authorization', `Bearer ${researcherToken}`);
      assert.equal(aRes.status, 403);

      // 5. Access admin-check verification
      const cRes = await request(app)
        .get('/api/auth/admin-check')
        .set('Authorization', `Bearer ${researcherToken}`);
      assert.equal(cRes.status, 403);
    });

    it('Sec-5: IDOR Defense - Researcher 2 cannot view Researcher 1 private report -> 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/reports/${acceptedReportId}`)
        .set('Authorization', `Bearer ${researcher2Token}`);

      assert.equal(res.status, 403);
      assert.match(res.body.message, /Access denied/i);
    });

    it('Sec-6: IDOR Defense - Researcher 2 cannot update or withdraw Researcher 1 report -> 403 Forbidden', async () => {
      const updateRes = await request(app)
        .put(`/api/reports/${acceptedReportId}`)
        .set('Authorization', `Bearer ${researcher2Token}`)
        .send({ title: 'Hijacked Title' });
      assert.equal(updateRes.status, 403);

      const deleteRes = await request(app)
        .delete(`/api/reports/${acceptedReportId}`)
        .set('Authorization', `Bearer ${researcher2Token}`);
      assert.equal(deleteRes.status, 403);
    });

    it('Sec-7: IDOR Defense - Researcher 2 cannot view or post comments on Researcher 1 report -> 403 Forbidden', async () => {
      const getRes = await request(app)
        .get(`/api/reports/${acceptedReportId}/comments`)
        .set('Authorization', `Bearer ${researcher2Token}`);
      assert.equal(getRes.status, 403);

      const postRes = await request(app)
        .post(`/api/reports/${acceptedReportId}/comments`)
        .set('Authorization', `Bearer ${researcher2Token}`)
        .send({ message: 'Unauthorized comment attempt' });
      assert.equal(postRes.status, 403);
    });

    it('Sec-8: Information Leakage Defense - Researcher cannot see internal admin notes', async () => {
      await request(app)
        .post(`/api/reports/${acceptedReportId}/comments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          message: 'Confidential internal note: Vulnerability verified in internal JIRA SEC-889.',
          isInternal: true,
        });

      await request(app)
        .post(`/api/reports/${acceptedReportId}/comments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          message: 'Public update: Engineering is preparing a hotfix.',
          isInternal: false,
        });

      const res = await request(app)
        .get(`/api/reports/${acceptedReportId}/comments`)
        .set('Authorization', `Bearer ${researcherToken}`);

      assert.equal(res.status, 200);
      const comments = res.body.data.comments;
      const internalNote = comments.find((c) => c.isInternal === true || c.message.includes('Confidential'));
      assert.equal(internalNote, undefined, 'Internal security notes must NEVER be exposed to researcher');
    });

    it('Sec-9: Malformed Input Handling -> 400 Bad Request', async () => {
      const badReport = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ title: 'Short' });
      assert.equal(badReport.status, 400);

      // 2. Invalid state transition (cannot transition backwards from resolved to submitted)
      const invalidTransition = await request(app)
        .patch(`/api/reports/${acceptedReportId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'submitted' });
      assert.equal(invalidTransition.status, 400);
      assert.match(invalidTransition.body.message, /Invalid workflow transition/i);

      const negativeReward = await request(app)
        .post('/api/rewards')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reportId: acceptedReportId, amount: -500 });
      assert.equal(negativeReward.status, 400);

      const badSeverity = await request(app)
        .patch(`/api/reports/${acceptedReportId}/severity`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ severity: 'super_ultra_catastrophic' });
      assert.equal(badSeverity.status, 400);
    });

    it('Sec-10: File Upload Abuse Prevention -> 400 Bad Request', async () => {
      const maliciousPayload = Buffer.from('<?php system($_GET["cmd"]); ?>');

      const phpRes = await request(app)
        .post('/api/upload/evidence')
        .set('Authorization', `Bearer ${researcherToken}`)
        .attach('evidence', maliciousPayload, 'shell.php');
      assert.equal(phpRes.status, 400);
      assert.match(phpRes.body.message, /Invalid file extension|Unsupported file type/i);

      const shRes = await request(app)
        .post('/api/upload/evidence')
        .set('Authorization', `Bearer ${researcherToken}`)
        .attach('evidence', Buffer.from('#!/bin/bash\nrm -rf /'), 'exploit.sh');
      assert.equal(shRes.status, 400);

      const exeRes = await request(app)
        .post('/api/upload/evidence')
        .set('Authorization', `Bearer ${researcherToken}`)
        .attach('evidence', Buffer.from('MZ\x90\x00'), 'payload.exe');
      assert.equal(exeRes.status, 400);
    });

    it('Sec-11: NoSQL Injection Sanitization Verification', async () => {
      const injectionAttempt = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $gt: '' },
          password: { $gt: '' },
        });

      assert.ok(injectionAttempt.status === 400 || injectionAttempt.status === 401);
      assert.equal(injectionAttempt.body.success, false);
    });

    it('Sec-12: Health Endpoint Verification', async () => {
      const res = await request(app).get('/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'online');
      assert.ok(res.body.data.uptime !== undefined);
      assert.ok(res.body.data.timestamp);
    });
  });
});
