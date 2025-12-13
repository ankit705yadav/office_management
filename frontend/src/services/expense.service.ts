import api from './api';
import {
  ApiResponse,
  Expense,
  CreateExpenseRequest,
  ExpenseSummary,
  PaginatedResponse,
} from '@/types';

export const expenseService = {
  /**
   * Submit expense claim with optional receipt file
   */
  submitExpense: async (data: CreateExpenseRequest & { receipt?: File }): Promise<Expense> => {
    const formData = new FormData();
    formData.append('amount', data.amount.toString());
    formData.append('category', data.category);
    formData.append('description', data.description);
    formData.append('expenseDate', data.expenseDate);
    if (data.receipt) {
      formData.append('receipt', data.receipt);
    }

    const response = await api.post<ApiResponse<{ expense: Expense }>>(
      '/expenses',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data!.expense;
  },

  /**
   * Get all expenses (filtered by role)
   */
  getAllExpenses: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Expense>> => {
    const response = await api.get<
      ApiResponse<{ expenses: Expense[]; pagination: any }>
    >('/expenses', { params });

    return {
      items: response.data.data!.expenses,
      pagination: response.data.data!.pagination,
    };
  },

  /**
   * Get current user's expenses
   */
  getMyExpenses: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Expense>> => {
    const response = await api.get<
      ApiResponse<{ expenses: Expense[]; pagination: any }>
    >('/expenses/my-expenses', { params });

    return {
      items: response.data.data!.expenses,
      pagination: response.data.data!.pagination,
    };
  },

  /**
   * Get pending expenses for approval
   */
  getPendingExpenses: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Expense>> => {
    const response = await api.get<
      ApiResponse<{ expenses: Expense[]; pagination: any }>
    >('/expenses/pending', { params });

    return {
      items: response.data.data!.expenses,
      pagination: response.data.data!.pagination,
    };
  },

  /**
   * Get expense by ID
   */
  getExpenseById: async (id: number): Promise<Expense> => {
    const response = await api.get<ApiResponse<{ expense: Expense }>>(
      `/expenses/${id}`
    );
    return response.data.data!.expense;
  },

  /**
   * Update expense (only pending)
   */
  updateExpense: async (id: number, data: Partial<CreateExpenseRequest>): Promise<Expense> => {
    const response = await api.put<ApiResponse<{ expense: Expense }>>(
      `/expenses/${id}`,
      data
    );
    return response.data.data!.expense;
  },

  /**
   * Approve expense
   */
  approveExpense: async (id: number, comments?: string): Promise<Expense> => {
    const response = await api.put<ApiResponse<{ expense: Expense }>>(
      `/expenses/${id}/approve`,
      { comments }
    );
    return response.data.data!.expense;
  },

  /**
   * Reject expense
   */
  rejectExpense: async (id: number, comments: string): Promise<Expense> => {
    const response = await api.put<ApiResponse<{ expense: Expense }>>(
      `/expenses/${id}/reject`,
      { comments }
    );
    return response.data.data!.expense;
  },

  /**
   * Cancel expense
   */
  cancelExpense: async (id: number): Promise<void> => {
    await api.put(`/expenses/${id}/cancel`);
  },

  /**
   * Delete expense
   */
  deleteExpense: async (id: number): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },

  /**
   * Get expense summary
   */
  getExpenseSummary: async (params?: {
    month?: number;
    year?: number;
  }): Promise<ExpenseSummary> => {
    const response = await api.get<ApiResponse<{ summary: ExpenseSummary }>>(
      '/expenses/summary',
      { params }
    );
    return response.data.data!.summary;
  },

  /**
   * Export expense report to CSV
   */
  exportExpenseReport: async (params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    category?: string;
  }): Promise<Blob> => {
    const response = await api.get('/expenses/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
