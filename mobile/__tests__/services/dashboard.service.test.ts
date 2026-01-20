import { dashboardService } from '../../services/dashboard.service';
import api from '../../services/api';
import { mockDashboardStats } from '../mocks/handlers';

// Mock the api module
jest.mock('../../services/api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('dashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should get dashboard stats', async () => {
      const mockResponse = {
        data: {
          data: {
            stats: mockDashboardStats,
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await dashboardService.getStats();

      expect(mockedApi.get).toHaveBeenCalledWith('/dashboard/stats');
      expect(result.leaves.pending).toBe(1);
      expect(result.leaves.approved).toBe(2);
      expect(result.notifications.unread).toBe(3);
    });
  });

  describe('getBirthdays', () => {
    it('should get upcoming birthdays', async () => {
      const mockBirthdays = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-25',
          daysUntil: 4,
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          dateOfBirth: '1992-01-28',
          daysUntil: 7,
        },
      ];

      const mockResponse = {
        data: {
          data: {
            birthdays: mockBirthdays,
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await dashboardService.getBirthdays(5);

      expect(mockedApi.get).toHaveBeenCalledWith('/dashboard/birthdays?limit=5');
      expect(result).toHaveLength(2);
      expect(result[0].firstName).toBe('John');
    });

    it('should use default limit', async () => {
      const mockResponse = {
        data: {
          data: {
            birthdays: [],
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await dashboardService.getBirthdays();

      expect(mockedApi.get).toHaveBeenCalledWith('/dashboard/birthdays?limit=5');
    });
  });

  describe('getAnniversaries', () => {
    it('should get work anniversaries', async () => {
      const mockAnniversaries = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          joiningDate: '2020-01-25',
          yearsCompleted: 5,
          daysUntil: 4,
        },
      ];

      const mockResponse = {
        data: {
          data: {
            anniversaries: mockAnniversaries,
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await dashboardService.getAnniversaries(10);

      expect(mockedApi.get).toHaveBeenCalledWith('/dashboard/anniversaries?limit=10');
      expect(result).toHaveLength(1);
      expect(result[0].yearsCompleted).toBe(5);
    });
  });

  describe('getEmployeesOnLeave', () => {
    it('should get employees on leave', async () => {
      const mockEmployeesOnLeave = [
        {
          id: 1,
          firstName: 'Jane',
          lastName: 'Smith',
          leaveType: 'casual',
          startDate: '2025-01-21',
          endDate: '2025-01-22',
        },
      ];

      const mockResponse = {
        data: {
          data: {
            employeesOnLeave: mockEmployeesOnLeave,
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await dashboardService.getEmployeesOnLeave();

      expect(mockedApi.get).toHaveBeenCalledWith('/dashboard/employees-on-leave');
      expect(result).toHaveLength(1);
      expect(result[0].leaveType).toBe('casual');
    });

    it('should return empty array for employees', async () => {
      const mockResponse = {
        data: {
          data: {
            employeesOnLeave: [],
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await dashboardService.getEmployeesOnLeave();

      expect(result).toEqual([]);
    });
  });

  describe('getTeamCalendar', () => {
    it('should get team calendar', async () => {
      const mockLeaves = [
        {
          id: 1,
          userId: 2,
          user: { firstName: 'Jane', lastName: 'Smith' },
          startDate: '2025-01-25',
          endDate: '2025-01-26',
          leaveType: 'casual',
        },
      ];

      const mockResponse = {
        data: {
          data: {
            leaves: mockLeaves,
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await dashboardService.getTeamCalendar('2025-01-01', '2025-01-31');

      expect(mockedApi.get).toHaveBeenCalledWith('/dashboard/team-calendar', {
        params: { startDate: '2025-01-01', endDate: '2025-01-31' },
      });
      expect(result).toHaveLength(1);
    });

    it('should get team calendar without dates', async () => {
      const mockResponse = {
        data: {
          data: {
            leaves: [],
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await dashboardService.getTeamCalendar();

      expect(mockedApi.get).toHaveBeenCalledWith('/dashboard/team-calendar', {
        params: {},
      });
    });
  });
});
