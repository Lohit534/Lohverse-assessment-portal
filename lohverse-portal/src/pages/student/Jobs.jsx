import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { toast } from '../../components/Toast';
import '../StudentDashboard.css';

export default function Jobs() {
  const [jobs, setJobs]         = useState([]);
  const [myApps, setMyApps]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [applying, setApplying] = useState(null);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [expandedJobs, setExpandedJobs] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [jRes, aRes] = await Promise.all([
        API.get('/jobs/?status=published'),
        API.get('/student/applications'),
      ]);
      setJobs(jRes.data.jobs || []);
      setMyApps(aRes.data.applications || []);
    } catch (e) {
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const appliedIds = new Set(myApps.map(a => a.jobId));

  const handleApply = async (jobId) => {
    setApplying(jobId);
    try {
      await API.post(`/jobs/${jobId}/apply`);
      toast.success('Application submitted successfully!');
      await loadData();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to apply');
    } finally {
      setApplying(null);
    }
  };

  const toggleExpand = (jobId) =>
    setExpandedJobs(prev => ({ ...prev, [jobId]: !prev[jobId] }));

  const filtered = jobs.filter(j =>
    !search ||
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.companyName.toLowerCase().includes(search.toLowerCase()) ||
    (j.requiredSkills || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (s) => ({
    applied:     { cls: 'sd-badge-blue',   icon: '⏳', label: 'Applied'      },
    shortlisted: { cls: 'sd-badge-green',  icon: '✅', label: 'Shortlisted'  },
    rejected:    { cls: 'sd-badge-red',    icon: '❌', label: 'Not Selected' },
  }[s] || { cls: 'sd-badge-blue', icon: '⏳', label: 'Applied' });

  if (loading) return <div className="sd-loading">⟳ Loading jobs…</div>;

  return (
    <div className="sd-page">
      <div className="sd-page-header">
        <h1 className="sd-page-title">💼 Job Board</h1>
        <p className="sd-page-sub">Browse and apply for available job opportunities. Track your applications in <strong>My Applications</strong>.</p>
      </div>

      {error && <div className="sd-alert sd-alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Search */}
      <div className="sd-form-field" style={{ marginBottom: '1.25rem' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search by title, company or skills…"
        />
      </div>

      {/* Count */}
      <div style={{ fontSize: '0.8rem', color: 'var(--sd-muted)', marginBottom: '1rem' }}>
        Showing {filtered.length} job{filtered.length !== 1 ? 's' : ''}
        {appliedIds.size > 0 && <span style={{ marginLeft: '0.75rem', color: '#a78bfa' }}>· {appliedIds.size} applied</span>}
      </div>

      {filtered.length === 0 && (
        <div className="sd-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--sd-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>💼</div>
          <div style={{ fontWeight: 600 }}>No jobs found.</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map(job => {
          const alreadyApplied = appliedIds.has(job.id);
          const appStatus      = myApps.find(a => a.jobId === job.id)?.status;
          const badge          = statusBadge(appStatus);
          const isExpanded     = expandedJobs[job.id];
          const desc           = job.description || '';
          const PREVIEW_LEN    = 150;

          return (
            <div key={job.id} className="sd-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '2px' }}>{job.title}</div>
                  <div style={{ color: 'var(--sd-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                    🏢 {job.companyName}
                  </div>

                  {desc && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <p style={{ color: 'var(--sd-muted)', fontSize: '0.825rem', lineHeight: 1.5, margin: 0 }}>
                        {isExpanded ? desc : `${desc.slice(0, PREVIEW_LEN)}${desc.length > PREVIEW_LEN ? '…' : ''}`}
                      </p>
                      {desc.length > PREVIEW_LEN && (
                        <button
                          onClick={() => toggleExpand(job.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#7c3aed', fontSize: '0.8rem', fontWeight: 600,
                            padding: '0.25rem 0', marginTop: '0.25rem',
                          }}
                        >
                          {isExpanded ? '▲ Show Less' : '▼ Read More'}
                        </button>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {job.experience  && <span className="sd-badge sd-badge-blue">💼 {job.experience}</span>}
                    {job.salaryRange && <span className="sd-badge sd-badge-green">💰 {job.salaryRange}</span>}
                    {job.deadline    && <span className="sd-badge sd-badge-yellow">📅 {new Date(job.deadline).toLocaleDateString('en-IN')}</span>}
                  </div>

                  {job.requiredSkills && (
                    <div style={{ marginTop: '0.6rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {job.requiredSkills.split(',').map(s => s.trim()).filter(Boolean).map((s, i) => (
                        <span key={i} className="sd-badge sd-badge-purple" style={{ fontSize: '0.7rem' }}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  {alreadyApplied ? (
                    <span className={`sd-badge ${badge.cls}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.875rem' }}>
                      {badge.icon} {badge.label}
                    </span>
                  ) : (
                    <button
                      className="sd-btn sd-btn-primary"
                      onClick={() => handleApply(job.id)}
                      disabled={applying === job.id}
                    >
                      {applying === job.id ? '⟳ Applying…' : '🚀 Apply Now'}
                    </button>
                  )}
                  <div style={{ fontSize: '0.7rem', color: 'var(--sd-muted)', marginTop: '4px' }}>
                    {job.applicationCount} applicant{job.applicationCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
