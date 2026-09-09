import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/authService';
import { UserSession, LoginRequest, RegisterRequest } from '../types';

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const restoreSession = async () => {
    setIsLoading(true);
    try {
      const session = await authService.restoreSession();
      setUser(session);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const auth = await authService.login(credentials);
      setUser({
        patientId: auth.patientId,
        email: credentials.email,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterRequest) => {
    setIsLoading(true);
    try {
      const auth = await authService.register(payload);
      setUser({
        patientId: auth.patientId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
