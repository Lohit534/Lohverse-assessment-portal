import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { toast } from '../components/Toast';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [status, setStatus] = useState('Verifying your credentials...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Retrieve Supabase session details
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!session) {
          throw new Error('No active authentication session found.');
        }

        setStatus('Synchronizing with Lohverse secure servers...');

        // Send token to our Flask backend for validation & login
        const response = await API.post('/auth/supabase-login', {
          accessToken: session.access_token
        });

        const { user: u, accessToken, refreshToken } = response.data;

        // Save local session
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(u));
        localStorage.setItem('loginTimestamp', Date.now().toString());
        
        setUser(u);
        toast.success('Successfully logged in!');
        navigate('/dashboard/assessments', { replace: true });
      } catch (err) {
        console.error('OAuth Callback Error:', err);
        toast.error(err.response?.data?.error || err.message || 'Authentication failed');
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate, setUser]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', background: '#0a0a14', color: '#fff', gap: '1.5rem'
    }}>
      <div style={{
        width: 50, height: 50, borderRadius: '50%',
        border: '3px solid transparent', borderTopColor: '#7c3aed',
        animation: 'spin 1s linear infinite'
      }} />
      <div style={{ color: '#a78bfa', fontSize: '1.1rem', fontWeight: '500' }}>
        {status}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}