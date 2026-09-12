import * as rewardService from '../services/rewardService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const create = async (req, res, next) => {
  try {
    const { reportId, amount, currency, notes } = req.body;
    if (!reportId || !amount) {
      return sendError(res, 400, 'Report ID and reward amount are required');
    }

    const result = await rewardService.assignReward(
      { reportId, amount, currency, notes },
      req.user
    );

    return sendSuccess(res, 201, 'Reward assigned successfully', result);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    next(error);
  }
};

export const list = async (req, res, next) => {
  try {
    const { programId, page, limit } = req.query;
    const result = await rewardService.getRewards({ programId, page, limit }, req.user);
    return sendSuccess(res, 200, 'Rewards retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};
