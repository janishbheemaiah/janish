import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

export interface User {
  _id: string;
  username: string;
  email: string;
  name: string;
  profilePicture?: string;
  phone?: string;
  licenseNumber?: string;
  bloodGroup?: string;
  bikeModel?: string;
  isAdmin: boolean;
  registeredEvents: string[];
  uploadedPhotos: string[];
  achievements: string[];
  achievementPoints?: number;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  licenseNumber?: string;
  bloodGroup?: string;
  bikeModel?: string;
  otp: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    // Load user from localStorage on app start
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUserState(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user: userData } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUserState(userData);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Login failed');
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const res = await api.post('/auth/register', userData);
      const { token, user: userDataRes } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userDataRes));
      setUserState(userDataRes);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    setUserState(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateProfile = async (userData: Partial<User>) => {
    if (!user) return;
    try {
      const res = await api.put('/auth/profile', userData);
      const updatedUser = res.data;
      setUserState(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Update failed');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await api.post('/auth/forgot-password', { email });
      // In real app, show success message
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Reset failed');
    }
  };

  const value = {
    user,
    setUser: setUserState,
    login,
    register,
    logout,
    updateProfile,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
