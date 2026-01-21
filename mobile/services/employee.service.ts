// Employee API service

import api from './api';
import { User, Department, Pagination } from '../types';

export interface EmployeeFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  departmentId?: number;
}

export interface EmployeeStats {
  total: number;
  active: number;
  managers: number;
  admins: number;
}

export interface CreateEmployeeData {
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
  panNumber?: string;
  aadharNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface UpdateEmployeeData {
  email?: string;
  password?: string;
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
  panNumber?: string;
  aadharNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface LeaveBalance {
  id: number;
  userId: number;
  year: number;
  sickLeave: number;
  casualLeave: number;
  earnedLeave: number;
  compOff: number;
  paternityMaternity: number;
  birthdayLeave: number;
}

export interface EmployeeWithDetails extends User {
  customFields?: Array<{ fieldName: string; fieldValue: string }>;
  documents?: Array<{ linkTitle: string; linkUrl: string }>;
  leaveBalances?: LeaveBalance[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export const employeeService = {
  /**
   * Get all employees with pagination and filters
   */
  getEmployees: async (
    filters?: EmployeeFilters
  ): Promise<{ items: User[]; pagination: Pagination; stats: EmployeeStats }> => {
    const response = await api.get('/users', { params: filters });
    return {
      items: response.data.data?.users || [],
      pagination: response.data.data?.pagination || {
        total: 0,
        page: filters?.page || 1,
        limit: filters?.limit || 10,
        totalPages: 0,
      },
      stats: response.data.data?.stats || {
        total: 0,
        active: 0,
        managers: 0,
        admins: 0,
      },
    };
  },

  /**
   * Get employee by ID with full details
   */
  getEmployeeById: async (id: number): Promise<EmployeeWithDetails> => {
    const response = await api.get(`/users/${id}`);
    return response.data.data?.user;
  },

  /**
   * Create new employee (Admin only)
   */
  createEmployee: async (data: CreateEmployeeData): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data.data?.user;
  },

  /**
   * Update employee
   */
  updateEmployee: async (id: number, data: UpdateEmployeeData): Promise<User> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data.data?.user;
  },

  /**
   * Delete employee (soft delete - sets status to terminated)
   */
  deleteEmployee: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  /**
   * Get all departments
   */
  getDepartments: async (): Promise<Department[]> => {
    const response = await api.get('/users/departments');
    return response.data.data?.departments || [];
  },

  /**
   * Get managers/admins for manager selection
   */
  getManagers: async (): Promise<User[]> => {
    // Get both managers and admins
    const [managersRes, adminsRes] = await Promise.all([
      api.get('/users', { params: { role: 'manager', limit: 100 } }),
      api.get('/users', { params: { role: 'admin', limit: 100 } }),
    ]);

    const managers = managersRes.data.data?.users || [];
    const admins = adminsRes.data.data?.users || [];

    return [...managers, ...admins];
  },
};

export default employeeService;
