// Leave API service

import api from './api';
import { LeaveRequest, LeaveBalance, PaginatedResponse, Pagination } from '../types';

export const leaveService = {
  /**
   * Get leave balance
   */
  getBalance: async (params?: { userId?: number; year?: number }): Promise<LeaveBalance> => {
    const response = await api.get('/leaves/balance', { params });
    return response.data.data.leaveBalance;
  },

  /**
   * Get leave requests with pagination (Current Leaves)
   */
  getLeaveRequests: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ items: LeaveRequest[]; pagination: Pagination }> => {
    const response = await api.get('/leaves', { params });
    return {
      items: response.data.data?.leaveRequests || response.data.data?.items || [],
      pagination: response.data.data?.pagination || {
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 10,
        totalPages: 0,
      },
    };
  },

  /**
   * Get leave history with pagination
   */
  getLeaveHistory: async (params?: {
    year?: number;
    page?: number;
    limit?: number;
  }): Promise<{ items: LeaveRequest[]; pagination: Pagination }> => {
    const response = await api.get('/leaves/history', { params });
    return {
      items: response.data.data?.items || [],
      pagination: response.data.data?.pagination || {
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 10,
        totalPages: 0,
      },
    };
  },

  /**
   * Apply for leave
   */
  applyLeave: async (data: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    isHalfDay?: boolean;
    halfDaySession?: string;
    documentUrl?: string;
  }): Promise<LeaveRequest> => {
    const response = await api.post('/leaves', data);
    return response.data.data?.leaveRequest || response.data.data;
  },

  /**
   * Cancel leave request
   */
  cancelLeave: async (id: number): Promise<void> => {
    await api.put(`/leaves/${id}/cancel`);
  },

  /**
   * Approve leave (Manager/Admin)
   */
  approveLeave: async (id: number, comments?: string): Promise<LeaveRequest> => {
    const response = await api.put(`/leaves/${id}/approve`, { comments });
    return response.data.data?.leaveRequest || response.data.data;
  },

  /**
   * Reject leave (Manager/Admin)
   */
  rejectLeave: async (id: number, comments: string): Promise<LeaveRequest> => {
    const response = await api.put(`/leaves/${id}/reject`, { comments });
    return response.data.data?.leaveRequest || response.data.data;
  },

  /**
   * Get leave request by ID
   */
  getLeaveRequestById: async (id: number): Promise<LeaveRequest> => {
    const response = await api.get(`/leaves/${id}`);
    return response.data.data?.leaveRequest || response.data.data;
  },

  /**
   * Legacy method - Get user's leave requests (kept for compatibility)
   * @deprecated Use getLeaveRequests instead
   */
  getMyLeaves: async (limit = 100): Promise<LeaveRequest[]> => {
    const response = await api.get('/leaves', {
      params: { limit },
    });
    return response.data.data?.leaveRequests || response.data.data?.items || [];
  },
};

export default leaveService;
