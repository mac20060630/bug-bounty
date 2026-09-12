import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import * as analyticsController from '../controllers/analyticsController.js';

const router = Router();

// All analytics routes require authentication
router.use(requireAuth);

// Admin-only analytics endpoint
router.get('/admin', requireRole('admin'), analyticsController.getAdminAnalytics);

// Researcher analytics endpoint
router.get('/researcher', requireRole('researcher'), analyticsController.getResearcherAnalytics);

export default router;
