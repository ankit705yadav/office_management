import { Op } from 'sequelize';
import Notification from '../models/Notification';
import { emitToUser } from './socket.service';
import logger from '../utils/logger';

export interface CreateNotificationData {
  userId: number;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  relatedId?: number;
  relatedType?: string;
}

/**
 * Create a notification and emit it via socket
 */
export const createNotification = async (data: CreateNotificationData): Promise<Notification> => {
  try {
    const notification = await Notification.create({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      relatedId: data.relatedId,
      relatedType: data.relatedType,
      isRead: false,
    });

    // Emit to user via socket for real-time update
    emitToUser(data.userId, 'notification', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
      relatedId: notification.relatedId,
      relatedType: notification.relatedType,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    });

    logger.info(`Notification created for user ${data.userId}: ${data.title}`);
    return notification;
  } catch (error) {
    logger.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notifications for multiple users
 */
export const createNotificationForUsers = async (
  userIds: number[],
  data: Omit<CreateNotificationData, 'userId'>
): Promise<Notification[]> => {
  const notifications: Notification[] = [];

  for (const userId of userIds) {
    try {
      const notification = await createNotification({ ...data, userId });
      notifications.push(notification);
    } catch (error) {
      logger.error(`Failed to create notification for user ${userId}:`, error);
    }
  }

  return notifications;
};

/**
 * Get notifications for a user
 */
export const getNotifications = async (
  userId: number,
  page: number = 1,
  limit: number = 20
): Promise<{ notifications: Notification[]; total: number; totalPages: number }> => {
  const offset = (page - 1) * limit;

  const { count, rows } = await Notification.findAndCountAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    notifications: rows,
    total: count,
    totalPages: Math.ceil(count / limit),
  };
};

/**
 * Get unread notification count for a user
 */
export const getUnreadCount = async (userId: number): Promise<number> => {
  return Notification.count({
    where: { userId, isRead: false },
  });
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (notificationId: number, userId: number): Promise<boolean> => {
  const [updated] = await Notification.update(
    { isRead: true },
    { where: { id: notificationId, userId } }
  );

  if (updated > 0) {
    // Emit unread count update to user
    const unreadCount = await getUnreadCount(userId);
    emitToUser(userId, 'unreadCountUpdate', { unreadCount });
    return true;
  }

  return false;
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: number): Promise<number> => {
  const [updated] = await Notification.update(
    { isRead: true },
    { where: { userId, isRead: false } }
  );

  if (updated > 0) {
    // Emit unread count update to user
    emitToUser(userId, 'unreadCountUpdate', { unreadCount: 0 });
  }

  return updated;
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: number, userId: number): Promise<boolean> => {
  const deleted = await Notification.destroy({
    where: { id: notificationId, userId },
  });

  return deleted > 0;
};

/**
 * Delete old read notifications (for cleanup)
 */
export const deleteOldNotifications = async (daysOld: number = 30): Promise<number> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const deleted = await Notification.destroy({
    where: {
      isRead: true,
      createdAt: { [Op.lt]: cutoffDate },
    },
  });

  logger.info(`Deleted ${deleted} old notifications`);
  return deleted;
};

export default {
  createNotification,
  createNotificationForUsers,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteOldNotifications,
};
