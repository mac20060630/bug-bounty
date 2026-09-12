import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitToUser, emitToAdmins } from './socketService.js';

/**
 * Creates and persists a notification in MongoDB, then emits in real-time over Socket.IO.
 *
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.userId
 * @param {string} params.message
 * @param {string} params.type
 * @param {Object} [params.data={}]
 * @returns {Promise<Object>} Created Notification
 */
export const createNotification = async ({ userId, message, type, data = {} }) => {
  const notification = await Notification.create({
    userId,
    message,
    type,
    data,
    isRead: false,
  });

  // Real-time delivery via WebSocket
  emitToUser(userId, 'notification:new', notification);

  return notification;
};

/**
 * Notifies all system administrators (both persistent in DB and via real-time WebSocket).
 *
 * @param {Object} params
 * @param {string} params.message
 * @param {string} params.type
 * @param {Object} [params.data={}]
 */
export const notifyAdmins = async ({ message, type, data = {} }) => {
  const admins = await User.find({ role: 'admin' }).select('_id');

  const notifications = await Promise.all(
    admins.map((admin) =>
      Notification.create({
        userId: admin._id,
        message,
        type,
        data,
        isRead: false,
      })
    )
  );

  // Broadcast to admin room
  emitToAdmins('notification:new', {
    message,
    type,
    data,
    createdAt: new Date(),
  });

  return notifications;
};

/**
 * Retrieves paginated notifications for a user.
 */
export const getUserNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const query = { userId };
  if (unreadOnly) {
    query.isRead = false;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
      limit: Number(limit),
    },
  };
};

/**
 * Returns the unread notification count for a user.
 */
export const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ userId, isRead: false });
};

/**
 * Marks a single notification as read, ensuring authorization.
 */
export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { isRead: true } },
    { new: true }
  );

  return notification;
};

/**
 * Marks all notifications for a user as read.
 */
export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true } }
  );

  return { modifiedCount: result.modifiedCount };
};
