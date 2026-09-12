import express from 'express';
import * as authController from '../controllers/authController.js';
import { validateRegisterInput, validateLoginInput } from '../validators/authValidator.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public Authentication Endpoints (rate limited)
router.post('/register', authLimiter, validateRegisterInput, authController.register);
router.post('/login', authLimiter, validateLoginInput, authController.login);

// Protected User Endpoints
router.get('/profile', requireAuth, authController.getProfile);
router.post('/logout', requireAuth, authController.logout);

// Admin-Protected Verification Endpoint (used to prove backend role authorization)
router.get('/admin-check', requireAuth, requireRole('admin'), authController.adminCheck);

export default router;
