import api from './api';

// Types
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export interface EmployeeSalary {
  id: number;
  userId: number;
  basicSalary: number;
  effectiveFrom: string;
  effectiveTo?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    departmentId?: number;
    department?: {
      id: number;
      name: string;
    };
  };
}

export interface Payment {
  id: number;
  userId: number;
  salaryId: number;
  paymentMonth: number;
  paymentYear: number;
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
  paidBy?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  payer?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface CreateSalaryRequest {
  userId: number;
  basicSalary: number;
  effectiveFrom: string;
}

export interface RunPayrollRequest {
  month: number;
  year: number;
}

export interface UpdatePaymentRequest {
  status: PaymentStatus;
  notes?: string;
}

interface ApiResponse<T> {
  status: string;
  data?: T;
  message?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const paymentService = {
  // ==================== EMPLOYEE ENDPOINTS ====================

  getMySalary: async (): Promise<EmployeeSalary | null> => {
    const response = await api.get<ApiResponse<{ salary: EmployeeSalary | null }>>('/payments/my-salary');
    return response.data.data?.salary || null;
  },

  getMyPayments: async (params?: {
    page?: number;
    limit?: number;
    year?: number;
  }): Promise<{ payments: Payment[]; pagination: Pagination }> => {
    const response = await api.get<ApiResponse<{ payments: Payment[]; pagination: Pagination }>>(
      '/payments/my-payments',
      { params }
    );
    return {
      payments: response.data.data?.payments || [],
      pagination: response.data.data?.pagination || { total: 0, page: 1, limit: 12, totalPages: 0 },
    };
  },

  // ==================== ADMIN ENDPOINTS ====================

  // Salary management
  setSalary: async (data: CreateSalaryRequest): Promise<EmployeeSalary> => {
    const response = await api.post<ApiResponse<{ salary: EmployeeSalary }>>('/payments/salaries', data);
    return response.data.data!.salary;
  },

  getAllSalaries: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{ salaries: EmployeeSalary[]; pagination: Pagination }> => {
    const response = await api.get<ApiResponse<{ salaries: EmployeeSalary[]; pagination: Pagination }>>(
      '/payments/salaries',
      { params }
    );
    return {
      salaries: response.data.data?.salaries || [],
      pagination: response.data.data?.pagination || { total: 0, page: 1, limit: 50, totalPages: 0 },
    };
  },

  getEmployeeSalary: async (userId: number): Promise<EmployeeSalary> => {
    const response = await api.get<ApiResponse<{ salary: EmployeeSalary }>>(`/payments/salaries/${userId}`);
    return response.data.data!.salary;
  },

  getEmployeesWithoutSalary: async (): Promise<{ id: number; firstName: string; lastName: string; email: string }[]> => {
    const response = await api.get<ApiResponse<{ users: { id: number; firstName: string; lastName: string; email: string }[] }>>(
      '/payments/employees-without-salary'
    );
    return response.data.data?.users || [];
  },

  // Payment management
  getAllPayments: async (params?: {
    page?: number;
    limit?: number;
    month?: number;
    year?: number;
    status?: PaymentStatus;
    userId?: number;
  }): Promise<{ payments: Payment[]; pagination: Pagination }> => {
    const response = await api.get<ApiResponse<{ payments: Payment[]; pagination: Pagination }>>(
      '/payments',
      { params }
    );
    return {
      payments: response.data.data?.payments || [],
      pagination: response.data.data?.pagination || { total: 0, page: 1, limit: 50, totalPages: 0 },
    };
  },

  runBulkPayroll: async (data: RunPayrollRequest): Promise<{ paymentsCreated: number; errors?: string[] }> => {
    const response = await api.post<ApiResponse<{ paymentsCreated: number; errors?: string[] }>>(
      '/payments/run-payroll',
      data
    );
    return response.data.data!;
  },

  updatePayment: async (id: number, data: UpdatePaymentRequest): Promise<Payment> => {
    const response = await api.put<ApiResponse<{ payment: Payment }>>(`/payments/${id}`, data);
    return response.data.data!.payment;
  },

  bulkUpdatePayments: async (paymentIds: number[], status: PaymentStatus): Promise<void> => {
    await api.put('/payments/bulk-update', { paymentIds, status });
  },
};
