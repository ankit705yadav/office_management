// Holiday API service

import api from './api';
import { Holiday } from '../types';

export const holidayService = {
  /**
   * Get all holidays for a year
   * @param year - The year to get holidays for (defaults to current year)
   */
  getHolidays: async (year?: number): Promise<Holiday[]> => {
    const response = await api.get('/holidays', {
      params: { year: year || new Date().getFullYear() },
    });
    return response.data.data.holidays;
  },

  /**
   * Get upcoming holidays
   * @param limit - Number of holidays to return
   */
  getUpcomingHolidays: async (limit = 5): Promise<Holiday[]> => {
    const response = await api.get('/holidays/upcoming', {
      params: { limit },
    });
    return response.data.data.holidays;
  },
};

export default holidayService;
