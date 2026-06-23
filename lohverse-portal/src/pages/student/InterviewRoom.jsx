import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../StudentDashboard.css';

export default function InterviewRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLaunchCall = () => {
    if (!roomId) return;
    window.open(`https://meet.jit.si/${roomId}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="sd-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 180px)', animation: 'fadeUp 0.35s ease both' }}>
      <div className="sd-card" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--sd-border)', borderRadius: '16px' }}>
        
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
          📹
        </div>

        <div>
          <h1 className="sd-page-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 800 }}>Secure Video Call Lobby</h1>
          <p className="sd-page-sub" style={{ fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--sd-muted)' }}>
            You are invited to join the proctored interview session. For security, maximum reliability, and unlimited duration, we host calls in a secure browser tab.
          </p>
        </div>

        {/* Feature List */}
        <div style={{ width: '100%', textAlign: 'left', background: 'rgba(0, 0, 0, 0.15)', padding: '1rem', borderRadius: '10px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: '#34d399' }}>✓</span>
            <span style={{ color: 'var(--sd-text)' }}><strong>Unlimited Time</strong> (no 5-minute timeout limits)</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: '#34d399' }}>✓</span>
            <span style={{ color: 'var(--sd-text)' }}><strong>Fully Interactive</strong> (screen share, audio, video & chat)</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: '#34d399' }}>✓</span>
            <span style={{ color: 'var(--sd-text)' }}><strong>100% Free</strong> (no account or login required for guests)</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
          <button 
            className="sd-btn sd-btn-primary" 
            onClick={handleLaunchCall}
            style={{ flex: 1, padding: '0.75rem', justifyContent: 'center', fontSize: '0.9rem' }}
          >
            🚀 Launch Jitsi Call
          </button>
          <button 
            className="sd-btn sd-btn-outline" 
            onClick={() => navigate('/dashboard/interviews')}
            style={{ padding: '0.75rem 1.25rem', justifyContent: 'center', fontSize: '0.9rem' }}
          >
            Cancel
          </button>
        </div>

        <div style={{ fontSize: '0.72rem', color: 'var(--sd-muted)' }}>
          Please make sure to allow camera and microphone permissions in the new tab.
        </div>
      </div>
    </div>
  );
}
