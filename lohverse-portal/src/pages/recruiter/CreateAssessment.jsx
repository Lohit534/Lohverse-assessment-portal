import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import '../RecruiterDashboard.css';

export default function CreateAssessment() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ai'); // 'manual' | 'ai'
  
  // Job list
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    title: '', description: '', durationMins: 60,
    passingMarks: 40, totalMarks: 100, jobId: '',
  });

  // AI Form State
  const [aiForm, setAiForm] = useState({
    title: '', description: '', topic: '', difficulty: 'Medium',
    mcqCount: 5, codingCount: 1, durationMins: 60,
    passingMarks: 40, totalMarks: 100, jobId: '',
  });

  // Global UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // AI Generation Terminal/Console States
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);
  
  // Custom Premium Modal State
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'confirm', onConfirm: null });

  const renderModal = () => {
    if (!modal.show) return null;
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(10, 7, 28, 0.85)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.25s ease-out'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1b163a 0%, #110d29 100%)',
          border: '1px solid #7c3aed',
          borderRadius: '16px', padding: '2rem', maxWidth: '420px', width: '90%',
          boxShadow: '0 20px 50px rgba(124, 58, 237, 0.3)',
          animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {modal.type === 'confirm' ? '❓' : modal.type === 'error' ? '❌' : 'ℹ️'} {modal.title}
          </h3>
          <p style={{ fontSize: '0.95rem', color: 'rgba(200, 185, 230, 0.75)', lineHeight: 1.5, marginBottom: '1.75rem' }}>
            {modal.message}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            {modal.type === 'confirm' && (
              <button
                onClick={() => setModal(prev => ({ ...prev, show: false }))}
                className="rp-btn rp-btn-outline"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => {
                if (modal.onConfirm) modal.onConfirm();
                setModal(prev => ({ ...prev, show: false }));
              }}
              className="rp-btn rp-btn-primary"
              style={{
                padding: '0.5rem 1.25rem', fontSize: '0.85rem',
                background: modal.type === 'error' ? '#ef4444' : 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)',
                border: 'none', cursor: 'pointer'
              }}
            >
              {modal.type === 'confirm' ? 'Confirm' : 'OK'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // AI Preview State
  const [generatedAssessment, setGeneratedAssessment] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [generatedCoding, setGeneratedCoding] = useState([]);
  const [previewActive, setPreviewActive] = useState(false);

  useEffect(() => {
    setLoadingJobs(true);
    API.get('/jobs/recruiter/all')
      .then(r => setJobs(r.data.jobs || []))
      .catch(() => {})
      .finally(() => setLoadingJobs(false));
  }, []);

  const setManual = (k, v) => setManualForm(p => ({ ...p, [k]: v }));
  const setAI = (k, v) => setAiForm(p => ({ ...p, [k]: v }));

  // Automatically update prompt topic when job is selected
  const handleAiJobChange = (jobId) => {
    setAI('jobId', jobId);
    if (!jobId) return;
    const selected = jobs.find(j => j.id === parseInt(jobId));
    if (selected) {
      setAI('title', `AI Assessment - ${selected.title}`);
      setAI('topic', `${selected.title} role, skills: ${selected.requiredSkills || ''}`);
      setAI('description', `Automated AI test covering core skills required for the ${selected.title} position at ${selected.companyName}.`);
    }
  };

  // ── MANUAL SUBMIT ──────────────────────────────────────────────────────────
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const payload = { ...manualForm, jobId: manualForm.jobId || null };
      const res = await API.post('/assessments/', payload);
      navigate(`/dashboard/assessments/${res.data.assessment.id}/questions`);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create assessment.');
    } finally {
      setLoading(false);
    }
  };

  // ── AI GENERATOR CONSOLE FLOW ──────────────────────────────────────────────
  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiForm.title.trim()) {
      setError('Please provide an assessment title.');
      return;
    }

    setLoading(true);
    setError('');
    setShowTerminal(true);
    setTerminalLogs([]);

    const logMessages = [
      { text: '📡 Initializing connection to Lohverse AI Core...', time: 400 },
      { text: '🔍 Analyzing job requirements and required candidate skills...', time: 1400 },
      { text: '🧠 Structuring question blueprints (difficulty: ' + aiForm.difficulty + ')...', time: 2400 },
      { text: '⚙️ Synthesizing dynamic MCQs with customized scoring weights...', time: 3600 },
      { text: '💻 Formulating HackerRank-style coding challenges and compiler test cases...', time: 4800 },
      { text: '🛡️ Running internal AI sanity and schema validation check...', time: 6000 },
      { text: '🚀 Assessment successfully generated! Preparing interactive board...', time: 7000 },
    ];

    // Stream logs locally for premium effect
    logMessages.forEach(msg => {
      setTimeout(() => {
        setTerminalLogs(prev => [...prev, msg.text]);
      }, msg.time);
    });

    try {
      const payload = { ...aiForm, jobId: aiForm.jobId || null };
      // Make backend generation call
      const res = await API.post('/assessments/ai-generate', payload);
      
      // Delay transitioning until terminal logs complete
      setTimeout(() => {
        setGeneratedAssessment(res.data.assessment);
        
        // Fetch generated questions to let them review
        API.get(`/assessments/${res.data.assessment.id}/questions`).then(qRes => {
          setGeneratedQuestions(qRes.data.questions || []);
        });

        API.get(`/assessments/${res.data.assessment.id}/questions/coding`).then(cRes => {
          setGeneratedCoding(cRes.data.questions || []);
        });

        setPreviewActive(true);
        setShowTerminal(false);
        setLoading(false);
      }, 7300);

    } catch (e) {
      setTimeout(() => {
        setError(e.response?.data?.error || 'AI generation encountered an unexpected error.');
        setShowTerminal(false);
        setLoading(false);
      }, 3000);
    }
  };

  // ── PREVIEW EDIT HANDLERS ──────────────────────────────────────────────────
  const handleDeleteMCQ = (qid) => {
    setModal({
      show: true,
      title: 'Delete MCQ Question',
      message: 'Are you sure you want to permanently delete this multiple choice question from the assessment?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          await API.delete(`/assessments/${generatedAssessment.id}/questions/${qid}`);
          setGeneratedQuestions(prev => prev.filter(q => q.id !== qid));
        } catch {
          setModal({
            show: true,
            title: 'Delete Failed',
            message: 'Unable to delete the MCQ question. Please try again.',
            type: 'error'
          });
        }
      }
    });
  };

  const handleDeleteCoding = (qid) => {
    setModal({
      show: true,
      title: 'Delete Coding Challenge',
      message: 'Are you sure you want to permanently delete this coding challenge from the assessment?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          await API.delete(`/assessments/${generatedAssessment.id}/questions/coding/${qid}`);
          setGeneratedCoding(prev => prev.filter(c => c.id !== qid));
        } catch {
          setModal({
            show: true,
            title: 'Delete Failed',
            message: 'Unable to delete the coding challenge. Please try again.',
            type: 'error'
          });
        }
      }
    });
  };

  // If preview is active, render the gorgeous AI Interactive Review Board
  if (previewActive && generatedAssessment) {
    return (
      <div className="rp-page">
        <div className="rp-header">
          <div>
            <h1 className="rp-title">✨ AI Assessment Preview</h1>
            <p className="rp-sub">Review and edit the questions generated by Lohverse AI.</p>
          </div>
          <button className="rp-btn rp-btn-outline" onClick={() => navigate('/dashboard/assessments')}>
            ← Back to List
          </button>
        </div>

        <div className="rp-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1b163a 0%, #110d29 100%)', border: '1px solid #7c3aed' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="rp-badge" style={{ background: '#7c3aed', color: '#fff', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', display: 'inline-block' }}>
                AI-Generated Assessment
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>{generatedAssessment.title}</h2>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>{generatedAssessment.description}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase' }}>Duration</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#a78bfa' }}>{generatedAssessment.durationMins}m</div>
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.15)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase' }}>Passing Marks</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>{generatedAssessment.passingMarks} / {generatedAssessment.totalMarks}</div>
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.15)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase' }}>Questions</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {generatedQuestions.length + generatedCoding.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Generated MCQs Panel */}
        {generatedQuestions.length > 0 && (
          <div className="rp-card" style={{ marginBottom: '1.5rem' }}>
            <div className="rp-card-title">📝 Generated Multiple Choice Questions ({generatedQuestions.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {generatedQuestions.map((q, idx) => (
                <div key={q.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: '600', color: '#a78bfa' }}>Question {idx + 1} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>({q.marks} Marks)</span></span>
                    <button onClick={() => handleDeleteMCQ(q.id)} className="rp-btn-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', borderRadius: '4px', padding: '0.2rem 0.5rem' }}>
                      ✕ Remove
                    </button>
                  </div>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>{q.questionText}</p>
                  <div className="rp-grid-2" style={{ gap: '0.5rem' }}>
                    {['optionA', 'optionB', 'optionC', 'optionD'].map((optKey, oIdx) => {
                      const label = ['A', 'B', 'C', 'D'][oIdx];
                      const isCorrect = q.correctAnswer === ['a', 'b', 'c', 'd'][oIdx];
                      return (
                        <div key={optKey} style={{
                          padding: '0.6rem 1rem',
                          borderRadius: '6px',
                          border: isCorrect ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.05)',
                          background: isCorrect ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.01)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.9rem'
                        }}>
                          <span style={{
                            background: isCorrect ? '#10b981' : 'rgba(255,255,255,0.1)',
                            color: '#fff',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>{label}</span>
                          <span style={{ color: isCorrect ? '#10b981' : 'inherit' }}>{q[optKey]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generated Coding Questions Panel */}
        {generatedCoding.length > 0 && (
          <div className="rp-card" style={{ marginBottom: '1.5rem' }}>
            <div className="rp-card-title">💻 Generated Coding Challenges ({generatedCoding.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {generatedCoding.map((cq, idx) => (
                <div key={cq.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: '600', color: '#f59e0b' }}>Coding Challenge {idx + 1}: {cq.title} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>({cq.marks} Marks)</span></span>
                    <button onClick={() => handleDeleteCoding(cq.id)} className="rp-btn-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', borderRadius: '4px', padding: '0.2rem 0.5rem' }}>
                      ✕ Remove
                    </button>
                  </div>
                  <div style={{ opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Difficulty</div>
                  <span className={`rp-badge ${cq.difficulty.toLowerCase() === 'easy' ? 'rp-badge-success' : cq.difficulty.toLowerCase() === 'medium' ? 'rp-badge-warning' : 'rp-badge-danger'}`} style={{ marginBottom: '1rem', display: 'inline-block' }}>
                    {cq.difficulty}
                  </span>
                  
                  <div style={{ opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Problem Description</div>
                  <p style={{ margin: '0 0 1rem 0', whiteSpace: 'pre-line', fontSize: '0.95rem', opacity: 0.9 }}>{cq.description}</p>
                  
                  <div className="rp-grid-2" style={{ gap: '1rem', marginTop: '1rem' }}>
                    <div>
                      <div style={{ opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Sample Input</div>
                      <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontFamily: 'monospace', margin: 0, border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>{cq.sampleInput || '(Empty)'}</pre>
                    </div>
                    <div>
                      <div style={{ opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Sample Output</div>
                      <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontFamily: 'monospace', margin: 0, border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>{cq.sampleOutput || '(Empty)'}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/dashboard/assessments')} className="rp-btn rp-btn-primary" style={{ flex: 1, padding: '1rem' }}>
            ✓ Publish & Save Assessment
          </button>
          <button onClick={() => {
            setPreviewActive(false);
            setGeneratedAssessment(null);
            setGeneratedQuestions([]);
            setGeneratedCoding([]);
          }} className="rp-btn rp-btn-outline" style={{ padding: '1rem 2rem' }}>
            ⟳ Re-Generate
          </button>
        </div>
        {renderModal()}
      </div>
    );
  }

  return (
    <div className="rp-page">
      <div className="rp-header">
        <div>
          <h1 className="rp-title">📝 Create Assessment</h1>
          <p className="rp-sub">Add a new technical assessment to check candidates' expertise.</p>
        </div>
        <button className="rp-btn rp-btn-outline" onClick={() => navigate('/dashboard/assessments')}>← Back</button>
      </div>

      {error && <div className="rp-alert-error">✕ {error}</div>}

      {/* Tabs Menu */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem' }}>
        <button
          className={`rp-btn`}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'ai' ? '2px solid #7c3aed' : '2px solid transparent',
            color: activeTab === 'ai' ? '#7c3aed' : '#fff',
            fontWeight: activeTab === 'ai' ? 'bold' : 'normal',
            padding: '0.75rem 1.5rem',
            borderRadius: 0,
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('ai')}
        >
          ✨ AI Auto-Generate (Recommended)
        </button>
        <button
          className={`rp-btn`}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'manual' ? '2px solid #7c3aed' : '2px solid transparent',
            color: activeTab === 'manual' ? '#7c3aed' : '#fff',
            fontWeight: activeTab === 'manual' ? 'bold' : 'normal',
            padding: '0.75rem 1.5rem',
            borderRadius: 0,
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('manual')}
        >
          📋 Manual Setup
        </button>
      </div>

      {/* ── TERMINAL LOGS SCREEN ── */}
      {showTerminal && (
        <div style={{
          background: '#0a071c',
          border: '1px solid #7c3aed',
          borderRadius: '8px',
          padding: '1.5rem',
          fontFamily: 'monospace',
          boxShadow: '0 0 20px rgba(124, 58, 237, 0.25)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
            <span style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '50%', display: 'inline-block' }}></span>
            <span style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '50%', display: 'inline-block' }}></span>
            <span style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
            <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: '1rem', fontSize: '0.85rem' }}>Lohverse AI Compiler Core v2.4</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
            {terminalLogs.map((log, i) => (
              <div key={i} style={{ color: log.includes('✕') ? '#ef4444' : log.includes('✓') || log.includes('🎉') ? '#10b981' : '#a78bfa', fontSize: '0.95rem' }}>
                {log.includes('✕') || log.includes('✓') || log.includes('🎉') || log.includes('📡') || log.includes('🔍') || log.includes('🧠') || log.includes('⚙️') || log.includes('💻') || log.includes('🛡️') ? '' : '> '}
                {log}
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#a78bfa' }}>&gt;</span>
              <span style={{ width: '8px', height: '15px', background: '#a78bfa', display: 'inline-block', animation: 'blink 1s step-end infinite' }}></span>
            </div>
          </div>
        </div>
      )}

      {/* ── TABS CONTENT ── */}
      {!showTerminal && activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit}>
          <div className="rp-card" style={{ marginBottom: '1.5rem' }}>
            <div className="rp-card-title">📋 Manual Assessment Details</div>
            <div className="rp-grid-2" style={{ gap: '1.25rem' }}>
              <div className="rp-field" style={{ gridColumn: 'span 2' }}>
                <label>Title *</label>
                <input value={manualForm.title} onChange={e => setManual('title', e.target.value)} placeholder="e.g. Java Backend Assessment" required />
              </div>
              <div className="rp-field" style={{ gridColumn: 'span 2' }}>
                <label>Description</label>
                <textarea value={manualForm.description} onChange={e => setManual('description', e.target.value)} placeholder="What will this test assess?" />
              </div>
              <div className="rp-field">
                <label>Duration (minutes)</label>
                <input type="number" min={5} max={300} value={manualForm.durationMins} onChange={e => setManual('durationMins', parseInt(e.target.value))} />
              </div>
              <div className="rp-field">
                <label>Total Marks</label>
                <input type="number" min={1} value={manualForm.totalMarks} onChange={e => setManual('totalMarks', parseInt(e.target.value))} />
              </div>
              <div className="rp-field">
                <label>Passing Marks</label>
                <input type="number" min={0} max={manualForm.totalMarks} value={manualForm.passingMarks} onChange={e => setManual('passingMarks', parseInt(e.target.value))} />
              </div>
              <div className="rp-field">
                <label>Assign to Job (optional)</label>
                <select value={manualForm.jobId} onChange={e => setManual('jobId', e.target.value)}>
                  <option value="">— Not linked to a job —</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title} ({j.companyName})</option>)}
                </select>
              </div>
            </div>
          </div>

          <button type="submit" className="rp-btn rp-btn-primary" disabled={loading}>
            {loading ? '⟳ Creating…' : '→ Create & Add Questions Manually'}
          </button>
        </form>
      )}

      {!showTerminal && activeTab === 'ai' && (
        <form onSubmit={handleAiSubmit}>
          <div className="rp-card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(124, 58, 237, 0.3)' }}>
            <div className="rp-card-title" style={{ color: '#a78bfa' }}>✨ Lohverse AI Settings</div>
            
            <div className="rp-field" style={{ marginBottom: '1.25rem' }}>
              <label>Link to Job Profile (Optional - AI automatically matches job skills!)</label>
              {loadingJobs ? (
                <div style={{ fontSize: '0.9rem', opacity: 0.6 }}>Loading jobs...</div>
              ) : (
                <select value={aiForm.jobId} onChange={e => handleAiJobChange(e.target.value)}>
                  <option value="">— Direct Generator (No job link) —</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title} ({j.companyName})</option>)}
                </select>
              )}
            </div>

            <div className="rp-grid-2" style={{ gap: '1.25rem' }}>
              <div className="rp-field" style={{ gridColumn: 'span 2' }}>
                <label>Assessment Title *</label>
                <input value={aiForm.title} onChange={e => setAI('title', e.target.value)} placeholder="e.g. AI-Generated Senior Java Developer Test" required />
              </div>
              
              <div className="rp-field" style={{ gridColumn: 'span 2' }}>
                <label>Skills / Topic Keywords *</label>
                <input value={aiForm.topic} onChange={e => setAI('topic', e.target.value)} placeholder="e.g. React hooks, Redux toolkit, Virtual DOM, JS performance" required />
                <span style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.25rem', display: 'block' }}>Type the core skills and subjects you want to assess.</span>
              </div>

              <div className="rp-field" style={{ gridColumn: 'span 2' }}>
                <label>Description</label>
                <textarea value={aiForm.description} onChange={e => setAI('description', e.target.value)} placeholder="AI will generate questions tailored to this test specification." />
              </div>

              <div className="rp-field">
                <label>MCQ Count</label>
                <input type="number" min={0} max={25} value={aiForm.mcqCount} onChange={e => setAI('mcqCount', parseInt(e.target.value) || 0)} />
              </div>

              <div className="rp-field">
                <label>Coding Challenges Count</label>
                <input type="number" min={0} max={5} value={aiForm.codingCount} onChange={e => setAI('codingCount', parseInt(e.target.value) || 0)} />
              </div>

              <div className="rp-field">
                <label>Target Difficulty</label>
                <select value={aiForm.difficulty} onChange={e => setAI('difficulty', e.target.value)}>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="rp-field">
                <label>Duration (minutes)</label>
                <input type="number" min={5} max={300} value={aiForm.durationMins} onChange={e => setAI('durationMins', parseInt(e.target.value) || 60)} />
              </div>

              <div className="rp-field">
                <label>Total Assessment Marks</label>
                <input type="number" min={1} value={aiForm.totalMarks} onChange={e => setAI('totalMarks', parseInt(e.target.value) || 100)} />
              </div>

              <div className="rp-field">
                <label>Passing Marks</label>
                <input type="number" min={0} max={aiForm.totalMarks} value={aiForm.passingMarks} onChange={e => setAI('passingMarks', parseInt(e.target.value) || 40)} />
              </div>
            </div>
          </div>

          <button type="submit" className="rp-btn rp-btn-primary" style={{ background: 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>✨</span> Generate Assessment with AI
          </button>
        </form>
      )}

      {/* Embedded Terminal Animation Styles */}
      <style>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      {renderModal()}
    </div>
  );
}
