import express from 'express';
import { requireAuth, requireRole, optionalAuth } from '../middleware/authMiddleware.js';
import { validateProgramInput } from '../validators/programValidator.js';
import * as programController from '../controllers/programController.js';

const router = express.Router();

// Public / Researcher list & view (with optional auth to detect admin)
router.get('/', optionalAuth, programController.list);
router.get('/:id', optionalAuth, programController.getById);

// Admin-Protected Program Management
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validateProgramInput,
  programController.create
);

router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validateProgramInput,
  programController.update
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  programController.remove
);

export default router;
