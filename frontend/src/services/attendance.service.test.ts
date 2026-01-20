import { describe, it, expect, beforeEach } from 'vitest';
import attendanceService from './attendance.service';

describe('attendanceService', () => {
  beforeEach(() => {
    localStorage.setItem('accessToken', 'mock-access-token');
  });

  describe('checkIn', () => {
    it('should check in successfully', async () => {
      const result = await attendanceService.checkIn({ location: 'Office' });

      expect(result).toBeDefined();
      expect(result.attendance).toBeDefined();
      expect(result.attendance.checkInTime).toBeDefined();
    });
  });

  describe('checkOut', () => {
    it('should check out successfully', async () => {
      const result = await attendanceService.checkOut({ location: 'Office' });

      expect(result).toBeDefined();
      expect(result.attendance).toBeDefined();
      expect(result.attendance.checkOutTime).toBeDefined();
    });
  });

  describe('getTodayAttendance', () => {
    it('should get today attendance', async () => {
      const result = await attendanceService.getTodayAttendance();

      expect(result).toBeDefined();
      expect(result.attendance).toBeDefined();
    });
  });

  describe('getMyAttendance', () => {
    it('should get my attendance records', async () => {
      const result = await attendanceService.getMyAttendance();

      expect(result).toBeDefined();
      expect(result.attendance).toBeDefined();
      expect(Array.isArray(result.attendance)).toBe(true);
      expect(result.pagination).toBeDefined();
    });

    it('should accept pagination parameters', async () => {
      const result = await attendanceService.getMyAttendance({
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(result.pagination).toBeDefined();
    });
  });

  describe('getTeamAttendance', () => {
    it('should get team attendance', async () => {
      const result = await attendanceService.getTeamAttendance();

      expect(result).toBeDefined();
      expect(result.attendance).toBeDefined();
      expect(result.pagination).toBeDefined();
    });
  });

  describe('getMonthlySummary', () => {
    it('should get monthly summary', async () => {
      const result = await attendanceService.getMonthlySummary(1, 2025);

      expect(result).toBeDefined();
      expect(result.presentDays).toBeDefined();
      expect(result.absentDays).toBeDefined();
    });
  });

  describe('requestRegularization', () => {
    it('should request regularization', async () => {
      const result = await attendanceService.requestRegularization({
        date: '2025-01-20',
        requestedCheckIn: '2025-01-20T09:00:00',
        requestedCheckOut: '2025-01-20T18:00:00',
        reason: 'Forgot to check in',
      });

      expect(result).toBeDefined();
      expect(result.regularization).toBeDefined();
      expect(result.regularization.status).toBe('pending');
    });
  });

  describe('getRegularizations', () => {
    it('should get regularization requests', async () => {
      const result = await attendanceService.getRegularizations();

      expect(result).toBeDefined();
      expect(result.regularizations).toBeDefined();
      expect(Array.isArray(result.regularizations)).toBe(true);
    });

    it('should filter by status', async () => {
      const result = await attendanceService.getRegularizations({ status: 'pending' });

      expect(result).toBeDefined();
    });
  });

  describe('approveRegularization', () => {
    it('should approve regularization', async () => {
      const result = await attendanceService.approveRegularization(1, {
        comments: 'Approved',
      });

      expect(result).toBeDefined();
      expect(result.regularization).toBeDefined();
      expect(result.regularization.status).toBe('approved');
    });
  });

  describe('rejectRegularization', () => {
    it('should reject regularization', async () => {
      const result = await attendanceService.rejectRegularization(1, {
        comments: 'Rejected',
      });

      expect(result).toBeDefined();
      expect(result.regularization).toBeDefined();
      expect(result.regularization.status).toBe('rejected');
    });
  });

  describe('getSettings', () => {
    it('should get attendance settings', async () => {
      const result = await attendanceService.getSettings();

      expect(result).toBeDefined();
      expect(result.settings).toBeDefined();
      expect(result.settings.workStartTime).toBeDefined();
    });
  });
});
