import api from './api';
import {
  ApiResponse,
  Voucher,
  CreateVoucherRequest,
  PaginatedResponse,
} from '@/types';

export const voucherService = {
  /**
   * Create/Generate a new voucher
   */
  createVoucher: async (data: CreateVoucherRequest): Promise<Voucher> => {
    const response = await api.post<ApiResponse<{ voucher: Voucher }>>(
      '/vouchers',
      data
    );
    return response.data.data!.voucher;
  },

  /**
   * Get all vouchers
   */
  getAllVouchers: async (params?: {
    page?: number;
    limit?: number;
    region?: string;
    isUsed?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Voucher>> => {
    const response = await api.get<
      ApiResponse<{ vouchers: Voucher[]; pagination: any }>
    >('/vouchers', { params });

    return {
      items: response.data.data!.vouchers,
      pagination: response.data.data!.pagination,
    };
  },

  /**
   * Get voucher by ID
   */
  getVoucherById: async (id: number): Promise<Voucher> => {
    const response = await api.get<ApiResponse<{ voucher: Voucher }>>(
      `/vouchers/${id}`
    );
    return response.data.data!.voucher;
  },

  /**
   * Get voucher by voucher number (for QR verification)
   */
  verifyVoucher: async (voucherNumber: string): Promise<Voucher> => {
    const response = await api.get<ApiResponse<{ voucher: Voucher }>>(
      `/vouchers/verify/${voucherNumber}`
    );
    return response.data.data!.voucher;
  },

  /**
   * Mark voucher as used
   */
  markVoucherAsUsed: async (id: number): Promise<Voucher> => {
    const response = await api.put<ApiResponse<{ voucher: Voucher }>>(
      `/vouchers/${id}/use`
    );
    return response.data.data!.voucher;
  },

  /**
   * Delete voucher
   */
  deleteVoucher: async (id: number): Promise<void> => {
    await api.delete(`/vouchers/${id}`);
  },

  /**
   * Get available regions
   */
  getRegions: async (): Promise<string[]> => {
    const response = await api.get<ApiResponse<{ regions: string[] }>>(
      '/vouchers/regions'
    );
    return response.data.data!.regions;
  },
};
