import express from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import * as rewardController from '../controllers/rewardController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', rewardController.list);
router.post('/', requireRole('admin'), rewardController.create);

export default router;
