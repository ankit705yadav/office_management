// Holiday API service

import api from './api';
import { Holiday } from '../types';

export interface CreateHolidayRequest {
  name: string;
  date: string;
  description?: string;
  isOptional: boolean;
  year?: number;
}

export interface HolidayFilters {
  year?: number;
  isOptional?: boolean;
}

export interface HolidayStats {
  total: number;
  mandatory: number;
  optional: number;
}

export const holidayService = {
  /**
   * Get all holidays for a year
   */
  getHolidays: async (filters?: HolidayFilters): Promise<{ holidays: Holiday[]; stats: HolidayStats }> => {
    const response = await api.get('/holidays', {
      params: { year: filters?.year || new Date().getFullYear(), ...filters },
    });
    const holidays = response.data.data?.holidays || [];

    return {
      holidays,
      stats: {
        total: holidays.length,
        mandatory: holidays.filter((h: Holiday) => !h.isOptional).length,
        optional: holidays.filter((h: Holiday) => h.isOptional).length,
      },
    };
  },

  /**
   * Get upcoming holidays
   */
  getUpcomingHolidays: async (limit: number = 5): Promise<Holiday[]> => {
    const response = await api.get('/holidays/upcoming', { params: { limit } });
    return response.data.data?.holidays || [];
  },

  /**
   * Get holiday by ID
   */
  getHolidayById: async (id: number): Promise<Holiday> => {
    const response = await api.get(`/holidays/${id}`);
    return response.data.data?.holiday;
  },

  /**
   * Create a new holiday (Admin only)
   */
  createHoliday: async (data: CreateHolidayRequest): Promise<Holiday> => {
    const response = await api.post('/holidays', {
      ...data,
      year: data.year || new Date(data.date).getFullYear(),
    });
    return response.data.data?.holiday;
  },

  /**
   * Delete a holiday (Admin only)
   */
  deleteHoliday: async (id: number): Promise<void> => {
    await api.delete(`/holidays/${id}`);
  },
};

export default holidayService;
