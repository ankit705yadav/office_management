import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../auth.service';
import api from '../api';

// Mock the api module
vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('should call login endpoint with credentials', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            user: { id: 1, email: 'test@test.com', role: 'employee' },
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh',
          },
        },
      };

      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const credentials = { email: 'test@test.com', password: 'Password@123' };
      const result = await authService.login(credentials);

      expect(api.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should throw error on login failure', async () => {
      const errorResponse = {
        response: {
          data: { message: 'Invalid credentials' },
          status: 401,
        },
      };

      (api.post as ReturnType<typeof vi.fn>).mockRejectedValue(errorResponse);

      const credentials = { email: 'test@test.com', password: 'wrong' };

      await expect(authService.login(credentials)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should call logout endpoint', async () => {
      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { status: 'success' } });

      await authService.logout();

      expect(api.post).toHaveBeenCalledWith('/auth/logout');
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user', async () => {
      const mockUser = { id: 1, email: 'test@test.com', role: 'employee' };
      const mockResponse = {
        data: {
          status: 'success',
          data: { user: mockUser },
        },
      };

      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await authService.getCurrentUser();

      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        },
      };

      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await authService.refreshToken('old-refresh-token');

      expect(api.post).toHaveBeenCalledWith('/auth/refresh-token', { refreshToken: 'old-refresh-token' });
      expect(result).toEqual(mockResponse.data.data);
    });
  });

  describe('changePassword', () => {
    it('should call change password endpoint', async () => {
      (api.put as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { status: 'success' } });

      const passwordData = {
        currentPassword: 'OldPassword@123',
        newPassword: 'NewPassword@123',
        confirmPassword: 'NewPassword@123',
      };

      await authService.changePassword(passwordData);

      expect(api.put).toHaveBeenCalledWith('/auth/change-password', passwordData);
    });
  });
});
