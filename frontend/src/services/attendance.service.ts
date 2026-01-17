import api from './api';
import {
  Attendance,
  AttendanceRegularization,
  AttendanceSetting,
  MonthlySummary,
  CheckInRequest,
  CheckOutRequest,
  RegularizationRequest,
  ApproveRegularizationRequest,
  RejectRegularizationRequest,
  AttendanceFilters,
} from '../types/attendance';

/**
 * Attendance Service
 * Handles all attendance-related API calls
 */
class AttendanceService {
  private baseUrl = '/attendance';

  /**
   * Check in for today
   */
  async checkIn(data: CheckInRequest): Promise<{ attendance: Attendance }> {
    const response = await api.post(`${this.baseUrl}/check-in`, data);
    return response.data.data;
  }

  /**
   * Check out for today
   */
  async checkOut(data: CheckOutRequest): Promise<{ attendance: Attendance }> {
    const response = await api.post(`${this.baseUrl}/check-out`, data);
    return response.data.data;
  }

  /**
   * Get today's attendance
   */
  async getTodayAttendance(): Promise<{ attendance: Attendance | null; statusReason: string }> {
    const response = await api.get(`${this.baseUrl}/today`);
    return response.data.data;
  }

  /**
   * Get my attendance records
   */
  async getMyAttendance(
    filters?: AttendanceFilters
  ): Promise<{ attendance: Attendance[]; pagination: any }> {
    const response = await api.get(`${this.baseUrl}/my`, { params: filters });
    return response.data.data;
  }

  /**
   * Get team attendance (for managers/admins)
   */
  async getTeamAttendance(
    filters?: AttendanceFilters
  ): Promise<{ attendance: Attendance[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const response = await api.get(`${this.baseUrl}/team`, { params: filters });
    return response.data.data;
  }

  /**
   * Get monthly attendance summary
   */
  async getMonthlySummary(month: number, year: number): Promise<MonthlySummary> {
    const response = await api.get(`${this.baseUrl}/monthly`, {
      params: { month, year },
    });
    return response.data.data;
  }

  /**
   * Export attendance report as CSV
   */
  async exportAttendance(filters?: AttendanceFilters): Promise<Blob> {
    const response = await api.get(`${this.baseUrl}/export`, {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Request attendance regularization
   */
  async requestRegularization(
    data: RegularizationRequest
  ): Promise<{ regularization: AttendanceRegularization }> {
    const response = await api.post(`${this.baseUrl}/regularize`, data);
    return response.data.data;
  }

  /**
   * Get regularization requests
   */
  async getRegularizations(
    filters?: { status?: string; page?: number; limit?: number }
  ): Promise<{ regularizations: AttendanceRegularization[]; pagination: any }> {
    const response = await api.get(`${this.baseUrl}/regularizations`, { params: filters });
    return response.data.data;
  }

  /**
   * Approve regularization request (Manager/Admin)
   */
  async approveRegularization(
    id: number,
    data?: ApproveRegularizationRequest
  ): Promise<{ regularization: AttendanceRegularization }> {
    const response = await api.put(`${this.baseUrl}/regularizations/${id}/approve`, data);
    return response.data.data;
  }

  /**
   * Reject regularization request (Manager/Admin)
   */
  async rejectRegularization(
    id: number,
    data: RejectRegularizationRequest
  ): Promise<{ regularization: AttendanceRegularization }> {
    const response = await api.put(`${this.baseUrl}/regularizations/${id}/reject`, data);
    return response.data.data;
  }

  /**
   * Get attendance settings
   */
  async getSettings(): Promise<{ settings: AttendanceSetting }> {
    const response = await api.get(`${this.baseUrl}/settings`);
    return response.data.data;
  }

  /**
   * Update attendance settings (Admin only)
   */
  async updateSettings(data: Partial<AttendanceSetting>): Promise<{ settings: AttendanceSetting }> {
    const response = await api.put(`${this.baseUrl}/settings`, data);
    return response.data.data;
  }

  /**
   * Get current location using browser geolocation API
   */
  async getCurrentLocation(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve(`${latitude.toFixed(6)}N, ${longitude.toFixed(6)}E`);
        },
        (error) => {
          reject(new Error(`Failed to get location: ${error.message}`));
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  }

  /**
   * Download CSV file
   */
  downloadCSV(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export default new AttendanceService();
