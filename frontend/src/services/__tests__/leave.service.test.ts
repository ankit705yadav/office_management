import { describe, it, expect, beforeEach, vi } from 'vitest';
import { leaveService } from '../leave.service';
import api from '../api';

// Mock the api module
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('leaveService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLeaveBalance', () => {
    it('should fetch leave balance', async () => {
      const mockBalance = {
        id: 1,
        userId: 1,
        sickLeave: 12,
        casualLeave: 12,
        earnedLeave: 15,
      };
      const mockResponse = {
        data: {
          status: 'success',
          data: { leaveBalance: mockBalance },
        },
      };

      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await leaveService.getLeaveBalance();

      expect(api.get).toHaveBeenCalledWith('/leaves/balance', { params: undefined });
      expect(result).toEqual(mockBalance);
    });

    it('should fetch leave balance for specific user and year', async () => {
      const mockBalance = { id: 1, userId: 2, year: 2024 };
      const mockResponse = {
        data: {
          status: 'success',
          data: { leaveBalance: mockBalance },
        },
      };

      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await leaveService.getLeaveBalance({ userId: 2, year: 2024 });

      expect(api.get).toHaveBeenCalledWith('/leaves/balance', {
        params: { userId: 2, year: 2024 },
      });
      expect(result).toEqual(mockBalance);
    });
  });

  describe('getLeaveRequests', () => {
    it('should fetch leave requests with pagination', async () => {
      const mockRequests = [{ id: 1, status: 'pending' }];
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            leaveRequests: mockRequests,
            pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
          },
        },
      };

      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await leaveService.getLeaveRequests({ page: 1, limit: 10 });

      expect(api.get).toHaveBeenCalledWith('/leaves', { params: { page: 1, limit: 10 } });
      expect(result.items).toEqual(mockRequests);
    });

    it('should fetch leave requests with filters', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            leaveRequests: [],
            pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
          },
        },
      };

      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await leaveService.getLeaveRequests({ status: 'pending', userId: 1 });

      expect(api.get).toHaveBeenCalledWith('/leaves', {
        params: { status: 'pending', userId: 1 },
      });
    });
  });

  describe('applyLeave', () => {
    it('should submit leave application', async () => {
      const leaveData = {
        leaveType: 'casual' as const,
        startDate: '2025-01-15',
        endDate: '2025-01-16',
        reason: 'Personal work',
      };

      const mockResponse = {
        data: {
          status: 'success',
          data: { leaveRequest: { id: 1, ...leaveData, status: 'pending' } },
        },
      };

      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await leaveService.applyLeave(leaveData);

      expect(api.post).toHaveBeenCalledWith('/leaves', leaveData);
      expect(result.status).toBe('pending');
    });

    it('should submit half-day leave application', async () => {
      const leaveData = {
        leaveType: 'casual' as const,
        startDate: '2025-01-15',
        endDate: '2025-01-15',
        reason: 'Doctor appointment',
        isHalfDay: true,
        halfDaySession: 'morning' as const,
      };

      const mockResponse = {
        data: {
          status: 'success',
          data: { leaveRequest: { id: 1, ...leaveData, status: 'pending', daysCount: 0.5 } },
        },
      };

      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await leaveService.applyLeave(leaveData);

      expect(api.post).toHaveBeenCalledWith('/leaves', leaveData);
      expect(result.daysCount).toBe(0.5);
    });
  });

  describe('approveLeave', () => {
    it('should approve leave request', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          message: 'Leave approved',
          data: { leaveRequest: { id: 1, status: 'approved' } },
        },
      };

      (api.put as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await leaveService.approveLeave(1, 'Approved');

      expect(api.put).toHaveBeenCalledWith('/leaves/1/approve', { comments: 'Approved' });
      expect(result.status).toBe('approved');
    });
  });

  describe('rejectLeave', () => {
    it('should reject leave request', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          message: 'Leave rejected',
          data: { leaveRequest: { id: 1, status: 'rejected' } },
        },
      };

      (api.put as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await leaveService.rejectLeave(1, 'Insufficient balance');

      expect(api.put).toHaveBeenCalledWith('/leaves/1/reject', { comments: 'Insufficient balance' });
      expect(result.status).toBe('rejected');
    });
  });

  describe('cancelLeave', () => {
    it('should cancel leave request', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          message: 'Leave cancelled',
        },
      };

      (api.put as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await leaveService.cancelLeave(1);

      expect(api.put).toHaveBeenCalledWith('/leaves/1/cancel');
    });
  });
});
