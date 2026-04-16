import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, clearToken } from '../lib/api';
import { UserProfile } from '../types';

interface AuthUser {
  id: number;
  email: string;
  displayName: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: { email: string; password: string; displayName: string; role: string; department: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we have a stored token and validate it
    const token = localStorage.getItem('omnisync_token');
    if (token) {
      api.get('/auth/me')
        .then((data) => {
          setUser({ id: data.id, email: data.email, displayName: data.displayName });
          setProfile({
            uid: data.uid || data.id.toString(),
            email: data.email,
            displayName: data.displayName,
            role: data.role,
            department: data.department,
            createdAt: data.createdAt,
          });
        })
        .catch(() => {
          clearToken();
          setUser(null);
          setProfile(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.post('/auth/login', { email, password });
    setToken(data.token);
    setUser({ id: data.user.id, email: data.user.email, displayName: data.user.displayName });
    setProfile({
      uid: data.user.id.toString(),
      email: data.user.email,
      displayName: data.user.displayName,
      role: data.user.role,
      department: data.user.department,
      createdAt: new Date().toISOString(),
    });
  };

  const logout = async () => {
    clearToken();
    setUser(null);
    setProfile(null);
  };

  const register = async (data: { email: string; password: string; displayName: string; role: string; department: string }) => {
    await api.post('/auth/register', data);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
