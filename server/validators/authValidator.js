import validator from 'validator';
import { sendError } from '../utils/response.js';

export const validateRegisterInput = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = {};

  // Validate Name
  if (!name || typeof name !== 'string' || validator.isEmpty(name.trim())) {
    errors.name = 'Full name is required';
  } else if (!validator.isLength(name.trim(), { min: 2, max: 100 })) {
    errors.name = 'Name must be between 2 and 100 characters';
  }

  // Validate Email
  if (!email || typeof email !== 'string' || validator.isEmpty(email.trim())) {
    errors.email = 'Email address is required';
  } else if (!validator.isEmail(email.trim())) {
    errors.email = 'Please provide a valid email address';
  }

  // Validate Password
  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required';
  } else if (!validator.isLength(password, { min: 8 })) {
    errors.password = 'Password must be at least 8 characters long';
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = 'Password must contain at least one letter and one number';
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 400, 'Validation failed', errors);
  }

  // Normalize email and trimmed name
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();

  next();
};

export const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};

  if (!email || typeof email !== 'string' || validator.isEmpty(email.trim())) {
    errors.email = 'Email address is required';
  } else if (!validator.isEmail(email.trim())) {
    errors.email = 'Please provide a valid email format';
  }

  if (!password || typeof password !== 'string' || validator.isEmpty(password)) {
    errors.password = 'Password is required';
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 400, 'Validation failed', errors);
  }

  req.body.email = email.trim().toLowerCase();

  next();
};
