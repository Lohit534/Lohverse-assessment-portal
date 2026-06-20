import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import '../StudentDashboard.css';

const TYPE_META = {
  mcq:      { icon: '📝', label: 'MCQ',      color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  coding:   { icon: '💻', label: 'Coding',   color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  combined: { icon: '🔀', label: 'Combined', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
};

function AssessmentCard({ a, onStart }) {
  const type = TYPE_META[a.assessmentType] || TYPE_META.mcq;
  const passed = a.attempted && a.attemptScore >= a.passingMarks;

  return (
    <div className="sd-card ta-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden' }}>
      {/* Top stripe accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${type.color}, transparent)` }} />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            background: type.bg, border: `1px solid ${type.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
          }}>
            {type.icon}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--sd-text)', marginBottom: 4 }}>{a.title}</div>
            {a.description && (
              <div style={{ fontSize: '0.78rem', color: 'var(--sd-muted)', lineHeight: 1.4, maxWidth: 420 }}>
                {a.description.length > 90 ? a.description.slice(0, 90) + '…' : a.description}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
          <span style={{
            padding: '0.25rem 0.75rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
            background: type.bg, color: type.color, border: `1px solid ${type.color}30`,
          }}>
            {type.icon} {type.label}
          </span>
          {a.attempted && (
            <span className="sd-badge sd-badge-green">
              ✓ Completed
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="sd-badge sd-badge-purple">⏱ {a.durationMins} mins</span>
        {a.mcqCount > 0   && <span className="sd-badge sd-badge-blue">📝 {a.mcqCount} MCQ</span>}
        {a.codingCount > 0 && <span className="sd-badge sd-badge-green">💻 {a.codingCount} Coding</span>}
        {a.isExpired && <span className="sd-badge sd-badge-red" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>⚠️ Expired</span>}
      </div>

      {/* Action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {a.attempted ? (
          <button className="sd-btn sd-btn-outline" disabled style={{ opacity: 0.55, fontSize: '0.85rem', padding: '0.55rem 1.2rem' }}>
            ✓ Completed
          </button>
        ) : a.isExpired ? (
          <button className="sd-btn sd-btn-outline" disabled style={{ opacity: 0.65, fontSize: '0.85rem', padding: '0.55rem 1.2rem', borderColor: 'var(--sd-danger)', color: '#f87171', cursor: 'not-allowed' }}>
            ⏱ Expired (Closed)
          </button>
        ) : a.questionCount === 0 ? (
          <button className="sd-btn sd-btn-outline" disabled style={{ opacity: 0.65, fontSize: '0.85rem', padding: '0.55rem 1.2rem', borderColor: 'var(--sd-danger)', color: 'var(--sd-danger)', cursor: 'not-allowed' }}>
            ⚠️ Empty Assessment
          </button>
        ) : (
          <button
            className="sd-btn sd-btn-primary"
            onClick={() => onStart(a.id)}
            style={{ fontSize: '0.875rem', padding: '0.6rem 1.5rem', background: `linear-gradient(135deg, ${type.color}, ${type.color}cc)` }}
          >
            🚀 Start Test
          </button>
        )}
      </div>
    </div>
  );
}

export default function Assessments() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | mcq | coding | combined | completed | pending

  useEffect(() => {
    API.get('/assessments/')
      .then(r => setAssessments(r.data.assessments || []))
      .catch(e => setError(e.response?.data?.error || 'Failed to load assessments'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = assessments.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ? true :
      filter === 'completed' ? a.attempted :
      filter === 'pending' ? !a.attempted :
      a.assessmentType === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: assessments.length,
    mcq: assessments.filter(a => a.assessmentType === 'mcq').length,
    coding: assessments.filter(a => a.assessmentType === 'coding').length,
    combined: assessments.filter(a => a.assessmentType === 'combined').length,
    completed: assessments.filter(a => a.attempted).length,
    pending: assessments.filter(a => !a.attempted).length,
  };

  if (loading) return <div className="sd-loading">⟳ Loading assessments…</div>;

  return (
    <div className="sd-page" style={{ maxWidth: 900 }}>
      <div className="sd-page-header">
        <h1 className="sd-page-title">📝 Assessments</h1>
        <p className="sd-page-sub">Take your MCQ and coding challenges — HackerRank-style.</p>
      </div>

      {error && <div className="sd-alert sd-alert-error">✕ {error}</div>}

      {/* Search + Filter Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <span style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--sd-muted)', fontSize: '0.9rem' }}>🔍</span>
          <input
            type="text"
            placeholder="Search exams..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '0.65rem 0.875rem 0.65rem 2.2rem',
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--sd-border)',
              borderRadius: 10, color: 'var(--sd-text)', fontSize: '0.875rem', outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { key: 'all',      label: `All (${counts.all})` },
            { key: 'pending',  label: `Pending (${counts.pending})` },
            { key: 'completed', label: `Done (${counts.completed})` },
            { key: 'mcq',     label: `📝 MCQ (${counts.mcq})` },
            { key: 'coding',  label: `💻 Coding (${counts.coding})` },
            { key: 'combined',label: `🔀 Mixed (${counts.combined})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '0.4rem 0.8rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                border: filter === f.key ? '1px solid var(--sd-accent)' : '1px solid var(--sd-border)',
                background: filter === f.key ? 'rgba(124,58,237,0.2)' : 'transparent',
                color: filter === f.key ? 'var(--sd-accent-light)' : 'var(--sd-muted)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="sd-card" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--sd-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📋</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>No assessments found.</div>
          <div style={{ fontSize: '0.85rem' }}>
            {filter !== 'all' ? 'Try changing the filter.' : 'Check back later or apply for jobs to unlock assessments.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(a => (
            <AssessmentCard
              key={a.id}
              a={a}
              onStart={id => navigate(`/dashboard/assessment/${id}`)}
            />
          ))}
        </div>
      )}

      {/* Instructions tip */}
      <div className="sd-card" style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--sd-border)' }}>
        <div className="sd-card-title" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--sd-text)' }}>Important Instructions</div>
        <ul style={{ color: 'var(--sd-muted)', fontSize: '0.85rem', lineHeight: 1.8, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: 0 }}>
          <li>Ensure you have a stable internet connection before starting</li>
          <li>All tests require fullscreen mode and prohibit tab switching</li>
          <li>Three warnings for tab switching will result in automatic submission</li>
          <li>Your progress is automatically saved - you can resume tests if interrupted</li>
        </ul>
      </div>
    </div>
  );
}
