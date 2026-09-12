import Reward from '../models/Reward.js';
import VulnerabilityReport from '../models/VulnerabilityReport.js';
import BountyProgram from '../models/BountyProgram.js';

export const assignReward = async ({ reportId, amount, currency = 'USD', notes = '' }, adminUser) => {
  const report = await VulnerabilityReport.findById(reportId).populate('programId');

  if (!report) {
    const err = new Error('Vulnerability report not found');
    err.statusCode = 404;
    throw err;
  }

  // Ensure report is at least in 'accepted' or 'reward_assigned' state
  if (!['accepted', 'reward_assigned', 'triaged', 'under_review'].includes(report.status)) {
    const err = new Error(`Cannot assign reward to a report with status '${report.status}'. Must be triaged or accepted.`);
    err.statusCode = 400;
    throw err;
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    const err = new Error('Reward amount must be a positive number');
    err.statusCode = 400;
    throw err;
  }

  // Create or update Reward document
  let reward = await Reward.findOne({ reportId });

  if (reward) {
    reward.amount = numAmount;
    reward.currency = currency;
    reward.notes = notes;
    reward.assignedBy = adminUser._id;
    reward.assignedAt = new Date();
    await reward.save();
  } else {
    reward = new Reward({
      reportId,
      researcherId: report.researcherId,
      programId: report.programId._id,
      amount: numAmount,
      currency,
      status: 'awarded',
      assignedBy: adminUser._id,
      assignedAt: new Date(),
      notes,
    });
    await reward.save();
  }

  // Update report reward summary
  report.reward = {
    amount: numAmount,
    currency,
    status: 'awarded',
    awardedAt: new Date(),
  };

  // Transition status to reward_assigned if currently accepted
  if (report.status === 'accepted') {
    report.status = 'reward_assigned';
    report.statusHistory.push({
      fromStatus: 'accepted',
      toStatus: 'reward_assigned',
      changedBy: adminUser._id,
      note: `Bounty reward of $${numAmount} ${currency} assigned.`,
      timestamp: new Date(),
    });
  }

  // Log timeline event
  report.timelineEvents.push({
    type: 'reward_assigned',
    actor: adminUser._id,
    message: `Assigned reward of $${numAmount} ${currency}`,
    metadata: { amount: numAmount, currency, notes },
    timestamp: new Date(),
  });

  await report.save();

  return { reward, report };
};

export const getRewards = async ({ programId, page = 1, limit = 20 }, user) => {
  const query = {};

  if (user.role === 'researcher') {
    query.researcherId = user._id;
  } else if (programId) {
    query.programId = programId;
  }

  const skip = (Math.max(1, page) - 1) * limit;

  const [rewards, total, totalAmountResult] = await Promise.all([
    Reward.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('researcherId', 'name email reputation')
      .populate('programId', 'companyName title rewardRange')
      .populate('reportId', 'title severity status'),
    Reward.countDocuments(query),
    Reward.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const totalEarnings = totalAmountResult.length > 0 ? totalAmountResult[0].total : 0;

  return {
    rewards,
    totalEarnings,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit) || 1,
      limit: Number(limit),
    },
  };
};
