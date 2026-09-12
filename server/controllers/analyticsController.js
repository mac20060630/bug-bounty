import * as analyticsService from '../services/analyticsService.js';

export const getAdminAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getAdminAnalytics();

    res.status(200).json({
      success: true,
      data: { analytics },
    });
  } catch (error) {
    next(error);
  }
};

export const getResearcherAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getResearcherAnalytics(req.user.id);

    res.status(200).json({
      success: true,
      data: { analytics },
    });
  } catch (error) {
    next(error);
  }
};
