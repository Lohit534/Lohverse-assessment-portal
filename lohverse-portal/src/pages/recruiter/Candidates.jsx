import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import '../RecruiterDashboard.css';

export default function Candidates() {
  const navigate = useNavigate();
  
  // All Candidates List
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [branch, setBranch]         = useState('All');
  const [error, setError]           = useState('');

  // Job specific AI Ranking
  const [jobs, setJobs]             = useState([]);
  const [selectedJob, setSelectedJob] = useState('All'); // 'All' | jobId
  const [rankings, setRankings]     = useState([]);
  const [rankingLoading, setRankingLoading] = useState(false);

  useEffect(() => {
    // Fetch all candidates
    API.get('/recruiter/candidates')
      .then(r => setCandidates(r.data.candidates || []))
      .catch(() => setError('Failed to load candidates'))
      .finally(() => setLoading(false));

    // Fetch recruiter's jobs to populate the ranking selector
    API.get('/jobs/recruiter/all')
      .then(r => setJobs(r.data.jobs || []))
      .catch(() => {});
  }, []);

  // Fetch rankings when selected job changes
  useEffect(() => {
    if (selectedJob === 'All') {
      setRankings([]);
      return;
    }
    
    setRankingLoading(true);
    API.get(`/recruiter/jobs/${selectedJob}/rankings`)
      .then(r => {
        setRankings(r.data.rankings || []);
      })
      .catch(() => setError('Failed to load job-specific rankings'))
      .finally(() => setRankingLoading(false));
  }, [selectedJob]);

  const branches = ['All', 'CSE/IT', 'ECE', 'MEC', 'EEE'];

  // Filters for All Candidates
  const filteredAll = candidates.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      c.fullName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.college?.toLowerCase().includes(q) ||
      c.branch?.toLowerCase().includes(q);
      
    let matchBranch = branch === 'All';
    if (!matchBranch && c.branch) {
      const cb = c.branch.toLowerCase();
      if (branch === 'CSE/IT') {
        matchBranch = cb.includes('cse') || cb.includes('it') || cb.includes('computer') || cb.includes('information');
      } else if (branch === 'ECE') {
        matchBranch = cb.includes('ece') || cb.includes('electronics') || cb.includes('telecom');
      } else if (branch === 'MEC') {
        matchBranch = cb.includes('mec') || cb.includes('mech') || cb.includes('mechanical');
      } else if (branch === 'EEE') {
        matchBranch = cb.includes('eee') || cb.includes('electrical');
      } else {
        matchBranch = cb.includes(branch.toLowerCase());
      }
    }
    return matchSearch && matchBranch;
  });

  // Filters for AI Rankings
  const filteredRankings = rankings.filter(r => {
    const q = search.toLowerCase();
    const c = r.student || {};
    return !search ||
      c.fullName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.college?.toLowerCase().includes(q) ||
      c.branch?.toLowerCase().includes(q);
  });

  const exportCSV = () => {
    let rows = [];
    if (selectedJob === 'All') {
      rows = [
        ['Name', 'Email', 'Phone', 'College', 'Branch', 'CGPA', 'Resume'],
        ...filteredAll.map(c => [c.fullName, c.email, c.phone, c.college, c.branch, c.cgpa || '', c.hasResume ? 'Yes' : 'No']),
      ];
    } else {
      const jobTitle = jobs.find(j => String(j.id) === String(selectedJob))?.title || 'Job';
      rows = [
        ['Rank', 'Name', 'Email', 'College', 'Resume Match %', 'Assessment %', 'Skill Match %', 'Profile Completeness %', 'Overall AI Score %', 'Status'],
        ...filteredRankings.map((r, index) => [
          index + 1,
          r.student?.fullName || '',
          r.student?.email || '',
          r.student?.college || '',
          r.resumeMatchPct + '%',
          r.assessmentScorePct + '%',
          r.skillMatchPct + '%',
          r.profileCompletenessPct + '%',
          r.overallScore + '%',
          r.applicationStatus || 'Applied'
        ]),
      ];
    }

    const csvContent = rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `Lohverse_Candidates_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleUpdateStatus = async (studentId, status) => {
    if (selectedJob === 'All') return;
    try {
      await API.put(`/jobs/${selectedJob}/applicants/${studentId}`, { status });
      // Update local state
      setRankings(prev => prev.map(r => {
        if (r.studentId === studentId) {
          return { ...r, applicationStatus: status };
        }
        return r;
      }));
    } catch (e) {
      alert("Failed to update status.");
    }
  };

  if (loading) return <div className="rp-loading">⟳ Loading candidates database…</div>;

  return (
    <div className="rp-page">
      <div className="rp-header">
        <div>
          <h1 className="rp-title">👥 Candidates</h1>
          <p className="rp-sub">
            {selectedJob === 'All' 
              ? `${filteredAll.length} candidates registered in database` 
              : `${filteredRankings.length} applicants ranked by overall AI Score`}
          </p>
        </div>
        <button className="rp-btn rp-btn-outline" onClick={exportCSV}>
          📥 Export CSV Data
        </button>
      </div>

      {error && <div className="rp-alert-error">✕ {error}</div>}

      {/* Selector & Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        
        {/* Job selector for AI Ranking */}
        <div className="rp-field" style={{ margin: 0 }}>
          <select
            value={selectedJob}
            onChange={e => setSelectedJob(e.target.value)}
            style={{ width: '100%', height: '100%', background: 'rgba(124,58,237,0.15)', borderColor: 'rgba(124,58,237,0.35)', fontWeight: 700 }}
          >
            <option value="All">🔍 Show All Registered Candidates</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>🤖 Rank applicants: {j.title} ({j.companyName})</option>
            ))}
          </select>
        </div>

        {/* Global text search */}
        <div className="rp-field" style={{ margin: 0 }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search by name, email, college…"
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Branch filter (only applies when viewing All Candidates) */}
        {selectedJob === 'All' ? (
          <div className="rp-field" style={{ margin: 0 }}>
            <select
              value={branch}
              onChange={e => setBranch(e.target.value)}
              style={{ width: '100%', height: '100%' }}
            >
              {branches.map(b => <option key={b} value={b}>{b === 'All' ? 'All Branches' : b}</option>)}
            </select>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--r-accent-light)', fontSize: '0.85rem', fontWeight: 600 }}>
            💡 Weighted AI Score = 30% Resume Match + 40% Assessments + 20% Skills + 10% Profile
          </div>
        )}
      </div>

      {/* Main Ranking Display */}
      {selectedJob !== 'All' ? (
        rankingLoading ? (
          <div className="rp-loading">⟳ Calculating cosine similarity & ranking candidates…</div>
        ) : (
          /* JOB SPECIFIC AI RANKINGS TABLE */
          <div className="rp-card">
            <div className="rp-card-title">🤖 Candidate Ranking Board ({filteredRankings.length} Applicants)</div>
            <div className="rp-table-wrap">
              <table className="rp-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Rank</th>
                    <th>Candidate Details</th>
                    <th style={{ textAlign: 'center' }}>Resume Match</th>
                    <th style={{ textAlign: 'center' }}>Assessment</th>
                    <th style={{ textAlign: 'center' }}>Skills Gap</th>
                    <th style={{ textAlign: 'center' }}>Completeness</th>
                    <th style={{ textAlign: 'center' }}>Overall Score</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRankings.map((r, index) => {
                    const student = r.student || {};
                    const status = r.applicationStatus || 'applied';
                    const gap = r.skillsGap || { matchedSkills: [], missingSkills: [], skillCoveragePct: 0 };
                    
                    return (
                      <tr key={r.id}>
                        {/* Rank Badge */}
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: index === 0 ? '#fbbf24' : index === 1 ? '#d1d5db' : index === 2 ? '#b45309' : 'rgba(255,255,255,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '0.85rem', color: index <= 2 ? '#1e1b4b' : 'var(--r-text)'
                          }}>
                            {index + 1}
                          </span>
                        </td>
                        {/* Candidate details */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: '0.8rem', color: 'white', flexShrink: 0,
                            }}>{(student.fullName || 'C')[0]}</div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{student.fullName}</div>
                              <div style={{ fontSize: '0.725rem', color: 'rgba(200,185,230,0.5)' }}>{student.college} · {student.degree || 'B.Tech'}</div>
                            </div>
                          </div>
                        </td>
                        {/* Resume similarity bar */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: r.resumeMatchPct > 70 ? '#34d399' : r.resumeMatchPct > 40 ? '#fbbf24' : '#f87171' }}>
                              {r.resumeMatchPct}%
                            </span>
                            <div style={{ width: 70, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ width: `${r.resumeMatchPct}%`, height: '100%', background: r.resumeMatchPct > 70 ? '#10b981' : r.resumeMatchPct > 40 ? '#f59e0b' : '#ef4444' }} />
                            </div>
                          </div>
                        </td>
                        {/* Assessment score */}
                        <td style={{ textAlign: 'center' }}>
                          <span className="rp-badge rp-badge-yellow" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}>
                            {r.assessmentScorePct}%
                          </span>
                        </td>
                        {/* Skills match */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} title={`Matched: ${gap.matchedSkills?.join(', ')}\nMissing: ${gap.missingSkills?.join(', ')}`}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{gap.skillCoveragePct}% Match</span>
                            <span style={{ fontSize: '0.675rem', color: 'var(--r-muted)' }}>{gap.matchedSkills?.length} of {gap.matchedSkills?.length + gap.missingSkills?.length}</span>
                          </div>
                        </td>
                        {/* Completeness */}
                        <td style={{ textAlign: 'center', fontSize: '0.825rem', color: 'var(--r-muted)' }}>
                          {r.profileCompletenessPct}%
                        </td>
                        {/* Weighted Overall Score */}
                        <td style={{ textAlign: 'center' }}>
                          <strong style={{ fontSize: '1rem', color: 'var(--r-accent-light)' }}>
                            {r.overallScore}%
                          </strong>
                        </td>
                        {/* Application status */}
                        <td>
                          <span className={`rp-badge ${status === 'shortlisted' ? 'rp-badge-green' : status === 'rejected' ? 'rp-badge-red' : 'rp-badge-purple'}`} style={{ textTransform: 'capitalize' }}>
                            {status}
                          </span>
                        </td>
                        {/* Quick Recruiter shortlisting actions */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                            <button
                              className="rp-btn"
                              onClick={() => handleUpdateStatus(student.id, 'shortlisted')}
                              style={{ padding: '0.25rem 0.5rem', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              ✓ Shortlist
                            </button>
                            <button
                              className="rp-btn"
                              onClick={() => handleUpdateStatus(student.id, 'rejected')}
                              style={{ padding: '0.25rem 0.5rem', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              ✕ Reject
                            </button>
                            <button
                              className="rp-btn rp-btn-outline"
                              onClick={() => navigate(`/dashboard/candidates/${student.id}`)}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              View Profile
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRankings.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--r-muted)' }}>
                        No candidates have applied to this job yet. Rankings will appear once applications are received.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* DEFAULT VIEW: ALL CANDIDATES */
        <div className="rp-card">
          <div className="rp-card-title">📋 All Registered Candidates ({filteredAll.length})</div>
          <div className="rp-table-wrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>College</th>
                  <th>Branch</th>
                  <th>CGPA</th>
                  <th>Resume</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAll.map(c => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/dashboard/candidates/${c.id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.8rem', color: 'white', flexShrink: 0,
                        }}>{(c.fullName || 'C')[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(200,185,230,0.55)' }}>{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{c.college || '—'}</td>
                    <td>{c.branch || '—'}</td>
                    <td>{c.cgpa || '—'}</td>
                    <td><span className={`rp-badge ${c.hasResume ? 'rp-badge-green' : 'rp-badge-red'}`}>{c.hasResume ? '✓' : '✗'}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'rgba(200,185,230,0.55)' }}>
                      {new Date(c.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="rp-btn rp-btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                              onClick={() => navigate(`/dashboard/candidates/${c.id}`)}>
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredAll.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(200,185,230,0.5)' }}>No candidates found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
