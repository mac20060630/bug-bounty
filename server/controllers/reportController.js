import * as reportService from '../services/reportService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const create = async (req, res, next) => {
  try {
    const report = await reportService.createReport(req.body, req.user._id);
    return sendSuccess(res, 201, 'Vulnerability report submitted successfully', { report });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    next(error);
  }
};

export const list = async (req, res, next) => {
  try {
    const { programId, status, page, limit } = req.query;
    const result = await reportService.getReports(
      { programId, status, page, limit },
      req.user
    );
    return sendSuccess(res, 200, 'Vulnerability reports retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const report = await reportService.getReportById(req.params.id, req.user);
    return sendSuccess(res, 200, 'Vulnerability report details retrieved', { report });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const report = await reportService.updateReport(req.params.id, req.body, req.user);
    return sendSuccess(res, 200, 'Report updated successfully', { report });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const result = await reportService.deleteReport(req.params.id, req.user);
    return sendSuccess(res, 200, result.message, result);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    next(error);
  }
};
