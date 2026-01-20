import { describe, it, expect, beforeEach } from 'vitest';
import { dashboardService } from './dashboard.service';

describe('dashboardService', () => {
  beforeEach(() => {
    localStorage.setItem('accessToken', 'mock-access-token');
  });

  describe('getStats', () => {
    it('should get dashboard stats', async () => {
      const stats = await dashboardService.getStats();

      expect(stats).toBeDefined();
      expect(stats.user).toBeDefined();
      expect(stats.leaves).toBeDefined();
      expect(stats.notifications).toBeDefined();
    });
  });

  describe('getBirthdays', () => {
    it('should get upcoming birthdays', async () => {
      const birthdays = await dashboardService.getBirthdays();

      expect(birthdays).toBeDefined();
      expect(Array.isArray(birthdays)).toBe(true);
    });

    it('should accept limit parameter', async () => {
      const birthdays = await dashboardService.getBirthdays(5);

      expect(birthdays).toBeDefined();
    });
  });

  describe('getAnniversaries', () => {
    it('should get work anniversaries', async () => {
      const anniversaries = await dashboardService.getAnniversaries();

      expect(anniversaries).toBeDefined();
      expect(Array.isArray(anniversaries)).toBe(true);
    });
  });

  describe('getActivities', () => {
    it('should get recent activities', async () => {
      const activities = await dashboardService.getActivities();

      expect(activities).toBeDefined();
      expect(Array.isArray(activities)).toBe(true);
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read', async () => {
      await expect(dashboardService.markNotificationAsRead(1)).resolves.not.toThrow();
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read', async () => {
      await expect(dashboardService.markAllNotificationsAsRead()).resolves.not.toThrow();
    });
  });

  describe('getTeamCalendar', () => {
    it('should get team calendar', async () => {
      const leaves = await dashboardService.getTeamCalendar();

      expect(leaves).toBeDefined();
      expect(Array.isArray(leaves)).toBe(true);
    });

    it('should accept date range parameters', async () => {
      const leaves = await dashboardService.getTeamCalendar({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(leaves).toBeDefined();
    });
  });

  describe('getEmployeesOnLeave', () => {
    it('should get employees on leave', async () => {
      const employees = await dashboardService.getEmployeesOnLeave();

      expect(employees).toBeDefined();
      expect(Array.isArray(employees)).toBe(true);
    });
  });
});
