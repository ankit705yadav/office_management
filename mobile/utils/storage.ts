// Storage utilities using SecureStore (for tokens) and AsyncStorage (for data)

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';

// Secure storage for sensitive data (tokens)
export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  },

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};

// Regular storage for non-sensitive data
export const storage = {
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async setObject<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  async getObject<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
};

// Token management
export const tokenStorage = {
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      secureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  },
};

// User data management
export const userStorage = {
  async setUser<T>(user: T): Promise<void> {
    await storage.setObject(STORAGE_KEYS.USER, user);
  },

  async getUser<T>(): Promise<T | null> {
    return await storage.getObject<T>(STORAGE_KEYS.USER);
  },

  async clearUser(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.USER);
  },
};

// Clear all auth-related data
export const clearAuthData = async (): Promise<void> => {
  await Promise.all([
    tokenStorage.clearTokens(),
    userStorage.clearUser(),
  ]);
};
