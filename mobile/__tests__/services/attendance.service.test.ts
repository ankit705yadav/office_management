import { attendanceService } from '../../services/attendance.service';
import api from '../../services/api';
import { mockAttendance } from '../mocks/handlers';

// Mock the api module
jest.mock('../../services/api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('attendanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTodayAttendance', () => {
    it('should get today attendance successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            attendance: mockAttendance,
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await attendanceService.getTodayAttendance();

      expect(mockedApi.get).toHaveBeenCalledWith('/attendance/today');
      expect(result).toEqual(mockAttendance);
    });

    it('should return null when no attendance record exists', async () => {
      const error = { response: { status: 404 } };
      mockedApi.get.mockRejectedValue(error);

      const result = await attendanceService.getTodayAttendance();

      expect(result).toBeNull();
    });

    it('should throw error for non-404 errors', async () => {
      const error = { response: { status: 500 } };
      mockedApi.get.mockRejectedValue(error);

      await expect(attendanceService.getTodayAttendance()).rejects.toEqual(error);
    });
  });

  describe('checkIn', () => {
    it('should check in successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            attendance: { ...mockAttendance, checkInTime: '2025-01-21T09:00:00.000Z' },
          },
        },
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await attendanceService.checkIn('Office');

      expect(mockedApi.post).toHaveBeenCalledWith('/attendance/check-in', { location: 'Office' });
      expect(result.checkInTime).toBe('2025-01-21T09:00:00.000Z');
    });

    it('should check in without location', async () => {
      const mockResponse = {
        data: {
          data: {
            attendance: mockAttendance,
          },
        },
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      await attendanceService.checkIn();

      expect(mockedApi.post).toHaveBeenCalledWith('/attendance/check-in', { location: undefined });
    });
  });

  describe('checkOut', () => {
    it('should check out successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            attendance: {
              ...mockAttendance,
              checkOutTime: '2025-01-21T18:00:00.000Z',
              workHours: 9,
            },
          },
        },
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await attendanceService.checkOut('Office');

      expect(mockedApi.post).toHaveBeenCalledWith('/attendance/check-out', { location: 'Office' });
      expect(result.checkOutTime).toBe('2025-01-21T18:00:00.000Z');
      expect(result.workHours).toBe(9);
    });
  });

  describe('getMonthlyAttendance', () => {
    it('should get monthly attendance summary', async () => {
      const mockSummary = {
        workingDays: 22,
        presentDays: 20,
        absentDays: 0,
        halfDays: 0,
        lateDays: 2,
        leaveDays: 2,
        holidays: 1,
        attendancePercentage: 90.9,
        totalWorkHours: 160,
      };

      const mockResponse = {
        data: {
          data: {
            month: 1,
            year: 2025,
            summary: mockSummary,
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await attendanceService.getMonthlyAttendance(1, 2025);

      expect(mockedApi.get).toHaveBeenCalledWith('/attendance/monthly', {
        params: { month: 1, year: 2025 },
      });
      expect(result.month).toBe(1);
      expect(result.year).toBe(2025);
      expect(result.workingDays).toBe(22);
      expect(result.presentDays).toBe(20);
    });

    it('should use current month/year if not provided', async () => {
      const mockResponse = {
        data: {
          data: {
            summary: { workingDays: 22 },
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await attendanceService.getMonthlyAttendance();

      expect(mockedApi.get).toHaveBeenCalledWith('/attendance/monthly', { params: {} });
    });
  });

  describe('getMyAttendance', () => {
    it('should get my attendance with pagination', async () => {
      const mockResponse = {
        data: {
          data: {
            attendance: [mockAttendance],
            pagination: {
              total: 20,
              page: 1,
              limit: 20,
              totalPages: 1,
            },
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await attendanceService.getMyAttendance(1, 20);

      expect(mockedApi.get).toHaveBeenCalledWith('/attendance/my', {
        params: { page: 1, limit: 20 },
      });
      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(20);
    });

    it('should support date range filters', async () => {
      const mockResponse = {
        data: {
          data: {
            attendance: [],
            pagination: { total: 0 },
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await attendanceService.getMyAttendance(1, 20, '2025-01-01', '2025-01-31');

      expect(mockedApi.get).toHaveBeenCalledWith('/attendance/my', {
        params: {
          page: 1,
          limit: 20,
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        },
      });
    });
  });

  describe('getTeamAttendance', () => {
    it('should get team attendance for managers', async () => {
      const mockResponse = {
        data: {
          data: {
            attendance: [mockAttendance],
            pagination: {
              page: 1,
              limit: 20,
              total: 5,
              totalPages: 1,
            },
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await attendanceService.getTeamAttendance(1, 2025, 1, 20);

      expect(mockedApi.get).toHaveBeenCalledWith('/attendance/team', {
        params: { month: 1, year: 2025, page: 1, limit: 20 },
      });
      expect(result.attendance).toHaveLength(1);
      expect(result.pagination.total).toBe(5);
    });
  });

  describe('requestRegularization', () => {
    it('should request regularization successfully', async () => {
      const mockRegularization = {
        id: 1,
        date: '2025-01-20',
        requestedCheckIn: '2025-01-20T09:00:00',
        requestedCheckOut: '2025-01-20T18:00:00',
        reason: 'Forgot to check in',
        status: 'pending',
      };

      const mockResponse = {
        data: {
          data: {
            regularization: mockRegularization,
          },
        },
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await attendanceService.requestRegularization({
        date: '2025-01-20',
        checkInTime: '09:00',
        checkOutTime: '18:00',
        reason: 'Forgot to check in',
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/attendance/regularize', {
        date: '2025-01-20',
        requestedCheckIn: '2025-01-20T09:00:00',
        requestedCheckOut: '2025-01-20T18:00:00',
        reason: 'Forgot to check in',
      });
      expect(result.status).toBe('pending');
    });
  });

  describe('getMyRegularizations', () => {
    it('should get my regularization requests', async () => {
      const mockResponse = {
        data: {
          data: {
            regularizations: [
              { id: 1, status: 'pending' },
              { id: 2, status: 'approved' },
            ],
            pagination: {
              total: 2,
              page: 1,
              limit: 20,
              totalPages: 1,
            },
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await attendanceService.getMyRegularizations();

      expect(mockedApi.get).toHaveBeenCalledWith('/attendance/regularizations', {
        params: { page: 1, limit: 20 },
      });
      expect(result.items).toHaveLength(2);
    });
  });

  describe('getPendingRegularizations', () => {
    it('should get pending regularizations for managers', async () => {
      const mockResponse = {
        data: {
          data: {
            regularizations: [
              { id: 1, status: 'pending' },
            ],
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await attendanceService.getPendingRegularizations();

      expect(mockedApi.get).toHaveBeenCalledWith('/attendance/regularizations', {
        params: { status: 'pending' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('approveRegularization', () => {
    it('should approve regularization successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            regularization: { id: 1, status: 'approved' },
          },
        },
      };

      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await attendanceService.approveRegularization(1, 'Approved');

      expect(mockedApi.put).toHaveBeenCalledWith('/attendance/regularizations/1/approve', {
        comments: 'Approved',
      });
      expect(result.status).toBe('approved');
    });
  });

  describe('rejectRegularization', () => {
    it('should reject regularization successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            regularization: { id: 1, status: 'rejected' },
          },
        },
      };

      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await attendanceService.rejectRegularization(1, 'Invalid reason');

      expect(mockedApi.put).toHaveBeenCalledWith('/attendance/regularizations/1/reject', {
        comments: 'Invalid reason',
      });
      expect(result.status).toBe('rejected');
    });
  });
});
