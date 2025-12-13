import { Request, Response } from 'express';
import * as notificationService from '../services/notification.service';
import logger from '../utils/logger';

/**
 * Get user's notifications
 * GET /api/notifications
 */
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await notificationService.getNotifications(userId, page, limit);

    res.status(200).json({
      status: 'success',
      data: {
        notifications: result.notifications,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: result.totalPages,
        },
      },
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching notifications',
    });
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const unreadCount = await notificationService.getUnreadCount(userId);

    res.status(200).json({
      status: 'success',
      data: { unreadCount },
    });
  } catch (error) {
    logger.error('Get unread count error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching unread count',
    });
  }
};

/**
 * Mark a notification as read
 * PUT /api/notifications/:id/read
 */
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      res.status(400).json({ status: 'error', message: 'Invalid notification ID' });
      return;
    }

    const success = await notificationService.markAsRead(notificationId, userId);

    if (success) {
      res.status(200).json({
        status: 'success',
        message: 'Notification marked as read',
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Notification not found',
      });
    }
  } catch (error) {
    logger.error('Mark as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while marking notification as read',
    });
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const count = await notificationService.markAllAsRead(userId);

    res.status(200).json({
      status: 'success',
      message: `${count} notifications marked as read`,
      data: { count },
    });
  } catch (error) {
    logger.error('Mark all as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while marking notifications as read',
    });
  }
};

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      res.status(400).json({ status: 'error', message: 'Invalid notification ID' });
      return;
    }

    const success = await notificationService.deleteNotification(notificationId, userId);

    if (success) {
      res.status(200).json({
        status: 'success',
        message: 'Notification deleted',
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Notification not found',
      });
    }
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while deleting notification',
    });
  }
};
