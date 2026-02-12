'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
  nickname?: string;
  is_admin?: boolean;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string, claudeApiKey?: string, tavilyApiKey?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Call the API using the actual method
      const userData = await apiClient.getCurrentUser();
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      localStorage.removeItem('auth_token');
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      // The apiClient.login already sets the token in localStorage
      // Response structure should be { access_token: string, user: User }
      if (response.user) {
        setUser(response.user);
      } else {
        // If user is not in response, fetch it separately
        const userData = await apiClient.getCurrentUser();
        setUser(userData);
      }
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name?: string, claudeApiKey?: string, tavilyApiKey?: string) => {
    try {
      const response = await apiClient.register(
        email,
        password,
        name || email.split('@')[0], // Use email prefix as name if not provided
        claudeApiKey || '', // Claude API key from registration form
        tavilyApiKey || ''  // Tavily API key optional
      );
      // The apiClient.register already sets the token in localStorage
      // Response structure should be { access_token: string, user: User }
      if (response.user) {
        setUser(response.user);
      } else {
        // If user is not in response, fetch it separately
        const userData = await apiClient.getCurrentUser();
        setUser(userData);
      }
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear local state
      apiClient.logout();
      localStorage.removeItem('auth_token');
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};