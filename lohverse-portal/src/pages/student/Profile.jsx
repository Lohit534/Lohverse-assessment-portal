import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import '../StudentDashboard.css';

const FIELDS = [
  { key: 'fullName',       label: 'Full Name',       type: 'text',  col: 2 },
  { key: 'email',          label: 'Email',            type: 'email', col: 1, readOnly: true },
  { key: 'phone',          label: 'Phone',            type: 'tel',   col: 1 },
  { key: 'college',        label: 'College',          type: 'text',  col: 2 },
  { key: 'degree',         label: 'Degree',           type: 'text',  col: 1 },
  { key: 'branch',         label: 'Branch',           type: 'text',  col: 1 },
  { key: 'course',         label: 'Course',           type: 'text',  col: 1 },
  { key: 'year',           label: 'Year of Passout',   type: 'text',  col: 1 },
  { key: 'cgpa',           label: 'CGPA',             type: 'text',  col: 1 },
  { key: 'address',        label: 'Address',          type: 'textarea', col: 2 },
  { key: 'skills',         label: 'Skills (comma-separated)', type: 'text', col: 2 },
  { key: 'certifications', label: 'Certifications (comma-separated)', type: 'text', col: 2 },
  { key: 'linkedinUrl',    label: 'LinkedIn URL',     type: 'url',   col: 1 },
  { key: 'githubUrl',      label: 'GitHub URL',       type: 'url',   col: 1 },
];

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm]     = useState({});
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        fullName:       user.fullName || '',
        email:          user.email || '',
        phone:          user.phone || '',
        address:        user.address || '',
        college:        user.college || '',
        degree:         user.degree || '',
        branch:         user.branch || '',
        course:         user.course || '',
        year:           user.year || '',
        cgpa:           user.cgpa || '',
        skills:         user.skills || '',
        certifications: user.certifications || '',
        linkedinUrl:    user.linkedinUrl || '',
        githubUrl:      user.githubUrl || '',
      });
      try {
        const p = typeof user.projects === 'string' ? JSON.parse(user.projects) : (user.projects || []);
        setProjects(Array.isArray(p) ? p : []);
      } catch { setProjects([]); }
    }
  }, [user]);

  const handleChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addProject = () =>
    setProjects(prev => [...prev, { name: '', description: '', url: '' }]);

  const updateProject = (i, key, val) =>
    setProjects(prev => prev.map((p, idx) => idx === i ? { ...p, [key]: val } : p));

  const removeProject = (i) =>
    setProjects(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      await API.put('/student/profile', {
        ...form,
        projects: JSON.stringify(projects),
      });
      await refreshUser();
      setSuccess('Profile updated successfully!');
      setEditMode(false);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const skillsList = (form.skills || '').split(',').map(s => s.trim()).filter(Boolean);
  const certsList  = (form.certifications || '').split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div className="sd-page">
      <div className="sd-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="sd-page-title">👤 My Profile</h1>
          <p className="sd-page-sub">Manage your personal, academic and professional details.</p>
        </div>
        {!editMode && (
          <button className="sd-btn sd-btn-primary" onClick={() => setEditMode(true)}>
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {success && <div className="sd-alert sd-alert-success">✓ {success}</div>}
      {error   && <div className="sd-alert sd-alert-error">✕ {error}</div>}

      {/* Profile Avatar Banner */}
      <div className="sd-card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{
          width: 72, height: 72,
          background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.75rem', fontWeight: 900, color: 'white', flexShrink: 0,
        }}>
          {(form.fullName || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--sd-text)' }}>
            {form.fullName || '—'}
          </div>
          <div style={{ color: 'var(--sd-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            {form.college && `${form.college} • `}{form.branch || ''} {form.year ? `• Passout ${form.year}` : ''}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            {form.linkedinUrl && (
              <a href={form.linkedinUrl} target="_blank" rel="noopener noreferrer"
                 style={{ color: '#60a5fa', fontSize: '0.8rem' }}>🔗 LinkedIn</a>
            )}
            {form.githubUrl && (
              <a href={form.githubUrl} target="_blank" rel="noopener noreferrer"
                 style={{ color: '#a78bfa', fontSize: '0.8rem' }}>⌥ GitHub</a>
            )}
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="sd-card" style={{ marginBottom: '1.5rem' }}>
        <div className="sd-card-title">📋 Personal & Academic Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {FIELDS.map(f => (
            <div key={f.key} className="sd-form-field" style={{ gridColumn: `span ${f.col}` }}>
              <label>{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea
                  value={form[f.key] || ''}
                  onChange={e => handleChange(f.key, e.target.value)}
                  readOnly={!editMode || f.readOnly}
                  style={{ opacity: (!editMode || f.readOnly) ? 0.65 : 1 }}
                />
              ) : (
                <input
                  type={f.type}
                  value={form[f.key] || ''}
                  onChange={e => handleChange(f.key, e.target.value)}
                  readOnly={!editMode || f.readOnly}
                  style={{ opacity: (!editMode || f.readOnly) ? 0.65 : 1 }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Skills & Certifications preview */}
      {!editMode && (skillsList.length > 0 || certsList.length > 0) && (
        <div className="sd-grid-2" style={{ marginBottom: '1.5rem', gap: '1.25rem' }}>
          {skillsList.length > 0 && (
            <div className="sd-card">
              <div className="sd-card-title">🛠️ Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {skillsList.map((s, i) => (
                  <span key={i} className="sd-badge sd-badge-purple">{s}</span>
                ))}
              </div>
            </div>
          )}
          {certsList.length > 0 && (
            <div className="sd-card">
              <div className="sd-card-title">🏅 Certifications</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {certsList.map((c, i) => (
                  <span key={i} className="sd-badge sd-badge-blue">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Projects */}
      <div className="sd-card" style={{ marginBottom: '1.5rem' }}>
        <div className="sd-card-title" style={{ justifyContent: 'space-between' }}>
          <span>🚀 Projects</span>
          {editMode && (
            <button className="sd-btn sd-btn-outline" style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}
                    onClick={addProject}>
              + Add Project
            </button>
          )}
        </div>

        {projects.length === 0 && (
          <p style={{ color: 'var(--sd-muted)', fontSize: '0.875rem' }}>
            {editMode ? 'Click "+ Add Project" to add your first project.' : 'No projects added yet.'}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {projects.map((p, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
              padding: '1rem', border: '1px solid var(--sd-border)'
            }}>
              {editMode ? (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--sd-muted)' }}>Project {i + 1}</span>
                    <button className="sd-btn sd-btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => removeProject(i)}>Remove</button>
                  </div>
                  <div className="sd-form-field">
                    <label>Project Name</label>
                    <input type="text" value={p.name} onChange={e => updateProject(i, 'name', e.target.value)} placeholder="My Awesome Project" />
                  </div>
                  <div className="sd-form-field">
                    <label>Description</label>
                    <textarea value={p.description} onChange={e => updateProject(i, 'description', e.target.value)} placeholder="Briefly describe the project..." />
                  </div>
                  <div className="sd-form-field">
                    <label>Project URL (optional)</label>
                    <input type="url" value={p.url} onChange={e => updateProject(i, 'url', e.target.value)} placeholder="https://github.com/..." />
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{p.name || 'Untitled'}</div>
                  <div style={{ color: 'var(--sd-muted)', fontSize: '0.875rem' }}>{p.description}</div>
                  {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontSize: '0.8rem', marginTop: '0.25rem', display: 'inline-block' }}>🔗 View Project</a>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      {editMode && (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="sd-btn sd-btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? '⟳ Saving…' : '💾 Save Profile'}
          </button>
          <button className="sd-btn sd-btn-outline" onClick={() => { setEditMode(false); setError(''); setSuccess(''); }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
