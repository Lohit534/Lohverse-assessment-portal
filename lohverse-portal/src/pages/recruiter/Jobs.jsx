import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import '../RecruiterDashboard.css';

const STATUS_BADGE = {
  published: 'rp-badge-green',
  draft:     'rp-badge-yellow',
  closed:    'rp-badge-red',
};

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    API.get('/jobs/recruiter/all')
      .then(r => setJobs(r.data.jobs || []))
      .catch(e => setError(e.response?.data?.error || 'Failed to load jobs'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleStatusChange = async (jobId, status) => {
    try {
      await API.put(`/jobs/${jobId}`, { status });
      setSuccess(`Job ${status} successfully`);
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Delete this job? This cannot be undone.')) return;
    setDeleting(jobId);
    try {
      await API.delete(`/jobs/${jobId}`);
      setSuccess('Job deleted');
      setJobs(j => j.filter(x => x.id !== jobId));
    } catch (e) {
      setError(e.response?.data?.error || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="rp-loading">⟳ Loading jobs…</div>;

  return (
    <div className="rp-page">
      <div className="rp-header">
        <div>
          <h1 className="rp-title">💼 Job Management</h1>
          <p className="rp-sub">Create and manage your job postings.</p>
        </div>
        <button className="rp-btn rp-btn-primary" onClick={() => navigate('/dashboard/jobs/create')}>
          + Create Job
        </button>
      </div>

      {error   && <div className="rp-alert-error">✕ {error}</div>}
      {success && <div className="rp-alert-success">✓ {success}</div>}

      {jobs.length === 0 && (
        <div className="rp-card rp-empty">
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>💼</div>
          <div style={{ fontWeight: 600 }}>No jobs created yet.</div>
          <button className="rp-btn rp-btn-primary" style={{ marginTop: '1rem' }}
                  onClick={() => navigate('/dashboard/jobs/create')}>Create First Job</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {jobs.map(job => (
          <div key={job.id} className="rp-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{job.title}</span>
                  <span className={`rp-badge ${STATUS_BADGE[job.status] || 'rp-badge-gray'}`}>
                    {job.status?.charAt(0).toUpperCase() + job.status?.slice(1)}
                  </span>
                </div>
                <div style={{ color: 'rgba(200,185,230,0.6)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  🏢 {job.companyName}
                  {job.experience && ` · 💼 ${job.experience}`}
                  {job.salaryRange && ` · 💰 ${job.salaryRange}`}
                </div>
                {job.requiredSkills && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.5rem' }}>
                    {job.requiredSkills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 5).map((s, i) => (
                      <span key={i} className="rp-badge rp-badge-purple" style={{ fontSize: '0.7rem' }}>{s}</span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'rgba(200,185,230,0.5)' }}>
                  <span>👥 {job.applicationCount} applicants</span>
                  {job.deadline && <span>📅 Deadline: {new Date(job.deadline).toLocaleDateString('en-IN')}</span>}
                  <span>📅 {new Date(job.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {job.status === 'draft' && (
                  <button className="rp-btn rp-btn-success" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                          onClick={() => handleStatusChange(job.id, 'published')}>
                    🚀 Publish
                  </button>
                )}
                {job.status === 'published' && (
                  <button className="rp-btn rp-btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                          onClick={() => handleStatusChange(job.id, 'closed')}>
                    🔒 Close
                  </button>
                )}
                <button className="rp-btn rp-btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                        onClick={() => navigate(`/dashboard/jobs/${job.id}/edit`)}>
                  ✏️ Edit
                </button>
                <button className="rp-btn rp-btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                        onClick={() => navigate(`/dashboard/candidates`, { state: { jobId: job.id } })}>
                  👥 Applicants
                </button>
                <button className="rp-btn rp-btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                        onClick={() => handleDelete(job.id)} disabled={deleting === job.id}>
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
