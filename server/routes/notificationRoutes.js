import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as notificationController from '../controllers/notificationController.js';

const router = Router();

// All notification routes require authentication
router.use(requireAuth);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

export default router;
