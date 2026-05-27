import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import './AuthForm.css';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError]     = useState('');
  const [devToken, setDevToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await API.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      if (res.data.resetToken) setDevToken(res.data.resetToken); // DEV only
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
        <h1 className="auth-title">Forgot Password</h1>
        <p className="auth-subtitle">Enter your email and we'll send you a reset link.</p>

        {message && (
          <div className="auth-alert success">
            <span>✓</span> {message}
            {devToken && (
              <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                <strong>DEV TOKEN:</strong> {devToken}
                <br />
                <Link to={`/reset-password?token=${devToken}`} style={{ color: '#a78bfa' }}>
                  → Click to reset password
                </Link>
              </div>
            )}
          </div>
        )}
        {error && <div className="auth-alert error"><span>✕</span> {error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="fp-email">Email Address</label>
            <input
              id="fp-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        <p className="auth-footer-link">
          Remember your password? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
