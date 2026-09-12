import express from 'express';
import authRoutes from './authRoutes.js';
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

// Authentication routes
router.use('/auth', authRoutes);

export default router;
