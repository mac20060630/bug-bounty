import * as workflowService from '../services/workflowService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const updateStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!status) {
      return sendError(res, 400, 'Target status is required');
    }

    const report = await workflowService.transitionReportStatus(
      req.params.id,
      status,
      note,
      req.user
    );

    return sendSuccess(res, 200, `Report status updated to '${status}'`, { report });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    next(error);
  }
};

export const updateSeverity = async (req, res, next) => {
  try {
    const { severity } = req.body;
    if (!severity) {
      return sendError(res, 400, 'Severity is required');
    }

    const report = await workflowService.updateReportSeverity(
      req.params.id,
      severity,
      req.user
    );

    return sendSuccess(res, 200, `Report severity updated to '${severity}'`, { report });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    next(error);
  }
};
