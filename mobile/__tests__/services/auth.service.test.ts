import { authService } from '../../services/auth.service';
import api from '../../services/api';
import { mockUser } from '../mocks/handlers';

// Mock the api module
jest.mock('../../services/api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        data: {
          data: {
            user: mockUser,
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
          },
        },
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await authService.login({
        email: 'employee@test.com',
        password: 'Test@123',
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'employee@test.com',
        password: 'Test@123',
      });
      expect(result.user.email).toBe('employee@test.com');
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should throw error on invalid credentials', async () => {
      mockedApi.post.mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        authService.login({
          email: 'invalid@test.com',
          password: 'wrong',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should call logout endpoint', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await authService.logout();

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/logout');
    });

    it('should not throw error if logout API fails', async () => {
      mockedApi.post.mockRejectedValue(new Error('Network error'));

      // Should not throw
      await expect(authService.logout()).resolves.not.toThrow();
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user', async () => {
      const mockResponse = {
        data: {
          data: {
            user: mockUser,
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const user = await authService.getCurrentUser();

      expect(mockedApi.get).toHaveBeenCalledWith('/auth/me');
      expect(user.email).toBe('employee@test.com');
    });

    it('should throw error if not authenticated', async () => {
      mockedApi.get.mockRejectedValue(new Error('Unauthorized'));

      await expect(authService.getCurrentUser()).rejects.toThrow('Unauthorized');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockedApi.put.mockResolvedValue({ data: {} });

      await authService.changePassword({
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@123',
      });

      expect(mockedApi.put).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@123',
      });
    });

    it('should throw error if current password is wrong', async () => {
      mockedApi.put.mockRejectedValue(new Error('Current password is incorrect'));

      await expect(
        authService.changePassword({
          currentPassword: 'WrongPass@123',
          newPassword: 'NewPass@123',
        })
      ).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        },
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await authService.refreshToken('old-refresh-token');

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/refresh-token', {
        refreshToken: 'old-refresh-token',
      });
      expect(result.accessToken).toBe('new-access-token');
    });
  });
});
