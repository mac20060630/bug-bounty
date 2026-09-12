import * as authService from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const result = await authService.registerUser({ name, email, password, role });
    return sendSuccess(res, 201, 'Registration successful', result);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message, error.errors);
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    return sendSuccess(res, 200, 'Login successful', result);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message, error.errors);
    }
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const safeUser = req.user.toSafeObject();
    return sendSuccess(res, 200, 'User profile retrieved successfully', { user: safeUser });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  // In a stateless JWT architecture, the client destroys the token.
  // This endpoint provides a clean confirmation and can be extended for token blocklists in future phases.
  return sendSuccess(res, 200, 'Logged out successfully');
};

export const adminCheck = async (req, res) => {
  return sendSuccess(res, 200, 'Admin authorization verified', {
    verified: true,
    user: req.user.toSafeObject(),
    timestamp: new Date().toISOString(),
  });
};
