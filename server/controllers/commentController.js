import * as commentService from '../services/commentService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const create = async (req, res, next) => {
  try {
    const { reportId, message, isInternal } = req.body;
    if (!reportId || !message) {
      return sendError(res, 400, 'Report ID and comment message are required');
    }

    const comment = await commentService.addComment(
      { reportId, message, isInternal },
      req.user
    );

    return sendSuccess(res, 201, 'Comment posted successfully', { comment });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    next(error);
  }
};

export const listByReport = async (req, res, next) => {
  try {
    const comments = await commentService.getCommentsByReport(req.params.id, req.user);
    return sendSuccess(res, 200, 'Comments retrieved successfully', { comments });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    next(error);
  }
};
