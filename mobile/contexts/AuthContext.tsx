// Authentication Context - Manages user authentication state

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials } from '../types';
import { authService } from '../services/auth.service';
import { tokenStorage, userStorage, clearAuthData } from '../utils/storage';
import { handleApiError } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check for existing session on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);

      // Check if we have stored tokens
      const accessToken = await tokenStorage.getAccessToken();

      if (!accessToken) {
        setUser(null);
        return;
      }

      // Try to get stored user first for faster initial load
      const storedUser = await userStorage.getUser<User>();
      if (storedUser) {
        setUser(storedUser);
      }

      // Validate token by fetching current user from server
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        await userStorage.setUser(currentUser);
      } catch (error) {
        // Token is invalid, clear everything
        await clearAuthData();
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      const { user: loggedInUser, accessToken, refreshToken } = await authService.login(credentials);

      // Store tokens and user
      await tokenStorage.setTokens(accessToken, refreshToken);
      await userStorage.setUser(loggedInUser);

      setUser(loggedInUser);
    } catch (error) {
      const message = handleApiError(error);
      throw new Error(message);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      // Ignore API errors during logout
      console.log('Logout API error:', error);
    } finally {
      // Always clear local data
      await clearAuthData();
      setUser(null);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      await userStorage.setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
