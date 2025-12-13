import api from './api';
import { ApiResponse } from '@/types';

export interface ExpenseCategoryCap {
  id: number | null;
  category: string;
  capAmount: number | null;
  isActive: boolean;
}

export const expenseCapService = {
  /**
   * Get all expense category caps
   */
  getAllCaps: async (): Promise<ExpenseCategoryCap[]> => {
    const response = await api.get<ApiResponse<{ caps: ExpenseCategoryCap[] }>>(
      '/expense-caps'
    );
    return response.data.data!.caps;
  },

  /**
   * Get cap for a specific category
   */
  getCapByCategory: async (category: string): Promise<ExpenseCategoryCap> => {
    const response = await api.get<ApiResponse<ExpenseCategoryCap>>(
      `/expense-caps/${category}`
    );
    return response.data.data!;
  },

  /**
   * Set or update cap for a category (Admin only)
   */
  setCapForCategory: async (
    category: string,
    capAmount: number,
    isActive: boolean = true
  ): Promise<ExpenseCategoryCap> => {
    const response = await api.put<ApiResponse<{ cap: ExpenseCategoryCap }>>(
      `/expense-caps/${category}`,
      { capAmount, isActive }
    );
    return response.data.data!.cap;
  },

  /**
   * Remove cap for a category (Admin only)
   */
  removeCapForCategory: async (category: string): Promise<void> => {
    await api.delete(`/expense-caps/${category}`);
  },
};
