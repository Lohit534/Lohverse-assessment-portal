import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import '../RecruiterDashboard.css';

export default function Assessments() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [jobs, setJobs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  const load = () => {
    Promise.all([API.get('/assessments/'), API.get('/jobs/recruiter/all')])
      .then(([a, j]) => {
        setAssessments(a.data.assessments || []);
        setJobs(j.data.jobs || []);
      })
      .catch(e => setError('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assessment?')) return;
    try {
      await API.delete(`/assessments/${id}`);
      setSuccess('Assessment deleted');
      setAssessments(a => a.filter(x => x.id !== id));
    } catch (e) {
      setError(e.response?.data?.error || 'Delete failed');
    }
  };

  const jobTitle = (jobId) => jobs.find(j => j.id === jobId)?.title || '—';

  if (loading) return <div className="rp-loading">⟳ Loading…</div>;

  return (
    <div className="rp-page">
      <div className="rp-header">
        <div>
          <h1 className="rp-title">📝 Assessments</h1>
          <p className="rp-sub">Manage assessment tests and question banks.</p>
        </div>
        <button className="rp-btn rp-btn-primary" onClick={() => navigate('/dashboard/assessments/create')}>
          + Create Assessment
        </button>
      </div>

      {error   && <div className="rp-alert-error">✕ {error}</div>}
      {success && <div className="rp-alert-success">✓ {success}</div>}

      {assessments.length === 0 && (
        <div className="rp-card rp-empty">
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📝</div>
          <div style={{ fontWeight: 600 }}>No assessments created yet.</div>
          <button className="rp-btn rp-btn-primary" style={{ marginTop: '1rem' }}
                  onClick={() => navigate('/dashboard/assessments/create')}>Create First Assessment</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {assessments.map(a => (
          <div key={a.id} className="rp-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>{a.title}</div>
                {a.description && (
                  <div style={{ color: 'rgba(200,185,230,0.6)', fontSize: '0.825rem', marginBottom: '0.6rem' }}>
                    {a.description.slice(0, 120)}{a.description.length > 120 ? '…' : ''}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span className="rp-badge rp-badge-purple">⏱ {a.durationMins} mins</span>
                  <span className="rp-badge rp-badge-blue">❓ {a.questionCount} questions</span>
                  <span className="rp-badge rp-badge-yellow">🎯 Pass: {a.passingMarks}/{a.totalMarks}</span>
                  {a.jobId && <span className="rp-badge rp-badge-green">💼 {jobTitle(a.jobId)}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="rp-btn rp-btn-outline" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                        onClick={() => navigate(`/dashboard/assessments/${a.id}/questions`)}>
                  ❓ Questions ({a.questionCount})
                </button>
                <button className="rp-btn rp-btn-danger" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                        onClick={() => handleDelete(a.id)}>
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
