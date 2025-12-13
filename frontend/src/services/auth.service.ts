import api from './api';
import {
  ApiResponse,
  LoginCredentials,
  AuthResponse,
  User,
  ChangePasswordData,
} from '@/types';

export const authService = {
  /**
   * Login user
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      credentials
    );
    return response.data.data!;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data.data!.user;
  },

  /**
   * Change password
   */
  changePassword: async (data: ChangePasswordData): Promise<void> => {
    await api.put('/auth/change-password', data);
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>(
      '/auth/refresh-token',
      { refreshToken }
    );
    return response.data.data!;
  },
};
