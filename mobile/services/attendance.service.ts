// Attendance API service

import api from './api';
import { Attendance, AttendanceRegularization, PaginatedResponse, User } from '../types';

export interface TodayAttendance {
  id?: number;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'half_day' | 'late' | 'on_leave' | 'holiday';
  workHours?: number;
  location?: string;
  isLate?: boolean;
}

export interface MonthlyAttendance {
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  lateDays: number;
  leaveDays: number;
  holidays: number;
  attendancePercentage: number;
  totalHours: number;
}

export interface TeamMemberAttendance {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    department?: { id: number; name: string };
  };
  attendance?: Attendance;
  leaveInfo?: {
    leaveType: string;
    isOnLeave: boolean;
  };
}

export interface TeamAttendanceResponse {
  attendance: Attendance[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RegularizationFormData {
  date: string;
  checkInTime: string;
  checkOutTime: string;
  reason: string;
}

export const attendanceService = {
  /**
   * Get today's attendance record
   */
  getTodayAttendance: async (): Promise<TodayAttendance | null> => {
    try {
      const response = await api.get('/attendance/today');
      return response.data.data?.attendance || response.data.attendance || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Check in for the day
   */
  checkIn: async (location?: string): Promise<TodayAttendance> => {
    const response = await api.post('/attendance/check-in', { location });
    return response.data.data?.attendance || response.data.attendance;
  },

  /**
   * Check out for the day
   */
  checkOut: async (location?: string): Promise<TodayAttendance> => {
    const response = await api.post('/attendance/check-out', { location });
    return response.data.data?.attendance || response.data.attendance;
  },

  /**
   * Get monthly attendance summary
   */
  getMonthlyAttendance: async (month?: number, year?: number): Promise<MonthlyAttendance> => {
    const params: any = {};
    if (month !== undefined) params.month = month;
    if (year !== undefined) params.year = year;

    const response = await api.get('/attendance/monthly', { params });
    const data = response.data.data || response.data;

    // Backend returns nested structure with summary object
    const summary = data.summary || data;
    return {
      month: data.month || month || new Date().getMonth() + 1,
      year: data.year || year || new Date().getFullYear(),
      workingDays: summary.workingDays || 0,
      presentDays: summary.presentDays || 0,
      absentDays: summary.absentDays || 0,
      halfDays: summary.halfDays || 0,
      lateDays: summary.lateDays || 0,
      leaveDays: summary.leaveDays || 0,
      holidays: summary.holidays || 0,
      attendancePercentage: summary.attendancePercentage || 0,
      totalHours: summary.totalWorkHours || summary.totalHours || 0,
    };
  },

  /**
   * Get my attendance history with pagination
   */
  getMyAttendance: async (
    page: number = 1,
    limit: number = 20,
    startDate?: string,
    endDate?: string
  ): Promise<PaginatedResponse<Attendance>> => {
    const params: any = { page, limit };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await api.get('/attendance/my', { params });
    const data = response.data.data || response.data;

    return {
      items: data.attendance || data.items || [],
      pagination: data.pagination || {
        total: data.total || 0,
        page: data.page || page,
        limit: data.limit || limit,
        totalPages: data.totalPages || Math.ceil((data.total || 0) / limit),
      },
    };
  },

  /**
   * Get team attendance for a specific month (manager/admin only)
   */
  getTeamAttendance: async (
    month: number,
    year: number,
    page: number = 1,
    limit: number = 20
  ): Promise<TeamAttendanceResponse> => {
    const response = await api.get('/attendance/team', {
      params: { month, year, page, limit },
    });
    const data = response.data.data || response.data;
    return {
      attendance: Array.isArray(data.attendance) ? data.attendance : [],
      pagination: data.pagination || {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  },

  /**
   * Request attendance regularization
   */
  requestRegularization: async (data: RegularizationFormData): Promise<AttendanceRegularization> => {
    const response = await api.post('/attendance/regularize', {
      date: data.date,
      requestedCheckIn: data.checkInTime ? `${data.date}T${data.checkInTime}:00` : undefined,
      requestedCheckOut: data.checkOutTime ? `${data.date}T${data.checkOutTime}:00` : undefined,
      reason: data.reason,
    });
    return response.data.data?.regularization || response.data.regularization || response.data.data;
  },

  /**
   * Get my regularization requests with pagination
   */
  getMyRegularizations: async (
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<AttendanceRegularization>> => {
    const response = await api.get('/attendance/regularizations', {
      params: { page, limit },
    });
    const data = response.data.data || response.data;

    return {
      items: data.regularizations || data.items || [],
      pagination: data.pagination || {
        total: data.total || 0,
        page: data.page || page,
        limit: data.limit || limit,
        totalPages: data.totalPages || Math.ceil((data.total || 0) / limit),
      },
    };
  },

  /**
   * Get pending regularization requests for team (manager/admin only)
   */
  getPendingRegularizations: async (): Promise<AttendanceRegularization[]> => {
    const response = await api.get('/attendance/regularizations', {
      params: { status: 'pending' },
    });
    const data = response.data.data || response.data;
    return data.regularizations || data.items || data || [];
  },

  /**
   * Approve a regularization request (manager/admin only)
   */
  approveRegularization: async (
    id: number,
    comments?: string
  ): Promise<AttendanceRegularization> => {
    const response = await api.put(`/attendance/regularizations/${id}/approve`, {
      comments,
    });
    return response.data.data?.regularization || response.data.regularization || response.data.data;
  },

  /**
   * Reject a regularization request (manager/admin only)
   */
  rejectRegularization: async (
    id: number,
    comments: string
  ): Promise<AttendanceRegularization> => {
    const response = await api.put(`/attendance/regularizations/${id}/reject`, {
      comments,
    });
    return response.data.data?.regularization || response.data.regularization || response.data.data;
  },
};

export default attendanceService;
