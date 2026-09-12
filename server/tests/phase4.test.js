import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import BountyProgram from '../models/BountyProgram.js';
import VulnerabilityReport from '../models/VulnerabilityReport.js';
import Notification from '../models/Notification.js';
import Reward from '../models/Reward.js';
import { calculateRiskScore } from '../services/riskScoringService.js';
import { checkReportDuplicates } from '../services/duplicateDetectionService.js';

let mongoServer;

describe('BugBounty Phase 4: Risk Scoring, Duplicates, Notifications & Analytics Suite', () => {
  let adminToken = '';
  let researcherToken = '';
  let adminId = '';
  let researcherId = '';
  let programId = '';
  let report1Id = '';
  let report2Id = '';
  let notificationId = '';

  before(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_key_for_unit_tests_32_characters!';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.NODE_ENV = 'test';

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Create Admin user
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'SecOps Director',
        email: 'secops@shieldcorp.io',
        password: 'AdminPassword!2026',
        role: 'admin',
      });
    adminToken = adminRes.body.data.token;
    adminId = adminRes.body.data.user._id;

    // Create Researcher user
    const resRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Margaret Hamilton',
        email: 'margaret@apollo.security',
        password: 'ResearcherPass!2026',
        role: 'researcher',
      });
    researcherToken = resRes.body.data.token;
    researcherId = resRes.body.data.user._id;

    // Create Bounty Program
    const progRes = await request(app)
      .post('/api/programs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyName: 'Acme Cloud Services',
        title: 'Acme Public Vulnerability Disclosure Program',
        description: 'Scope covering api.acmecloud.com and billing infrastructure.',
        scope: [
          { asset: 'https://api.acmecloud.com', assetType: 'api', inScope: true },
          { asset: 'https://billing.acmecloud.com', assetType: 'web', inScope: true },
        ],
        rules: 'No denial of service. No automated scanner spam.',
        rewardRange: { min: 250, max: 5000 },
        status: 'active',
      });
    programId = progRes.body.data.program._id;
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  // -------------------------------------------------------------
  // 1. RISK-SCORING ENGINE TESTS
  // -------------------------------------------------------------
  it('1. Risk Engine: Deterministic calculation, factors, boundaries & bands', () => {
    // Critical factor combo: Critical impact (10), wild exploit (1.2), network (1.0), credentials (3.5), unauth (1.0)
    const critAssessment = calculateRiskScore({
      impact: 'critical',
      exploitability: 'high',
      attackVector: 'network',
      dataExposure: 'credentials_financial',
      authRequirements: 'none_unauthenticated',
    });

    assert.equal(critAssessment.score, 10.0, 'Score should clamp to 10.0 max');
    assert.equal(critAssessment.riskBand, 'Critical');
    assert.equal(critAssessment.severityRecommendation, 'critical');
    assert.ok(critAssessment.breakdown.formula);
    assert.equal(critAssessment.breakdown.impactScore, 10.0);

    // Low factor combo
    const lowAssessment = calculateRiskScore({
      impact: 'low',
      exploitability: 'unproven',
      attackVector: 'physical',
      dataExposure: 'none',
      authRequirements: 'admin_privileged',
    });

    assert.equal(lowAssessment.score, 0.3);
    assert.equal(lowAssessment.riskBand, 'Low');
    assert.equal(lowAssessment.severityRecommendation, 'low');

    // Zero / None boundary test
    const zeroAssessment = calculateRiskScore({
      impact: 'none',
      exploitability: 'unproven',
      attackVector: 'physical',
      dataExposure: 'none',
      authRequirements: 'admin_privileged',
    });
    assert.equal(zeroAssessment.score, 0.0);
    assert.equal(zeroAssessment.riskBand, 'None');

    // Safe fallbacks for missing / invalid values
    const fallbackAssessment = calculateRiskScore({});
    assert.ok(fallbackAssessment.score >= 0 && fallbackAssessment.score <= 10);
    assert.ok(fallbackAssessment.riskBand);
    assert.ok(fallbackAssessment.severityRecommendation);
  });

  // -------------------------------------------------------------
  // 2. DUPLICATE DETECTION TESTS
  // -------------------------------------------------------------
  it('2. Duplicate Detection: Check initial report and subsequent identical/similar reports', async () => {
    // Submit original report 1
    const rep1Res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${researcherToken}`)
      .send({
        programId,
        title: 'Remote Code Execution in Acme Cloud File Upload Endpoint',
        category: 'rce',
        affectedAsset: 'https://api.acmecloud.com/v1/upload',
        description: 'Unrestricted file upload allows uploading executable webshells executing arbitrary commands.',
        reproductionSteps: '1. Send POST request to /v1/upload with webshell.php\n2. Access /uploads/webshell.php?cmd=whoami\n3. Confirm root execution.',
        impact: 'Full remote server compromise and lateral movement.',
        severity: 'critical',
      });

    assert.equal(rep1Res.status, 201);
    report1Id = rep1Res.body.data.report._id;
    assert.equal(rep1Res.body.data.report.duplicateCheck.highestSimilarity, 0);
    assert.equal(rep1Res.body.data.report.duplicateCheck.recommendation, 'unique');

    // Run duplicate check service against identical report content
    const duplicateResult = await checkReportDuplicates({
      programId,
      title: 'Remote Code Execution in Acme Cloud File Upload Endpoint',
      category: 'rce',
      affectedAsset: 'https://api.acmecloud.com/v1/upload',
      description: 'Unrestricted file upload allows uploading executable webshells executing arbitrary commands.',
      reproductionSteps: '1. Send POST request to /v1/upload with webshell.php\n2. Access /uploads/webshell.php?cmd=whoami\n3. Confirm root execution.',
    });

    assert.ok(duplicateResult.highestSimilarity >= 80, `Expected >= 80% similarity, got ${duplicateResult.highestSimilarity}%`);
    assert.equal(duplicateResult.recommendation, 'likely_duplicate');
    assert.equal(duplicateResult.matches.length, 1);
    assert.equal(duplicateResult.matches[0].reportId.toString(), report1Id);

    // Test distinct/different report
    const distinctResult = await checkReportDuplicates({
      programId,
      title: 'Cross-Site Scripting (XSS) in User Profile Bio',
      category: 'xss',
      affectedAsset: 'https://billing.acmecloud.com/profile',
      description: 'Stored XSS in bio field executes alert box on profile view.',
      reproductionSteps: 'Insert <script>alert(1)</script> into bio and save.',
    });

    assert.ok(distinctResult.highestSimilarity < 40, `Expected < 40% similarity, got ${distinctResult.highestSimilarity}%`);
    assert.equal(distinctResult.recommendation, 'unique');

    // Submit report 2 with high similarity and verify it stores duplicateCheck without rejecting
    const rep2Res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${researcherToken}`)
      .send({
        programId,
        title: 'Remote Code Execution in Acme Cloud File Upload Endpoint (Duplicate Test)',
        category: 'rce',
        affectedAsset: 'https://api.acmecloud.com/v1/upload',
        description: 'Unrestricted file upload vulnerability on api.acmecloud.com allows executing arbitrary webshell.',
        reproductionSteps: 'Upload webshell to /v1/upload and trigger whoami command execution.',
        impact: 'Server compromise.',
        severity: 'critical',
      });

    assert.equal(rep2Res.status, 201, 'Should NOT reject potential duplicates; must persist for admin review');
    report2Id = rep2Res.body.data.report._id;
    assert.ok(rep2Res.body.data.report.duplicateCheck.highestSimilarity >= 50);
  });

  // -------------------------------------------------------------
  // 3. REAL-TIME NOTIFICATIONS TESTS
  // -------------------------------------------------------------
  it('3. Notifications: List, unread count, mark read, and mark all read', async () => {
    // Fetch notifications for Admin (who received notification of report submissions)
    const adminNotifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(adminNotifRes.status, 200);
    assert.ok(adminNotifRes.body.data.notifications.length >= 1);
    notificationId = adminNotifRes.body.data.notifications[0]._id;

    // Check unread count
    const countRes = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(countRes.status, 200);
    assert.ok(countRes.body.data.unreadCount >= 1);

    // Mark single notification as read
    const markReadRes = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(markReadRes.status, 200);
    assert.equal(markReadRes.body.data.notification.isRead, true);

    // Mark all as read
    const markAllRes = await request(app)
      .patch('/api/notifications/mark-all-read')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(markAllRes.status, 200);

    // Unread count should now be 0
    const countAfterRes = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(countAfterRes.body.data.unreadCount, 0);

    // Security check: Researcher cannot mark Admin's notification as read
    const unauthorizedMarkRes = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${researcherToken}`);

    assert.equal(unauthorizedMarkRes.status, 404, 'Must return 404 not found or unauthorized');
  });

  // -------------------------------------------------------------
  // 4. WORKFLOW & REWARD NOTIFICATIONS DISPATCH TEST
  // -------------------------------------------------------------
  it('4. Workflow Events: Triage transitions and reward trigger notifications to researcher', async () => {
    // Admin transitions report1: submitted -> under_review -> triaged -> accepted
    await request(app)
      .patch(`/api/reports/${report1Id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'under_review', reason: 'Security team reviewing' });

    await request(app)
      .patch(`/api/reports/${report1Id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'triaged', reason: 'Confirmed vulnerability' });

    await request(app)
      .patch(`/api/reports/${report1Id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'accepted', reason: 'Impact validated' });

    // Admin assigns bounty of $2,500
    await request(app)
      .post('/api/rewards')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reportId: report1Id, amount: 2500, currency: 'USD' });

    // Researcher should have received notifications for reviewed, accepted, and bounty assigned
    const resNotifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${researcherToken}`);

    assert.equal(resNotifRes.status, 200);
    const types = resNotifRes.body.data.notifications.map((n) => n.type);
    assert.ok(types.includes('report_reviewed') || types.includes('status_changed'));
    assert.ok(types.includes('report_accepted') || types.includes('status_changed'));
    assert.ok(types.includes('bounty_assigned'));
  });

  // -------------------------------------------------------------
  // 5. ADVANCED ANALYTICS TESTS
  // -------------------------------------------------------------
  it('5. Analytics: Admin and Researcher aggregation pipelines return real data', async () => {
    // Test Admin Analytics API
    const adminAnalyticsRes = await request(app)
      .get('/api/analytics/admin')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(adminAnalyticsRes.status, 200);
    const adminAnalytics = adminAnalyticsRes.body.data.analytics;
    assert.ok(Array.isArray(adminAnalytics.reportsOverTime));
    assert.ok(Array.isArray(adminAnalytics.severityDist));
    assert.ok(Array.isArray(adminAnalytics.statusDist));
    assert.equal(adminAnalytics.rewards.totalAmount, 2500);
    assert.equal(adminAnalytics.rewards.payoutCount, 1);
    assert.ok(adminAnalytics.topPrograms.length >= 1);
    assert.equal(adminAnalytics.topPrograms[0].companyName, 'Acme Cloud Services');

    // Test Researcher Analytics API
    const resAnalyticsRes = await request(app)
      .get('/api/analytics/researcher')
      .set('Authorization', `Bearer ${researcherToken}`);

    assert.equal(resAnalyticsRes.status, 200);
    const resAnalytics = resAnalyticsRes.body.data.analytics;
    assert.ok(Array.isArray(resAnalytics.reportsOverTime));
    assert.ok(resAnalytics.acceptanceRate >= 50);
    assert.ok(Array.isArray(resAnalytics.reputationHistory));

    // Security Check: Researcher should be REJECTED from admin analytics
    const forbiddenAnalyticsRes = await request(app)
      .get('/api/analytics/admin')
      .set('Authorization', `Bearer ${researcherToken}`);

    assert.equal(forbiddenAnalyticsRes.status, 403, 'Researcher must be blocked from admin analytics');
  });
});
