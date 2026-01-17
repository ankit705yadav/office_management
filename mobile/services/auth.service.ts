// Authentication service

import api from './api';
import { User, LoginCredentials, AuthResponse, ChangePasswordData } from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors - we'll clear local data anyway
      console.log('Logout API call failed, clearing local data');
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  },

  async changePassword(data: ChangePasswordData): Promise<void> {
    await api.put('/auth/change-password', data);
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data.data;
  },
};

export default authService;
