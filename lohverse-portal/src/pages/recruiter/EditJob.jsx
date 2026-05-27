import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';
import '../RecruiterDashboard.css';

export default function EditJob() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [form, setForm]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    API.get(`/jobs/${id}`)
      .then(r => {
        const j = r.data.job;
        setForm({
          title:          j.title || '',
          companyName:    j.companyName || '',
          description:    j.description || '',
          requiredSkills: j.requiredSkills || '',
          experience:     j.experience || '',
          salaryRange:    j.salaryRange || '',
          deadline:       j.deadline ? j.deadline.slice(0, 16) : '',
          status:         j.status || 'draft',
        });
      })
      .catch(() => setError('Failed to load job'))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await API.put(`/jobs/${id}`, form);
      setSuccess('Job updated!');
      setTimeout(() => navigate('/dashboard/jobs'), 1000);
    } catch (e) {
      setError(e.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rp-loading">⟳ Loading…</div>;
  if (!form)   return <div className="rp-page"><div className="rp-alert-error">✕ {error}</div></div>;

  return (
    <div className="rp-page">
      <div className="rp-header">
        <div>
          <h1 className="rp-title">✏️ Edit Job</h1>
          <p className="rp-sub">Update job posting details.</p>
        </div>
        <button className="rp-btn rp-btn-outline" onClick={() => navigate('/dashboard/jobs')}>← Back</button>
      </div>

      {error   && <div className="rp-alert-error">✕ {error}</div>}
      {success && <div className="rp-alert-success">✓ {success}</div>}

      <form onSubmit={handleSave}>
        <div className="rp-card" style={{ marginBottom: '1.5rem' }}>
          <div className="rp-card-title">📋 Job Details</div>
          <div className="rp-grid-2" style={{ gap: '1.25rem' }}>
            <div className="rp-field" style={{ gridColumn: 'span 2' }}>
              <label>Job Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} required />
            </div>
            <div className="rp-field">
              <label>Company Name *</label>
              <input value={form.companyName} onChange={e => set('companyName', e.target.value)} required />
            </div>
            <div className="rp-field">
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="rp-field">
              <label>Experience</label>
              <input value={form.experience} onChange={e => set('experience', e.target.value)} />
            </div>
            <div className="rp-field">
              <label>Salary Range</label>
              <input value={form.salaryRange} onChange={e => set('salaryRange', e.target.value)} />
            </div>
            <div className="rp-field">
              <label>Deadline</label>
              <input type="datetime-local" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
            </div>
            <div className="rp-field" style={{ gridColumn: 'span 2' }}>
              <label>Required Skills</label>
              <input value={form.requiredSkills} onChange={e => set('requiredSkills', e.target.value)} />
            </div>
            <div className="rp-field" style={{ gridColumn: 'span 2' }}>
              <label>Description</label>
              <textarea style={{ minHeight: 120 }} value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>
        </div>
        <button type="submit" className="rp-btn rp-btn-primary" disabled={saving}>
          {saving ? '⟳ Saving…' : '💾 Save Changes'}
        </button>
      </form>
    </div>
  );
}
