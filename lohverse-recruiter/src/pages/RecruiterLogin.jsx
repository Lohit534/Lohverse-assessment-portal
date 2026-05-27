import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RecruiterLogin() {
  const { login }         = useAuth();
  const navigate          = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (e) {
      setError(e.message === 'Not a recruiter account'
        ? 'This account is not a recruiter account. Use the student portal instead.'
        : (e.response?.data?.error || 'Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg,#0d0d1a 0%,#1a0a2e 60%,#0a1a2e 100%)',
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
    }}>
      {/* Left Panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem',
        background: 'rgba(124,58,237,0.08)', borderRight: '1px solid rgba(167,139,250,0.1)',
        display: window.innerWidth < 768 ? 'none' : 'flex',
      }}>
        <div style={{ marginBottom: '3rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '2rem',
          }}>
            <div style={{
              width: 48, height: 48, background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
              borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem', fontWeight: 900, color: 'white',
            }}>L</div>
            <div>
              <div style={{ color: '#f1edff', fontWeight: 800, fontSize: '1.25rem' }}>Lohverse</div>
              <div style={{ color: 'rgba(200,185,230,0.5)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Recruiter Console</div>
            </div>
          </div>
          <h1 style={{ color: '#f1edff', fontSize: '2.25rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '1rem' }}>
            Find Top Talent.<br />
            <span style={{ background: 'linear-gradient(90deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Effortlessly.
            </span>
          </h1>
          <p style={{ color: 'rgba(200,185,230,0.65)', fontSize: '1rem', lineHeight: 1.7 }}>
            Manage job postings, create assessments, evaluate candidates and build your dream team — all from one powerful dashboard.
          </p>
        </div>
        {[
          { icon: '💼', title: 'Post Jobs', desc: 'Create and manage job listings with full control' },
          { icon: '📝', title: 'Custom Assessments', desc: 'Build MCQ tests and automatically grade candidates' },
          { icon: '📊', title: 'Analytics Dashboard', desc: 'Track applications, scores, and hiring pipeline' },
        ].map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.875rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: 42, height: 42, flexShrink: 0,
              background: 'rgba(124,58,237,0.2)', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
            }}>{f.icon}</div>
            <div>
              <div style={{ color: '#e8e3f8', fontWeight: 700, fontSize: '0.9rem' }}>{f.title}</div>
              <div style={{ color: 'rgba(200,185,230,0.55)', fontSize: '0.8rem' }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Right Panel — Form */}
      <div style={{
        width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '2rem 2.5rem',
      }}>
        <h2 style={{ color: '#f1edff', fontWeight: 800, fontSize: '1.75rem', marginBottom: '0.5rem' }}>
          Recruiter Sign In
        </h2>
        <p style={{ color: 'rgba(200,185,230,0.6)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Welcome back! Sign in to your recruiter account.
        </p>

        {error && (
          <div style={{
            padding: '0.875rem', borderRadius: 10, background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)', color: '#f87171',
            fontSize: '0.875rem', marginBottom: '1.5rem',
          }}>✕ {error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[
            { key: 'email', label: 'Email Address', type: 'email', placeholder: 'recruiter@company.com' },
            { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
          ].map(f => (
            <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(200,185,230,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
              <input
                id={`login-${f.key}`}
                type={f.type}
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                required
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(167,139,250,0.2)',
                  borderRadius: 10, padding: '0.75rem 1rem', color: '#f1edff', fontSize: '0.95rem',
                  outline: 'none', fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = 'rgba(167,139,250,0.2)'}
              />
            </div>
          ))}

          <button
            type="submit"
            id="login-submit"
            disabled={loading}
            style={{
              padding: '0.875rem', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              border: 'none', borderRadius: 10, color: 'white', fontWeight: 700,
              fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1, letterSpacing: '0.02em', fontFamily: 'inherit',
            }}
          >
            {loading ? '⟳ Signing In…' : 'Sign In to Dashboard'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'rgba(200,185,230,0.6)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>
            Register as Recruiter
          </Link>
        </p>
      </div>
    </div>
  );
}
