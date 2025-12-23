import api from './api';
import { ApiResponse, Holiday } from '@/types';

export interface CreateHolidayData {
  name: string;
  date: string;
  description?: string;
  isOptional: boolean;
  year?: number;
}

export const holidayService = {
  /**
   * Get all holidays
   */
  getHolidays: async (params?: {
    year?: number;
    isOptional?: boolean;
  }): Promise<Holiday[]> => {
    const response = await api.get<ApiResponse<{ holidays: Holiday[] }>>(
      '/holidays',
      { params }
    );
    return response.data.data!.holidays;
  },

  /**
   * Get upcoming holidays
   */
  getUpcomingHolidays: async (limit = 5): Promise<Holiday[]> => {
    const response = await api.get<ApiResponse<{ holidays: Holiday[] }>>(
      '/holidays/upcoming',
      { params: { limit } }
    );
    return response.data.data!.holidays;
  },

  /**
   * Create a holiday (Admin only)
   */
  createHoliday: async (data: CreateHolidayData): Promise<Holiday> => {
    const response = await api.post<ApiResponse<{ holiday: Holiday }>>(
      '/holidays',
      data
    );
    return response.data.data!.holiday;
  },

  /**
   * Delete a holiday (Admin only)
   */
  deleteHoliday: async (id: number): Promise<void> => {
    await api.delete(`/holidays/${id}`);
  },
};
