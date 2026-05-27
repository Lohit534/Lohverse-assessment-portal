import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import '../RecruiterDashboard.css';

const INIT = {
  title: '', companyName: '', description: '',
  requiredSkills: '', experience: '', salaryRange: '',
  deadline: '', status: 'draft',
};

export default function CreateJob() {
  const navigate = useNavigate();
  const [form, setForm]     = useState(INIT);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e, publish = false) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await API.post('/jobs/', { ...form, status: publish ? 'published' : 'draft' });
      navigate('/dashboard/jobs');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rp-page">
      <div className="rp-header">
        <div>
          <h1 className="rp-title">💼 Create Job</h1>
          <p className="rp-sub">Post a new job opportunity for candidates.</p>
        </div>
        <button className="rp-btn rp-btn-outline" onClick={() => navigate('/dashboard/jobs')}>← Back</button>
      </div>

      {error && <div className="rp-alert-error">✕ {error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="rp-card" style={{ marginBottom: '1.5rem' }}>
          <div className="rp-card-title">📋 Job Details</div>
          <div className="rp-grid-2" style={{ gap: '1.25rem' }}>
            <div className="rp-field" style={{ gridColumn: 'span 2' }}>
              <label>Job Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Software Engineer" required />
            </div>
            <div className="rp-field">
              <label>Company Name *</label>
              <input value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Your Company" required />
            </div>
            <div className="rp-field">
              <label>Experience Required</label>
              <input value={form.experience} onChange={e => set('experience', e.target.value)} placeholder="e.g. 0-2 years / Fresher" />
            </div>
            <div className="rp-field">
              <label>Salary Range</label>
              <input value={form.salaryRange} onChange={e => set('salaryRange', e.target.value)} placeholder="e.g. ₹4-8 LPA" />
            </div>
            <div className="rp-field">
              <label>Application Deadline</label>
              <input type="datetime-local" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
            </div>
            <div className="rp-field" style={{ gridColumn: 'span 2' }}>
              <label>Required Skills (comma-separated)</label>
              <input value={form.requiredSkills} onChange={e => set('requiredSkills', e.target.value)} placeholder="Java, Spring Boot, MySQL, REST APIs" />
            </div>
            <div className="rp-field" style={{ gridColumn: 'span 2' }}>
              <label>Job Description</label>
              <textarea style={{ minHeight: 120 }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the role, responsibilities, requirements..." />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="rp-btn rp-btn-outline" disabled={loading}>
            💾 Save as Draft
          </button>
          <button type="button" className="rp-btn rp-btn-success" disabled={loading}
                  onClick={e => handleSubmit(e, true)}>
            🚀 Publish Now
          </button>
        </div>
      </form>
    </div>
  );
}
