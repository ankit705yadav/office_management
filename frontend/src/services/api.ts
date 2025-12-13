import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Navigation handler - will be set by the app
let navigationHandler: (() => void) | null = null;

export const setNavigationHandler = (handler: () => void) => {
  navigationHandler = handler;
};

const handleLogout = () => {
  localStorage.clear();
  if (navigationHandler) {
    navigationHandler();
  } else {
    // Fallback to window.location if handler not set
    window.location.href = '/login';
  }
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          // No refresh token, redirect to login
          handleLogout();
          return Promise.reject(error);
        }

        // Try to refresh the token
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // Save new tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        handleLogout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse>;

    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    if (axiosError.response?.data?.errors) {
      return axiosError.response.data.errors
        .map((err) => err.message)
        .join(', ');
    }

    if (axiosError.message) {
      return axiosError.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
};

export default api;
