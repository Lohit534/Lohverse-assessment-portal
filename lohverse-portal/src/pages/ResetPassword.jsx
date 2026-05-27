import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import './AuthForm.css';

export default function ResetPassword() {
  const [params]              = useSearchParams();
  const navigate              = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState('');
  const [error, setError]       = useState('');
  const token                   = params.get('token') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await API.post('/auth/reset-password', { token, password });
      setMessage(res.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">L</div>
          <span>Lohverse</span>
        </div>
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Enter your new password below.</p>

        {message && <div className="auth-alert success"><span>✓</span> {message} — redirecting to login…</div>}
        {error   && <div className="auth-alert error"><span>✕</span> {error}</div>}

        {!token && (
          <div className="auth-alert error">
            <span>✕</span> Invalid reset link. <Link to="/forgot-password">Request a new one</Link>.
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="rp-password">New Password</label>
            <input
              id="rp-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="rp-confirm">Confirm Password</label>
            <input
              id="rp-confirm"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat your new password"
              required
            />
          </div>
          <button type="submit" className="auth-btn" disabled={loading || !token}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>

        <p className="auth-footer-link">
          <Link to="/login">← Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
