// Daily Report API service

import api from './api';
import { DailyReport, PaginatedResponse } from '../types';

export interface CreateReportRequest {
  reportDate: string;
  title: string;
  description?: string;
}

export interface DailyReportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  employeeId?: number;
  page?: number;
  limit?: number;
}

export interface TeamMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export const dailyReportService = {
  /**
   * Create or update a daily report
   */
  createOrUpdateReport: async (data: CreateReportRequest): Promise<DailyReport> => {
    const response = await api.post('/daily-reports', data);
    return response.data.data;
  },

  /**
   * Submit a daily report
   */
  submitReport: async (id: number): Promise<DailyReport> => {
    const response = await api.post(`/daily-reports/${id}/submit`);
    return response.data.data;
  },

  /**
   * Get current user's reports
   */
  getMyReports: async (
    filters?: DailyReportFilters
  ): Promise<{ reports: DailyReport[]; pagination: any }> => {
    const response = await api.get('/daily-reports/my', { params: filters });
    return response.data.data;
  },

  /**
   * Get team reports (manager/admin only)
   */
  getTeamReports: async (
    filters?: DailyReportFilters
  ): Promise<{ reports: DailyReport[]; pagination: any }> => {
    const response = await api.get('/daily-reports/team', { params: filters });
    return response.data.data;
  },

  /**
   * Get report by date for current user
   */
  getReportByDate: async (date: string): Promise<DailyReport | null> => {
    try {
      const response = await api.get(`/daily-reports/date/${date}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get report by ID
   */
  getReportById: async (id: number): Promise<DailyReport> => {
    const response = await api.get(`/daily-reports/${id}`);
    return response.data.data;
  },

  /**
   * Delete a draft report
   */
  deleteReport: async (id: number): Promise<void> => {
    await api.delete(`/daily-reports/${id}`);
  },

  /**
   * Get team members for filtering (manager/admin only)
   */
  getTeamMembers: async (): Promise<TeamMember[]> => {
    const response = await api.get('/daily-reports/team-members');
    return response.data.data;
  },
};

export default dailyReportService;
