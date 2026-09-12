import express from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import * as statsController from '../controllers/statsController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/admin', requireRole('admin'), statsController.getAdminStats);
router.get('/researcher', statsController.getResearcherStats);

export default router;
