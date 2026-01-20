import { holidayService } from '../../services/holiday.service';
import api from '../../services/api';
import { mockHoliday } from '../mocks/handlers';

// Mock the api module
jest.mock('../../services/api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('holidayService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getHolidays', () => {
    it('should get holidays for specified year', async () => {
      const mockHolidays = [
        mockHoliday,
        {
          id: 2,
          name: 'Republic Day',
          date: '2025-01-26',
          year: 2025,
          isOptional: false,
        },
        {
          id: 3,
          name: 'Holi',
          date: '2025-03-14',
          year: 2025,
          isOptional: true,
        },
      ];

      const mockResponse = {
        data: {
          data: {
            holidays: mockHolidays,
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await holidayService.getHolidays(2025);

      expect(mockedApi.get).toHaveBeenCalledWith('/holidays', {
        params: { year: 2025 },
      });
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('New Year');
    });

    it('should use current year if not specified', async () => {
      const currentYear = new Date().getFullYear();

      const mockResponse = {
        data: {
          data: {
            holidays: [mockHoliday],
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await holidayService.getHolidays();

      expect(mockedApi.get).toHaveBeenCalledWith('/holidays', {
        params: { year: currentYear },
      });
    });

    it('should return empty array when no holidays', async () => {
      const mockResponse = {
        data: {
          data: {
            holidays: [],
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await holidayService.getHolidays(2025);

      expect(result).toEqual([]);
    });
  });

  describe('getUpcomingHolidays', () => {
    it('should get upcoming holidays with limit', async () => {
      const mockHolidays = [
        {
          id: 2,
          name: 'Republic Day',
          date: '2025-01-26',
          year: 2025,
          isOptional: false,
          daysUntil: 5,
        },
        {
          id: 3,
          name: 'Holi',
          date: '2025-03-14',
          year: 2025,
          isOptional: true,
          daysUntil: 52,
        },
      ];

      const mockResponse = {
        data: {
          data: {
            holidays: mockHolidays,
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await holidayService.getUpcomingHolidays(10);

      expect(mockedApi.get).toHaveBeenCalledWith('/holidays/upcoming', {
        params: { limit: 10 },
      });
      expect(result).toHaveLength(2);
    });

    it('should use default limit of 5', async () => {
      const mockResponse = {
        data: {
          data: {
            holidays: [],
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await holidayService.getUpcomingHolidays();

      expect(mockedApi.get).toHaveBeenCalledWith('/holidays/upcoming', {
        params: { limit: 5 },
      });
    });
  });
});
