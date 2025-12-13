import api from './api';
import {
  ApiResponse,
  DashboardStats,
  Birthday,
  WorkAnniversary,
  Notification,
  LeaveRequest,
  EmployeeOnLeave,
} from '@/types';

export const dashboardService = {
  /**
   * Get dashboard stats
   */
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<ApiResponse<{ stats: DashboardStats }>>(
      '/dashboard/stats'
    );
    return response.data.data!.stats;
  },

  /**
   * Get upcoming birthdays
   */
  getBirthdays: async (limit = 10): Promise<Birthday[]> => {
    const response = await api.get<ApiResponse<{ birthdays: Birthday[] }>>(
      '/dashboard/birthdays',
      { params: { limit } }
    );
    return response.data.data!.birthdays;
  },

  /**
   * Get work anniversaries
   */
  getAnniversaries: async (limit = 10): Promise<WorkAnniversary[]> => {
    const response = await api.get<ApiResponse<{ anniversaries: WorkAnniversary[] }>>(
      '/dashboard/anniversaries',
      { params: { limit } }
    );
    return response.data.data!.anniversaries;
  },

  /**
   * Get recent activities (notifications)
   */
  getActivities: async (limit = 10): Promise<Notification[]> => {
    const response = await api.get<ApiResponse<{ activities: Notification[] }>>(
      '/dashboard/activities',
      { params: { limit } }
    );
    return response.data.data!.activities;
  },

  /**
   * Mark notification as read
   */
  markNotificationAsRead: async (id: number): Promise<void> => {
    await api.put(`/dashboard/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllNotificationsAsRead: async (): Promise<void> => {
    await api.put('/dashboard/notifications/read-all');
  },

  /**
   * Get team calendar
   */
  getTeamCalendar: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<LeaveRequest[]> => {
    const response = await api.get<ApiResponse<{ leaves: LeaveRequest[] }>>(
      '/dashboard/team-calendar',
      { params }
    );
    return response.data.data!.leaves;
  },

  /**
   * Get employees on leave (current and upcoming)
   */
  getEmployeesOnLeave: async (): Promise<EmployeeOnLeave[]> => {
    const response = await api.get<ApiResponse<{ employeesOnLeave: EmployeeOnLeave[] }>>(
      '/dashboard/employees-on-leave'
    );
    return response.data.data!.employeesOnLeave;
  },
};
