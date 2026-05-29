import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('recruiter_user');
    const token  = localStorage.getItem('recruiter_accessToken');
    const loginTimestamp = localStorage.getItem('recruiter_loginTimestamp');
    const maxSessionDuration = 24 * 60 * 60 * 1000; // 24 hours in ms

    if (stored && token) {
      if (loginTimestamp && (Date.now() - parseInt(loginTimestamp, 10) > maxSessionDuration)) {
        ['recruiter_accessToken', 'recruiter_refreshToken', 'recruiter_user', 'recruiter_loginTimestamp'].forEach(k => localStorage.removeItem(k));
        setUser(null);
        window.location.href = '/login';
      } else {
        try { setUser(JSON.parse(stored)); } catch { localStorage.clear(); }
      }
    }
    setLoading(false);

    // Periodic check every 30 seconds for 24-hour expiration
    const interval = setInterval(() => {
      const ts = localStorage.getItem('recruiter_loginTimestamp');
      if (ts && (Date.now() - parseInt(ts, 10) > maxSessionDuration)) {
        ['recruiter_accessToken', 'recruiter_refreshToken', 'recruiter_user', 'recruiter_loginTimestamp'].forEach(k => localStorage.removeItem(k));
        setUser(null);
        window.location.href = '/login';
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const { user: u, accessToken, refreshToken } = res.data;
    if (u.role !== 'recruiter') throw new Error('Not a recruiter account');
    localStorage.setItem('recruiter_accessToken', accessToken);
    localStorage.setItem('recruiter_refreshToken', refreshToken);
    localStorage.setItem('recruiter_user', JSON.stringify(u));
    localStorage.setItem('recruiter_loginTimestamp', Date.now().toString());
    setUser(u);
    return u;
  };

  const register = async (body) => {
    const res = await API.post('/recruiter/register', body);
    const { user: u, accessToken, refreshToken } = res.data;
    localStorage.setItem('recruiter_accessToken', accessToken);
    localStorage.setItem('recruiter_refreshToken', refreshToken);
    localStorage.setItem('recruiter_user', JSON.stringify(u));
    localStorage.setItem('recruiter_loginTimestamp', Date.now().toString());
    setUser(u);
    return u;
  };

  const logout = async () => {
    try { await API.post('/auth/logout'); } catch {}
    ['recruiter_accessToken', 'recruiter_refreshToken', 'recruiter_user', 'recruiter_loginTimestamp'].forEach(k => localStorage.removeItem(k));
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await API.get('/auth/me');
      const u   = res.data.user;
      localStorage.setItem('recruiter_user', JSON.stringify(u));
      setUser(u);
      return u;
    } catch { await logout(); }
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
