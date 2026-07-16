import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import '../RecruiterDashboard.css';

/* ─── helpers ─────────────────────────────────────────────── */
function parseCsvText(text) {
  // Accept CSV or plain line-separated emails
  const lines = text.split(/[\r\n,;]+/).map(l => l.trim()).filter(Boolean);
  // Filter only email-like strings
  return lines.filter(l => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(l));
}

function ScoreBadge({ value, total }) {
  if (value == null) return <span style={{ color: 'var(--r-muted)', fontSize: '0.78rem' }}>—</span>;
  const pct = total ? Math.round((value / total) * 100) : 0;
  const color = pct >= 70 ? '#34d399' : pct >= 40 ? '#fbbf24' : '#f87171';
  return (
    <span style={{ fontWeight: 700, color, fontSize: '0.85rem' }}>
      {value}/{total} ({pct}%)
    </span>
  );
}

// ── Animated circular progress score ──────────────────────────────────────
function CircleScore({ value, max = 100, label, color, size = 95 }) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.round((value / max) * 100));
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
        <text x={size/2} y={size/2 + 4} textAnchor="middle" fill="white" fontSize={14} fontWeight={900}>{pct}%</text>
      </svg>
      <span style={{ fontSize: '0.68rem', color: 'var(--r-muted)', fontWeight: 600, textAlign: 'center', maxWidth: size }}>{label}</span>
    </div>
  );
}

// ── Skill pill ──────────────────────────────────────────────────────
function SkillPill({ skill, matched }) {
  return (
    <span style={{
      padding: '0.25rem 0.6rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600,
      background: matched ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
      color:      matched ? '#34d399'              : '#f87171',
      border:     matched ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.25)',
      display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
    }}>
      {matched ? '✓' : '✗'} {skill}
    </span>
  );
}

