import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import '../RecruiterDashboard.css';

export default function Interviews() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    candidateId: '',
    scheduledDate: '',
    scheduledTime: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [intRes, candRes] = await Promise.all([
        API.get('/recruiter/interviews'),
        API.get('/recruiter/candidates')
      ]);
      setInterviews(intRes.data.interviews || []);
      const list = candRes.data.candidates || [];
      setCandidates(list);
      if (list.length > 0) {
        setForm(p => ({ ...p, candidateId: String(list[0].id) }));
      }
    } catch (e) {
      setError('Failed to load interviews or candidates data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteInterview = async (interviewId) => {
    if (!window.confirm("Are you sure you want to delete this scheduled video interview?")) return;
    try {
      await API.delete(`/recruiter/interviews/${interviewId}`);
      loadData();
    } catch (e) {
      alert(e.response?.data?.error || "Delete failed");
    }
  };

  const handleUpdateCandidateStatus = async (jobId, studentId, status) => {
    try {
      await API.put(`/jobs/${jobId}/applicants/${studentId}`, { status });
      // Update local state for interviews
      setInterviews(prev => prev.map(item => {
        if (item.candidateId === studentId) {
          const updatedApps = (item.applications || []).map(app => {
            if (app.jobId === jobId) {
              return { ...app, status };
            }
            return app;
          });
          return { ...item, applications: updatedApps };
        }
        return item;
      }));
      alert(`Candidate ${status}`);
    } catch (e) {
      alert('Failed to update status.');
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!form.candidateId || !form.scheduledDate || !form.scheduledTime) {
      alert("Please fill all target fields.");
      return;
    }
    setSubmitting(true);
    try {
      await API.post('/recruiter/interviews', form);
      alert("One-to-One Interview successfully scheduled!");
      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || "Scheduling failed. Verify candidate details.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="rp-loading">⟳ Loading interviews…</div>;

  return (
    <div className="rp-page">
      <div className="rp-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="rp-title">📹 Video Interviews</h1>
          <p className="rp-sub">Manage scheduled placement sessions and join zero-redirection Jitsi calls.</p>
        </div>
        <button className="rp-btn rp-btn-primary" onClick={() => setShowModal(true)}>
          ➕ Schedule Video Interview
        </button>
      </div>

      {error && <div className="rp-alert-error">✕ {error}</div>}

      {/* Interviews Grid Cards */}
      {interviews.length === 0 ? (
        <div className="rp-card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--sd-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📹</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No Video Interviews Scheduled</div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>Click "Schedule Video Interview" to book a live screening session with candidates.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {interviews.map(item => (
            <div key={item.id} className="rp-card" style={{ borderLeft: `4px solid ${item.status === 'completed' ? '#10b981' : '#7c3aed'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 800 }}>
                    Interview with {item.candidateName}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem', opacity: 0.85 }}>
                    <span>📧 {item.candidateEmail}</span>
                    <span>•</span>
                    <span>📅 {item.scheduledDate}</span>
                    <span>•</span>
                    <span>⏱ {item.scheduledTime}</span>
                  </div>
                  {item.feedback && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(16,185,129,0.06)', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.15)' }}>
                      <div style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 'bold' }}>⭐ Candidate Rating: {item.feedback.rating}/10</div>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.825rem', fontStyle: 'italic', opacity: 0.8 }}>Notes: {item.feedback.notes}</p>
                    </div>
                  )}

                  {/* Connected Job Applications */}
                  {item.applications && item.applications.length > 0 && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--r-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Job Applications
                      </div>
                      {item.applications.map(app => {
                        const statusColor = app.status === 'shortlisted' ? '#34d399' : app.status === 'rejected' ? '#f87171' : '#a78bfa';
                        const statusBg = app.status === 'shortlisted' ? 'rgba(16,185,129,0.12)' : app.status === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(124,58,237,0.12)';
                        return (
                          <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--r-border)', maxWidth: '420px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{app.jobTitle}</span>
                              <span style={{ 
                                alignSelf: 'flex-start',
                                marginTop: '0.15rem',
                                padding: '0.1rem 0.35rem', 
                                fontSize: '0.65rem', 
                                borderRadius: '4px',
                                background: statusBg,
                                color: statusColor,
                                textTransform: 'capitalize',
                                fontWeight: 700
                              }}>
                                {app.status}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                              <button
                                className="rp-btn"
                                disabled={app.status === 'shortlisted'}
                                onClick={() => handleUpdateCandidateStatus(app.jobId, item.candidateId, 'shortlisted')}
                                style={{ padding: '0.2rem 0.45rem', fontSize: '0.68rem', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', opacity: app.status === 'shortlisted' ? 0.55 : 1, cursor: app.status === 'shortlisted' ? 'not-allowed' : 'pointer' }}
                              >
                                ✓ Shortlist
                              </button>
                              <button
                                className="rp-btn"
                                disabled={app.status === 'rejected'}
                                onClick={() => handleUpdateCandidateStatus(app.jobId, item.candidateId, 'rejected')}
                                style={{ padding: '0.2rem 0.45rem', fontSize: '0.68rem', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', opacity: app.status === 'rejected' ? 0.55 : 1, cursor: app.status === 'rejected' ? 'not-allowed' : 'pointer' }}
                              >
                                ✕ Reject
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="sd-badge" style={{ 
                    background: item.status === 'completed' ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.15)',
                    color: item.status === 'completed' ? '#34d399' : '#a78bfa',
                    border: `1px solid ${item.status === 'completed' ? 'rgba(16,185,129,0.3)' : 'rgba(124,58,237,0.3)'}`,
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}>
                    {item.status}
                  </span>
                  
                  {item.status !== 'completed' && (
                    <button 
                      className="rp-btn rp-btn-success"
                      onClick={() => navigate(`/dashboard/interview-room/${item.roomId}`)}
                      style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                    >
                      🎙️ Enter Jitsi Room
                    </button>
                  )}

                  <button 
                    className="rp-btn rp-btn-danger"
                    onClick={() => handleDeleteInterview(item.id)}
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                    title="Delete Interview"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Modal Overlay */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }}>
          <form onSubmit={handleSchedule} className="rp-card" style={{ maxWidth: '480px', width: '100%', background: '#12112a', border: '1px solid var(--sd-border)' }}>
            <div className="rp-card-title">📅 Schedule Live Interview Call</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
              <div className="rp-field">
                <label>Select Candidate *</label>
                {candidates.length > 0 ? (
                  <select 
                    value={form.candidateId} 
                    onChange={e => setForm(p => ({ ...p, candidateId: e.target.value }))}
                    style={{ width: '100%', padding: '0.6rem', background: '#09090e', color: 'white', border: '1px solid var(--sd-border)', borderRadius: '8px' }}
                    required
                  >
                    {candidates.map(c => (
                      <option key={c.id} value={c.id}>{c.fullName} ({c.email}) • {c.branch || 'No branch'}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.8rem', borderRadius: '6px' }}>
                    ⚠️ No candidates registered yet. Click Cancel.
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="rp-field">
                  <label>Scheduled Date *</label>
                  <input 
                    type="date" 
                    value={form.scheduledDate} 
                    onChange={e => setForm(p => ({ ...p, scheduledDate: e.target.value }))}
                    required 
                  />
                </div>
                <div className="rp-field">
                  <label>Scheduled Time *</label>
                  <input 
                    type="time" 
                    value={form.scheduledTime} 
                    onChange={e => setForm(p => ({ ...p, scheduledTime: e.target.value }))}
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="submit" className="rp-btn rp-btn-primary" disabled={submitting || candidates.length === 0} style={{ flex: 1, padding: '0.65rem' }}>
                  {submitting ? 'Scheduling…' : 'Schedule Meeting'}
                </button>
                <button type="button" className="rp-btn rp-btn-outline" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.65rem' }}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
