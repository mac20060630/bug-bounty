import * as statsService from '../services/statsService.js';
import { sendSuccess } from '../utils/response.js';

export const getAdminStats = async (req, res, next) => {
  try {
    const stats = await statsService.getAdminStats();
    return sendSuccess(res, 200, 'Admin platform statistics retrieved', { stats });
  } catch (error) {
    next(error);
  }
};

export const getResearcherStats = async (req, res, next) => {
  try {
    const stats = await statsService.getResearcherStats(req.user._id);
    return sendSuccess(res, 200, 'Researcher dashboard statistics retrieved', { stats });
  } catch (error) {
    next(error);
  }
};
