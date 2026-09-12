import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { evidenceUpload } from '../middleware/uploadMiddleware.js';
import * as uploadController from '../controllers/uploadController.js';

const router = express.Router();

// Evidence file upload endpoint (Authenticated users, max 5 files, 5MB each)
router.post(
  '/evidence',
  requireAuth,
  evidenceUpload.array('evidence', 5),
  uploadController.uploadEvidence
);

export default router;
