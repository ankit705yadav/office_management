import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { authService } from './auth.service';

describe('authService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('login', () => {
    it('should login successfully with valid employee credentials', async () => {
      const result = await authService.login({
        email: 'employee@test.com',
        password: 'Employee@123',
      });

      expect(result).toBeDefined();
      expect(result.user.email).toBe('employee@test.com');
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
    });

    it('should login successfully with valid admin credentials', async () => {
      const result = await authService.login({
        email: 'admin@test.com',
        password: 'Admin@123',
      });

      expect(result).toBeDefined();
      expect(result.user.email).toBe('admin@test.com');
      expect(result.user.role).toBe('admin');
    });

    it('should login successfully with valid manager credentials', async () => {
      const result = await authService.login({
        email: 'manager@test.com',
        password: 'Manager@123',
      });

      expect(result).toBeDefined();
      expect(result.user.email).toBe('manager@test.com');
      expect(result.user.role).toBe('manager');
    });

    it('should throw error with invalid credentials', async () => {
      await expect(
        authService.login({
          email: 'invalid@test.com',
          password: 'wrong',
        })
      ).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear localStorage', async () => {
      // Set up some tokens
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('refreshToken', 'test-refresh');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));

      await authService.logout();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user when authenticated', async () => {
      localStorage.setItem('accessToken', 'mock-access-token');

      const user = await authService.getCurrentUser();

      expect(user).toBeDefined();
      expect(user.email).toBe('employee@test.com');
    });

    it('should throw error when not authenticated', async () => {
      await expect(authService.getCurrentUser()).rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully with correct current password', async () => {
      localStorage.setItem('accessToken', 'mock-access-token');

      await expect(
        authService.changePassword({
          currentPassword: 'Employee@123',
          newPassword: 'NewPassword@123',
        })
      ).resolves.not.toThrow();
    });

    it('should throw error with incorrect current password', async () => {
      localStorage.setItem('accessToken', 'mock-access-token');

      await expect(
        authService.changePassword({
          currentPassword: 'WrongPassword@123',
          newPassword: 'NewPassword@123',
        })
      ).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const result = await authService.refreshToken('valid-refresh-token');

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('new-mock-access-token');
      expect(result.refreshToken).toBe('new-mock-refresh-token');
    });
  });
});
