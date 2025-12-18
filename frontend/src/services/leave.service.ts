import api from './api';
import {
  ApiResponse,
  LeaveRequest,
  LeaveBalance,
  CreateLeaveRequest,
  PaginatedResponse,
} from '@/types';

export const leaveService = {
  /**
   * Apply for leave with optional document link
   */
  applyLeave: async (data: CreateLeaveRequest & { documentUrl?: string }): Promise<LeaveRequest> => {
    const response = await api.post<ApiResponse<{ leaveRequest: LeaveRequest }>>(
      '/leaves',
      {
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        isHalfDay: data.isHalfDay,
        halfDaySession: data.halfDaySession,
        documentUrl: data.documentUrl,
      }
    );
    return response.data.data!.leaveRequest;
  },

  /**
   * Get all leave requests
   */
  getLeaveRequests: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<LeaveRequest>> => {
    const response = await api.get<
      ApiResponse<{ leaveRequests: LeaveRequest[]; pagination: any }>
    >('/leaves', { params });

    return {
      items: response.data.data!.leaveRequests,
      pagination: response.data.data!.pagination,
    };
  },

  /**
   * Get leave request by ID
   */
  getLeaveRequestById: async (id: number): Promise<LeaveRequest> => {
    const response = await api.get<ApiResponse<{ leaveRequest: LeaveRequest }>>(
      `/leaves/${id}`
    );
    return response.data.data!.leaveRequest;
  },

  /**
   * Get leave balance
   */
  getLeaveBalance: async (params?: {
    userId?: number;
    year?: number;
  }): Promise<LeaveBalance> => {
    const response = await api.get<ApiResponse<{ leaveBalance: LeaveBalance }>>(
      '/leaves/balance',
      { params }
    );
    return response.data.data!.leaveBalance;
  },

  /**
   * Approve leave request
   */
  approveLeave: async (id: number, comments?: string): Promise<LeaveRequest> => {
    const response = await api.put<ApiResponse<{ leaveRequest: LeaveRequest }>>(
      `/leaves/${id}/approve`,
      { comments }
    );
    return response.data.data!.leaveRequest;
  },

  /**
   * Reject leave request
   */
  rejectLeave: async (id: number, comments: string): Promise<LeaveRequest> => {
    const response = await api.put<ApiResponse<{ leaveRequest: LeaveRequest }>>(
      `/leaves/${id}/reject`,
      { comments }
    );
    return response.data.data!.leaveRequest;
  },

  /**
   * Cancel leave request
   */
  cancelLeave: async (id: number): Promise<void> => {
    await api.put(`/leaves/${id}/cancel`);
  },

  /**
   * Get leave history (past leaves)
   */
  getLeaveHistory: async (params?: {
    year?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<LeaveRequest>> => {
    const response = await api.get<
      ApiResponse<PaginatedResponse<LeaveRequest>>
    >('/leaves/history', { params });
    return response.data.data!;
  },

  /**
   * Export leave report to CSV
   */
  exportLeaveReport: async (params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    userId?: number;
  }): Promise<Blob> => {
    const response = await api.get('/leaves/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
