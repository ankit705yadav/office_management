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

  /**
   * Import holidays from CSV (Admin only)
   */
  importHolidaysFromCSV: async (file: File): Promise<{ imported: number; errors?: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<{ imported: number; errors?: string[] }>>(
      '/holidays/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data!;
  },

  /**
   * Download CSV template (Admin only)
   */
  downloadCSVTemplate: async (): Promise<Blob> => {
    const response = await api.get('/holidays/template', {
      responseType: 'blob',
    });
    return response.data;
  },
};
