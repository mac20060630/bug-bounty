import validator from 'validator';
import { sendError } from '../utils/response.js';

export const validateProgramInput = (req, res, next) => {
  const { companyName, title, description, rewardRange, rules, status } = req.body;
  const errors = {};

  if (!companyName || typeof companyName !== 'string' || validator.isEmpty(companyName.trim())) {
    errors.companyName = 'Company name is required';
  } else if (!validator.isLength(companyName.trim(), { min: 2, max: 120 })) {
    errors.companyName = 'Company name must be between 2 and 120 characters';
  }

  if (!title || typeof title !== 'string' || validator.isEmpty(title.trim())) {
    errors.title = 'Program title is required';
  } else if (!validator.isLength(title.trim(), { min: 3, max: 150 })) {
    errors.title = 'Program title must be between 3 and 150 characters';
  }

  if (!description || typeof description !== 'string' || validator.isEmpty(description.trim())) {
    errors.description = 'Program description is required';
  } else if (description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }

  // Validate Reward Range
  if (!rewardRange || typeof rewardRange !== 'object') {
    errors.rewardRange = 'Reward range object is required';
  } else {
    const min = Number(rewardRange.min);
    const max = Number(rewardRange.max);

    if (isNaN(max) || max <= 0) {
      errors['rewardRange.max'] = 'Maximum reward must be a positive number';
    }
    if (isNaN(min) || min < 0) {
      errors['rewardRange.min'] = 'Minimum reward cannot be negative';
    }
    if (!isNaN(min) && !isNaN(max) && min > max) {
      errors.rewardRange = 'Minimum reward cannot exceed maximum reward';
    }
  }

  if (rules && typeof rules === 'string' && rules.trim().length < 10) {
    errors.rules = 'Rules must be at least 10 characters long';
  }

  if (status && !['active', 'paused', 'closed'].includes(status)) {
    errors.status = 'Status must be active, paused, or closed';
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 400, 'Program validation failed', errors);
  }

  req.body.companyName = companyName.trim();
  req.body.title = title.trim();
  req.body.description = description.trim();
  if (rules) req.body.rules = rules.trim();

  next();
};
