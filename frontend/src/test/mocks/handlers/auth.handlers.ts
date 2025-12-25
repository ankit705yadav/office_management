import { http, HttpResponse } from 'msw';
import { mockEmployee, mockAdmin, mockManager } from '../data/users';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const authHandlers = [
  // Login
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'employee@test.com' && body.password === 'Employee@123') {
      return HttpResponse.json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: mockEmployee,
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      });
    }

    if (body.email === 'admin@test.com' && body.password === 'Admin@123') {
      return HttpResponse.json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: mockAdmin,
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      });
    }

    if (body.email === 'manager@test.com' && body.password === 'Manager@123') {
      return HttpResponse.json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: mockManager,
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      });
    }

    return HttpResponse.json(
      {
        status: 'error',
        message: 'Invalid email or password',
      },
      { status: 401 }
    );
  }),

  // Get current user
  http.get(`${API_URL}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { status: 'error', message: 'Not authenticated' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      status: 'success',
      data: { user: mockEmployee },
    });
  }),

  // Logout
  http.post(`${API_URL}/auth/logout`, () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Logout successful',
    });
  }),

  // Refresh token
  http.post(`${API_URL}/auth/refresh-token`, async ({ request }) => {
    const body = await request.json() as { refreshToken: string };

    if (body.refreshToken) {
      return HttpResponse.json({
        status: 'success',
        message: 'Token refreshed successfully',
        data: {
          accessToken: 'new-mock-access-token',
          refreshToken: 'new-mock-refresh-token',
        },
      });
    }

    return HttpResponse.json(
      { status: 'error', message: 'Invalid refresh token' },
      { status: 401 }
    );
  }),

  // Change password
  http.put(`${API_URL}/auth/change-password`, async ({ request }) => {
    const body = await request.json() as { currentPassword: string; newPassword: string };

    if (body.currentPassword === 'Employee@123') {
      return HttpResponse.json({
        status: 'success',
        message: 'Password changed successfully',
      });
    }

    return HttpResponse.json(
      { status: 'error', message: 'Current password is incorrect' },
      { status: 401 }
    );
  }),
];
