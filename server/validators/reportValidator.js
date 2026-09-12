import mongoose from 'mongoose';
import validator from 'validator';
import { sendError } from '../utils/response.js';

const VALID_CATEGORIES = [
  'injection',
  'broken_auth',
  'sensitive_data_exposure',
  'xxe',
  'broken_access_control',
  'security_misconfiguration',
  'xss',
  'insecure_deserialization',
  'known_vulnerabilities',
  'insufficient_logging',
  'ssrf',
  'idor',
  'rce',
  'csrf',
  'other',
];

const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'];

export const validateReportInput = (req, res, next) => {
  const {
    programId,
    title,
    description,
    category,
    affectedAsset,
    reproductionSteps,
    impact,
    severity,
    evidence,
  } = req.body;

  const errors = {};

  // Validate Program ID
  if (!programId || !mongoose.Types.ObjectId.isValid(programId)) {
    errors.programId = 'A valid Bounty Program ID is required';
  }

  // Validate Title
  if (!title || typeof title !== 'string' || validator.isEmpty(title.trim())) {
    errors.title = 'Vulnerability title is required';
  } else if (!validator.isLength(title.trim(), { min: 5, max: 180 })) {
    errors.title = 'Title must be between 5 and 180 characters long';
  }

  // Validate Description
  if (!description || typeof description !== 'string' || validator.isEmpty(description.trim())) {
    errors.description = 'Vulnerability description is required';
  } else if (description.trim().length < 15) {
    errors.description = 'Description must be at least 15 characters long';
  }

  // Validate Category
  if (!category || !VALID_CATEGORIES.includes(category)) {
    errors.category = `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`;
  }

  // Validate Affected Asset
  if (!affectedAsset || typeof affectedAsset !== 'string' || validator.isEmpty(affectedAsset.trim())) {
    errors.affectedAsset = 'Affected asset or target URL is required';
  } else if (affectedAsset.trim().length > 255) {
    errors.affectedAsset = 'Affected asset cannot exceed 255 characters';
  }

  // Validate Reproduction Steps
  if (!reproductionSteps || typeof reproductionSteps !== 'string' || validator.isEmpty(reproductionSteps.trim())) {
    errors.reproductionSteps = 'Detailed reproduction steps are required';
  } else if (reproductionSteps.trim().length < 20) {
    errors.reproductionSteps = 'Reproduction steps must be at least 20 characters long';
  }

  // Validate Impact
  if (!impact || typeof impact !== 'string' || validator.isEmpty(impact.trim())) {
    errors.impact = 'Impact assessment is required';
  } else if (impact.trim().length < 10) {
    errors.impact = 'Impact assessment must be at least 10 characters long';
  }

  // Validate Severity
  if (!severity || !VALID_SEVERITIES.includes(severity.toLowerCase())) {
    errors.severity = `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}`;
  }

  // Validate Evidence if provided
  if (evidence && !Array.isArray(evidence)) {
    errors.evidence = 'Evidence must be an array of uploaded file references';
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 400, 'Vulnerability report validation failed', errors);
  }

  req.body.title = title.trim();
  req.body.description = description.trim();
  req.body.affectedAsset = affectedAsset.trim();
  req.body.reproductionSteps = reproductionSteps.trim();
  req.body.impact = impact.trim();
  req.body.severity = severity.toLowerCase();

  next();
};
