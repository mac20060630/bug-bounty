import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateReportInput } from '../validators/reportValidator.js';
import * as reportController from '../controllers/reportController.js';

const router = express.Router();

// All report endpoints require authentication
router.use(requireAuth);

router.post('/', validateReportInput, reportController.create);
router.get('/', reportController.list);
router.get('/:id', reportController.getById);
router.put('/:id', reportController.update);
router.delete('/:id', reportController.remove);

export default router;
