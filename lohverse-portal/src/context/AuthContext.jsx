import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token  = localStorage.getItem('accessToken');
    const loginTimestamp = localStorage.getItem('loginTimestamp');
    const maxSessionDuration = 24 * 60 * 60 * 1000; // 24 hours in ms

    if (stored && token) {
      if (loginTimestamp && (Date.now() - parseInt(loginTimestamp, 10) > maxSessionDuration)) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTimestamp');
        setUser(null);
        window.location.href = '/';
      } else {
        try {
          setUser(JSON.parse(stored));
        } catch {
          localStorage.clear();
        }
      }
    }
    setLoading(false);

    // Periodic check every 30 seconds for 24-hour expiration
    const interval = setInterval(() => {
      const ts = localStorage.getItem('loginTimestamp');
      if (ts && (Date.now() - parseInt(ts, 10) > maxSessionDuration)) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTimestamp');
        setUser(null);
        window.location.href = '/';
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const { user: u, accessToken, refreshToken } = res.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('loginTimestamp', Date.now().toString());
    setUser(u);
    return u;
  };

  const register = async (formData) => {
    // formData is FormData (supports file upload)
    const res = await API.post('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const { user: u, accessToken, refreshToken } = res.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('loginTimestamp', Date.now().toString());
    setUser(u);
    return u;
  };

  const logout = async () => {
    try { await API.post('/auth/logout'); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTimestamp');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await API.get('/auth/me');
      const updated = res.data.user;
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      return updated;
    } catch {
      await logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
