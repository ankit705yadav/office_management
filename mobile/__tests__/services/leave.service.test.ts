import { leaveService } from '../../services/leave.service';
import api from '../../services/api';
import { mockLeaveBalance, mockLeaveRequest } from '../mocks/handlers';

// Mock the api module
jest.mock('../../services/api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('leaveService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should get leave balance successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            leaveBalance: mockLeaveBalance,
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await leaveService.getBalance();

      expect(mockedApi.get).toHaveBeenCalledWith('/leaves/balance', { params: undefined });
      expect(result.sickLeave).toBe(12);
      expect(result.casualLeave).toBe(12);
    });

    it('should get leave balance with params', async () => {
      const mockResponse = {
        data: {
          data: {
            leaveBalance: mockLeaveBalance,
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await leaveService.getBalance({ userId: 1, year: 2025 });

      expect(mockedApi.get).toHaveBeenCalledWith('/leaves/balance', {
        params: { userId: 1, year: 2025 },
      });
    });
  });

  describe('getLeaveRequests', () => {
    it('should get leave requests with pagination', async () => {
      const mockResponse = {
        data: {
          data: {
            leaveRequests: [mockLeaveRequest],
            pagination: {
              total: 1,
              page: 1,
              limit: 10,
              totalPages: 1,
            },
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await leaveService.getLeaveRequests({ page: 1, limit: 10 });

      expect(mockedApi.get).toHaveBeenCalledWith('/leaves', {
        params: { page: 1, limit: 10 },
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].leaveType).toBe('casual');
    });

    it('should filter by status', async () => {
      const mockResponse = {
        data: {
          data: {
            leaveRequests: [],
            pagination: { total: 0 },
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await leaveService.getLeaveRequests({ status: 'pending' });

      expect(mockedApi.get).toHaveBeenCalledWith('/leaves', {
        params: { status: 'pending' },
      });
    });
  });

  describe('getLeaveHistory', () => {
    it('should get leave history', async () => {
      const mockResponse = {
        data: {
          data: {
            items: [mockLeaveRequest],
            pagination: {
              total: 1,
              page: 1,
              limit: 10,
              totalPages: 1,
            },
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await leaveService.getLeaveHistory({ year: 2025 });

      expect(mockedApi.get).toHaveBeenCalledWith('/leaves/history', {
        params: { year: 2025 },
      });
      expect(result.items).toHaveLength(1);
    });
  });

  describe('applyLeave', () => {
    it('should apply for leave successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            leaveRequest: mockLeaveRequest,
          },
        },
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      const leaveData = {
        leaveType: 'casual',
        startDate: '2025-01-25',
        endDate: '2025-01-26',
        reason: 'Personal work',
      };

      const result = await leaveService.applyLeave(leaveData);

      expect(mockedApi.post).toHaveBeenCalledWith('/leaves', leaveData);
      expect(result.status).toBe('pending');
    });

    it('should apply for half-day leave', async () => {
      const mockHalfDayLeave = {
        ...mockLeaveRequest,
        isHalfDay: true,
        halfDaySession: 'morning',
        daysCount: 0.5,
      };

      const mockResponse = {
        data: {
          data: {
            leaveRequest: mockHalfDayLeave,
          },
        },
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      const leaveData = {
        leaveType: 'casual',
        startDate: '2025-01-25',
        endDate: '2025-01-25',
        reason: 'Half day',
        isHalfDay: true,
        halfDaySession: 'morning',
      };

      const result = await leaveService.applyLeave(leaveData);

      expect(mockedApi.post).toHaveBeenCalledWith('/leaves', leaveData);
      expect(result.isHalfDay).toBe(true);
    });
  });

  describe('cancelLeave', () => {
    it('should cancel leave request', async () => {
      mockedApi.put.mockResolvedValue({ data: {} });

      await leaveService.cancelLeave(1);

      expect(mockedApi.put).toHaveBeenCalledWith('/leaves/1/cancel');
    });
  });

  describe('approveLeave', () => {
    it('should approve leave request', async () => {
      const mockResponse = {
        data: {
          data: {
            leaveRequest: { ...mockLeaveRequest, status: 'approved' },
          },
        },
      };

      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await leaveService.approveLeave(1, 'Approved');

      expect(mockedApi.put).toHaveBeenCalledWith('/leaves/1/approve', { comments: 'Approved' });
      expect(result.status).toBe('approved');
    });
  });

  describe('rejectLeave', () => {
    it('should reject leave request', async () => {
      const mockResponse = {
        data: {
          data: {
            leaveRequest: { ...mockLeaveRequest, status: 'rejected' },
          },
        },
      };

      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await leaveService.rejectLeave(1, 'Insufficient notice');

      expect(mockedApi.put).toHaveBeenCalledWith('/leaves/1/reject', {
        comments: 'Insufficient notice',
      });
      expect(result.status).toBe('rejected');
    });
  });

  describe('getLeaveRequestById', () => {
    it('should get leave request by ID', async () => {
      const mockResponse = {
        data: {
          data: {
            leaveRequest: mockLeaveRequest,
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await leaveService.getLeaveRequestById(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/leaves/1');
      expect(result.id).toBe(1);
    });
  });

  describe('getMyLeaves', () => {
    it('should get user leaves (legacy method)', async () => {
      const mockResponse = {
        data: {
          data: {
            leaveRequests: [mockLeaveRequest],
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await leaveService.getMyLeaves(50);

      expect(mockedApi.get).toHaveBeenCalledWith('/leaves', {
        params: { limit: 50 },
      });
      expect(result).toHaveLength(1);
    });
  });
});
