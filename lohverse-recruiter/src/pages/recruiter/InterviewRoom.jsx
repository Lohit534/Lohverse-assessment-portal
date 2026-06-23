import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import '../RecruiterDashboard.css';

export default function InterviewRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [jitsiLoaded, setJitsiLoaded] = useState(false);
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [savingFeedback, setSavingFeedback] = useState(false);
  
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);

  // Load Jitsi script dynamically
  useEffect(() => {
    const loadScript = () => {
      return new Promise((resolve) => {
        if (window.JitsiMeetExternalAPI) {
          resolve(true);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://meet.ffmuc.net/external_api.js';
        script.async = true;
        script.onload = () => resolve(true);
        document.body.appendChild(script);
      });
    };

    loadScript().then(() => {
      setJitsiLoaded(true);
    });
  }, []);

  // Initialize Jitsi Meet Iframe
  useEffect(() => {
    if (!jitsiLoaded || !jitsiContainerRef.current || !roomId) return;

    const domain = 'meet.ffmuc.net';
    const options = {
      roomName: roomId,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: user?.fullName || 'Recruiter'
      },
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: true,
        disableDeepLinking: true,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
      }
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);
    jitsiApiRef.current = api;

    // Listen to video call exit event
    api.addEventListener('videoConferenceLeft', () => {
      setShowFeedbackModal(true);
    });

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
    };
  }, [jitsiLoaded, roomId, user]);

  const handleSubmitFeedback = async () => {
    setSavingFeedback(true);
    try {
      // Find interview by room ID to submit feedback
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
    <div className="rp-page" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <h1 className="rp-title" style={{ fontSize: '1.25rem', margin: 0 }}>📹 Live Interview Room</h1>
          <p className="rp-sub" style={{ margin: 0, fontSize: '0.75rem' }}>One-to-One Embedded Jitsi Video Session</p>
        </div>
        <button 
          className="rp-btn rp-btn-outline" 
          onClick={() => {
            if (window.confirm("Are you sure you want to exit the meeting room?")) {
              setShowFeedbackModal(true);
            }
          }}
          style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
        >
          Exit Meeting
        </button>
      </div>

      {/* Embedded Iframe Container */}
      <div 
        ref={jitsiContainerRef} 
        id="jitsi-container"
        style={{ 
          flex: 1, 
          background: '#09090e', 
          borderRadius: '12px', 
          border: '1px solid var(--sd-border)',
          overflow: 'hidden'
        }}
      />

      {/* Recruiter Rating/Feedback Modal */}
      {showFeedbackModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }}>
          <div className="rp-card" style={{ maxWidth: '450px', width: '100%', background: '#12112a', border: '1px solid var(--sd-border)' }}>
            <div className="rp-card-title">📝 Candidate Interview Feedback</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div className="rp-field">
                <label>Rating (1 - 10)</label>
                <select 
                  value={rating} 
                  onChange={e => setRating(parseInt(e.target.value))}
                  style={{ width: '100%', padding: '0.5rem', background: '#09090e', color: 'white', border: '1px solid var(--sd-border)', borderRadius: '6px' }}
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
                  style={{ width: '100%', height: '110px', background: '#09090e', color: 'white', border: '1px solid var(--sd-border)', borderRadius: '6px', padding: '0.5rem' }}
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
                  onClick={() => navigate('/dashboard/interviews')}
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
