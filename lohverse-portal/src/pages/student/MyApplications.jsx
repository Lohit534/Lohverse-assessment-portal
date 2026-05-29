import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import '../StudentDashboard.css';

const STATUS_MAP = {
  applied:     { label: 'Applied',     icon: '⏳', badge: 'sd-badge-blue',   desc: 'Your application is under review.' },
  shortlisted: { label: 'Shortlisted', icon: '✅', badge: 'sd-badge-green',  desc: 'Congratulations! You have been shortlisted.' },
  rejected:    { label: 'Not Selected',icon: '❌', badge: 'sd-badge-red',    desc: 'Unfortunately you were not selected for this role.' },
};

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  useEffect(() => {
    API.get('/student/applications')
      .then(r => setApplications(r.data.applications || []))
      .catch(() => setError('Failed to load your applications.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="sd-loading">⟳ Loading applications…</div>;

  const counts = {
    total:       applications.length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    rejected:    applications.filter(a => a.status === 'rejected').length,
    pending:     applications.filter(a => a.status === 'applied').length,
  };

  return (
    <div className="sd-page">
      <div className="sd-page-header">
        <h1 className="sd-page-title">📋 My Applications</h1>
        <p className="sd-page-sub">Track the status of your job applications.</p>
      </div>

      {error && (
        <div className="sd-alert sd-alert-error" style={{ marginBottom: '1.25rem' }}>⚠️ {error}</div>
      )}

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'Total Applied',  value: counts.total,       color: '#a78bfa', bg: 'rgba(124,58,237,0.10)' },
          { label: 'Under Review',   value: counts.pending,     color: '#60a5fa', bg: 'rgba(59,130,246,0.10)'  },
          { label: 'Shortlisted',    value: counts.shortlisted, color: '#34d399', bg: 'rgba(16,185,129,0.10)'  },
          { label: 'Not Selected',   value: counts.rejected,    color: '#f87171', bg: 'rgba(239,68,68,0.10)'   },
        ].map(s => (
          <div key={s.label} className="sd-card" style={{ textAlign: 'center', padding: '1.25rem 1rem', background: s.bg, border: `1px solid ${s.color}30` }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--sd-muted)', marginTop: '0.3rem', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Application Cards */}
      {applications.length === 0 ? (
        <div className="sd-card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--sd-muted)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📭</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.4rem' }}>No Applications Yet</div>
          <div style={{ fontSize: '0.875rem' }}>Head over to the Job Board to explore and apply for opportunities.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applications.map(app => {
            const st   = STATUS_MAP[app.status] || STATUS_MAP.applied;
            const job  = app.job || {};
            const date = app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

            return (
              <div key={app.id} className="sd-card" style={{ borderLeft: `3px solid ${st.badge === 'sd-badge-green' ? '#34d399' : st.badge === 'sd-badge-red' ? '#f87171' : '#60a5fa'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '2px' }}>
                      {job.title || 'Job Position'}
                    </div>
                    <div style={{ color: 'var(--sd-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                      🏢 {job.companyName || '—'}
                      {job.experience && <span style={{ marginLeft: '0.5rem' }}>· 💼 {job.experience}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {job.requiredSkills && job.requiredSkills.split(',').slice(0, 4).map((s, i) => (
                        <span key={i} className="sd-badge sd-badge-purple" style={{ fontSize: '0.68rem' }}>{s.trim()}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--sd-muted)', marginTop: '0.5rem' }}>
                      Applied on {date}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span className={`sd-badge ${st.badge}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.875rem', display: 'inline-block' }}>
                      {st.icon} {st.label}
                    </span>
                    <div style={{ fontSize: '0.72rem', color: 'var(--sd-muted)', marginTop: '0.4rem', maxWidth: 180, textAlign: 'right' }}>
                      {st.desc}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Note */}
      <div className="sd-card" style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>ℹ️</span>
        <div style={{ fontSize: '0.825rem', color: 'var(--sd-muted)', lineHeight: 1.6 }}>
          Application status is updated by the recruiter. You will see <strong style={{ color: '#34d399' }}>Shortlisted</strong> once a recruiter reviews and selects your profile based on company criteria.
          Your assessment scores are reviewed by recruiters as part of the evaluation process.
        </div>
      </div>
    </div>
  );
}
