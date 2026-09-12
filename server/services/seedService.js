import User from '../models/User.js';
import BountyProgram from '../models/BountyProgram.js';
import VulnerabilityReport from '../models/VulnerabilityReport.js';

export const seedDefaultDataIfEmpty = async () => {
  try {
    const programCount = await BountyProgram.countDocuments();
    if (programCount > 0) {
      return; // Already seeded or has data
    }

    console.log('[Seed] Database is empty. Seeding initial demonstration data for local presentation...');

    // 1. Seed Admin User
    let admin = await User.findOne({ email: 'admin@bugbounty.io' });
    if (!admin) {
      admin = new User({
        name: 'System Administrator',
        email: 'admin@bugbounty.io',
        password: 'AdminPassword123!',
        role: 'admin',
        reputation: 50,
      });
      await admin.save();
    }

    // 2. Seed Security Researcher User
    let researcher = await User.findOne({ email: 'researcher@bugbounty.io' });
    if (!researcher) {
      researcher = new User({
        name: 'Alex Rivera',
        email: 'researcher@bugbounty.io',
        password: 'ResearcherPassword123!',
        role: 'researcher',
        reputation: 100,
      });
      await researcher.save();
    }

    // 3. Seed Active Bounty Program
    const program = new BountyProgram({
      companyName: 'Apex Cloud Systems',
      title: 'Apex Cloud Public Bug Bounty',
      description: 'Public vulnerability disclosure program securing Apex Cloud core services and APIs.',
      scope: {
        inScope: [
          { target: 'https://api.apexcorp.com', type: 'api', description: 'Core REST and GraphQL APIs' },
          { target: 'https://app.apexcorp.com', type: 'web', description: 'Customer Web Dashboard' },
          { target: 'https://auth.apexcorp.com', type: 'web', description: 'Single Sign-On (SSO) Portal' },
        ],
        outOfScope: [
          { target: 'https://blog.apexcorp.com', description: 'Third-party hosted marketing blog' },
          { target: 'https://status.apexcorp.com', description: 'SaaS status page provider' },
        ],
      },
      rules: '1. Test ONLY targets in authorized scope.\n2. No Denial of Service (DoS/DDoS) or brute-force rate limit attacks.\n3. Do not alter or destroy customer data.\n4. Maintain confidentiality until authorized disclosure.\n5. Safe harbor applies to good-faith security research.',
      rewardRange: {
        min: 250,
        max: 10000,
        currency: 'USD',
      },
      status: 'active',
      createdBy: admin._id,
    });
    await program.save();

    // 4. Seed a Sample Triaged Vulnerability Report
    const sampleReport = new VulnerabilityReport({
      programId: program._id,
      researcherId: researcher._id,
      title: 'Broken Object Level Authorization in Customer Invoice Download',
      description: 'The invoice endpoint /api/v1/invoices/:id does not verify whether the requesting user owns the requested invoice ID.',
      category: 'idor',
      affectedAsset: 'https://api.apexcorp.com/api/v1/invoices',
      reproductionSteps: '1. Authenticate as User A (ID: 101).\n2. Request invoice /api/v1/invoices/999 belonging to User B.\n3. Observe complete PDF invoice with financial data returned.',
      impact: 'Allows unauthorized attackers to scrape all customer financial records and PII.',
      suggestedRemediation: 'Add server-side ownership checks before querying invoice documents.',
      severity: 'high',
      riskScore: 7.5,
      status: 'triaged',
      statusHistory: [
        {
          fromStatus: 'submitted',
          toStatus: 'under_review',
          changedBy: admin._id,
          note: 'Under initial review by security engineering.',
          timestamp: new Date(Date.now() - 3600000 * 24),
        },
        {
          fromStatus: 'under_review',
          toStatus: 'triaged',
          changedBy: admin._id,
          note: 'Vulnerability confirmed on staging.',
          timestamp: new Date(Date.now() - 3600000 * 12),
        },
      ],
      timelineEvents: [
        {
          type: 'report_created',
          actor: researcher._id,
          message: 'Initial report submitted by researcher.',
          timestamp: new Date(Date.now() - 3600000 * 24),
        },
        {
          type: 'status_changed',
          actor: admin._id,
          message: 'Status transitioned from under_review to triaged',
          timestamp: new Date(Date.now() - 3600000 * 12),
        },
      ],
    });
    await sampleReport.save();

    console.log('[Seed] Local demonstration data seeded successfully:');
    console.log('       Admin:      admin@bugbounty.io / AdminPassword123!');
    console.log('       Researcher: researcher@bugbounty.io / ResearcherPassword123!');
    console.log('       Program:    Apex Cloud Public Bug Bounty');
  } catch (err) {
    console.warn('[Seed] Note on auto-seed:', err.message);
  }
};
