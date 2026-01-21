// App configuration

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.197.220.16:5003/api';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://10.197.220.16:5003';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  THEME: 'theme',
} as const;

export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;
