import User from '../models/User.js';
import ReputationLog from '../models/ReputationLog.js';

export const REPUTATION_POINTS_MAP = {
  critical: 100,
  high: 50,
  medium: 25,
  low: 10,
};

export const awardReputationForReport = async (researcherId, reportId, severity) => {
  const points = REPUTATION_POINTS_MAP[severity?.toLowerCase()] || 25;

  const user = await User.findById(researcherId);
  if (!user) {
    throw new Error('Researcher not found');
  }

  const previousReputation = user.reputation || 0;
  const newReputation = previousReputation + points;

  user.reputation = newReputation;
  await user.save();

  // Create audit log
  const log = new ReputationLog({
    researcherId,
    reportId,
    points,
    reason: `Report accepted: ${severity?.toUpperCase()} severity finding`,
    previousReputation,
    newReputation,
  });
  await log.save();

  return { points, previousReputation, newReputation };
};

export const getReputationHistory = async (researcherId, limit = 20) => {
  return ReputationLog.find({ researcherId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('reportId', 'title severity');
};
