import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, LineChart, Line, Area, AreaChart
} from 'recharts';
import API from '../../api/axios';
import '../StudentDashboard.css';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

function ScoreCircle({ pct, label, color }) {
  const r = 40, circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        <circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
        <text x={50} y={54} textAnchor="middle" fill="white" fontSize={18} fontWeight={800}>{pct}%</text>
      </svg>
      <span style={{ fontSize: '0.75rem', color: 'var(--sd-muted)', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

export default function Results() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [activeTab, setActiveTab] = useState('list'); // list | analytics

  useEffect(() => {
    API.get('/student/results')
      .then(r => setResults(r.data.results || []))
      .catch(e => setError(e.response?.data?.error || 'Failed to load results'))
      .finally(() => setLoading(false));
  }, []);

  const avgScore  = results.length ? Math.round(results.reduce((s, r) => s + (r.percentage || 0), 0) / results.length) : 0;
  const passed    = results.filter(r => r.passed).length;
  const bestRank  = results.length ? Math.min(...results.map(r => r.rank || 999)) : null;
  const avgMCQ    = results.length ? Math.round(results.reduce((s, r) => s + (r.mcqScore || 0), 0) / results.length) : 0;
  const avgCoding = results.length ? Math.round(results.reduce((s, r) => s + (r.codingScore || 0), 0) / results.length) : 0;

  // Bar chart data — last 10 results
  const barData = [...results].slice(-10).map((r, i) => ({
    name: `Test ${i + 1}`,
    score: r.percentage || 0,
    passing: r.assessment?.passingMarks ? Math.round((r.assessment.passingMarks / (r.assessment.totalMarks || 100)) * 100) : 40,
  }));

  // MCQ vs Coding breakdown (pie)
  const mcqTotal    = results.reduce((s, r) => s + (r.mcqScore    || 0), 0);
  const codingTotal = results.reduce((s, r) => s + (r.codingScore || 0), 0);
  const pieData = mcqTotal || codingTotal ? [
    { name: 'MCQ Score',    value: mcqTotal },
    { name: 'Coding Score', value: codingTotal },
  ] : [];

  // Grade distribution
  const gradeDist = { 'A (≥90%)': 0, 'B (75-89%)': 0, 'C (50-74%)': 0, 'F (<50%)': 0 };
  results.forEach(r => {
    const p = r.percentage || 0;
    if (p >= 90) gradeDist['A (≥90%)']++;
    else if (p >= 75) gradeDist['B (75-89%)']++;
    else if (p >= 50) gradeDist['C (50-74%)']++;
    else gradeDist['F (<50%)']++;
  });
  const gradeData = Object.entries(gradeDist).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

  if (loading) return <div className="sd-loading">⟳ Loading results…</div>;

  return (
    <div className="sd-page" style={{ maxWidth: 1050 }}>
      <div className="sd-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="sd-page-title">🏆 My Results</h1>
            <p className="sd-page-sub">Your assessment history, scores, ranks and performance analytics.</p>
          </div>
          {results.length > 0 && (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['list', 'analytics'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                  border: activeTab === tab ? '1px solid var(--sd-accent)' : '1px solid var(--sd-border)',
                  background: activeTab === tab ? 'rgba(124,58,237,0.2)' : 'transparent',
                  color: activeTab === tab ? 'var(--sd-accent-light)' : 'var(--sd-muted)',
                }}>
                  {tab === 'list' ? '📋 History' : '📊 Analytics'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <div className="sd-alert sd-alert-error">✕ {error}</div>}

      {/* Summary Stats */}
      {results.length > 0 && (
        <div className="sd-grid-3" style={{ marginBottom: '2rem' }}>
          {[
            { label: 'Tests Taken',  value: results.length,      icon: '📝', color: '#3b82f6' },
            { label: 'Passed',       value: passed,              icon: '✅', color: '#10b981' },
            { label: 'Failed',       value: results.length - passed, icon: '❌', color: '#ef4444' },
            { label: 'Avg Score',    value: `${avgScore}%`,      icon: '📊', color: '#a78bfa' },
            { label: 'Pass Rate',    value: `${results.length ? Math.round(passed/results.length*100) : 0}%`, icon: '🎯', color: '#f59e0b' },
            { label: 'Best Rank',    value: bestRank ? `#${bestRank}` : '—', icon: '🏅', color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="sd-card" style={{ textAlign: 'center', padding: '1.25rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.73rem', color: 'var(--sd-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !error && (
        <div className="sd-card" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--sd-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📋</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>No results yet.</div>
          <div style={{ fontSize: '0.85rem' }}>Complete an assessment to see your results here.</div>
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {activeTab === 'analytics' && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Score circles */}
          <div className="sd-card">
            <div className="sd-card-title">📈 Performance Breakdown</div>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1rem', padding: '0.5rem 0' }}>
              <ScoreCircle pct={avgScore}  label="Overall Avg"  color="#a78bfa" />
              <ScoreCircle pct={results.length ? Math.round(passed/results.length*100) : 0} label="Pass Rate" color="#10b981" />
              <ScoreCircle pct={Math.min(100, avgMCQ)} label="MCQ Avg" color="#3b82f6" />
              <ScoreCircle pct={Math.min(100, avgCoding)} label="Coding Avg" color="#f59e0b" />
            </div>
          </div>

          {/* Bar chart + Grade distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
            <div className="sd-card">
              <div className="sd-card-title">📊 Score Trend (Last 10 Tests)</div>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.07)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(200,185,230,0.55)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'rgba(200,185,230,0.55)', fontSize: 10 }} unit="%" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, color: '#e8e3f8', fontSize: '0.8rem' }}
                      formatter={(v, n) => [`${v}%`, n === 'score' ? 'Your Score' : 'Pass Mark']}
                    />
                    <Bar dataKey="score"   fill="#7c3aed" radius={[6, 6, 0, 0]} name="score" />
                    <Bar dataKey="passing" fill="rgba(245,158,11,0.3)" radius={[6, 6, 0, 0]} name="passing" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--sd-muted)' }}>No chart data yet.</div>
              )}
            </div>

            <div className="sd-card">
              <div className="sd-card-title">🎓 Grade Distribution</div>
              {gradeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={gradeData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                      paddingAngle={3} dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {gradeData.map((entry, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, color: '#e8e3f8', fontSize: '0.75rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--sd-muted)' }}>No data yet.</div>
              )}
              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                {gradeData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--sd-muted)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i], flexShrink: 0 }} />
                    {d.name}: {d.value} test{d.value !== 1 ? 's' : ''}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MCQ vs Coding pie */}
          {pieData.length > 0 && (
            <div className="sd-card">
              <div className="sd-card-title">🔀 MCQ vs Coding Score Split</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                <ResponsiveContainer width={220} height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, i) => <Cell key={i} fill={i === 0 ? '#3b82f6' : '#10b981'} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, color: '#e8e3f8', fontSize: '0.75rem' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: '#3b82f6', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--sd-text)' }}>MCQ Total: {mcqTotal} pts</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--sd-muted)' }}>Avg per test: {avgMCQ} pts</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--sd-text)' }}>Coding Total: {codingTotal} pts</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--sd-muted)' }}>Avg per test: {avgCoding} pts</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LIST TAB ── */}
      {activeTab === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {results.map(r => (
            <div key={r.id} className="sd-card" style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Accent strip */}
              <div style={{
                position: 'absolute', top: 0, left: 0, width: 4, height: '100%',
                background: r.passed ? '#10b981' : '#ef4444',
              }} />
              <div style={{ paddingLeft: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--sd-text)', marginBottom: 4 }}>
                      {r.assessment?.title || 'Assessment'}
                    </div>
                    {r.assessment?.job && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--sd-muted)', marginBottom: 6 }}>
                        💼 {r.assessment.job.title} @ {r.assessment.job.companyName}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span className={`sd-badge ${r.passed ? 'sd-badge-green' : 'sd-badge-red'}`}>
                        {r.passed ? '✓ PASSED' : '✗ FAILED'}
                      </span>
                      <span className="sd-badge sd-badge-purple">🏅 Rank #{r.rank || '—'}</span>
                      <span className="sd-badge sd-badge-blue">📊 {r.percentage}%</span>
                      {r.mcqScore != null    && <span className="sd-badge sd-badge-blue">📝 MCQ: {r.mcqScore}</span>}
                      {r.codingScore != null && <span className="sd-badge sd-badge-green">💻 Code: {r.codingScore}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: r.passed ? '#34d399' : '#f87171' }}>
                      {r.score}/{r.assessment?.totalMarks || '—'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--sd-muted)' }}>Total Score</div>
                  </div>
                </div>

                {/* Score progress */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      width: `${Math.min(100, r.percentage || 0)}%`,
                      background: r.passed ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#ef4444,#f87171)',
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34d399', fontSize: '0.82rem' }}>
                    ✅ {r.correctCount} correct
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f87171', fontSize: '0.82rem' }}>
                    ❌ {r.wrongCount} wrong
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--sd-muted)', marginLeft: 'auto' }}>
                    {r.completedAt ? new Date(r.completedAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : '—'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
