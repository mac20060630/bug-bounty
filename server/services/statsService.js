import VulnerabilityReport from '../models/VulnerabilityReport.js';
import BountyProgram from '../models/BountyProgram.js';
import Reward from '../models/Reward.js';
import User from '../models/User.js';
import ReputationLog from '../models/ReputationLog.js';

export const getAdminStats = async () => {
  const [
    totalPrograms,
    activePrograms,
    totalReports,
    pendingReviews,
    triagedReports,
    acceptedReports,
    resolvedReports,
    criticalReports,
    totalResearchers,
    rewardSumAgg,
  ] = await Promise.all([
    BountyProgram.countDocuments(),
    BountyProgram.countDocuments({ status: 'active' }),
    VulnerabilityReport.countDocuments(),
    VulnerabilityReport.countDocuments({ status: { $in: ['submitted', 'under_review'] } }),
    VulnerabilityReport.countDocuments({ status: 'triaged' }),
    VulnerabilityReport.countDocuments({ status: { $in: ['accepted', 'reward_assigned', 'resolved'] } }),
    VulnerabilityReport.countDocuments({ status: 'resolved' }),
    VulnerabilityReport.countDocuments({ severity: 'critical' }),
    User.countDocuments({ role: 'researcher' }),
    Reward.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  const totalRewards = rewardSumAgg.length > 0 ? rewardSumAgg[0].total : 0;
  const resolutionRate =
    totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;

  return {
    totalPrograms,
    activePrograms,
    totalReports,
    pendingReviews,
    triagedReports,
    acceptedReports,
    resolvedReports,
    criticalReports,
    totalResearchers,
    totalRewards,
    resolutionRate,
  };
};

export const getResearcherStats = async (researcherId) => {
  const [
    user,
    totalReports,
    acceptedReports,
    rejectedReports,
    pendingReports,
    rewardSumAgg,
    recentReports,
    recentRewards,
    reputationActivity,
  ] = await Promise.all([
    User.findById(researcherId),
    VulnerabilityReport.countDocuments({ researcherId }),
    VulnerabilityReport.countDocuments({
      researcherId,
      status: { $in: ['accepted', 'reward_assigned', 'resolved'] },
    }),
    VulnerabilityReport.countDocuments({ researcherId, status: 'rejected' }),
    VulnerabilityReport.countDocuments({
      researcherId,
      status: { $in: ['submitted', 'under_review', 'triaged'] },
    }),
    Reward.aggregate([
      { $match: { researcherId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    VulnerabilityReport.find({ researcherId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('programId', 'companyName title'),
    Reward.find({ researcherId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('programId', 'companyName')
      .populate('reportId', 'title severity'),
    ReputationLog.find({ researcherId }).sort({ createdAt: -1 }).limit(5),
  ]);

  const totalRewards = rewardSumAgg.length > 0 ? rewardSumAgg[0].total : 0;

  return {
    reputation: user?.reputation || 0,
    totalReports,
    acceptedReports,
    rejectedReports,
    pendingReports,
    totalRewards,
    recentReports,
    recentRewards,
    reputationActivity,
  };
};
