import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import '../RecruiterDashboard.css';

export default function CandidateDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [results, setResults]     = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [updatingApp, setUpdatingApp] = useState(null);

  useEffect(() => {
    API.get(`/recruiter/candidates/${id}`)
      .then(r => {
        setCandidate(r.data.candidate);
        setResults(r.data.candidate.assessments || []);
      })
      .catch(() => setError('Failed to load candidate'))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (jobId, appId, status) => {
    setUpdatingApp(appId);
    try {
      await API.put(`/jobs/${jobId}/applicants/${id}`, { status });
      setSuccess(`Candidate ${status}`);
      // Refresh candidate data
      const r = await API.get(`/recruiter/candidates/${id}`);
      setCandidate(r.data.candidate);
    } catch (e) {
      setError(e.response?.data?.error || 'Update failed');
    } finally {
      setUpdatingApp(null);
    }
  };

  const downloadResume = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBase}/student/resume?userId=${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('recruiter_accessToken')}` }
      });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `${candidate?.fullName}_Resume.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { setError('Resume download failed'); }
  };

  if (loading) return <div className="rp-loading">⟳ Loading…</div>;
  if (!candidate) return <div className="rp-page"><div className="rp-alert-error">✕ {error || 'Candidate not found'}</div></div>;

  const skills = (candidate.skills || '').split(',').map(s => s.trim()).filter(Boolean);
  const certs  = (candidate.certifications || '').split(',').map(s => s.trim()).filter(Boolean);
  let projects = [];
  try { projects = JSON.parse(candidate.projects || '[]'); } catch {}

  const initials = (candidate.fullName || 'C').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="rp-page">
      <div className="rp-header">
        <div>
          <h1 className="rp-title">👤 Candidate Profile</h1>
          <p className="rp-sub">{candidate.fullName}</p>
        </div>
        <button className="rp-btn rp-btn-outline" onClick={() => navigate('/dashboard/candidates')}>← Back</button>
      </div>

      {error   && <div className="rp-alert-error">✕ {error}</div>}
      {success && <div className="rp-alert-success">✓ {success}</div>}

      {/* Profile Card */}
      <div className="rp-card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.75rem', fontWeight: 900, color: 'white', flexShrink: 0,
        }}>{initials}</div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '2px' }}>{candidate.fullName}</div>
          <div style={{ color: 'rgba(200,185,230,0.65)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            📧 {candidate.email} · 📱 {candidate.phone || '—'}
          </div>
          <div style={{ color: 'rgba(200,185,230,0.65)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            🎓 {candidate.college || '—'} · {candidate.branch || '—'} · {candidate.degree || candidate.course || '—'}
            {candidate.cgpa && ` · CGPA: ${candidate.cgpa}`}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {candidate.linkedinUrl && <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontSize: '0.8rem' }}>🔗 LinkedIn</a>}
            {candidate.githubUrl   && <a href={candidate.githubUrl}   target="_blank" rel="noreferrer" style={{ color: '#a78bfa', fontSize: '0.8rem' }}>⌥ GitHub</a>}
          </div>
        </div>

        {candidate.hasResume && (
          <button className="rp-btn rp-btn-primary" onClick={downloadResume}>⬇️ Download Resume</button>
        )}
      </div>

      {/* Skills & Certs */}
      {(skills.length > 0 || certs.length > 0) && (
        <div className="rp-grid-2" style={{ marginBottom: '1.5rem' }}>
          {skills.length > 0 && (
            <div className="rp-card">
              <div className="rp-card-title">🛠️ Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {skills.map((s, i) => <span key={i} className="rp-badge rp-badge-purple">{s}</span>)}
              </div>
            </div>
          )}
          {certs.length > 0 && (
            <div className="rp-card">
              <div className="rp-card-title">🏅 Certifications</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {certs.map((c, i) => <span key={i} className="rp-badge rp-badge-blue">{c}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assessment Results */}
      <div className="rp-card" style={{ marginBottom: '1.5rem' }}>
        <div className="rp-card-title">📝 Assessment Results ({results.length})</div>
        {results.length === 0 ? (
          <div className="rp-empty">No assessments attempted yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {results.map(r => (
              <div key={r.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)',
                borderRadius: 10, border: '1px solid var(--r-border)',
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{r.testTitle}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(200,185,230,0.55)' }}>{r.status}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '1.25rem', fontWeight: 800,
                    color: r.score >= 40 ? '#34d399' : '#f87171'
                  }}>{r.score ?? '—'}/{r.totalMarks ?? '—'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <div className="rp-card" style={{ marginBottom: '1.5rem' }}>
          <div className="rp-card-title">🚀 Projects</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {projects.map((p, i) => (
              <div key={i} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--r-border)' }}>
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>{p.name || 'Untitled'}</div>
                <div style={{ color: 'rgba(200,185,230,0.6)', fontSize: '0.85rem' }}>{p.description}</div>
                {p.url && <a href={p.url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontSize: '0.8rem', marginTop: '4px', display: 'inline-block' }}>🔗 View</a>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
