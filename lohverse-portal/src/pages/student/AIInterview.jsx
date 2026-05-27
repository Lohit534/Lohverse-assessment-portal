import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import '../StudentDashboard.css';

export default function AIInterview() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  
  // Read proctoring requirements from common local storage
  const cameraRequired = JSON.parse(localStorage.getItem('ai_camera_proctor') ?? 'true');
  const audioRequired = JSON.parse(localStorage.getItem('ai_audio_proctor') ?? 'true');

  const [cameraEnabled, setCameraEnabled] = useState(!cameraRequired && !audioRequired);
  const [stream, setStream] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [pdfName, setPdfName] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [transcript, setTranscript] = useState([]);
  
  // Past attempts history states
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedAI, setSelectedAI] = useState(null);
  const [aiDetails, setAiDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [applications, setApplications] = useState([]);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await API.get('/student/ai-interview/history');
      setHistory(res.data.history || []);
    } catch {}
    finally { setHistoryLoading(false); }
  };

  const handleDeleteHistory = async (aiId) => {
    if (!window.confirm("Are you sure you want to delete this AI Interview attempt record? This is permanent.")) return;
    try {
      await API.delete(`/student/ai-interview/${aiId}`);
      alert("AI Interview record deleted successfully!");
      loadHistory();
    } catch {
      alert("Failed to delete the record.");
    }
  };

  const handleViewDetails = async (aiId) => {
    setSelectedAI(aiId);
    setLoadingDetails(true);
    setAiDetails(null);
    try {
      const res = await API.get(`/student/ai-interview/${aiId}`);
      setAiDetails(res.data.interview);
    } catch {
      alert("Failed to load AI details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  // Fetch jobs for dropdown list & attempts history
  useEffect(() => {
    API.get('/student/applications')
      .then(r => {
        const apps = r.data.applications || [];
        setApplications(apps);
        setJobs(apps.map(a => a.job).filter(Boolean));
        if (apps.length > 0 && apps[0].job) {
          setSelectedJob(String(apps[0].job.id));
        }
      })
      .catch(() => {});
      
    loadHistory();
  }, []);

  const enableCamera = async () => {
    try {
      const constraints = {};
      if (cameraRequired) constraints.video = true;
      if (audioRequired) constraints.audio = true;

      if (!cameraRequired && !audioRequired) {
        setCameraEnabled(true);
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCameraEnabled(true);
      if (videoRef.current && cameraRequired) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (e) {
      alert(`Permission for ${[cameraRequired && 'camera', audioRequired && 'microphone'].filter(Boolean).join(' and ')} is required.`);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are accepted.');
      return;
    }
    setUploading(true);
    setTimeout(() => {
      setPdfUploaded(true);
      setPdfName(file.name);
      setUploading(false);
    }, 1200);
  };

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const mockQuestions = [
    "Tell me about a challenging programming conflict you solved and your complete reasoning behind it.",
    "Explain how you would design a rate limiter middleware for a high-traffic microservices backend architecture.",
    "What are the trade-offs of using SQL vs NoSQL databases in structured application environments?",
    "How do you optimize asynchronous API calls in a React web application to avoid state rendering errors?"
  ];

  const handleStartInterview = () => {
    if ((cameraRequired || audioRequired) && !cameraEnabled) {
      alert(`Please enable your ${[cameraRequired && 'camera', audioRequired && 'microphone'].filter(Boolean).join(' and ')} first.`);
      return;
    }
    setInterviewStarted(true);
  };

  const handleToggleAnswer = () => {
    if (isAnswering) {
      setIsAnswering(false);
      setTranscript(prev => [...prev, { q: mockQuestions[currentQuestion], a: speechText || "Simulated technical voice transcription answer accepted." }]);
      setSpeechText('');
      if (currentQuestion < mockQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        alert("AI Interview successfully completed! Recruiter has been notified.");
        setInterviewStarted(false);
        setCurrentQuestion(0);
        setTranscript([]);
      }
    } else {
      setIsAnswering(true);
      setSpeechText("Listening to audio feed...");
      let words = [
        "In my previous project,",
        " I implemented a scalable caching layer with Redis",
        " which dropped database queries by over 40%",
        " and improved concurrent page loads.",
        " I utilized optimized indexes and SQL joins to resolve structural lag."
      ];
      let i = 0;
      const interval = setInterval(() => {
        setSpeechText(prev => (prev === "Listening to audio feed..." ? "" : prev) + words[i]);
        i++;
        if (i >= words.length) clearInterval(interval);
      }, 900);
    }
  };

  if (interviewStarted) {
    return (
      <div className="sd-page" style={{ maxWidth: 800, animation: 'fadeUp 0.35s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 className="sd-page-title">🎙️ AI Interview Session</h1>
            <p className="sd-page-sub">Speak clearly into your microphone.</p>
          </div>
          <span className="sd-badge sd-badge-red" style={{ animation: 'pulse 1.5s infinite', fontWeight: 'bold' }}>● LIVE RECORDING</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Question panel */}
          <div className="sd-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--sd-accent-light)', textTransform: 'uppercase' }}>
              Question {currentQuestion + 1} of {mockQuestions.length}
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.5 }}>
              {mockQuestions[currentQuestion]}
            </h2>
            <div style={{ minHeight: '120px', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--sd-border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--sd-muted)', marginBottom: '0.5rem' }}>Real-time voice-to-text transcript:</div>
              <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.9rem', color: isAnswering ? 'var(--sd-accent-light)' : 'var(--sd-text)' }}>
                {speechText || "Click 'Start Speaking' and answer aloud..."}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
              <button 
                className="sd-btn" 
                onClick={handleToggleAnswer}
                style={{ 
                  background: isAnswering ? '#ef4444' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  fontWeight: 850
                }}
              >
                {isAnswering ? '⏹️ Stop Speaking & Save' : '🎙️ Start Speaking'}
              </button>
              <button className="sd-btn sd-btn-outline" onClick={() => setInterviewStarted(false)}>
                Quit Session
              </button>
            </div>
          </div>

          {/* Proctor Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ width: '100%', height: '180px', borderRadius: '14px', overflow: 'hidden', background: '#000', border: '2px solid var(--sd-accent)' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div className="sd-card" style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--sd-muted)', textAlign: 'center' }}>
              🟢 Proctor Feed Active<br />Webcam & Mic verified
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedJobObj = jobs.find(j => String(j.id) === String(selectedJob));
  const isJobCompleted = selectedJobObj && history.some(h => h.jobRole === selectedJobObj.title);
  
  // Find associated application to check assessment status
  const matchedApp = applications.find(a => a.job && String(a.job.id) === String(selectedJob));
  const hasAssessment = matchedApp?.hasAssessment;
  const assessmentPassed = matchedApp?.assessmentPassed;

  return (
    <div className="sd-page" style={{ maxWidth: 850, animation: 'fadeUp 0.35s ease both' }}>
      
      {/* Robot badge and title header */}
      <div className="sd-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(59,130,246,0.06))' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem' }}>
          🤖
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>AI Interview</h1>
        <p style={{ margin: 0, color: 'var(--sd-muted)', fontSize: '0.925rem', maxStyle: '560px', lineHeight: 1.6 }}>
          Select an open job role, upload your resume, and the AI Interviewer will focus on job-relevant concepts.
        </p>
      </div>

      {/* Main setup container */}
      <div className="sd-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 className="sd-card-title" style={{ margin: 0 }}>Upload Your Resume</h2>
        
        {/* Job Role select list */}
        <div className="sd-form-field">
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Select Job Role</label>
          {jobs.length > 0 ? (
            <select
              value={selectedJob}
              onChange={e => setSelectedJob(e.target.value)}
              style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', color: 'var(--sd-text)', border: '1px solid var(--sd-border)' }}
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id} style={{ background: '#0e111d' }}>{j.title} ({j.companyName})</option>
              ))}
            </select>
          ) : (
            <div style={{ padding: '0.875rem', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24', borderRadius: '10px', fontSize: '0.875rem' }}>
              Sorry, no job role is open currently.
            </div>
          )}
        </div>

        {/* Video feed element */}
        {(cameraRequired || audioRequired) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="sd-badge sd-badge-purple" style={{ alignSelf: 'flex-start' }}>
              PROCTOR SETUP {(!cameraRequired && audioRequired) ? '(Audio Only)' : (cameraRequired && !audioRequired) ? '(Video Only)' : ''}
            </label>
            
            <div style={{ width: '100%', height: cameraRequired ? '320px' : '120px', borderRadius: '14px', overflow: 'hidden', background: '#000', border: '1px solid var(--sd-border)', position: 'relative' }}>
              {cameraRequired && (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraEnabled ? 'block' : 'none' }}
                />
              )}
              
              {!cameraEnabled ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: '#07070b' }}>
                  <span style={{ fontSize: cameraRequired ? '3rem' : '1.5rem' }}>{cameraRequired ? '📷' : '🎙️'}</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--sd-muted)' }}>
                    Enable {cameraRequired ? 'camera' : ''}{cameraRequired && audioRequired ? ' and ' : ''}{audioRequired ? 'microphone' : ''} to start interview
                  </span>
                  <button 
                    className="sd-btn" 
                    onClick={enableCamera}
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', position: 'absolute', top: '1rem', right: '1rem', padding: '0.5rem 1.25rem', fontSize: '0.8rem', borderRadius: '30px' }}
                  >
                    Enable
                  </button>
                </div>
              ) : (
                !cameraRequired && audioRequired && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem', color: '#10b981', fontWeight: 'bold' }}>
                    🎙️ Microphone feed verified & active
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {!cameraRequired && !audioRequired && (
          <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.06)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.9rem' }}>
            <span>✓</span> AI Interview Proctor checks (Camera & Audio) are bypassed by the recruiter. Ready to start!
          </div>
        )}

        {/* PDF Dotted Drag & Drop or Completed State */}
        {isJobCompleted ? (
          <div style={{
            padding: '2.5rem',
            textAlign: 'center',
            background: 'rgba(16,185,129,0.04)',
            border: '1px dashed rgba(16,185,129,0.4)',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '3rem' }}>✓</span>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#10b981' }}>AI Assessment Completed</span>
            <p style={{ margin: 0, color: 'var(--sd-muted)', fontSize: '0.85rem', maxWidth: '480px', lineHeight: 1.6 }}>
              You have already completed the AI Interview for the <strong>{selectedJobObj?.title}</strong> role. 
              Your evaluation scores, behavioral reports, and keyword responses have been saved securely in your student profile. 
              Retries are locked.
            </p>
          </div>
        ) : hasAssessment && !assessmentPassed ? (
          <div style={{
            padding: '2.5rem',
            textAlign: 'center',
            background: 'rgba(239,68,68,0.03)',
            border: '1px dashed rgba(239,68,68,0.3)',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '3rem' }}>🔒</span>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ef4444' }}>AI Interview Locked</span>
            <p style={{ margin: 0, color: 'var(--sd-muted)', fontSize: '0.85rem', maxWidth: '480px', lineHeight: 1.6 }}>
              The AI Interview (testing communication and soft skills) is locked for <strong>{selectedJobObj?.title}</strong>. 
              You must first complete and <strong>pass the required Job Assessment (MCQ / Coding test)</strong> before you can proceed to the AI Interview round.
            </p>
          </div>
        ) : (
          <>
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{ 
                border: '2px dashed var(--sd-border)', 
                borderRadius: '14px', 
                padding: '2.5rem', 
                textAlign: 'center', 
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.01)',
                transition: 'border-color 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--sd-accent)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--sd-border)'}
            >
              <span style={{ fontSize: '2.5rem', opacity: 0.8 }}>📤</span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {pdfUploaded ? `📄 Selected: ${pdfName}` : 'Click to upload PDF'}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--sd-muted)' }}>
                {uploading ? 'Analyzing PDF data match…' : pdfUploaded ? 'PDF loaded for AI parsing' : 'Maximum file size: 10MB'}
              </span>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".pdf" 
                style={{ display: 'none' }} 
                onChange={handleFileUpload} 
              />
            </div>

            {/* Start button */}
            <button 
              className="sd-btn" 
              disabled={!cameraEnabled || uploading}
              onClick={handleStartInterview}
              style={{ 
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', 
                color: 'white', 
                width: '100%', 
                padding: '1rem', 
                fontSize: '1rem', 
                borderRadius: '12px',
                boxShadow: cameraEnabled ? '0 4px 15px rgba(124,58,237,0.3)' : 'none',
                justifyContent: 'center'
              }}
            >
              🎙️ Start AI Interview
            </button>
          </>
        )}

        {/* Instructions Card */}
        <div className="sd-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--sd-border)', marginTop: '1.5rem' }}>
          <div className="sd-card-title" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--sd-text)' }}>💡 Important Interview Instructions</div>
          <ul style={{ color: 'var(--sd-muted)', fontSize: '0.8rem', lineHeight: 1.8, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: 0 }}>
            <li>Verify your internet connectivity and complete lighting before launching the session.</li>
            <li>If required, grant camera and microphone permissions to satisfy proctor specifications.</li>
            <li>Speak clearly and answer verbally; Gemini evaluates technical, communication, and confidence scores based on your transcript.</li>
            <li>Once complete, the evaluation is automatically saved, and your hiring profile is updated.</li>
          </ul>
        </div>

        {/* Past AI Interview Attempts list */}
        {history.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h2 className="sd-card-title" style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>📅 Your Past AI Interview Attempts</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {history.map(attempt => (
                <div key={attempt.id} className="sd-card" style={{ border: '1px solid var(--sd-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>AI Interview: {attempt.jobRole}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--sd-muted)', margin: '2px 0' }}>
                        Skills: {attempt.skills} • {attempt.difficulty} Level • Taken: {new Date(attempt.createdAt).toLocaleDateString('en-IN')}
                      </div>
                      {attempt.result && (
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                          <span className="sd-badge sd-badge-purple" style={{ fontSize: '0.7rem' }}>💻 Tech: {attempt.result.technicalScore}/100</span>
                          <span className="sd-badge sd-badge-blue" style={{ fontSize: '0.7rem' }}>🎙️ Comm: {attempt.result.communicationScore}/100</span>
                          <span className="sd-badge sd-badge-green" style={{ fontSize: '0.7rem' }}>⭐ Conf: {attempt.result.confidenceScore}/100</span>
                          <span className="sd-badge sd-badge-yellow" style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>🎯 {attempt.result.finalRecommendation}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button 
                        onClick={() => handleViewDetails(attempt.id)}
                        className="sd-btn" 
                        style={{ padding: '0.4rem 1.25rem', fontSize: '0.75rem', minHeight: 'auto' }}
                      >
                        📄 View Report
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Detailed Report Modal */}
        {selectedAI && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
          }}>
            <div className="sd-card" style={{ maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto', background: '#0e111d', border: '1px solid var(--sd-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--sd-border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <h3 className="sd-card-title" style={{ margin: 0 }}>🤖 AI Interview Feedback Report</h3>
                <button className="sd-btn" onClick={() => setSelectedAI(null)} style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', minHeight: 'auto' }}>✕ Close</button>
              </div>

              {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--sd-muted)' }}>⟳ Loading Gemini evaluation details…</div>
              ) : (
                aiDetails && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--sd-border)' }}>
                      <strong style={{ fontSize: '0.9rem' }}>{aiDetails.jobRole} AI Interview Details</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--sd-muted)', marginTop: '2px' }}>Skills: {aiDetails.skills} • {aiDetails.difficulty} Level</div>
                    </div>

                    {aiDetails.result ? (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                          <div style={{ background: 'rgba(124,58,237,0.04)', border: '1px solid var(--sd-border)', padding: '0.5rem', borderRadius: 8 }}>
                            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--sd-accent-light)' }}>{aiDetails.result.technicalScore}%</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--sd-muted)' }}>Technical</div>
                          </div>
                          <div style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid var(--sd-border)', padding: '0.5rem', borderRadius: 8 }}>
                            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#60a5fa' }}>{aiDetails.result.communicationScore}%</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--sd-muted)' }}>Communication</div>
                          </div>
                          <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid var(--sd-border)', padding: '0.5rem', borderRadius: 8 }}>
                            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#34d399' }}>{aiDetails.result.confidenceScore}%</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--sd-muted)' }}>Confidence</div>
                          </div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--sd-border)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--sd-muted)', fontWeight: 'bold' }}>Gemini Comprehensive Feedback</div>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--sd-text)', whiteSpace: 'pre-line' }}>{aiDetails.result.feedbackReport}</p>
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: '0.5rem', background: 'rgba(245,158,11,0.1)', color: '#fbbf24', fontSize: '0.8rem', borderRadius: 6, textAlign: 'center' }}>
                        ⚠️ Gemini grading evaluation results are still compiling.
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--sd-border)', paddingTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--sd-text)', marginBottom: '0.4rem' }}>Answer Logs & Expected Keywords</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                        {aiDetails.questions?.map((q, idx) => {
                          const ans = aiDetails.answers?.find(a => a.aiQuestionId === q.id);
                          return (
                            <div key={q.id} style={{ background: 'rgba(0,0,0,0.15)', padding: '0.6rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.02)' }}>
                              <div style={{ fontSize: '0.78rem', color: 'var(--sd-accent-light)', fontWeight: 'bold' }}>Question {idx+1}: {q.questionText}</div>
                              {q.expectedKeywords && <div style={{ fontSize: '0.68rem', color: '#fbbf24', margin: '2px 0' }}>Keywords: {q.expectedKeywords}</div>}
                              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', fontStyle: 'italic', color: 'var(--sd-text)' }}>
                                Answer transcript: "{ans?.transcript || 'Attempt recorded empty.'}"
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
