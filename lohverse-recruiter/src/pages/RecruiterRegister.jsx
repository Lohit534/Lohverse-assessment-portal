import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const inputStyle = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(167,139,250,0.2)',
  borderRadius: 10, padding: '0.75rem 1rem', color: '#f1edff', fontSize: '0.9rem',
  outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
};

export default function RecruiterRegister() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    companyName: '', designation: '', companyUrl: '', phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match'); return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters'); return;
    }
    setLoading(true); setError('');
    try {
      await register({
        fullName:    form.fullName,
        email:       form.email,
        password:    form.password,
        companyName: form.companyName,
        designation: form.designation,
        companyUrl:  form.companyUrl,
        phone:       form.phone,
      });
      navigate('/dashboard');
    } catch (e) {
      setError(e.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = 'text', placeholder = '', opts = {}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', ...opts.containerStyle }}>
      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(200,185,230,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}{opts.required && <span style={{ color: '#f87171' }}> *</span>}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        required={opts.required}
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = '#7c3aed'}
        onBlur={e => e.target.style.borderColor = 'rgba(167,139,250,0.2)'}
      />
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0d0d1a 0%,#1a0a2e 60%,#0a1a2e 100%)',
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", padding: '2rem 1rem',
    }}>
      <div style={{
        width: '100%', maxWidth: 520,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(167,139,250,0.15)',
        borderRadius: 20, padding: '2.5rem 2rem', backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <div style={{
            width: 38, height: 38, background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '1rem', color: 'white',
          }}>L</div>
          <div>
            <div style={{ color: '#f1edff', fontWeight: 800, fontSize: '1rem' }}>Lohverse</div>
            <div style={{ color: 'rgba(200,185,230,0.5)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recruiter Console</div>
          </div>
        </div>

        <h1 style={{ color: '#f1edff', fontWeight: 800, fontSize: '1.6rem', marginBottom: '0.4rem' }}>
          Create Recruiter Account
        </h1>
        <p style={{ color: 'rgba(200,185,230,0.6)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
          Join Lohverse to post jobs and find top talent.
        </p>

        {error && (
          <div style={{
            padding: '0.875rem', borderRadius: 10, background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)', color: '#f87171',
            fontSize: '0.875rem', marginBottom: '1.5rem',
          }}>✕ {error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(167,139,250,0.06)', borderRadius: 12, padding: '1rem', border: '1px solid rgba(167,139,250,0.1)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa', marginBottom: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              👤 Personal Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              {field('fullName',  'Full Name',     'text',  'Your full name',  { required: true })}
              {field('phone',     'Phone',         'tel',   '+91 9876543210')}
              {field('email',     'Email',         'email', 'you@company.com', { required: true, containerStyle: { gridColumn: 'span 2' } })}
            </div>
          </div>

          <div style={{ background: 'rgba(167,139,250,0.06)', borderRadius: 12, padding: '1rem', border: '1px solid rgba(167,139,250,0.1)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa', marginBottom: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              🏢 Company Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              {field('companyName',  'Company Name',  'text',  'Lohverse Inc.', { required: true, containerStyle: { gridColumn: 'span 2' } })}
              {field('designation', 'Designation',   'text',  'HR Manager')}
              {field('companyUrl',  'Company URL',   'url',   'https://company.com')}
            </div>
          </div>

          <div style={{ background: 'rgba(167,139,250,0.06)', borderRadius: 12, padding: '1rem', border: '1px solid rgba(167,139,250,0.1)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa', marginBottom: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              🔐 Security
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              {field('password',        'Password',         'password', 'Min 6 characters',    { required: true })}
              {field('confirmPassword', 'Confirm Password', 'password', 'Repeat password',     { required: true })}
            </div>
          </div>

          <button
            type="submit"
            id="register-submit"
            disabled={loading}
            style={{
              padding: '0.875rem', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              border: 'none', borderRadius: 10, color: 'white', fontWeight: 700,
              fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1, letterSpacing: '0.02em', fontFamily: 'inherit',
              marginTop: '0.5rem',
            }}
          >
            {loading ? '⟳ Creating Account…' : '🚀 Create Recruiter Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'rgba(200,185,230,0.6)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
