// Leave API service

import api from './api';
import { LeaveRequest, LeaveBalance, PaginatedResponse } from '../types';

export const leaveService = {
  /**
   * Get user's leave requests
   * @param limit - Number of leave requests to return
   */
  getMyLeaves: async (limit = 100): Promise<LeaveRequest[]> => {
    const response = await api.get('/leaves', {
      params: { limit },
    });
    // The API returns items array for paginated responses
    return response.data.data?.items || response.data.items || [];
  },

  /**
   * Get leave balance
   */
  getBalance: async (): Promise<LeaveBalance> => {
    const response = await api.get('/leaves/balance');
    return response.data.data.leaveBalance;
  },
};

export default leaveService;
