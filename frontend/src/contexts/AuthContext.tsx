import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, AuthResponse } from '@/types';
import { authService } from '@/services/auth.service';
import { handleApiError } from '@/services/api';

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

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');

      if (storedUser && accessToken) {
        try {
          // Verify token is still valid by fetching current user
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        } catch (error) {
          // Token invalid, clear storage
          localStorage.clear();
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      const response: AuthResponse = await authService.login(credentials);

      // Save tokens and user to localStorage
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      setUser(response.user);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state and localStorage regardless of API call success
      setUser(null);
      localStorage.clear();
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      localStorage.setItem('user', JSON.stringify(currentUser));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
