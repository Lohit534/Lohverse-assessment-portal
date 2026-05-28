import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Cell
} from 'recharts';
import API from '../../api/axios';
import '../StudentDashboard.css';

// ── Animated circular progress score ──────────────────────────────────────
function CircleScore({ value, max = 100, label, color, size = 130 }) {
  const r = (size / 2) - 12;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.round((value / max) * 100));
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
        <text x={size/2} y={size/2 + 6} textAnchor="middle" fill="white" fontSize={20} fontWeight={900}>{pct}%</text>
      </svg>
      <span style={{ fontSize: '0.78rem', color: 'var(--sd-muted)', fontWeight: 600, textAlign: 'center', maxWidth: size }}>{label}</span>
    </div>
  );
}

// ── Skill badge/pill matching ──────────────────────────────────────────────
function SkillPill({ skill, matched }) {
  return (
    <span style={{
      padding: '0.3rem 0.75rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600,
      background: matched ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
      color:      matched ? '#34d399'              : '#f87171',
      border:     matched ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.25)',
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
    }}>
      {matched ? '✓' : '✗'} {skill}
    </span>
  );
}

export default function Resume() {
  const { user, refreshUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  // AI Insights State
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [ranking, setRanking] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  const hasResume = user?.hasResume;
  const token     = localStorage.getItem('accessToken');
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const resumeViewUrl = `${apiBase}/student/resume/view`;
  const resumeDownloadUrl = `${apiBase}/student/resume`;

  // Fetch applications for matching job selector
  useEffect(() => {
    API.get('/student/applications')
      .then(r => {
        const apps = r.data.applications || [];
        setJobs(apps.map(a => a.job).filter(Boolean));
        if (apps.length > 0 && apps[0].job) {
          setSelectedJob(String(apps[0].job.id));
        }
      })
      .catch(() => {});
  }, [hasResume]);

  // Fetch AI ranking analysis for selected job
  useEffect(() => {
    if (!selectedJob) return;
    setLoadingAnalysis(true);
    setRanking(null);
    setAnalysisError('');
    API.get(`/student/ai-ranking/${selectedJob}`)
      .then(r => setRanking(r.data))
      .catch(e => setAnalysisError(e.response?.data?.error || 'AI match rating is currently preparing.'))
      .finally(() => setLoadingAnalysis(false));
  }, [selectedJob, hasResume]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted.'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5 MB.'); return;
    }

    setUploading(true); setError(''); setSuccess('');
    const fd = new FormData();
    fd.append('resume', file);

    try {
      await API.post('/student/resume', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshUser();
      setSuccess('Resume uploaded successfully!');
      setPreviewUrl('');
    } catch (e) {
      setError(e.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    fetch(resumeDownloadUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `${user.fullName || 'Resume'}_Resume.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => setError('Download failed'));
  };

  const handlePreview = () => {
    fetch(resumeViewUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      })
      .catch(() => setError('Preview failed'));
  };

  // Profile completeness calculations based on active user context
  const calcCompleteness = (p) => {
    if (!p) return 0;
    let score = 0;
    const basics = [p.fullName, p.email, p.phone, p.address];
    score += basics.filter(Boolean).length * 6.25;
    const academic = [p.college, p.course, p.branch, p.degree, p.cgpa];
    score += academic.filter(Boolean).length * 5;
    const profiles = [p.linkedinUrl, p.githubUrl, p.hasResume];
    score += profiles.filter(Boolean).length * 6.66;
    if (p.skills)         score += 10;
    if (p.certifications) score += 10;
    if (p.projects && p.projects !== '[]') score += 10;
    return Math.min(100, Math.round(score));
  };

  const completeness = calcCompleteness(user);

  const radarData = user ? [
    { subject: 'Basic Info',  value: [user.fullName, user.email, user.phone, user.address].filter(Boolean).length * 25 },
    { subject: 'Academic',    value: [user.college, user.course, user.branch, user.degree, user.cgpa].filter(Boolean).length * 20 },
    { subject: 'Social',      value: [user.linkedinUrl, user.githubUrl].filter(Boolean).length * 50 },
    { subject: 'Resume',      value: user.hasResume ? 100 : 0 },
    { subject: 'Skills',      value: user.skills ? 100 : 0 },
    { subject: 'Certs/Proj',  value: ([user.certifications, user.projects && user.projects !== '[]' ? user.projects : null].filter(Boolean).length * 50) },
  ] : [];

  const skillBarData = ranking?.skillsGap ? [
    { name: 'Matched',  value: ranking.skillsGap.matchedSkills?.length || 0, fill: '#10b981' },
    { name: 'Missing',  value: ranking.skillsGap.missingSkills?.length || 0, fill: '#ef4444' },
  ] : [];

  return (
    <div className="sd-page" style={{ maxWidth: 1000, animation: 'fadeUp 0.35s ease both' }}>
      <div className="sd-page-header">
        <h1 className="sd-page-title">📄 Resume & AI Match Insights</h1>
        <p className="sd-page-sub">Upload your resume PDF and analyze job similarity metrics powered by AI matching.</p>
      </div>

      {success && <div className="sd-alert sd-alert-success">✓ {success}</div>}
      {error   && <div className="sd-alert sd-alert-error">✕ {error}</div>}

      {/* Status Card */}
      <div className="sd-card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '14px',
          background: hasResume ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${hasResume ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', flexShrink: 0,
        }}>
          {hasResume ? '📄' : '❌'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--sd-text)', marginBottom: '4px' }}>
            {hasResume ? 'Resume PDF Active' : 'No Resume Uploaded'}
          </div>
          <div style={{ color: 'var(--sd-muted)', fontSize: '0.875rem' }}>
            {hasResume
              ? `Filename: ${user.resumeFilename || 'resume.pdf'}`
              : 'Upload a PDF (max 5MB) to trigger automatic AI matching and apply for open positions.'}
          </div>
          {hasResume && (
            <span className="sd-badge sd-badge-green" style={{ marginTop: '0.5rem' }}>✓ System Validated</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {hasResume && (
            <>
              <button className="sd-btn sd-btn-outline" onClick={handlePreview}>
                👁️ Preview
              </button>
              <button className="sd-btn sd-btn-primary" onClick={handleDownload}>
                ⬇️ Download
              </button>
            </>
          )}
          <button
            className="sd-btn sd-btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={hasResume ? { background: 'linear-gradient(135deg,#059669,#047857)' } : {}}
          >
            {uploading ? '⌛ Uploading…' : hasResume ? '🔁 Replace PDF' : '⬆️ Upload Resume'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
        </div>
      </div>

      {/* Preview Embed */}
      {previewUrl && (
        <div className="sd-card" style={{ marginBottom: '1.5rem' }}>
          <div className="sd-card-title" style={{ justifyContent: 'space-between' }}>
            <span>👁️ PDF Reader Preview</span>
            <button className="sd-btn sd-btn-outline" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => setPreviewUrl('')}>Close Preview</button>
          </div>
          <iframe
            src={previewUrl}
            title="Resume Preview"
            style={{
              width: '100%', height: '70vh', borderRadius: '8px',
              border: '1px solid var(--sd-border)', background: '#fff',
            }}
          />
        </div>
      )}

      {/* ─── DYNAMIC AI INSIGHTS BLOCK ─── */}
      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '2rem 0 1rem 0', color: 'var(--sd-text)', borderBottom: '1px solid var(--sd-border)', paddingBottom: '0.5rem' }}>
        🤖 AI Profile & Resume Analysis
      </h2>

      {/* Profile Completeness Dashboard */}
      <div className="sd-card" style={{ marginBottom: '1.5rem' }}>
        <div className="sd-card-title">🙎‍♂️ Match Readiness & Profile Completeness</div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <CircleScore value={completeness} label="Profile Checklist Score" color={completeness >= 80 ? '#10b981' : completeness >= 50 ? '#f59e0b' : '#ef4444'} size={140} />
          
          <div style={{ flex: 1, minWidth: 260 }}>
            {/* Checklist */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {[
                { label: 'Full Name', done: !!user?.fullName },
                { label: 'Phone & Address', done: !!(user?.phone && user?.address) },
                { label: 'College & Branch', done: !!(user?.college && user?.branch) },
                { label: 'Degree & CGPA', done: !!(user?.degree && user?.cgpa) },
                { label: 'LinkedIn URL added', done: !!user?.linkedinUrl },
                { label: 'GitHub URL added', done: !!user?.githubUrl },
                { label: 'Resume PDF uploaded', done: !!user?.hasResume },
                { label: 'Skills listed', done: !!user?.skills },
                { label: 'Certifications', done: !!user?.certifications },
                { label: 'Projects added', done: !!(user?.projects && user.projects !== '[]') },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                  <span style={{ color: item.done ? '#34d399' : '#6b6b9c', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {item.done ? '✓' : '○'}
                  </span>
                  <span style={{ color: item.done ? 'var(--sd-text)' : 'var(--sd-muted)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {radarData.length > 0 && (
            <div style={{ width: 220, height: 180, display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(167,139,250,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--sd-muted)', fontSize: 9 }} />
                  <Radar name="Profile Strength" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Target Job Match selector */}
      {jobs.length > 0 ? (
        <div className="sd-card" style={{ marginBottom: '1.5rem' }}>
          <div className="sd-card-title">💼 Select Job description to match against</div>
          <select
            value={selectedJob}
            onChange={e => setSelectedJob(e.target.value)}
            style={{
              width: '100%', padding: '0.75rem 1rem',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--sd-border)',
              borderRadius: 10, color: 'var(--sd-text)', fontSize: '0.9rem', outline: 'none',
              cursor: 'pointer'
            }}
          >
            {jobs.map(j => (
              <option key={j.id} value={j.id} style={{ background: '#0e111d' }}>
                {j.title} @ {j.companyName}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="sd-card" style={{ textAlign: 'center', padding: '2.5rem', marginBottom: '1.5rem', color: 'var(--sd-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💼</div>
          <div style={{ fontWeight: 700 }}>No job applications yet.</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>AI Insights and skill matches will load dynamically as soon as you apply for jobs!</div>
        </div>
      )}

      {/* Analysis loader */}
      {loadingAnalysis && (
        <div className="sd-loading" style={{ padding: '2.5rem' }}>
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
          Updating TF-IDF cosine matching indexes and scores…
        </div>
      )}

      {analysisError && !loadingAnalysis && jobs.length > 0 && (
        <div className="sd-card" style={{ padding: '1.5rem', color: 'var(--sd-muted)', fontSize: '0.875rem' }}>
          💡 Match analysis pending: {analysisError}
        </div>
      )}

      {/* TF-IDF AI score matching panels */}
      {ranking && !loadingAnalysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Circular gauges cards */}
          <div className="sd-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(79, 70, 229, 0.05))' }}>
            <div className="sd-card-title">🏆 AI Target Candidate Score Card</div>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'space-around', flexWrap: 'wrap', padding: '0.5rem 0' }}>
              <CircleScore value={ranking.overallScore}           label="Overall Weighted" color="#818cf8" size={145} />
              <CircleScore value={ranking.resumeMatchPct}         label="Resume Cosine"   color="#3b82f6" />
              <CircleScore value={ranking.assessmentScorePct}     label="Assessments"     color="#10b981" />
              <CircleScore value={ranking.skillMatchPct}          label="Skills Coverage" color="#fbbf24" />
            </div>
            <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.15)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--sd-muted)' }}>
              <strong>AI Weight Scale: </strong> Resume Text similarity (30%) + Proctored assessments score (40%) + Profile skill matcher (20%) + Core checklist (10%)
            </div>
          </div>

          {/* Cosine similarity text analyzer */}
          <div className="sd-card">
            <div className="sd-card-title">📄 TF-IDF Resume Similarity Match</div>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <CircleScore value={ranking.resumeMatchPct} label="Similarity Index" color="#3b82f6" />
              <div style={{ flex: 1, minWidth: 260 }}>
                <p style={{ color: 'var(--sd-muted)', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 1rem 0' }}>
                  Our AI engine parsed your resume PDF and calculated a Cosine Similarity score against the target description. Adding technical tools and project keywords will boost this rating.
                </p>
                {ranking.resumeMatchPct === 0 && (
                  <div style={{ padding: '0.75rem', background: 'rgba(245,158,11,0.06)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.82rem', color: '#fbbf24' }}>
                    ⚠️ Cosine similarity is 0%. Upload an active resume PDF to trigger extraction.
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--sd-muted)', marginBottom: '0.35rem' }}>Similarity Match Coverage</div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 4, transition: 'width 1s ease',
                      width: `${ranking.resumeMatchPct}%`,
                      background: ranking.resumeMatchPct >= 70 ? '#10b981' : ranking.resumeMatchPct >= 40 ? '#f59e0b' : '#ef4444',
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skill gaps */}
          {ranking.skillsGap && (
            <div className="sd-card">
              <div className="sd-card-title">🎯 Skill Coverage & Gap Analyzer</div>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                
                {skillBarData.length > 0 && (
                  <div style={{ width: 180 }}>
                    <ResponsiveContainer width="100%" height={110}>
                      <BarChart data={skillBarData} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{ fill: 'var(--sd-muted)', fontSize: 10 }} />
                        <YAxis tick={{ fill: 'var(--sd-muted)', fontSize: 9 }} allowDecimals={false} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {skillBarData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--sd-muted)', marginTop: '0.25rem' }}>
                      Skills Covered: <strong>{ranking.skillsGap.skillCoveragePct}%</strong>
                    </div>
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 260 }}>
                  {ranking.skillsGap.matchedSkills?.length > 0 && (
                    <div style={{ marginBottom: '0.875rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                        ✓ Matched Skills ({ranking.skillsGap.matchedSkills.length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {ranking.skillsGap.matchedSkills.map(s => <SkillPill key={s} skill={s} matched />)}
                      </div>
                    </div>
                  )}

                  {ranking.skillsGap.missingSkills?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f87171', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                        ✗ Recommended Skills to Develop ({ranking.skillsGap.missingSkills.length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {ranking.skillsGap.missingSkills.map(s => <SkillPill key={s} skill={s} matched={false} />)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Tips */}
          <div className="sd-card" style={{ background: 'rgba(99, 102, 241, 0.04)', borderColor: 'rgba(99, 102, 241, 0.15)' }}>
            <div className="sd-card-title">💡 How to Improve your Candidate Rating</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { cond: ranking.resumeMatchPct < 55,           tip: 'Tweak your resume text to cover primary tools and key responsibilities stated in the job post.' },
                { cond: ranking.assessmentScorePct < 75,       tip: 'Excel in proctored tests! The test score holds the highest overall weight factor (40%).' },
                { cond: ranking.skillMatchPct < 60,            tip: 'Acquire high-demand missing skills and update your student profile tags.' },
                { cond: completeness < 80,                     tip: 'Make sure your basic personal, social links, and course data fields are 100% filled.' },
                { cond: !user?.hasResume,                      tip: 'Upload a clean text-based PDF resume so our TF-IDF parsers can index it.' },
              ].filter(t => t.cond).slice(0, 3).map((t, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--sd-muted)' }}>
                  <span style={{ color: '#fbbf24' }}>→</span>
                  {t.tip}
                </div>
              ))}
              {ranking.overallScore >= 80 && (
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399', marginTop: '0.25rem' }}>
                  🎉 Highly Recommended! Your profile is exceptionally matched for this job opening.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
