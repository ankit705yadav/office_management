import { describe, it, expect, beforeEach } from 'vitest';
import { notificationService } from './notification.service';

describe('notificationService', () => {
  beforeEach(() => {
    localStorage.setItem('accessToken', 'mock-access-token');
  });

  describe('getNotifications', () => {
    it('should get notifications', async () => {
      const result = await notificationService.getNotifications();

      expect(result).toBeDefined();
      expect(result.notifications).toBeDefined();
      expect(Array.isArray(result.notifications)).toBe(true);
      expect(result.pagination).toBeDefined();
    });

    it('should accept pagination parameters', async () => {
      const result = await notificationService.getNotifications(1, 10);

      expect(result).toBeDefined();
      expect(result.pagination).toBeDefined();
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread notification count', async () => {
      const count = await notificationService.getUnreadCount();

      expect(count).toBeDefined();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      await expect(notificationService.markAsRead(1)).resolves.not.toThrow();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      await expect(notificationService.markAllAsRead()).resolves.not.toThrow();
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      await expect(notificationService.deleteNotification(1)).resolves.not.toThrow();
    });
  });
});
