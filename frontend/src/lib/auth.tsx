'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authAPI } from './api';

interface User {
  id: number;
  email: string;
  full_name: string;
  telegram_username: string;
  is_admin: boolean;
  is_email_verified: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; password_confirm: string; code: string; telegram_username?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const saveTokens = (access: string, refresh: string) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    setToken(access);
  };

  const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('access_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }
    try {
      const userData = await authAPI.me(storedToken);
      setUser(userData);
      setToken(storedToken);
    } catch {
      // Try refresh
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const data = await authAPI.refreshToken(refreshToken);
          // Refresh-token rotation is enabled server-side: persist the NEW
          // refresh token when the response includes one, otherwise keep the
          // existing one. Reusing a rotated-out token would fail next refresh.
          saveTokens(data.access, data.refresh ?? refreshToken);
          const userData = await authAPI.me(data.access);
          setUser(userData);
        } catch {
          clearTokens();
        }
      } else {
        clearTokens();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const data = await authAPI.login({ email, password });
    saveTokens(data.tokens.access, data.tokens.refresh);
    setUser(data.user);
  };

  const register = async (regData: { email: string; password: string; password_confirm: string; code: string; telegram_username?: string }) => {
    const data = await authAPI.register(regData);
    saveTokens(data.tokens.access, data.tokens.refresh);
    setUser(data.user);
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (token && refreshToken) {
      authAPI.logout(token, refreshToken).catch(() => {});
    }
    clearTokens();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
