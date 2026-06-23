import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import '../RecruiterDashboard.css';

export default function InterviewRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [candidateName, setCandidateName] = useState('');

  // Fetch interview details to show candidate name
  useEffect(() => {
    const fetchInterviewDetails = async () => {
      try {
        const res = await API.get('/recruiter/interviews');
        const list = res.data.interviews || [];
        const match = list.find(i => i.roomId === roomId);
        if (match) {
          setCandidateName(match.candidateName || match.studentName || '');
        }
      } catch (e) {
        console.error("Failed to load interview details:", e);
      }
    };
    if (roomId) {
      fetchInterviewDetails();
    }
  }, [roomId]);

  const handleLaunchCall = () => {
    if (!roomId) return;
    window.open(`https://meet.jit.si/${roomId}`, '_blank', 'noopener,noreferrer');
  };

  const handleSubmitFeedback = async () => {
    setSavingFeedback(true);
    try {
      const res = await API.get('/recruiter/interviews');
      const list = res.data.interviews || [];
      const match = list.find(i => i.roomId === roomId);
      
      if (match) {
        await API.put(`/recruiter/interviews/${match.id}/feedback`, {
          rating,
          notes
        });
      }
      alert("Feedback saved! Directing back to Interviews...");
      navigate('/dashboard/interviews');
    } catch (e) {
      alert("Failed to submit feedback. Returning to dashboard...");
      navigate('/dashboard/interviews');
    } finally {
      setSavingFeedback(false);
    }
  };

  return (
    <div className="rp-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 180px)', animation: 'fadeUp 0.35s ease both' }}>
      <div className="rp-card" style={{ maxWidth: '550px', width: '100%', padding: '2.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--r-border)', borderRadius: '16px' }}>
        
        {/* Animated Camera Icon */}
        <div style={{
          width: '84px',
          height: '84px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(167, 139, 250, 0.15))',
          border: '1px solid rgba(167, 139, 250, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          boxShadow: '0 8px 24px rgba(124, 58, 237, 0.15)',
        }}>
          👥
        </div>

        <div>
          <h1 className="rp-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 800 }}>Recruiter Interview Lobby</h1>
          <p className="rp-sub" style={{ fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--r-muted)' }}>
            Conducting interview for {candidateName ? <strong>{candidateName}</strong> : 'the candidate'}. To bypass connection blocks and access all host/moderator features with unlimited duration, we host calls in a secure browser tab.
          </p>
        </div>

        {/* Feature List */}
        <div style={{ width: '100%', textAlign: 'left', background: 'rgba(0, 0, 0, 0.15)', padding: '1rem', borderRadius: '10px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: '#34d399' }}>✓</span>
            <span style={{ color: 'var(--r-text)' }}><strong>Unlimited Time</strong> (no 5-minute sandbox timeout limits)</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: '#34d399' }}>✓</span>
            <span style={{ color: 'var(--r-text)' }}><strong>Full Moderation</strong> (kick, mute, record, screen-share)</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: '#34d399' }}>✓</span>
            <span style={{ color: 'var(--r-text)' }}><strong>100% Free</strong> (no account setup required)</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
          <button 
            className="rp-btn rp-btn-primary" 
            onClick={handleLaunchCall}
            style={{ width: '100%', padding: '0.75rem', justifyContent: 'center', fontSize: '0.95rem' }}
          >
            🚀 Launch Jitsi Call
          </button>
          
          <button 
            className="rp-btn rp-btn-success" 
            onClick={() => setShowFeedbackModal(true)}
            style={{ width: '100%', padding: '0.75rem', justifyContent: 'center', fontSize: '0.95rem' }}
          >
            📝 Complete & Evaluate Candidate
          </button>
          
          <button 
            className="rp-btn rp-btn-outline" 
            onClick={() => navigate('/dashboard/interviews')}
            style={{ width: '100%', padding: '0.75rem', justifyContent: 'center', fontSize: '0.95rem' }}
          >
            Back to Dashboard
          </button>
        </div>

        <div style={{ fontSize: '0.72rem', color: 'var(--r-muted)' }}>
          Tip: Once the meeting tab is open, keep this lobby dashboard open in the background to submit candidate evaluation when done.
        </div>
      </div>

      {/* Recruiter Rating/Feedback Modal */}
      {showFeedbackModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }}>
          <div className="rp-card" style={{ maxWidth: '450px', width: '100%', background: '#12112a', border: '1px solid var(--r-border)' }}>
            <div className="rp-card-title">📝 Candidate Interview Feedback</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div className="rp-field">
                <label>Rating (1 - 10)</label>
                <select 
                  value={rating} 
                  onChange={e => setRating(parseInt(e.target.value))}
                  style={{ width: '100%', padding: '0.5rem', background: '#09090e', color: 'white', border: '1px solid var(--r-border)', borderRadius: '6px' }}
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1} - {i+1 === 10 ? 'Exceptional' : i+1 >= 7 ? 'Good' : i+1 >= 5 ? 'Average' : 'Poor'}</option>
                  ))}
                </select>
              </div>

              <div className="rp-field">
                <label>Evaluation Notes</label>
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Detail candidate technical skills, soft skills, and placement fit..."
                  style={{ width: '100%', height: '110px', background: '#09090e', color: 'white', border: '1px solid var(--r-border)', borderRadius: '6px', padding: '0.5rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button 
                  className="rp-btn rp-btn-success" 
                  disabled={savingFeedback}
                  onClick={handleSubmitFeedback}
                  style={{ flex: 1, padding: '0.6rem' }}
                >
                  {savingFeedback ? 'Saving…' : 'Submit & Complete'}
                </button>
                <button 
                  className="rp-btn rp-btn-outline" 
                  onClick={() => setShowFeedbackModal(false)}
                  style={{ flex: 1, padding: '0.6rem' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
