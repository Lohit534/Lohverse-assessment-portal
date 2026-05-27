import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';
import API from '../../api/axios';
import '../StudentDashboard.css';

// ── Animated circular progress ──────────────────────────────────────
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

// ── Skill pill ──────────────────────────────────────────────────────
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

export default function AIInsights() {
  const { user } = useAuth();
  const [jobs,     setJobs]     = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [ranking,  setRanking]  = useState(null);
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error,    setError]    = useState('');

  // Load jobs the student applied to
  useEffect(() => {
    API.get('/student/applications')
      .then(r => {
        const apps = r.data.applications || [];
        // Extract jobs from applications
        setJobs(apps.map(a => a.job).filter(Boolean));
        if (apps.length > 0 && apps[0].job) {
          setSelectedJob(String(apps[0].job.id));
        }
      })
      .catch(() => {});

    // Load profile for completeness & skills
    API.get('/auth/me')
      .then(r => setProfile(r.data.user))
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  // Fetch AI ranking for selected job
  useEffect(() => {
    if (!selectedJob) return;
    setLoading(true);
    setRanking(null);
    setError('');
    API.get(`/student/ai-ranking/${selectedJob}`)
      .then(r => setRanking(r.data))
      .catch(e => setError(e.response?.data?.error || 'AI ranking not available for this job.'))
      .finally(() => setLoading(false));
  }, [selectedJob]);

  // Profile completeness calculation (client-side mirror)
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

  const completeness = calcCompleteness(profile);

  // Profile radar data
  const radarData = profile ? [
    { subject: 'Basic Info',  value: [profile.fullName, profile.email, profile.phone, profile.address].filter(Boolean).length * 25 },
    { subject: 'Academic',    value: [profile.college, profile.course, profile.branch, profile.degree, profile.cgpa].filter(Boolean).length * 20 },
    { subject: 'Social',      value: [profile.linkedinUrl, profile.githubUrl].filter(Boolean).length * 50 },
    { subject: 'Resume',      value: profile.hasResume ? 100 : 0 },
    { subject: 'Skills',      value: profile.skills ? 100 : 0 },
    { subject: 'Certs/Proj',  value: ([profile.certifications, profile.projects !== '[]' ? profile.projects : null].filter(Boolean).length * 50) },
  ] : [];

  // Skill coverage bar data from ranking
  const skillBarData = ranking?.skillsGap ? [
    { name: 'Matched',  value: ranking.skillsGap.matchedSkills?.length || 0, fill: '#10b981' },
    { name: 'Missing',  value: ranking.skillsGap.missingSkills?.length || 0, fill: '#ef4444' },
  ] : [];

  return (
    <div className="sd-page" style={{ maxWidth: 980 }}>
      <div className="sd-page-header">
        <h1 className="sd-page-title">🤖 AI Insights</h1>
        <p className="sd-page-sub">Resume match, skill gap analysis, and AI-powered candidate ranking for your applications.</p>
      </div>

      {error && <div className="sd-alert sd-alert-error">✕ {error}</div>}

      {/* ── Profile Completeness Card ── */}
      {!loadingProfile && (
        <div className="sd-card" style={{ marginBottom: '1.5rem' }}>
          <div className="sd-card-title">🙍‍♂️ Profile Completeness</div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <CircleScore value={completeness} label="Profile Score" color={completeness >= 80 ? '#10b981' : completeness >= 50 ? '#f59e0b' : '#ef4444'} size={140} />
            <div style={{ flex: 1 }}>
              {/* Mini checklist */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { label: 'Full Name', done: !!profile?.fullName },
                  { label: 'Phone & Address', done: !!(profile?.phone && profile?.address) },
                  { label: 'College & Branch', done: !!(profile?.college && profile?.branch) },
                  { label: 'Degree & CGPA', done: !!(profile?.degree && profile?.cgpa) },
                  { label: 'LinkedIn Profile', done: !!profile?.linkedinUrl },
                  { label: 'GitHub Profile', done: !!profile?.githubUrl },
                  { label: 'Resume Uploaded', done: !!profile?.hasResume },
                  { label: 'Skills Listed', done: !!profile?.skills },
                  { label: 'Certifications', done: !!profile?.certifications },
                  { label: 'Projects Added', done: !!(profile?.projects && profile.projects !== '[]') },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                    <span style={{ color: item.done ? '#34d399' : '#6b6b9c', fontSize: '0.9rem' }}>
                      {item.done ? '✓' : '○'}
                    </span>
                    <span style={{ color: item.done ? 'var(--sd-text)' : 'var(--sd-muted)' }}>{item.label}</span>
                  </div>
                ))}
              </div>
              {completeness < 80 && (
                <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.875rem', background: 'rgba(245,158,11,0.1)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.25)', fontSize: '0.8rem', color: '#fbbf24' }}>
                  💡 Complete your profile to improve your AI ranking score. Each field boosts your match percentage.
                </div>
              )}
            </div>
            {radarData.length > 0 && (
              <div style={{ width: 220, height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(167,139,250,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(200,185,230,0.55)', fontSize: 9 }} />
                    <Radar name="Profile" dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Job Selector ── */}
      {jobs.length > 0 ? (
        <div className="sd-card" style={{ marginBottom: '1.5rem' }}>
          <div className="sd-card-title">💼 Select Job for AI Analysis</div>
          <select
            value={selectedJob}
            onChange={e => setSelectedJob(e.target.value)}
            style={{
              width: '100%', padding: '0.7rem 1rem',
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--sd-border)',
              borderRadius: 10, color: 'var(--sd-text)', fontSize: '0.9rem', outline: 'none',
            }}
          >
            {jobs.map(j => (
              <option key={j.id} value={j.id} style={{ background: '#1a1a2e' }}>
                {j.title} @ {j.companyName}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="sd-card" style={{ textAlign: 'center', padding: '2rem', marginBottom: '1.5rem', color: 'var(--sd-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💼</div>
          <div style={{ fontWeight: 700 }}>No job applications yet.</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Apply for jobs to unlock AI resume matching and candidate ranking.</div>
        </div>
      )}

      {/* ── AI Ranking Results ── */}
      {loading && (
        <div className="sd-loading" style={{ padding: '3rem' }}>
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
          Running AI analysis — comparing resume, skills, and assessment scores…
        </div>
      )}

      {ranking && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Overall score + metrics */}
          <div className="sd-card" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(167,139,250,0.05))' }}>
            <div className="sd-card-title">🏆 Overall AI Candidate Score</div>
            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'space-around', flexWrap: 'wrap', padding: '0.5rem 0' }}>
              <CircleScore value={ranking.overallScore}           label="Overall Score"  color="#a78bfa" size={150} />
              <CircleScore value={ranking.resumeMatchPct}         label="Resume Match"   color="#3b82f6" />
              <CircleScore value={ranking.assessmentScorePct}     label="Assessment"     color="#10b981" />
              <CircleScore value={ranking.skillMatchPct}          label="Skill Match"    color="#f59e0b" />
              <CircleScore value={ranking.profileCompletenessPct} label="Profile Score"  color="#ec4899" />
            </div>

            {/* Weight explanation */}
            <div style={{ marginTop: '1.25rem', padding: '0.875rem 1rem', background: 'rgba(0,0,0,0.15)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--sd-muted)' }}>
              <strong style={{ color: 'var(--sd-accent-light)' }}>Scoring Formula: </strong>
              Resume Match (30%) + Assessment Score (40%) + Skill Match (20%) + Profile Completeness (10%)
            </div>
          </div>

          {/* Resume Match Analysis */}
          <div className="sd-card">
            <div className="sd-card-title">📄 Resume Match Analysis</div>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <CircleScore value={ranking.resumeMatchPct} label="Resume Similarity" color="#3b82f6" />
              <div style={{ flex: 1, minWidth: 220 }}>
                <p style={{ color: 'var(--sd-muted)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '0.75rem' }}>
                  Your resume was analyzed using <strong style={{ color: 'var(--sd-text)' }}>TF-IDF Cosine Similarity</strong> against 
                  the job description. Keywords, skills, and domain terms were extracted and compared.
                </p>
                {ranking.resumeMatchPct === 0 && (
                  <div style={{ padding: '0.75rem', background: 'rgba(245,158,11,0.1)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.82rem', color: '#fbbf24' }}>
                    ⚠️ Your resume hasn't been uploaded yet, or the text couldn't be extracted. Upload a PDF resume to improve your match score.
                  </div>
                )}
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--sd-muted)', marginBottom: '0.35rem' }}>Match Score</div>
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

          {/* Skill Gap Analysis */}
          {ranking.skillsGap && (
            <div className="sd-card">
              <div className="sd-card-title">🎯 Skill Gap Analysis</div>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {/* Skill bar */}
                {skillBarData.length > 0 && (
                  <div style={{ width: 200 }}>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={skillBarData} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{ fill: 'rgba(200,185,230,0.55)', fontSize: 11 }} />
                        <YAxis tick={{ fill: 'rgba(200,185,230,0.55)', fontSize: 10 }} allowDecimals={false} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {skillBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--sd-muted)', marginTop: '0.25rem' }}>
                      Coverage: <strong style={{ color: 'var(--sd-text)' }}>{ranking.skillsGap.skillCoveragePct}%</strong>
                    </div>
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 260 }}>
                  {ranking.skillsGap.matchedSkills?.length > 0 && (
                    <div style={{ marginBottom: '0.875rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        ✓ Matched Skills ({ranking.skillsGap.matchedSkills.length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {ranking.skillsGap.matchedSkills.map(s => <SkillPill key={s} skill={s} matched />)}
                      </div>
                    </div>
                  )}

                  {ranking.skillsGap.missingSkills?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f87171', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        ✗ Skills to Develop ({ranking.skillsGap.missingSkills.length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {ranking.skillsGap.missingSkills.map(s => <SkillPill key={s} skill={s} matched={false} />)}
                      </div>
                    </div>
                  )}

                  {ranking.skillsGap.matchedSkills?.length === 0 && ranking.skillsGap.missingSkills?.length === 0 && (
                    <div style={{ color: 'var(--sd-muted)', fontSize: '0.85rem' }}>
                      No required skills listed for this job. Your profile skills: <br />
                      <span style={{ color: 'var(--sd-accent-light)' }}>{profile?.skills || 'None listed — update your profile.'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Improvement tips */}
          <div className="sd-card" style={{ background: 'rgba(124,58,237,0.06)', borderColor: 'rgba(124,58,237,0.2)' }}>
            <div className="sd-card-title">💡 How to Improve Your AI Score</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { cond: ranking.resumeMatchPct < 50,           tip: 'Update your resume PDF to include job-relevant keywords from the job description.' },
                { cond: ranking.assessmentScorePct < 70,       tip: 'Take the assessment linked to this job and aim for a higher score — it has the highest weight (40%).' },
                { cond: ranking.skillMatchPct < 60,            tip: 'Add missing required skills to your profile after developing them.' },
                { cond: ranking.profileCompletenessPct < 70,   tip: 'Complete your profile — fill in college, branch, LinkedIn, GitHub, skills, certifications.' },
                { cond: !profile?.hasResume,                   tip: 'Upload a PDF resume — it enables resume text extraction for AI matching.' },
                { cond: !profile?.linkedinUrl || !profile?.githubUrl, tip: 'Add your LinkedIn and GitHub URLs to your profile for completeness.' },
              ].filter(t => t.cond).slice(0, 4).map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--sd-muted)' }}>
                  <span style={{ color: '#f59e0b', flexShrink: 0 }}>→</span>
                  {t.tip}
                </div>
              ))}
              {ranking.overallScore >= 80 && (
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399' }}>
                  🎉 Excellent score! You're a strong candidate for this position.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
