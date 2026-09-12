import express from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { validateReportInput } from '../validators/reportValidator.js';
import * as reportController from '../controllers/reportController.js';
import * as workflowController from '../controllers/workflowController.js';
import * as commentController from '../controllers/commentController.js';

const router = express.Router();

// All report endpoints require authentication
router.use(requireAuth);

router.post('/', validateReportInput, reportController.create);
router.get('/', reportController.list);
router.get('/:id', reportController.getById);
router.put('/:id', reportController.update);
router.delete('/:id', reportController.remove);

// Admin-only Workflow State Machine & Severity Endpoints
router.patch('/:id/status', requireRole('admin'), workflowController.updateStatus);
router.patch('/:id/severity', requireRole('admin'), workflowController.updateSeverity);

// Report Discussion & Internal Notes Endpoints
router.get('/:id/comments', commentController.listByReport);
router.post(
  '/:id/comments',
  (req, res, next) => {
    req.body.reportId = req.params.id;
    next();
  },
  commentController.create
);

export default router;