/* ─── main component ──────────────────────────────────────── */
export default function JobApplicants() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search / filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Bulk import modal
  const [showImport, setShowImport] = useState(false);
  const [importEmails, setImportEmails] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef(null);

  // Schedule interview modal (per candidate)
  const [schedModal, setSchedModal] = useState(null); // {candidateId, candidateName}
  const [schedForm, setSchedForm] = useState({ scheduledDate: '', scheduledTime: '' });
  const [scheduling, setScheduling] = useState(false);

  // Status update loading
  const [updatingId, setUpdatingId] = useState(null);

  // Resume and AI Match modal states
  const [resumeModalCandidate, setResumeModalCandidate] = useState(null);
  const [resumeModalRanking, setResumeModalRanking] = useState(null);
  const [loadingRanking, setLoadingRanking] = useState(false);

  const handleOpenResume = async (student) => {
    setResumeModalCandidate(student);
    setLoadingRanking(true);
    setResumeModalRanking(null);
    try {
      const res = await API.get(`/recruiter/jobs/${jobId}/rankings`);
      const rank = (res.data.rankings || []).find(r => r.student?.id === student.id);
      setResumeModalRanking(rank || null);
    } catch (e) {
      console.error('Failed to load AI ranking details', e);
    } finally {
      setLoadingRanking(false);
    }
  };

  /* ── load data ── */
  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/jobs/${jobId}/applicants-detailed`);
      setJob(res.data.job);
      setApplicants(res.data.applicants || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [jobId]);

  /* ── filtering ── */
  const filtered = applicants.filter(a => {
    const s = a.student || {};
    const q = search.toLowerCase();
    const matchQ = !search ||
      s.fullName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.college?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchQ && matchStatus;
  });

  /* ── status update ── */
  const handleStatusChange = async (studentId, status) => {
    setUpdatingId(studentId);
    try {
      await API.put(`/jobs/${jobId}/applicants/${studentId}`, { status });
      setApplicants(prev => prev.map(a =>
        a.studentId === studentId ? { ...a, status } : a
      ));
      setSuccess(`Candidate ${status}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.error || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  /* ── bulk import: file handler ── */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const emails = parseCsvText(text);
      setImportEmails(emails.join('\n'));
    };
    reader.readAsText(file);
  };

  /* ── bulk import: submit ── */
  const handleImport = async () => {
    const emails = importEmails.split(/[\r\n,;]+/).map(e => e.trim()).filter(Boolean);
    if (emails.length === 0) {
      setError('Please enter at least one valid email address.');
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const res = await API.post(`/jobs/${jobId}/bulk-import`, { emails });
      setImportResult(res.data);
      setSuccess(res.data.message);
      load(); // refresh list
    } catch (e) {
      setError(e.response?.data?.error || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  /* ── schedule video interview ── */
  const handleScheduleInterview = async () => {
    if (!schedForm.scheduledDate || !schedForm.scheduledTime) {
      setError('Please fill in both date and time.');
      return;
    }
    setScheduling(true);
    try {
      await API.post('/recruiter/interviews', {
        candidateId: schedModal.candidateId,
        scheduledDate: schedForm.scheduledDate,
        scheduledTime: schedForm.scheduledTime,
      });
      setSuccess(`Video interview scheduled for ${schedModal.candidateName}`);
      setSchedModal(null);
      setSchedForm({ scheduledDate: '', scheduledTime: '' });
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(e.response?.data?.error || 'Scheduling failed');
    } finally {
      setScheduling(false);
    }
  };

  /* ── CSV export ── */
  const exportCSV = () => {
    const rows = [
      ['Student Name', 'Email ID', 'College Name', 'Branch', 'Status'],
      ...filtered.map(a => {
        const s = a.student || {};
        return [
          s.fullName || '',
          s.email || '',
          s.college || '',
          s.branch || '',
          a.status === 'shortlisted' ? 'Selected' : a.status === 'rejected' ? 'Not Selected' : 'Under Review',
        ];
      }),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Lohverse_Applicants_${job?.title || jobId}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  /* ── render ── */
  if (loading) return <div className="rp-loading">⟳ Loading applicants for this job…</div>;

  return (
    <div className="rp-page">
      {/* Header */}
      <div className="rp-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="rp-title">👥 Job Applicants</h1>
          <p className="rp-sub">
            {job?.title && <strong style={{ color: 'var(--r-accent-light)' }}>{job.title}</strong>}
            {job?.companyName && <span style={{ color: 'var(--r-muted)' }}> · {job.companyName}</span>}
            &nbsp;— {filtered.length} of {applicants.length} candidate{applicants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="rp-btn rp-btn-outline" onClick={() => navigate(-1)}>← Back</button>
          <button className="rp-btn rp-btn-outline" onClick={exportCSV}>📥 Export CSV</button>
          <button className="rp-btn rp-btn-primary" onClick={() => { setShowImport(true); setImportResult(null); }}>
            📂 Import Candidates
          </button>
        </div>
      </div>

      {error && <div className="rp-alert-error" onClick={() => setError('')}>✕ {error}</div>}
      {success && <div className="rp-alert-success">✓ {success}</div>}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search by name, email, college…"
          style={{ flex: 2, minWidth: 200, padding: '0.55rem 0.85rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--r-border)', borderRadius: 8, color: 'var(--r-text)', fontSize: '0.875rem' }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            flex: 1,
            minWidth: 150,
            padding: '0.55rem 0.85rem',
            background: '#12112a',
            border: '1px solid rgba(124,58,237,0.35)',
            borderRadius: 8,
            color: 'var(--r-text)',
            fontWeight: 600,
            fontSize: '0.875rem',
            colorScheme: 'dark'
          }}
        >
          <option value="all" style={{ background: '#12112a', color: 'var(--r-text)' }}>All Statuses</option>
          <option value="applied" style={{ background: '#12112a', color: 'var(--r-text)' }}>Applied</option>
          <option value="shortlisted" style={{ background: '#12112a', color: 'var(--r-text)' }}>Shortlisted</option>
          <option value="rejected" style={{ background: '#12112a', color: 'var(--r-text)' }}>Rejected</option>
        </select>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Applied', value: applicants.length, color: '#a78bfa' },
          { label: 'Shortlisted', value: applicants.filter(a => a.status === 'shortlisted').length, color: '#34d399' },
          { label: 'Rejected', value: applicants.filter(a => a.status === 'rejected').length, color: '#f87171' },
          { label: 'Assessment Passed', value: applicants.filter(a => a.assessmentPassed).length, color: '#fbbf24' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rp-card" style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color }}>{value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--r-muted)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Applicant table */}
      {filtered.length === 0 ? (
        <div className="rp-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--r-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👤</div>
          <div style={{ fontWeight: 700 }}>
            {applicants.length === 0
              ? 'No candidates yet — use "Import Candidates" to add them'
              : 'No candidates match your filters'}
          </div>
        </div>
      ) : (
        <div className="rp-card" style={{ padding: 0 }}>
          <div className="rp-table-wrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>College / Branch</th>
                  <th style={{ textAlign: 'center' }}>Assessment</th>
                  <th style={{ textAlign: 'center' }}>Score</th>
                  <th style={{ textAlign: 'center' }}>Passed?</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(app => {
                  const s = app.student || {};
                  const asmt = (app.assessments || [])[0] || {};
                  const st_db = app.status || 'applied';
                  const st = (asmt.attemptStatus === 'completed' && asmt.passed === false) ? 'rejected' : st_db;
                  const statusColor = st === 'shortlisted' ? '#34d399' : st === 'rejected' ? '#f87171' : '#a78bfa';
                  const statusBg = st === 'shortlisted' ? 'rgba(16,185,129,0.12)' : st === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(124,58,237,0.12)';

                  return (
                    <tr key={app.id}>
                      {/* Candidate */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.8rem', color: 'white', flexShrink: 0,
                          }}>{(s.fullName || 'C')[0]}</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.fullName || '—'}</div>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(200,185,230,0.5)' }}>{s.email}</div>
                          </div>
                        </div>
                      </td>
                      {/* College */}
                      <td style={{ fontSize: '0.82rem', color: 'var(--r-muted)' }}>
                        {s.college || '—'}<br /><span style={{ fontSize: '0.72rem' }}>{s.branch || ''}</span>
                      </td>
                      {/* Assessment title */}
                      <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>
                        {asmt.assessmentTitle
                          ? <span style={{ color: 'var(--r-accent-light)' }}>{asmt.assessmentTitle}</span>
                          : <span style={{ color: 'var(--r-muted)' }}>Not linked</span>}
                        {asmt.attemptStatus && asmt.attemptStatus !== 'not_started' && (
                          <div style={{ fontSize: '0.68rem', marginTop: 2, color: asmt.attemptStatus === 'completed' ? '#34d399' : '#fbbf24' }}>
                            {asmt.attemptStatus === 'completed' ? '✓ Completed' : '⏳ In Progress'}
                          </div>
                        )}
                      </td>
                      {/* Score */}
                      <td style={{ textAlign: 'center' }}>
                        <ScoreBadge value={asmt.score} total={asmt.totalMarks} />
                      </td>
                      {/* Passed */}
                      <td style={{ textAlign: 'center' }}>
                        {asmt.passed == null
                          ? <span style={{ color: 'var(--r-muted)', fontSize: '0.78rem' }}>—</span>
                          : asmt.passed
                            ? <span className="rp-badge rp-badge-green">✓ Pass</span>
                            : <span className="rp-badge rp-badge-red">✗ Fail</span>}
                      </td>
                      {/* Status badge */}
                      <td>
                        <span style={{
                          padding: '0.2rem 0.65rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                          background: statusBg, color: statusColor, border: `1px solid ${statusColor}40`,
                          textTransform: 'capitalize',
                        }}>{st}</span>
                      </td>
                      {/* Actions — conditional on status */}
                      <td>
                        {st === 'rejected' ? (
                          /* Rejected: no actions */
                          <span style={{ fontSize: '0.72rem', color: 'var(--r-muted)', fontStyle: 'italic' }}>—</span>
                        ) : st === 'shortlisted' ? (
                          /* Shortlisted: Assessment info + Interview + Profile */
                          <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                padding: '0.22rem 0.55rem', fontSize: '0.7rem', borderRadius: 6, fontWeight: 600,
                                background: asmt.assessmentTitle ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)',
                                color: asmt.assessmentTitle ? '#fbbf24' : 'var(--r-muted)',
                                border: `1px solid ${asmt.assessmentTitle ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.08)'}`,
                              }}
                              title="Assessment linked to this job"
                            >
                              📋 {asmt.assessmentTitle
                                ? (asmt.passed ? '✓ Passed' : asmt.attemptStatus === 'completed' ? '✗ Failed' : 'Pending')
                                : 'No Assessment'}
                            </span>
                            <button
                              className="rp-btn rp-btn-outline"
                              onClick={() => { setSchedModal({ candidateId: s.id, candidateName: s.fullName }); }}
                              style={{ padding: '0.22rem 0.5rem', fontSize: '0.7rem' }}
                              title="Schedule a video interview"
                            >📹 Interview</button>
                            <button
                              className="rp-btn rp-btn-outline"
                              onClick={() => navigate(`/dashboard/candidates/${s.id}`)}
                              style={{ padding: '0.22rem 0.5rem', fontSize: '0.7rem' }}
                            >👤 Profile</button>
                          </div>
                        ) : (
                          /* Applied (under review): Shortlist + Reject + Resume + Profile */
                          <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              className="rp-btn"
                              disabled={updatingId === s.id}
                              onClick={() => handleStatusChange(s.id, 'shortlisted')}
                              style={{ padding: '0.22rem 0.5rem', fontSize: '0.7rem', background: 'rgba(16,185,129,0.13)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}
                            >✓ Shortlist</button>
                            <button
                              className="rp-btn"
                              disabled={updatingId === s.id}
                              onClick={() => handleStatusChange(s.id, 'rejected')}
                              style={{ padding: '0.22rem 0.5rem', fontSize: '0.7rem', background: 'rgba(239,68,68,0.13)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                            >✕ Reject</button>
                            {s.resumeFilename && (
                              <button
                                className="rp-btn"
                                onClick={() => handleOpenResume(s)}
                                style={{ padding: '0.22rem 0.5rem', fontSize: '0.7rem', background: 'rgba(124,58,237,0.13)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}
                                title="View resume and AI Match score before shortlisting"
                              >📄 Resume</button>
                            )}
                            <button
                              className="rp-btn rp-btn-outline"
                              onClick={() => navigate(`/dashboard/candidates/${s.id}`)}
                              style={{ padding: '0.22rem 0.5rem', fontSize: '0.7rem' }}
                            >👤 Profile</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Bulk Import Modal ─────────────────────────────────── */}
      {showImport && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
        }}>
          <div className="rp-card" style={{ maxWidth: 540, width: '100%', background: '#12112a', border: '1px solid var(--r-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="rp-card-title" style={{ margin: 0 }}>📂 Import Candidates</h2>
              <button className="rp-btn rp-btn-outline" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} onClick={() => setShowImport(false)}>✕</button>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--r-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Upload a <strong style={{ color: '#a78bfa' }}>CSV / Excel file</strong> with one email per row, or paste emails
              directly below (comma, semicolon, or line-separated). Only registered students are imported;
              unregistered emails are listed as "Not Found".
            </div>

            {/* File upload */}
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: '2px dashed rgba(124,58,237,0.4)', borderRadius: 10,
                padding: '1.25rem', textAlign: 'center', cursor: 'pointer',
                background: 'rgba(124,58,237,0.06)', marginBottom: '0.75rem',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.8)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>📄</div>
              <div style={{ fontWeight: 600, color: 'var(--r-accent-light)' }}>Click to upload CSV / Excel</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--r-muted)', marginTop: 4 }}>.csv, .xlsx, .xls or plain text file</div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls,.txt"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </div>

            <div style={{ textAlign: 'center', color: 'var(--r-muted)', fontSize: '0.78rem', marginBottom: '0.6rem' }}>— or paste emails directly —</div>

            <textarea
              value={importEmails}
              onChange={e => setImportEmails(e.target.value)}
              rows={6}
              placeholder={`student1@email.com\nstudent2@email.com\nstudent3@email.com`}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '0.65rem', background: '#09090e',
                border: '1px solid var(--r-border)', borderRadius: 8,
                color: 'var(--r-text)', fontSize: '0.82rem', resize: 'vertical',
                fontFamily: 'monospace',
              }}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--r-muted)', marginTop: '0.35rem' }}>
              {importEmails.split(/[\r\n,;]+/).filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())).length} valid email(s) detected
            </div>

            {/* Import result summary */}
            {importResult && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(16,185,129,0.06)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 700, color: '#34d399', marginBottom: '0.35rem' }}>✓ Import Complete</div>
                <div>✅ Imported: <strong>{importResult.imported?.length || 0}</strong></div>
                <div>⏭ Already Applied (skipped): <strong>{importResult.skipped?.length || 0}</strong></div>
                {importResult.notFound?.length > 0 && (
                  <div style={{ color: '#f87171' }}>
                    ⚠️ Not registered ({importResult.notFound.length}): {importResult.notFound.slice(0, 3).join(', ')}{importResult.notFound.length > 3 ? '…' : ''}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                className="rp-btn rp-btn-primary"
                style={{ flex: 1, padding: '0.65rem' }}
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? '⟳ Importing…' : '📥 Import Candidates'}
              </button>
              <button
                className="rp-btn rp-btn-outline"
                style={{ flex: 1, padding: '0.65rem' }}
                onClick={() => setShowImport(false)}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Schedule Interview Modal ───────────────────────────── */}
      {schedModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
        }}>
          <div className="rp-card" style={{ maxWidth: 420, width: '100%', background: '#12112a', border: '1px solid var(--r-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="rp-card-title" style={{ margin: 0 }}>📹 Schedule Interview</h2>
              <button className="rp-btn rp-btn-outline" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} onClick={() => setSchedModal(null)}>✕</button>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--r-muted)', marginBottom: '1rem' }}>
              Scheduling a live video interview for <strong style={{ color: 'white' }}>{schedModal.candidateName}</strong>.
              A Jitsi meeting link will be auto-generated and the candidate will be notified.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="rp-field">
                <label>Interview Date *</label>
                <input
                  type="date"
                  value={schedForm.scheduledDate}
                  onChange={e => setSchedForm(p => ({ ...p, scheduledDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="rp-field">
                <label>Interview Time *</label>
                <input
                  type="time"
                  value={schedForm.scheduledTime}
                  onChange={e => setSchedForm(p => ({ ...p, scheduledTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button
                className="rp-btn rp-btn-primary"
                style={{ flex: 1, padding: '0.65rem' }}
                onClick={handleScheduleInterview}
                disabled={scheduling}
              >
                {scheduling ? '⟳ Scheduling…' : '📅 Confirm Schedule'}
              </button>
              <button
                className="rp-btn rp-btn-outline"
                style={{ flex: 1, padding: '0.65rem' }}
                onClick={() => setSchedModal(null)}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RESUME & AI MATCH MODAL ─── */}
      {resumeModalCandidate && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1050,
          background: 'rgba(13,13,26,0.85)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', backdropFilter: 'blur(5px)', padding: '2rem'
        }}>
          <div style={{
            width: '100%', maxWidth: '1280px', height: '90vh',
            background: '#12112a', border: '1px solid var(--r-border)',
            borderRadius: '16px', display: 'grid', gridTemplateColumns: '1fr 420px',
            overflow: 'hidden', boxShadow: '0 15px 35px rgba(0,0,0,0.6)'
          }}>
            {/* LEFT: Resume Document Viewer */}
            <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--r-border)', background: '#0d0d1a' }}>
              <div style={{
                padding: '1rem 1.5rem', background: '#12112a', borderBottom: '1px solid var(--r-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--r-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Candidate Resume</span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', marginTop: 2 }}>{resumeModalCandidate.fullName}</h3>
                  </div>
                  <a
                    href={`${import.meta.env.VITE_API_BASE_URL || 'https://lohverse-assessment-portal.onrender.com/api'}/student/resume/view?userId=${resumeModalCandidate.id}&jwt=${localStorage.getItem('recruiter_accessToken')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rp-btn"
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      background: 'rgba(124,58,237,0.1)',
                      color: 'var(--r-accent-light)',
                      border: '1px solid rgba(124,58,237,0.3)',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    Open Original ↗
                  </a>
                </div>
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <iframe
                  src={`${import.meta.env.VITE_API_BASE_URL || 'https://lohverse-assessment-portal.onrender.com/api'}/student/resume/view?userId=${resumeModalCandidate.id}&jwt=${localStorage.getItem('recruiter_accessToken')}`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="Candidate Resume"
                />
              </div>
            </div>

            {/* RIGHT: AI Match & Skill Gap Scorecard */}
            <div style={{ display: 'flex', flexDirection: 'column', background: '#12112a', height: '100%', overflowY: 'auto' }}>
              <div style={{
                padding: '1rem 1.5rem', borderBottom: '1px solid var(--r-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(124,58,237,0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🤖</span>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--r-accent-light)' }}>AI Match Analysis</span>
                </div>
                <button
                  onClick={() => setResumeModalCandidate(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--r-muted)', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >×</button>
              </div>

              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {loadingRanking ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--r-accent-light)', gap: '0.75rem', padding: '3rem 0' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#7c3aed', borderRightColor: '#a78bfa', animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Analyzing resume & matching skills…</span>
                  </div>
                ) : resumeModalRanking ? (
                  <>
                    {/* Circular gauges row */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--r-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                        <CircleScore value={resumeModalRanking.overallScore} label="Overall Match" color="#a78bfa" size={90} />
                        <CircleScore value={resumeModalRanking.resumeMatchPct} label="Resume Text" color="#3b82f6" size={80} />
                        <CircleScore value={resumeModalRanking.skillMatchPct} label="Skill coverage" color="#f59e0b" size={80} />
                      </div>
                      <div style={{ height: 1, background: 'var(--r-border)' }} />
                      <div style={{ fontSize: '0.7rem', color: 'var(--r-muted)', textAlign: 'center', lineHeight: 1.4 }}>
                        Resume similarity uses TF-IDF matching. Core technical keywords boost candidate scores.
                      </div>
                    </div>

                    {/* Skill gap detailed lists */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--r-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Skills Match & Gap Analysis
                      </div>

                      {resumeModalRanking.skillsGap?.matchedSkills?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', marginBottom: '0.35rem' }}>
                            ✓ Matched Skills ({resumeModalRanking.skillsGap.matchedSkills.length})
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {resumeModalRanking.skillsGap.matchedSkills.map(s => <SkillPill key={s} skill={s} matched={true} />)}
                          </div>
                        </div>
                      )}

                      {resumeModalRanking.skillsGap?.missingSkills?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f87171', marginBottom: '0.35rem' }}>
                            ✗ Missing Skills ({resumeModalRanking.skillsGap.missingSkills.length})
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {resumeModalRanking.skillsGap.missingSkills.map(s => <SkillPill key={s} skill={s} matched={false} />)}
                          </div>
                        </div>
                      )}

                      {(!resumeModalRanking.skillsGap?.matchedSkills?.length && !resumeModalRanking.skillsGap?.missingSkills?.length) && (
                        <div style={{ color: 'var(--r-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                          No specific skill matches detected. Check candidate profile or job requirements.
                        </div>
                      )}
                    </div>

                    {/* Action and status updates inside the modal */}
                    <div style={{ marginTop: 'auto', borderTop: '1px solid var(--r-border)', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <button
                          disabled={updatingId === resumeModalCandidate.id}
                          onClick={async () => {
                            await handleStatusChange(resumeModalCandidate.id, 'shortlisted');
                            setResumeModalCandidate(null);
                          }}
                          style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', background: 'rgba(16,185,129,0.13)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                        >✓ Shortlist</button>
                        <button
                          disabled={updatingId === resumeModalCandidate.id}
                          onClick={async () => {
                            await handleStatusChange(resumeModalCandidate.id, 'rejected');
                            setResumeModalCandidate(null);
                          }}
                          style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', background: 'rgba(239,68,68,0.13)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                        >✗ Reject</button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ color: 'var(--r-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem 0' }}>
                    No AI scoring details found for this candidate against this job.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
