// Dashboard API service

import api from './api';
import {
  DashboardStats,
  Birthday,
  WorkAnniversary,
  EmployeeOnLeave,
} from '../types';

export const dashboardService = {
  /**
   * Get dashboard stats
   * Returns leave balance, pending requests, approvals (for manager/admin), etc.
   */
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data.data.stats;
  },

  /**
   * Get upcoming birthdays
   * @param limit - Number of birthdays to return (default: 5)
   */
  getBirthdays: async (limit = 5): Promise<Birthday[]> => {
    const response = await api.get(`/dashboard/birthdays?limit=${limit}`);
    return response.data.data.birthdays;
  },

  /**
   * Get work anniversaries
   * @param limit - Number of anniversaries to return (default: 5)
   */
  getAnniversaries: async (limit = 5): Promise<WorkAnniversary[]> => {
    const response = await api.get(`/dashboard/anniversaries?limit=${limit}`);
    return response.data.data.anniversaries;
  },

  /**
   * Get employees on leave
   * - Managers see their team members
   * - Admins see all employees
   * - Employees see empty list
   */
  getEmployeesOnLeave: async (): Promise<EmployeeOnLeave[]> => {
    const response = await api.get('/dashboard/employees-on-leave');
    return response.data.data.employeesOnLeave;
  },

  /**
   * Get team calendar (leave schedule)
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   */
  getTeamCalendar: async (startDate?: string, endDate?: string) => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await api.get('/dashboard/team-calendar', { params });
    return response.data.data.leaves;
  },
};

export default dashboardService;
