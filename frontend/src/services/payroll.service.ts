import api from './api';
import {
  ApiResponse,
  Payroll,
  EmployeeSalaryDetail,
  GeneratePayrollRequest,
  CreateSalaryDetailRequest,
  PayrollSummary,
  PaginatedResponse,
} from '@/types';

export const payrollService = {
  /**
   * Generate payroll for a month/year
   */
  generatePayroll: async (data: GeneratePayrollRequest): Promise<{ success: any[]; failed: any[] }> => {
    const response = await api.post<ApiResponse<{ success: any[]; failed: any[] }>>(
      '/payroll/generate',
      data
    );
    return response.data.data!;
  },

  /**
   * Get all payroll records (role-based filtering)
   */
  getPayrollRecords: async (params?: {
    month?: number;
    year?: number;
    userId?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Payroll>> => {
    const response = await api.get<
      ApiResponse<{ payrollRecords: Payroll[]; pagination: any }>
    >('/payroll', { params });

    return {
      items: response.data.data!.payrollRecords,
      pagination: response.data.data!.pagination,
    };
  },

  /**
   * Get current user's payslips
   */
  getMyPayslips: async (params?: { year?: number }): Promise<Payroll[]> => {
    const response = await api.get<ApiResponse<Payroll[]>>(
      '/payroll/my-payslips',
      { params }
    );
    return response.data.data!;
  },

  /**
   * Get payroll by ID
   */
  getPayrollById: async (id: number): Promise<Payroll> => {
    const response = await api.get<ApiResponse<Payroll>>(`/payroll/${id}`);
    return response.data.data!;
  },

  /**
   * Download payslip PDF
   */
  downloadPayslip: async (id: number): Promise<Blob> => {
    const response = await api.get(`/payroll/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Update payroll record (Admin only)
   */
  updatePayroll: async (id: number, data: Partial<Payroll>): Promise<Payroll> => {
    const response = await api.put<ApiResponse<Payroll>>(
      `/payroll/${id}`,
      data
    );
    return response.data.data!;
  },

  /**
   * Delete payroll record (Admin only)
   */
  deletePayroll: async (id: number): Promise<void> => {
    await api.delete(`/payroll/${id}`);
  },

  /**
   * Get payroll summary (aggregated stats)
   */
  getPayrollSummary: async (params?: {
    month?: number;
    year?: number;
  }): Promise<PayrollSummary> => {
    const response = await api.get<ApiResponse<PayrollSummary>>(
      '/payroll/summary',
      { params }
    );
    return response.data.data!;
  },

  // Salary Details Methods

  /**
   * Create salary details for an employee (Admin only)
   */
  createSalaryDetails: async (
    data: CreateSalaryDetailRequest
  ): Promise<EmployeeSalaryDetail> => {
    const response = await api.post<ApiResponse<EmployeeSalaryDetail>>(
      '/salary-details',
      data
    );
    return response.data.data!;
  },

  /**
   * Get all salary details (Admin only)
   */
  getAllSalaryDetails: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
  }): Promise<PaginatedResponse<EmployeeSalaryDetail>> => {
    const response = await api.get<
      ApiResponse<{ salaryDetails: EmployeeSalaryDetail[]; pagination: any }>
    >('/salary-details', { params });

    return {
      items: response.data.data!.salaryDetails,
      pagination: response.data.data!.pagination,
    };
  },

  /**
   * Get salary details by user ID
   */
  getSalaryDetails: async (userId: number): Promise<EmployeeSalaryDetail> => {
    const response = await api.get<ApiResponse<EmployeeSalaryDetail>>(
      `/salary-details/${userId}`
    );
    return response.data.data!;
  },

  /**
   * Update salary details (Admin only)
   */
  updateSalaryDetails: async (
    userId: number,
    data: Partial<CreateSalaryDetailRequest>
  ): Promise<EmployeeSalaryDetail> => {
    const response = await api.put<ApiResponse<EmployeeSalaryDetail>>(
      `/salary-details/${userId}`,
      data
    );
    return response.data.data!;
  },

  /**
   * Delete salary details (Admin only)
   */
  deleteSalaryDetails: async (userId: number): Promise<void> => {
    await api.delete(`/salary-details/${userId}`);
  },

  /**
   * Get employees without salary setup (Admin only)
   */
  getEmployeesWithoutSalary: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
  }): Promise<PaginatedResponse<any>> => {
    const response = await api.get<
      ApiResponse<{ employees: any[]; pagination: any }>
    >('/salary-details/employees/without-salary', { params });

    return {
      items: response.data.data!.employees,
      pagination: response.data.data!.pagination,
    };
  },

  /**
   * Bulk import salary details (Admin only)
   */
  bulkImportSalaryDetails: async (
    salaryData: CreateSalaryDetailRequest[]
  ): Promise<{ success: any[]; failed: any[] }> => {
    const response = await api.post<ApiResponse<{ success: any[]; failed: any[] }>>(
      '/salary-details/bulk-import',
      { salaryData }
    );
    return response.data.data!;
  },
};
