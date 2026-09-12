import express from 'express';
import { optionalAuth } from '../middleware/authMiddleware.js';
import * as leaderboardController from '../controllers/leaderboardController.js';

const router = express.Router();

router.get('/', optionalAuth, leaderboardController.getLeaderboard);

export default router;
