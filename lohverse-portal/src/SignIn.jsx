import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './SignIn.css';

export default function SignIn({ onBack, onRegister }) {
  const { login }           = useAuth();
  const navigate            = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const u = await login(form.email, form.password);
      if (u.role === 'recruiter') {
        // Recruiters should use the recruiter portal
        setErrors({ submit: 'This is the student portal. Recruiters please use the Recruiter Console.' });
        return;
      }
      navigate('/dashboard/profile', { replace: true });
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || 'Invalid email or password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="si-root">
      {/* Left decorative panel */}
      <div className="si-left">
        <div className="si-left__inner">
          <div className="si-logo" onClick={onBack} style={{ cursor: 'pointer' }}>
            <div className="si-logo-icon">L</div>
            <div>
              <div className="si-logo-name">Lohverse</div>
              <div className="si-logo-sub">SECURE EXAMINATION PORTAL</div>
            </div>
          </div>

          <div className="si-left__content">
            <h2>Welcome Back!</h2>
            <p>Sign in to access your assessments, track your progress, and continue your career journey.</p>

            <ul className="si-benefits">
              <li><span className="si-tick">✓</span> Access all assigned tests</li>
              <li><span className="si-tick">✓</span> View your performance analytics</li>
              <li><span className="si-tick">✓</span> Download your certificates</li>
              <li><span className="si-tick">✓</span> Track recruitment status</li>
            </ul>
          </div>

          <div className="si-left__blob1" />
          <div className="si-left__blob2" />
        </div>
      </div>

      {/* Right form panel */}
      <div className="si-right">
        <div className="si-form-card">
          {/* Back link */}
          <button className="si-back-link" onClick={onBack}>← Back to Home</button>

          <div className="si-form-header">
            <h1>Sign In</h1>
            <p>Enter your credentials to access your portal</p>
          </div>

          <form onSubmit={handleSubmit} className="si-form" noValidate>
            {/* Email */}
            <div className={`si-field ${errors.email ? 'has-error' : ''}`}>
              <label className="si-label">EMAIL ADDRESS <span className="si-req">*</span></label>
              <div className="si-input-wrap">
                <span className="si-input-icon">✉</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="student@college.edu"
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="si-error">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className={`si-field ${errors.password ? 'has-error' : ''}`}>
              <label className="si-label">PASSWORD <span className="si-req">*</span></label>
              <div className="si-input-wrap">
                <span className="si-input-icon">🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button type="button" className="si-toggle-pass" onClick={() => setShowPass(s => !s)}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
              {errors.password && <span className="si-error">{errors.password}</span>}
            </div>

            {/* Forgot password */}
            <div className="si-forgot-row">
              <Link to="/forgot-password" className="si-forgot">Forgot password?</Link>
            </div>

            {/* Error display */}
            {errors.submit && (
              <div className="si-error" style={{ padding: '10px', background: '#fff5f5', border: '1px solid #ef4444', borderRadius: '8px', textAlign: 'center' }}>
                ⚠️ {errors.submit}
              </div>
            )}

            {/* Submit */}
            <button type="submit" className={`si-btn-submit ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading ? <span className="si-spinner" /> : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="si-divider"><span>or</span></div>

          {/* SSO buttons */}
          <div className="si-sso">
            <button className="si-sso-btn">
              <span>G</span> Continue with Google
            </button>
            <button className="si-sso-btn">
              <span style={{fontFamily:'serif'}}>in</span> Continue with LinkedIn
            </button>
          </div>

          {/* Register link */}
          <p className="si-register-link">
            Don't have an account?{' '}
            <button className="si-link-btn" onClick={onRegister}>Register Now →</button>
          </p>
        </div>
      </div>
    </div>
  );
}
