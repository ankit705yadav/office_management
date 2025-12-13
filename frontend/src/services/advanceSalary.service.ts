import api from './api';
import {
  ApiResponse,
  AdvanceSalaryRequest,
  CreateAdvanceSalaryRequest,
  AdvanceSalarySummary,
  PaginatedResponse,
} from '@/types';

export const advanceSalaryService = {
  /**
   * Request salary advance
   */
  requestAdvance: async (data: CreateAdvanceSalaryRequest): Promise<AdvanceSalaryRequest> => {
    const response = await api.post<ApiResponse<{ advanceRequest: AdvanceSalaryRequest }>>(
      '/advance-salary',
      data
    );
    return response.data.data!.advanceRequest;
  },

  /**
   * Get all advance requests (role-based filtering)
   */
  getAllAdvanceRequests: async (params?: {
    status?: string;
    month?: number;
    year?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<AdvanceSalaryRequest>> => {
    const response = await api.get<
      ApiResponse<{ advanceRequests: AdvanceSalaryRequest[]; pagination: any }>
    >('/advance-salary', { params });

    return {
      items: response.data.data!.advanceRequests || [],
      pagination: response.data.data!.pagination,
    };
  },

  /**
   * Get current user's advance requests
   */
  getMyAdvanceRequests: async (): Promise<AdvanceSalaryRequest[]> => {
    const response = await api.get<ApiResponse<{ advanceRequests: AdvanceSalaryRequest[]; pagination: any }>>(
      '/advance-salary/my-requests'
    );
    return response.data.data!.advanceRequests || [];
  },

  /**
   * Get pending advance requests for approval
   */
  getPendingAdvanceRequests: async (): Promise<AdvanceSalaryRequest[]> => {
    const response = await api.get<ApiResponse<{ advanceRequests: AdvanceSalaryRequest[]; pagination: any }>>(
      '/advance-salary/pending'
    );
    return response.data.data!.advanceRequests || [];
  },

  /**
   * Approve advance request
   */
  approveAdvance: async (id: number, comments?: string): Promise<AdvanceSalaryRequest> => {
    const response = await api.put<ApiResponse<{ advanceRequest: AdvanceSalaryRequest }>>(
      `/advance-salary/${id}/approve`,
      { comments }
    );
    return response.data.data!.advanceRequest;
  },

  /**
   * Reject advance request
   */
  rejectAdvance: async (id: number, comments?: string): Promise<AdvanceSalaryRequest> => {
    const response = await api.put<ApiResponse<{ advanceRequest: AdvanceSalaryRequest }>>(
      `/advance-salary/${id}/reject`,
      { comments }
    );
    return response.data.data!.advanceRequest;
  },

  /**
   * Mark advance as disbursed
   */
  markAsDisbursed: async (id: number): Promise<AdvanceSalaryRequest> => {
    const response = await api.put<ApiResponse<{ advanceRequest: AdvanceSalaryRequest }>>(
      `/advance-salary/${id}/disburse`
    );
    return response.data.data!.advanceRequest;
  },

  /**
   * Cancel advance request
   */
  cancelAdvanceRequest: async (id: number): Promise<AdvanceSalaryRequest> => {
    const response = await api.put<ApiResponse<{ advanceRequest: AdvanceSalaryRequest }>>(
      `/advance-salary/${id}/cancel`
    );
    return response.data.data!.advanceRequest;
  },

  /**
   * Get advance salary summary
   */
  getSummary: async (): Promise<AdvanceSalarySummary> => {
    const response = await api.get<ApiResponse<AdvanceSalarySummary>>(
      '/advance-salary/summary'
    );
    return response.data.data!;
  },
};
