import mongoose from 'mongoose';
import VulnerabilityReport from '../models/VulnerabilityReport.js';
import BountyProgram from '../models/BountyProgram.js';
import Reward from '../models/Reward.js';
import ReputationLog from '../models/ReputationLog.js';

/**
 * Aggregates platform-wide analytics for administrators.
 */
export const getAdminAnalytics = async () => {
  const [
    reportsOverTime,
    severityDist,
    statusDist,
    resolutionStats,
    rewardAnalytics,
    topPrograms,
    criticalTrends,
  ] = await Promise.all([
    // 1. Reports volume over time (grouped by month-day)
    VulnerabilityReport.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          criticalCount: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] },
          },
          acceptedCount: {
            $sum: {
              $cond: [
                { $in: ['$status', ['accepted', 'reward_assigned', 'resolved']] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
      {
        $project: {
          date: '$_id',
          count: 1,
          criticalCount: 1,
          acceptedCount: 1,
          _id: 0,
        },
      },
    ]),

    // 2. Severity distribution
    VulnerabilityReport.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          severity: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]),

    // 3. Status distribution (Accepted vs Rejected vs Under Review etc.)
    VulnerabilityReport.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]),

    // 4. Resolution statistics (Average resolution time in hours)
    VulnerabilityReport.aggregate([
      {
        $match: { status: 'resolved' },
      },
      {
        $project: {
          resolutionDurationHours: {
            $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 1000 * 60 * 60],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgHours: { $avg: '$resolutionDurationHours' },
          minHours: { $min: '$resolutionDurationHours' },
          maxHours: { $max: '$resolutionDurationHours' },
          totalResolved: { $sum: 1 },
        },
      },
    ]),

    // 5. Rewards distributed & average payout
    Reward.aggregate([
      {
        $group: {
          _id: null,
          totalRewards: { $sum: '$amount' },
          avgReward: { $avg: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),

    // 6. Program performance (top programs by report volume)
    VulnerabilityReport.aggregate([
      {
        $group: {
          _id: '$programId',
          reportCount: { $sum: 1 },
          criticalCount: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'bountyprograms',
          localField: '_id',
          foreignField: '_id',
          as: 'program',
        },
      },
      { $unwind: '$program' },
      { $sort: { reportCount: -1 } },
      { $limit: 5 },
      {
        $project: {
          programId: '$_id',
          companyName: '$program.companyName',
          title: '$program.title',
          reportCount: 1,
          criticalCount: 1,
          _id: 0,
        },
      },
    ]),

    // 7. Critical vulnerability trends over time
    VulnerabilityReport.aggregate([
      { $match: { severity: 'critical' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          criticalCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
      {
        $project: {
          date: '$_id',
          criticalCount: 1,
          _id: 0,
        },
      },
    ]),
  ]);

  const avgResolutionHours =
    resolutionStats.length > 0 && resolutionStats[0].avgHours
      ? Math.round(resolutionStats[0].avgHours * 10) / 10
      : 0;

  const totalRewardsAmount =
    rewardAnalytics.length > 0 ? rewardAnalytics[0].totalRewards : 0;
  const avgRewardAmount =
    rewardAnalytics.length > 0
      ? Math.round(rewardAnalytics[0].avgReward)
      : 0;

  return {
    reportsOverTime,
    severityDist,
    statusDist,
    resolution: {
      avgResolutionHours,
      totalResolved: resolutionStats.length > 0 ? resolutionStats[0].totalResolved : 0,
    },
    rewards: {
      totalAmount: totalRewardsAmount,
      avgAmount: avgRewardAmount,
      payoutCount: rewardAnalytics.length > 0 ? rewardAnalytics[0].count : 0,
    },
    topPrograms,
    criticalTrends,
  };
};

/**
 * Aggregates personalized analytics for an individual security researcher.
 */
export const getResearcherAnalytics = async (researcherId) => {
  const objectId = new mongoose.Types.ObjectId(researcherId);

  const [
    reportsOverTime,
    severityDist,
    statusCounts,
    rewardsOverTime,
    reputationHistory,
  ] = await Promise.all([
    // 1. Researcher reports over time
    VulnerabilityReport.aggregate([
      { $match: { researcherId: objectId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]),

    // 2. Severity distribution
    VulnerabilityReport.aggregate([
      { $match: { researcherId: objectId } },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          severity: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]),

    // 3. Status totals for acceptance rate
    VulnerabilityReport.aggregate([
      { $match: { researcherId: objectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    // 4. Rewards received over time
    Reward.aggregate([
      { $match: { researcherId: objectId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          total: 1,
          _id: 0,
        },
      },
    ]),

    // 5. Reputation progression timeline
    ReputationLog.find({ researcherId: objectId })
      .sort({ createdAt: 1 })
      .select('points newReputation reason createdAt')
      .lean(),
  ]);

  let totalReports = 0;
  let acceptedReports = 0;
  let rejectedReports = 0;

  for (const s of statusCounts) {
    totalReports += s.count;
    if (['accepted', 'reward_assigned', 'resolved'].includes(s._id)) {
      acceptedReports += s.count;
    }
    if (s._id === 'rejected') {
      rejectedReports += s.count;
    }
  }

  const acceptanceRate =
    totalReports > 0 ? Math.round((acceptedReports / totalReports) * 100) : 0;

  return {
    reportsOverTime,
    severityDist,
    acceptanceRate,
    counts: {
      total: totalReports,
      accepted: acceptedReports,
      rejected: rejectedReports,
    },
    rewardsOverTime,
    reputationHistory: reputationHistory.map((h) => ({
      date: h.createdAt ? h.createdAt.toISOString().split('T')[0] : '',
      points: h.points,
      totalReputation: h.newReputation,
      reason: h.reason,
    })),
  };
};
