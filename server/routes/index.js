import express from 'express';
import authRoutes from './authRoutes.js';
import programRoutes from './programRoutes.js';
import reportRoutes from './reportRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import { sendSuccess } from '../utils/response.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  return sendSuccess(res, 200, 'BugBounty API is healthy', {
    status: 'online',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
router.use('/auth', authRoutes);
router.use('/programs', programRoutes);
router.use('/reports', reportRoutes);
router.use('/upload', uploadRoutes);

export default router;
