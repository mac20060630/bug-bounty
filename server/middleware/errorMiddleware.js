import { sendError } from '../utils/response.js';

export const notFoundHandler = (req, res, next) => {
  return sendError(res, 404, `API route not found: ${req.method} ${req.originalUrl}`);
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'An unexpected error occurred on the server.';
  let errors = null;

  // Handle Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account with this ${field} already exists.`;
    errors = { [field]: `${field} is already registered.` };
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = {};
    Object.values(err.errors).forEach((val) => {
      errors[val.path] = val.message;
    });
  }

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid resource ID format: ${err.value}`;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token signature.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired.';
  }

  // Log server errors for developer diagnosis (hide sensitive details from client in prod)
  if (statusCode >= 500) {
    console.error(`[Server Error ${statusCode}]`, err);
  }

  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  // Only attach stack trace in development mode
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};
