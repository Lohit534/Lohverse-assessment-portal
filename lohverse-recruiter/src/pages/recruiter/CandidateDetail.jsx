import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { toast, PageLoader } from '../../components/Toast';
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

  const [selectedAI, setSelectedAI] = useState(null);
  const [aiReportDetails, setAiReportDetails] = useState(null);
  const [aiReportLoading, setAiReportLoading] = useState(false);

  useEffect(() => {
    API.get(`/recruiter/candidates/${id}`)
      .then(r => {
        setCandidate(r.data.candidate);
        setResults(r.data.candidate.assessments || []);
      })
      .catch(() => setError('Failed to load candidate'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleViewAIReport = async (aiId) => {
    setSelectedAI(aiId);
    setAiReportLoading(true);
    setAiReportDetails(null);
    try {
      const res = await API.get(`/student/ai-interview/${aiId}`);
      setAiReportDetails(res.data.interview);
    } catch (e) {
      setError("Failed to fetch AI report details.");
    } finally {
      setAiReportLoading(false);
    }
  };

  const handleDeleteAI = async (aiId) => {
    if (!window.confirm('Are you sure you want to delete this AI Interview attempt record? This is permanent.')) return;
    try {
      await API.delete(`/student/ai-interview/${aiId}`);
      toast.success('AI Interview record deleted successfully.');
      const r = await API.get(`/recruiter/candidates/${id}`);
      setCandidate(r.data.candidate);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Delete failed');
    }
  };

  const updateStatus = async (jobId, appId, status) => {
    setUpdatingApp(appId);
    try {
      await API.put(`/jobs/${jobId}/applicants/${id}`, { status });
      toast.success(`Candidate ${status}`);
      const r = await API.get(`/recruiter/candidates/${id}`);
      setCandidate(r.data.candidate);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Update failed');
    } finally {
      setUpdatingApp(null);
    }
  };

  const downloadResume = async () => {
    try {
      const token = localStorage.getItem('recruiter_accessToken');
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://lohverse-assessment-portal.onrender.com/api';
      const res = await fetch(`${apiBase}/student/resume?userId=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `${candidate?.fullName || 'Candidate'}_Resume.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Resume download failed');
    }
  };

  const viewResume = () => {
    const cloudinaryUrl = candidate?.resumeFilename;
    if (!cloudinaryUrl) { setError('No resume found'); return; }
    window.open(cloudinaryUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) return <PageLoader label="Loading candidate profile…" />;
  if (!candidate) return <div className="rp-page"><div className="rp-alert-error">✕ {error || 'Candidate not found'}</div></div>;

  const skills = (candidate.skills || '').split(',').map(s => s.trim()).filter(Boolean);
  const certs  = (candidate.certifications || '').split(',').map(s => s.trim()).filter(Boolean);
  let projects = [];
  try { projects = JSON.parse(candidate.projects || '[]'); } catch {}

  const initials = (candidate.fullName || 'C').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const aiInterviews = candidate.aiInterviews || [];

  return (
    <div className="rp-page">
      <div className="rp-header">
        <div>
          <h1 className="rp-title">👤 Candidate Profile</h1>
          <p className="rp-sub">{candidate.fullName}</p>
        </div>
        <button className="rp-btn rp-btn-outline" onClick={() => navigate('/dashboard/candidates')}>← Back</button>
      </div>

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
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="rp-btn rp-btn-primary"
              onClick={viewResume}
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              📄 View Resume
            </button>
            <button className="rp-btn rp-btn-outline" onClick={downloadResume} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ⬇️ Download
            </button>
          </div>
        )}
        {!candidate.hasResume && (
          <span style={{ fontSize: '0.8rem', color: 'rgba(200,185,230,0.4)', fontStyle: 'italic' }}>No resume uploaded</span>
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

      {/* AI Mock Interviews taken by Candidate */}
      <div className="rp-card" style={{ marginBottom: '1.5rem' }}>
        <div className="rp-card-title">🤖 Gemini AI Video Interviews ({aiInterviews.length})</div>
        {aiInterviews.length === 0 ? (
          <div className="rp-empty">No AI Interviews completed yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {aiInterviews.map(ai => (
              <div key={ai.id} style={{
                padding: '1rem', background: 'rgba(255,255,255,0.03)',
                borderRadius: 10, border: '1px solid var(--r-border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 800 }}>
                      AI Interview for {ai.jobRole}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', fontSize: '0.78rem', color: 'rgba(200,185,230,0.6)' }}>
                      <span>⚙️ Skills: {ai.skills}</span>
                      <span>•</span>
                      <span>📈 Difficulty: {ai.difficulty}</span>
                      <span>•</span>
                      <span>📅 Taken: {new Date(ai.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>

                    {ai.result && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        <span className="rp-badge rp-badge-purple" style={{ fontSize: '0.7rem' }}>💻 Tech: {ai.result.technicalScore}/100</span>
                        <span className="rp-badge rp-badge-blue" style={{ fontSize: '0.7rem' }}>🎙️ Comm: {ai.result.communicationScore}/100</span>
                        <span className="rp-badge rp-badge-yellow" style={{ fontSize: '0.7rem' }}>⭐ Conf: {ai.result.confidenceScore}/100</span>
                        <span className="rp-badge" style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 'bold',
                          background: ai.result.finalRecommendation.includes('Hire') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          color: ai.result.finalRecommendation.includes('Hire') ? '#34d399' : '#f87171' 
                        }}>
                          🎯 Rec: {ai.result.finalRecommendation}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button 
                      className="rp-btn rp-btn-outline" 
                      onClick={() => handleViewAIReport(ai.id)}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                    >
                      📄 View AI Report
                    </button>
                    <button 
                      className="rp-btn rp-btn-danger" 
                      onClick={() => handleDeleteAI(ai.id)}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Jitsi AI Report Modal popup */}
      {selectedAI && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }}>
          <div className="rp-card" style={{ maxWidth: '640px', width: '100%', maxHeight: '85vh', overflowY: 'auto', background: '#12112a', border: '1px solid var(--r-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--r-border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h2 className="rp-card-title" style={{ margin: 0 }}>🤖 Detailed Gemini AI Grading Report</h2>
              <button className="rp-btn rp-btn-outline" onClick={() => setSelectedAI(null)} style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}>✕ Close</button>
            </div>

            {aiReportLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--r-muted)' }}>⟳ Querying Gemini report analysis details…</div>
            ) : (
              aiReportDetails && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: '#09090e', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--r-border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--r-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Job Specifications</div>
                    <strong style={{ fontSize: '0.95rem', color: 'white' }}>{aiReportDetails.jobRole}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(200,185,230,0.75)', marginTop: '2px' }}>Skills: {aiReportDetails.skills} • {aiReportDetails.difficulty} Level</div>
                  </div>

                  {aiReportDetails.result ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                        <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid var(--r-border)', padding: '0.5rem', borderRadius: 8 }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#a78bfa' }}>{aiReportDetails.result.technicalScore}%</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--r-muted)' }}>Technical</div>
                        </div>
                        <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid var(--r-border)', padding: '0.5rem', borderRadius: 8 }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#60a5fa' }}>{aiReportDetails.result.communicationScore}%</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--r-muted)' }}>Communication</div>
                        </div>
                        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid var(--r-border)', padding: '0.5rem', borderRadius: 8 }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34d399' }}>{aiReportDetails.result.confidenceScore}%</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--r-muted)' }}>Confidence</div>
                        </div>
                      </div>

                      <div style={{ background: '#09090e', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--r-border)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--r-muted)', fontWeight: 'bold' }}>Gemini Core Feedback Report</div>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', lineHeight: 1.5, color: '#e8e3f8', whiteSpace: 'pre-line' }}>{aiReportDetails.result.feedbackReport}</p>
                      </div>
                    </>
                  ) : (
                    <div className="rp-alert-error" style={{ textAlign: 'center' }}>⚠️ Evaluation results are still being compiled by Gemini.</div>
                  )}

                  <div style={{ borderTop: '1px solid var(--r-border)', paddingTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--r-text)', marginBottom: '0.5rem' }}>Verbal Response Logs ({aiReportDetails.answers?.length || 0})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {aiReportDetails.questions?.map((q, idx) => {
                        const ans = aiReportDetails.answers?.find(a => a.aiQuestionId === q.id);
                        return (
                          <div key={q.id} style={{ background: '#09090e', padding: '0.6rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ fontSize: '0.78rem', color: '#a78bfa', fontWeight: 'bold' }}>Q{idx+1}: {q.questionText}</div>
                            {q.expectedKeywords && <div style={{ fontSize: '0.68rem', color: '#fbbf24', margin: '2px 0' }}>Keywords: {q.expectedKeywords}</div>}
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', fontStyle: 'italic', color: 'white' }}>
                              Answer: "{ans?.transcript || 'No transcript answered.'}"
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

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
