import React, { useState, useEffect, useRef } from 'react';
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

  // Resume Upload State
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [resumeSuccess, setResumeSuccess] = useState('');
  const [resumeError, setResumeError] = useState('');
  const fileInputRef = useRef(null);

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploading) return;
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploading) return;
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file select
  const handleFileSelect = async (e) => {
    if (uploading) return;
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  // Upload file logic
  const uploadFile = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setResumeError('Only PDF files are accepted.');
      setResumeSuccess('');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeError('File size must be under 5 MB.');
      setResumeSuccess('');
      return;
    }

    setUploading(true);
    setResumeError('');
    setResumeSuccess('');
    
    const fd = new FormData();
    fd.append('resume', file);

    try {
      await API.post('/student/resume', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshUser();
      setResumeSuccess('Resume uploaded successfully!');
      setResumeError('');
    } catch (e) {
      setResumeError(e.response?.data?.error || 'Upload failed');
      setResumeSuccess('');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePreview = () => {
    if (!user?.resumeFilename) {
      setResumeError('No resume found');
      return;
    }
    const token = localStorage.getItem('accessToken');
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://lohverse-assessment-portal.onrender.com/api';
    window.open(`${apiBase}/student/resume/view?jwt=${token}`, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://lohverse-assessment-portal.onrender.com/api';
      const res = await fetch(`${apiBase}/student/resume`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `${user?.fullName || 'Resume'}_Resume.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setResumeError('Resume download failed');
    }
  };

  const getResumeName = () => {
    if (!user?.resumeFilename) return 'resume.pdf';
    try {
      const parts = user.resumeFilename.split('/');
      return decodeURIComponent(parts[parts.length - 1]);
    } catch {
      return 'resume.pdf';
    }
  };

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

      {/* Resume / CV Section */}
      <div className="sd-card" style={{ marginBottom: '1.5rem' }}>
        <div className="sd-card-title" style={{ justifyContent: 'space-between' }}>
          <span>📄 Resume / CV</span>
          {user?.hasResume && (
            <span className="sd-badge sd-badge-green">Active</span>
          )}
        </div>

        {resumeSuccess && <div className="sd-alert sd-alert-success" style={{ padding: '0.6rem 0.8rem', fontSize: '0.825rem', marginBottom: '1rem' }}>✓ {resumeSuccess}</div>}
        {resumeError   && <div className="sd-alert sd-alert-error" style={{ padding: '0.6rem 0.8rem', fontSize: '0.825rem', marginBottom: '1rem' }}>✕ {resumeError}</div>}

        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => { if (!uploading) fileInputRef.current?.click(); }}
          style={{
            border: dragActive 
              ? '2px dashed var(--sd-accent-light)' 
              : '2px dashed var(--sd-border)',
            borderRadius: '12px',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            background: dragActive 
              ? 'rgba(124, 58, 237, 0.08)' 
              : 'rgba(255, 255, 255, 0.01)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.8rem',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            if (!dragActive) {
              e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
            }
          }}
          onMouseLeave={(e) => {
            if (!dragActive) {
              e.currentTarget.style.borderColor = 'var(--sd-border)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          
          {uploading ? (
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--sd-muted)' }}>Uploading PDF resume...</span>
            </div>
          ) : user?.hasResume ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', width: '100%' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: '2.5rem' }}>📄</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--sd-text)', wordBreak: 'break-all', maxWidth: '80%' }}>
                {getResumeName()}
              </div>
              <div style={{ color: 'var(--sd-muted)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                Your resume is active. Drag & drop a new PDF here to replace it, or click the button below.
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button 
                  className="sd-btn sd-btn-outline" 
                  style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                  onClick={handlePreview}
                >
                  👁️ Preview
                </button>
                <button 
                  className="sd-btn sd-btn-outline" 
                  style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                  onClick={handleDownload}
                >
                  ⬇️ Download
                </button>
                <button 
                  className="sd-btn sd-btn-primary" 
                  style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: 'linear-gradient(135deg,#059669,#047857)' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  🔁 Replace Resume
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ fontSize: '2.5rem', color: 'var(--sd-muted)' }}>📤</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--sd-text)' }}>
                Drag & drop your Resume or CV here
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--sd-muted)' }}>
                or <span style={{ color: 'var(--sd-accent-light)', textDecoration: 'underline', fontWeight: 600 }}>browse your files</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--sd-muted)', marginTop: '0.2rem' }}>
                Supports PDF format only (Max 5MB)
              </div>
            </div>
          )}
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
