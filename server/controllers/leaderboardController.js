import * as leaderboardService from '../services/leaderboardService.js';
import { sendSuccess } from '../utils/response.js';

export const getLeaderboard = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const leaderboard = await leaderboardService.getLeaderboard(limit);
    return sendSuccess(res, 200, 'Leaderboard rankings retrieved', { leaderboard });
  } catch (error) {
    next(error);
  }
};
