import User from '../models/User.js';
import VulnerabilityReport from '../models/VulnerabilityReport.js';
import Reward from '../models/Reward.js';

export const getLeaderboard = async (limit = 50) => {
  const researchers = await User.find({ role: 'researcher' })
    .sort({ reputation: -1, createdAt: 1 })
    .limit(limit)
    .select('name reputation profileImage createdAt');

  // Enhance with accepted report counts and total rewards
  const researcherIds = researchers.map((r) => r._id);

  const [acceptedReportsAgg, rewardsAgg] = await Promise.all([
    VulnerabilityReport.aggregate([
      {
        $match: {
          researcherId: { $in: researcherIds },
          status: { $in: ['accepted', 'reward_assigned', 'resolved'] },
        },
      },
      {
        $group: {
          _id: '$researcherId',
          count: { $sum: 1 },
        },
      },
    ]),
    Reward.aggregate([
      {
        $match: {
          researcherId: { $in: researcherIds },
        },
      },
      {
        $group: {
          _id: '$researcherId',
          totalBounties: { $sum: '$amount' },
        },
      },
    ]),
  ]);

  const acceptedMap = new Map();
  acceptedReportsAgg.forEach((item) => {
    acceptedMap.set(item._id.toString(), item.count);
  });

  const rewardMap = new Map();
  rewardsAgg.forEach((item) => {
    rewardMap.set(item._id.toString(), item.totalBounties);
  });

  const leaderboard = researchers.map((researcher, index) => {
    const idStr = researcher._id.toString();
    const earnings = rewardMap.get(idStr) || 0;
    return {
      rank: index + 1,
      id: idStr,
      researcherId: idStr,
      name: researcher.name,
      reputation: researcher.reputation || 0,
      profileImage: researcher.profileImage,
      acceptedReportsCount: acceptedMap.get(idStr) || 0,
      totalEarnings: earnings,
      totalRewardsAmount: earnings,
      joinedAt: researcher.createdAt,
      createdAt: researcher.createdAt,
    };
  });

  return leaderboard;
};
