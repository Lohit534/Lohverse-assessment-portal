import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { toast } from '../../components/Toast';
import '../StudentDashboard.css';

export default function Jobs() {
  const [jobs, setJobs]             = useState([]);
  const [myApps, setMyApps]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [applying, setApplying]     = useState(null);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [search, setSearch]         = useState('');
  const [tab, setTab]               = useState('available'); // available | applied

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

  const filtered = jobs.filter(j =>
    !search ||
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.companyName.toLowerCase().includes(search.toLowerCase()) ||
    (j.requiredSkills || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s) => ({
    applied: 'sd-badge-blue', shortlisted: 'sd-badge-green', rejected: 'sd-badge-red'
  }[s] || 'sd-badge-blue');

  const statusIcon = (s) => ({
    applied: '⏳', shortlisted: '✅', rejected: '❌'
  }[s] || '⏳');

  if (loading) return <div className="sd-loading">⟳ Loading jobs…</div>;

  return (
    <div className="sd-page">
      <div className="sd-page-header">
        <h1 className="sd-page-title">💼 Jobs</h1>
        <p className="sd-page-sub">Browse and apply for available job opportunities.</p>
      </div>


      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[{ key: 'available', label: `Available (${jobs.length})` }, { key: 'applied', label: `My Applications (${myApps.length})` }].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="sd-btn"
            style={{
              background: tab === t.key ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'transparent',
              border: tab === t.key ? 'none' : '1px solid var(--sd-border)',
              color: tab === t.key ? 'white' : 'var(--sd-muted)',
              padding: '0.5rem 1.25rem', fontSize: '0.875rem',
            }}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'available' && (
        <>
          {/* Search */}
          <div className="sd-form-field" style={{ marginBottom: '1.25rem' }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search by title, company or skills…"
            />
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
              const appStatus = myApps.find(a => a.jobId === job.id)?.status;

              return (
                <div key={job.id} className="sd-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '2px' }}>{job.title}</div>
                      <div style={{ color: 'var(--sd-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                        🏢 {job.companyName}
                      </div>

                      {job.description && (
                        <p style={{ color: 'var(--sd-muted)', fontSize: '0.825rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                          {job.description.slice(0, 200)}{job.description.length > 200 ? '…' : ''}
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {job.experience && <span className="sd-badge sd-badge-blue">💼 {job.experience}</span>}
                        {job.salaryRange && <span className="sd-badge sd-badge-green">💰 {job.salaryRange}</span>}
                        {job.deadline && <span className="sd-badge sd-badge-yellow">📅 {new Date(job.deadline).toLocaleDateString('en-IN')}</span>}
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
                        <span className={`sd-badge ${statusColor(appStatus)}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.875rem' }}>
                          {statusIcon(appStatus)} {appStatus?.charAt(0).toUpperCase() + appStatus?.slice(1)}
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
        </>
      )}

      {tab === 'applied' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {myApps.length === 0 && (
            <div className="sd-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--sd-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📋</div>
              <div style={{ fontWeight: 600 }}>No applications yet.</div>
            </div>
          )}
          {myApps.map(app => (
            <div key={app.id} className="sd-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{app.job?.title || 'Job'}</div>
                  <div style={{ color: 'var(--sd-muted)', fontSize: '0.825rem', marginTop: '2px' }}>
                    🏢 {app.job?.companyName} · Applied {new Date(app.appliedAt).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <span className={`sd-badge ${statusColor(app.status)}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.875rem' }}>
                  {statusIcon(app.status)} {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
