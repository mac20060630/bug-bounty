import * as programService from '../services/programService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const create = async (req, res, next) => {
  try {
    const program = await programService.createProgram(req.body, req.user._id);
    return sendSuccess(res, 201, 'Bounty program created successfully', { program });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    next(error);
  }
};

export const list = async (req, res, next) => {
  try {
    const { search, status, page, limit } = req.query;
    const result = await programService.getPrograms(
      { search, status, page, limit },
      req.user || null
    );
    return sendSuccess(res, 200, 'Bounty programs retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const program = await programService.getProgramById(req.params.id, req.user || null);
    return sendSuccess(res, 200, 'Program details retrieved successfully', { program });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const program = await programService.updateProgram(req.params.id, req.body, req.user._id);
    return sendSuccess(res, 200, 'Program updated successfully', { program });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const result = await programService.deleteProgram(req.params.id, req.user._id);
    return sendSuccess(res, 200, result.message, result);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    next(error);
  }
};
