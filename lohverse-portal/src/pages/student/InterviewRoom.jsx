import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../StudentDashboard.css';

export default function InterviewRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [jitsiLoaded, setJitsiLoaded] = useState(false);
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
        script.src = 'https://meet.jit.si/external_api.js';
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

    const domain = 'meet.jit.si';
    const options = {
      roomName: roomId,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: user?.fullName || 'Student Candidate'
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
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
      alert("You have left the interview conference room.");
      navigate('/dashboard/interviews');
    });

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
    };
  }, [jitsiLoaded, roomId, user, navigate]);

  return (
    <div className="sd-page" style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column', animation: 'fadeUp 0.35s ease both', paddingBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <h1 className="sd-page-title" style={{ fontSize: '1.25rem', margin: 0 }}>📹 Live Interview call</h1>
          <p className="sd-page-sub" style={{ margin: 0, fontSize: '0.75rem' }}>One-to-One Embedded Jitsi Video Session</p>
        </div>
        <button 
          className="sd-btn sd-btn-outline" 
          onClick={() => {
            if (window.confirm("Are you sure you want to leave the live interview call?")) {
              navigate('/dashboard/interviews');
            }
          }}
          style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', minHeight: 'auto' }}
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
          overflow: 'hidden',
          minHeight: '400px'
        }}
      />
    </div>
  );
}
