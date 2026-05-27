import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import API from '../../api/axios';
import '../RecruiterDashboard.css';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
const GRADIENT_COLORS = ['#7c3aed', '#a78bfa', '#60a5fa', '#34d399'];

export default function Overview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      API.get('/recruiter/dashboard/analytics'),
      API.get('/recruiter/candidates')
    ]).then(([anal, cand]) => {
      setAnalytics(anal.data);
      setCandidates(cand.data.candidates || []);
    }).catch((e) => {
      console.error(e);
      setError('Failed to load real-time recruiter analytics.');
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rp-loading">⟳ Running AI analysis & loading dashboard…</div>;

  const counts = analytics?.counts || { totalCandidates: 0, totalJobs: 0, totalApplications: 0, totalAssessments: 0 };
  const statCards = [
    { label: 'Total Candidates', value: counts.totalCandidates, icon: '👥', color: '#7c3aed' },
    { label: 'Active Job Openings', value: counts.totalJobs, icon: '💼', color: '#3b82f6' },
    { label: 'Assessment Banks', value: counts.totalAssessments, icon: '📝', color: '#10b981' },
    { label: 'Job Applications', value: counts.totalApplications, icon: '📋', color: '#f59e0b' },
  ];

  return (
    <div className="rp-page">
      <div className="rp-header">
        <div>
          <h1 className="rp-title">📊 Recruiter Analytics Overview</h1>
          <p className="rp-sub">Real-time candidate metrics, AI match rankings, and funnel trends.</p>
        </div>
      </div>

      {error && <div className="rp-alert-error">✕ {error}</div>}

      {/* Stat Cards Grid */}
      <div className="rp-grid-4" style={{ marginBottom: '1.5rem' }}>
        {statCards.map(s => (
          <div key={s.label} className="rp-stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span className="rp-stat-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts section 1: Funnel & Weekly Trends */}
      <div className="rp-grid-2" style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        
        {/* Weekly application line trend */}
        <div className="rp-card">
          <div className="rp-card-title">📈 Weekly Applications Pipeline Trend</div>
          {analytics?.trends?.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={analytics.trends} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.06)" />
                <XAxis dataKey="day" tick={{ fill: 'rgba(200,185,230,0.6)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'rgba(200,185,230,0.6)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, color: '#e8e3f8', fontSize: '0.8rem' }} />
                <Area type="monotone" dataKey="applications" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorApps)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="rp-empty">No application trends data.</div>
          )}
        </div>

        {/* Hiring Funnel Stage bar chart */}
        <div className="rp-card">
          <div className="rp-card-title">⏳ Recruitment Stage funnel</div>
          {analytics?.funnel?.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={analytics.funnel} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.06)" />
                <XAxis dataKey="stage" tick={{ fill: 'rgba(200,185,230,0.6)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'rgba(200,185,230,0.6)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, color: '#e8e3f8', fontSize: '0.8rem' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {analytics.funnel.map((entry, index) => {
                    const colors = ['#8b5cf6', '#10b981', '#ef4444'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="rp-empty">No funnel stage data.</div>
          )}
        </div>
      </div>

      {/* Charts section 2: Assessment average scores & score distributions */}
      <div className="rp-grid-2" style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        
        {/* Assessment Average Percentage scores */}
        <div className="rp-card">
          <div className="rp-card-title">📝 Average Percentage Score per Test</div>
          {analytics?.assessments?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.assessments} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.06)" />
                <XAxis dataKey="name" tick={{ fill: 'rgba(200,185,230,0.6)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'rgba(200,185,230,0.6)', fontSize: 10 }} unit="%" />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, color: '#e8e3f8', fontSize: '0.8rem' }} />
                <Bar dataKey="avgScore" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="rp-empty">No completed test attempts yet.</div>
          )}
        </div>

        {/* Score Distribution pie chart */}
        <div className="rp-card">
          <div className="rp-card-title">📊 Assessment Score Grades Distribution</div>
          {analytics?.distribution?.length > 0 && analytics.distribution[0].name !== 'No Data' ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={analytics.distribution} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  {analytics.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, color: '#e8e3f8', fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="rp-empty">No score grade distribution data yet.</div>
          )}
        </div>
      </div>

      {/* Recruiter Leaderboard and Candidate Listings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
        
        {/* Top 5 AI ranked leader board */}
        <div className="rp-card">
          <div className="rp-card-title">🏅 Top Candidates (AI Ranking Score)</div>
          {analytics?.topCandidates?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {analytics.topCandidates.map((c, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: 8, borderLeft: `3px solid ${GRADIENT_COLORS[index % GRADIENT_COLORS.length]}` }}>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--r-text)' }}>{index+1}. {c.name}</strong>
                    <div style={{ fontSize: '0.7rem', color: 'var(--r-muted)' }}>{c.college}</div>
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--r-accent-light)' }}>{c.score}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rp-empty" style={{ padding: '2rem' }}>No pre-calculated candidate rankings.</div>
          )}
        </div>

        {/* Candidate table view */}
        <div className="rp-card">
          <div className="rp-card-title" style={{ justifyContent: 'space-between' }}>
            <span>👥 Candidate Pool Activity</span>
            <button className="rp-btn rp-btn-outline" style={{ padding: '0.35rem 0.875rem', fontSize: '0.8rem' }} onClick={() => navigate('/dashboard/candidates')}>
              View All Pool
            </button>
          </div>
          <div className="rp-table-wrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>College Name</th>
                  <th>Branch / Course</th>
                  <th>Resume</th>
                  <th>Join Date</th>
                </tr>
              </thead>
              <tbody>
                {candidates.slice(0, 4).map(c => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/dashboard/candidates/${c.id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.75rem', color: 'white', flexShrink: 0,
                        }}>{(c.fullName || 'C')[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>{c.fullName}</div>
                          <div style={{ fontSize: '0.675rem', color: 'rgba(200,185,230,0.55)' }}>{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.825rem' }}>{c.college || '—'}</td>
                    <td style={{ fontSize: '0.825rem' }}>{c.branch || '—'}</td>
                    <td>
                      <span className={`rp-badge ${c.hasResume ? 'rp-badge-green' : 'rp-badge-red'}`} style={{ fontSize: '0.75rem', padding: '0.1rem 0.35rem' }}>
                        {c.hasResume ? '✓ Yes' : '✗ No'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'rgba(200,185,230,0.55)' }}>
                      {new Date(c.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
                {candidates.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--r-muted)', padding: '2rem' }}>
                      No registered candidates inside the pool.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
