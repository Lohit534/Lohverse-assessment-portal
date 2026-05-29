import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';
import API from '../../api/axios';
import '../RecruiterDashboard.css';

// ── Animated circular progress score ──────────────────────────────────────
function CircleScore({ value, max = 100, label, color, size = 110 }) {
  const r = (size / 2) - 10;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.round((value / max) * 100));
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
        <text x={size/2} y={size/2 + 5} textAnchor="middle" fill="white" fontSize={16} fontWeight={900}>{pct}%</text>
      </svg>
      <span style={{ fontSize: '0.72rem', color: 'var(--r-muted)', fontWeight: 600, textAlign: 'center', maxWidth: size }}>{label}</span>
    </div>
  );
}

// ── Skill pill ──────────────────────────────────────────────────────
function SkillPill({ skill, matched }) {
  return (
    <span style={{
      padding: '0.25rem 0.65rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
      background: matched ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
      color:      matched ? '#34d399'              : '#f87171',
      border:     matched ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.25)',
      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
    }}>
      {matched ? '✓' : '✗'} {skill}
    </span>
  );
}

export default function AIMatch() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [rankings, setRankings] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Status updating
  const [updatingId, setUpdatingId] = useState(null);

  // Interview scheduling modal state
  const [schedModal, setSchedModal] = useState(null); // {candidateId, candidateName}
  const [schedForm, setSchedForm] = useState({ scheduledDate: '', scheduledTime: '' });
  const [scheduling, setScheduling] = useState(false);

  // Load all recruiter jobs on mount
  useEffect(() => {
    API.get('/jobs/recruiter/all')
      .then(res => {
        const activeJobs = res.data || [];
        setJobs(activeJobs);
        if (activeJobs.length > 0) {
          setSelectedJob(String(activeJobs[0].id));
        }
      })
      .catch(() => setError('Failed to load recruiter jobs.'))
      .finally(() => setLoadingJobs(false));
  }, []);

  // Fetch rankings whenever selectedJob changes
  useEffect(() => {
    if (!selectedJob) return;
    setLoadingRankings(true);
    setRankings([]);
    setSelectedCandidate(null);
    setError('');
    API.get(`/recruiter/jobs/${selectedJob}/rankings`)
      .then(res => {
        const ranks = res.data.rankings || [];
        setRankings(ranks);
        if (ranks.length > 0) {
          setSelectedCandidate(ranks[0]);
        }
      })
      .catch(e => setError(e.response?.data?.error || 'Failed to fetch AI rankings for this job.'))
      .finally(() => setLoadingRankings(false));
  }, [selectedJob]);

  // Handle Candidate Status Change (Shortlist / Reject)
  const handleStatusChange = async (studentId, status) => {
    setUpdatingId(studentId);
    try {
      await API.put(`/jobs/${selectedJob}/applicants/${studentId}`, { status });
      setRankings(prev => prev.map(r => {
        if (r.student.id === studentId) {
          const updated = { ...r, applicationStatus: status };
          if (selectedCandidate && selectedCandidate.student.id === studentId) {
            setSelectedCandidate(updated);
          }
          return updated;
        }
        return r;
      }));
      setSuccess(`Candidate successfully ${status}!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to update candidate status.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setUpdatingId(null);
    }
  };

  // Schedule Interview
  const handleScheduleInterview = async () => {
    if (!schedForm.scheduledDate || !schedForm.scheduledTime) {
      setError('Please fill in both date and time.');
      return;
    }
    setScheduling(true);
    try {
      await API.post('/recruiter/interviews', {
        candidateId: schedModal.candidateId,
        scheduledDate: schedForm.scheduledDate,
        scheduledTime: schedForm.scheduledTime,
      });
      setSuccess(`Video interview scheduled for ${schedModal.candidateName}`);
      setSchedModal(null);
      setSchedForm({ scheduledDate: '', scheduledTime: '' });
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to schedule interview.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setScheduling(false);
    }
  };

  // Profile Completeness calculation
  const calcCompleteness = (p) => {
    if (!p) return 0;
    let score = 0;
    const basics = [p.fullName, p.email, p.phone, p.address];
    score += basics.filter(Boolean).length * 6.25;
    const academic = [p.college, p.course, p.branch, p.degree, p.cgpa];
    score += academic.filter(Boolean).length * 5;
    const profiles = [p.linkedinUrl, p.githubUrl, p.resumeFilename];
    score += profiles.filter(Boolean).length * 6.66;
    if (p.skills)         score += 10;
    if (p.certifications) score += 10;
    if (p.projects && p.projects !== '[]') score += 10;
    return Math.min(100, Math.round(score));
  };

  const completeness = selectedCandidate ? calcCompleteness(selectedCandidate.student) : 0;

  // Radar Data for Candidate Profile Completeness
  const radarData = selectedCandidate?.student ? [
    { subject: 'Basic Info',  value: [selectedCandidate.student.fullName, selectedCandidate.student.email, selectedCandidate.student.phone, selectedCandidate.student.address].filter(Boolean).length * 25 },
    { subject: 'Academic',    value: [selectedCandidate.student.college, selectedCandidate.student.course, selectedCandidate.student.branch, selectedCandidate.student.degree, selectedCandidate.student.cgpa].filter(Boolean).length * 20 },
    { subject: 'Social',      value: [selectedCandidate.student.linkedinUrl, selectedCandidate.student.githubUrl].filter(Boolean).length * 50 },
    { subject: 'Resume',      value: selectedCandidate.student.resumeFilename ? 100 : 0 },
    { subject: 'Skills',      value: selectedCandidate.student.skills ? 100 : 0 },
    { subject: 'Certs/Proj',  value: ([selectedCandidate.student.certifications, selectedCandidate.student.projects !== '[]' ? selectedCandidate.student.projects : null].filter(Boolean).length * 50) },
  ] : [];

  // Skill Coverage Data for Bar Chart
  const skillBarData = selectedCandidate?.skillsGap ? [
    { name: 'Matched',  value: selectedCandidate.skillsGap.matchedSkills?.length || 0, fill: '#10b981' },
    { name: 'Missing',  value: selectedCandidate.skillsGap.missingSkills?.length || 0, fill: '#ef4444' },
  ] : [];

  return (
    <div className="rp-page">
      <div className="rp-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="rp-title">🤖 AI Match & Skill Gap Analyzer</h1>
          <p className="rp-sub">Compare candidate resumes, assess technical skill gaps, and review automatic scoring matches.</p>
        </div>
      </div>

      {error && <div className="rp-alert-error" style={{ marginBottom: '1rem' }}>✕ {error}</div>}
      {success && <div className="rp-badge rp-badge-green" style={{ marginBottom: '1rem', display: 'block', padding: '0.6rem', textAlign: 'center' }}>✓ {success}</div>}

      {/* ── Job Selector Dropdown ── */}
      <div className="rp-card" style={{ marginBottom: '1.5rem', border: '1px solid var(--r-border)' }}>
        <div className="rp-card-title" style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>💼</span> Select Job to Match Candidates
        </div>
        {loadingJobs ? (
          <div style={{ color: 'var(--r-muted)', fontSize: '0.85rem' }}>Loading active jobs…</div>
        ) : jobs.length > 0 ? (
          <select
            value={selectedJob}
            onChange={e => setSelectedJob(e.target.value)}
            style={{
              width: '100%', padding: '0.7rem 1rem',
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--r-border)',
              borderRadius: 10, color: 'var(--r-text)', fontSize: '0.9rem', outline: 'none',
              cursor: 'pointer'
            }}
          >
            {jobs.map(j => (
              <option key={j.id} value={j.id} style={{ background: '#12112a' }}>
                {j.title} ({j.applicationCount} Applicants)
              </option>
            ))}
          </select>
        ) : (
          <div style={{ color: 'var(--r-muted)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
            No jobs posted yet. Please create a job post first to run AI match scores.
          </div>
        )}
      </div>

      {/* ── Main Split View ── */}
      {!loadingRankings && rankings.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* LEFT SIDEBAR: Candidate List */}
          <div className="rp-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--r-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', borderBottom: '1px solid var(--r-border)', paddingBottom: '0.5rem' }}>
              Applicants ({rankings.length})
            </div>
            {rankings.map(r => {
              const active = selectedCandidate && selectedCandidate.student.id === r.student.id;
              const statusColor = r.applicationStatus === 'shortlisted' ? '#34d399' : r.applicationStatus === 'rejected' ? '#f87171' : '#a78bfa';
              return (
                <div
                  key={r.student.id}
                  onClick={() => setSelectedCandidate(r)}
                  style={{
                    padding: '0.75rem', borderRadius: 10, cursor: 'pointer',
                    background: active ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.02)',
                    border: active ? '1px solid var(--r-accent)' : '1px solid transparent',
                    transition: 'all 0.2s',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <div style={{ overflow: 'hidden', marginRight: '0.5rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: active ? 'white' : 'var(--r-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.student.fullName}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--r-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block'
                      }} />
                      {r.applicationStatus}
                    </div>
                  </div>
                  <div style={{
                    padding: '0.3rem 0.5rem', borderRadius: 8, background: 'rgba(124,58,237,0.1)',
                    border: '1px solid rgba(124,58,237,0.2)', fontSize: '0.78rem', fontWeight: 800, color: 'var(--r-accent-light)'
                  }}>
                    {r.overallScore}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT VIEW: Candidate Match Details */}
          {selectedCandidate && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Card 1: Overview Score Breakdown */}
              <div className="rp-card" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(167,139,250,0.04))', border: '1px solid rgba(124,58,237,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--r-border)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedCandidate.student.fullName}</h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--r-muted)' }}>{selectedCandidate.student.email} • {selectedCandidate.student.phone || 'No phone'}</p>
                  </div>
                  
                  {/* Decisions Action buttons */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {selectedCandidate.applicationStatus === 'rejected' ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--r-muted)', fontStyle: 'italic', padding: '0.4rem' }}>Candidate Rejected</span>
                    ) : selectedCandidate.applicationStatus === 'shortlisted' ? (
                      <>
                        <button
                          className="rp-btn"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', cursor: 'default' }}
                        >📋 Assessment Linked</button>
                        <button
                          className="rp-btn rp-btn-outline"
                          onClick={() => setSchedModal({ candidateId: selectedCandidate.student.id, candidateName: selectedCandidate.student.fullName })}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                        >📹 Schedule Interview</button>
                      </>
                    ) : (
                      <>
                        <button
                          className="rp-btn"
                          disabled={updatingId === selectedCandidate.student.id}
                          onClick={() => handleStatusChange(selectedCandidate.student.id, 'shortlisted')}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'rgba(16,185,129,0.13)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}
                        >✓ Shortlist</button>
                        <button
                          className="rp-btn"
                          disabled={updatingId === selectedCandidate.student.id}
                          onClick={() => handleStatusChange(selectedCandidate.student.id, 'rejected')}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
                        >✗ Reject</button>
                      </>
                    )}
                    <button
                      className="rp-btn rp-btn-outline"
                      onClick={() => navigate(`/dashboard/candidates/${selectedCandidate.student.id}`)}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                    >👤 Profile Details</button>
                  </div>
                </div>

                <div className="rp-card-title" style={{ fontSize: '0.85rem', color: 'var(--r-accent-light)', marginBottom: '1rem' }}>🏆 AI Ranking Overview Score</div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-around', flexWrap: 'wrap', padding: '0.5rem 0' }}>
                  <CircleScore value={selectedCandidate.overallScore}           label="Overall Score"  color="#a78bfa" size={120} />
                  <CircleScore value={selectedCandidate.resumeMatchPct}         label="Resume Match"   color="#3b82f6" />
                  <CircleScore value={selectedCandidate.assessmentScorePct}     label="Assessment"     color="#10b981" />
                  <CircleScore value={selectedCandidate.skillMatchPct}          label="Skill Match"    color="#f59e0b" />
                  <CircleScore value={completeness}                             label="Profile Score"  color="#ec4899" />
                </div>
              </div>

              {/* Card 2: Resume Similarity TF-IDF Match */}
              <div className="rp-card">
                <div className="rp-card-title">📄 Resume Match Analysis</div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <CircleScore value={selectedCandidate.resumeMatchPct} label="Cosine Similarity" color="#3b82f6" />
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <p style={{ color: 'var(--r-muted)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                      This candidate's resume PDF was parsed and scored using <strong>TF-IDF Cosine Similarity</strong> against the job description. Core toolsets, project achievements, and domain vocabulary were evaluated.
                    </p>
                    {!selectedCandidate.student.resumeFilename && (
                      <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.15)', fontSize: '#f87171', color: '#f87171', fontSize: '0.78rem' }}>
                        ⚠️ Candidate has not uploaded a PDF resume yet. Resume text similarity remains at 0%.
                      </div>
                    )}
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--r-muted)', marginBottom: '0.3rem' }}>Resume Match Score</div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 3, transition: 'width 1s ease',
                          width: `${selectedCandidate.resumeMatchPct}%`,
                          background: selectedCandidate.resumeMatchPct >= 70 ? '#10b981' : selectedCandidate.resumeMatchPct >= 40 ? '#f59e0b' : '#ef4444',
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Skill Gap Analysis */}
              {selectedCandidate.skillsGap && (
                <div className="rp-card">
                  <div className="rp-card-title">🎯 Skill Gap Analysis</div>
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    {/* Skill coverage bar */}
                    {skillBarData.length > 0 && (
                      <div style={{ width: 180 }}>
                        <ResponsiveContainer width="100%" height={110}>
                          <BarChart data={skillBarData} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                            <XAxis dataKey="name" tick={{ fill: 'rgba(200,185,230,0.5)', fontSize: 10 }} />
                            <YAxis tick={{ fill: 'rgba(200,185,230,0.5)', fontSize: 9 }} allowDecimals={false} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {skillBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--r-muted)', marginTop: '0.2rem' }}>
                          Skill Coverage: <strong style={{ color: 'var(--r-text)' }}>{selectedCandidate.skillsGap.skillCoveragePct}%</strong>
                        </div>
                      </div>
                    )}

                    {/* Skill list pills */}
                    <div style={{ flex: 1, minWidth: 240 }}>
                      {selectedCandidate.skillsGap.matchedSkills?.length > 0 && (
                        <div style={{ marginBottom: '0.8rem' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            ✓ Matched Skills ({selectedCandidate.skillsGap.matchedSkills.length})
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {selectedCandidate.skillsGap.matchedSkills.map(s => <SkillPill key={s} skill={s} matched />)}
                          </div>
                        </div>
                      )}

                      {selectedCandidate.skillsGap.missingSkills?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f87171', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            ✗ Missing Skills ({selectedCandidate.skillsGap.missingSkills.length})
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {selectedCandidate.skillsGap.missingSkills.map(s => <SkillPill key={s} skill={s} matched={false} />)}
                          </div>
                        </div>
                      )}

                      {selectedCandidate.skillsGap.matchedSkills?.length === 0 && selectedCandidate.skillsGap.missingSkills?.length === 0 && (
                        <div style={{ color: 'var(--r-muted)', fontSize: '0.8rem' }}>
                          No required skills listed for this job, or candidate profile has no listed skills.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Card 4: Completeness and Radar */}
              <div className="rp-card">
                <div className="rp-card-title">🙍‍♂️ Profile Completeness & Domain Balance</div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <CircleScore value={completeness} label="Completeness" color={completeness >= 80 ? '#10b981' : completeness >= 50 ? '#f59e0b' : '#ef4444'} size={110} />
                  
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                      {[
                        { label: 'Full Name', done: !!selectedCandidate.student.fullName },
                        { label: 'Phone & Address', done: !!(selectedCandidate.student.phone && selectedCandidate.student.address) },
                        { label: 'College & Branch', done: !!(selectedCandidate.student.college && selectedCandidate.student.branch) },
                        { label: 'Degree & CGPA', done: !!(selectedCandidate.student.degree && selectedCandidate.student.cgpa) },
                        { label: 'LinkedIn Url', done: !!selectedCandidate.student.linkedinUrl },
                        { label: 'GitHub Url', done: !!selectedCandidate.student.githubUrl },
                        { label: 'Resume Uploaded', done: !!selectedCandidate.student.resumeFilename },
                        { label: 'Skills Listed', done: !!selectedCandidate.student.skills },
                        { label: 'Certifications', done: !!selectedCandidate.student.certifications },
                        { label: 'Projects Linked', done: !!(selectedCandidate.student.projects && selectedCandidate.student.projects !== '[]') },
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
                          <span style={{ color: item.done ? '#34d399' : '#6b6b9c', fontSize: '0.85rem' }}>{item.done ? '✓' : '○'}</span>
                          <span style={{ color: item.done ? 'var(--r-text)' : 'var(--r-muted)' }}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {radarData.length > 0 && (
                    <div style={{ width: 180, height: 150 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="rgba(167,139,250,0.1)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(200,185,230,0.5)', fontSize: 8 }} />
                          <Radar name="Profile" dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.25} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      ) : !loadingRankings ? (
        <div className="rp-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--r-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👥</div>
          <div style={{ fontWeight: 700, color: 'var(--r-text)' }}>No Applicants for this Job yet</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>No candidates have applied to this position, or no matching records were found.</div>
        </div>
      ) : (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--r-accent-light)' }}>
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: '0.5rem' }}>⟳</span>
          Running deep AI scoring analysis and matching applicant resumes…
        </div>
      )}

      {/* ── INTERVIEW SCHEDULING MODAL ── */}
      {schedModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(13,13,26,0.8)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
          <div className="rp-card" style={{ width: 440, border: '1px solid var(--r-border)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', background: '#12112a' }}>
            <div className="rp-card-title" style={{ borderBottom: '1px solid var(--r-border)', paddingBottom: '0.6rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📹 Schedule Video Interview</span>
              <button
                onClick={() => setSchedModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--r-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >×</button>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--r-muted)', marginBottom: '0.25rem' }}>Candidate</div>
              <div style={{ fontWeight: 700, color: 'white' }}>{schedModal.candidateName}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--r-muted)', marginBottom: '0.35rem' }}>Date</label>
                <input
                  type="date"
                  value={schedForm.scheduledDate}
                  onChange={e => setSchedForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  style={{
                    width: '100%', padding: '0.55rem', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--r-border)', borderRadius: 8, color: 'white', fontSize: '0.85rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--r-muted)', marginBottom: '0.35rem' }}>Time</label>
                <input
                  type="time"
                  value={schedForm.scheduledTime}
                  onChange={e => setSchedForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  style={{
                    width: '100%', padding: '0.55rem', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--r-border)', borderRadius: 8, color: 'white', fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                className="rp-btn rp-btn-outline"
                onClick={() => setSchedModal(null)}
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
              >Cancel</button>
              <button
                className="rp-btn"
                onClick={handleScheduleInterview}
                disabled={scheduling}
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', background: 'var(--r-accent)' }}
              >
                {scheduling ? 'Scheduling…' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
