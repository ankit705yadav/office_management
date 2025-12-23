import api from './api';
import {
  ApiResponse,
  User,
  Department,
  PaginatedResponse,
} from '@/types';

export interface CustomField {
  fieldName: string;
  fieldValue: string;
}

export interface DocumentLink {
  linkTitle: string;
  linkUrl: string;
}

export interface CreateEmployeeRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  dateOfJoining: string;
  role: string;
  departmentId?: number;
  managerId?: number;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  panNumber?: string;
  aadharNumber?: string;
  profileImageUrl?: string;
  documentLinks?: DocumentLink[];
  customFields?: CustomField[];
}

export interface UpdateEmployeeRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  dateOfJoining?: string;
  role?: string;
  status?: string;
  departmentId?: number | null;
  managerId?: number | null;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  profileImageUrl?: string;
}

export const employeeService = {
  /**
   * Get all employees with pagination and filters
   */
  getEmployees: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    departmentId?: number;
  }): Promise<PaginatedResponse<User>> => {
    const response = await api.get<
      ApiResponse<{ users: User[]; pagination: any }>
    >('/users', { params });

    return {
      items: response.data.data!.users,
      pagination: response.data.data!.pagination,
    };
  },

  /**
   * Get employee by ID
   */
  getEmployeeById: async (id: number): Promise<User> => {
    const response = await api.get<ApiResponse<{ user: User }>>(
      `/users/${id}`
    );
    return response.data.data!.user;
  },

  /**
   * Create new employee with profile image URL and document links
   */
  createEmployee: async (data: CreateEmployeeRequest): Promise<User> => {
    const response = await api.post<ApiResponse<{ user: User }>>(
      '/users',
      data
    );
    return response.data.data!.user;
  },

  /**
   * Update employee
   */
  updateEmployee: async (id: number, data: UpdateEmployeeRequest): Promise<User> => {
    const response = await api.put<ApiResponse<{ user: User }>>(
      `/users/${id}`,
      data
    );
    return response.data.data!.user;
  },

  /**
   * Delete (deactivate) employee
   */
  deleteEmployee: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  /**
   * Get all departments
   */
  getDepartments: async (): Promise<Department[]> => {
    const response = await api.get<ApiResponse<{ departments: Department[] }>>(
      '/users/departments'
    );
    return response.data.data!.departments;
  },

  /**
   * Download employee ID card as PDF
   */
  downloadIdCard: async (id: number, employeeName: string): Promise<void> => {
    const response = await api.get(`/users/${id}/id-card`, {
      responseType: 'blob',
    });

    // Create blob URL and trigger download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `id-card-${employeeName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Get employee's team
   */
  getEmployeeTeam: async (id: number): Promise<{ team: User[]; count: number }> => {
    const response = await api.get<ApiResponse<{ team: User[]; count: number }>>(
      `/users/${id}/team`
    );
    return response.data.data!;
  },
};
