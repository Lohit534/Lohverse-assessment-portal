import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import '../StudentDashboard.css';

export default function Interviews() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInterviews = async () => {
    setLoading(true);
    try {
      const res = await API.get('/student/interviews');
      setInterviews(res.data.interviews || []);
    } catch (e) {
      setError('Failed to fetch your scheduled interviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  if (loading) return <div className="sd-page" style={{ color: 'var(--sd-muted)', textAlign: 'center', padding: '4rem' }}>⟳ Loading interviews…</div>;

  return (
    <div className="sd-page" style={{ animation: 'fadeUp 0.35s ease both', maxWidth: 900 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="sd-page-title">📹 Video Interviews</h1>
        <p className="sd-page-sub">Join scheduled placement sessions directly inside your web console using Jitsi.</p>
      </div>

      {error && <div style={{ padding: '0.8rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>✕ {error}</div>}

      {interviews.length === 0 ? (
        <div className="sd-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 2rem', border: '1px solid var(--sd-border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.85 }}>📅</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--sd-text)', marginBottom: '0.5rem' }}>No Interviews Scheduled</h2>
          <p style={{ margin: 0, color: 'var(--sd-muted)', fontSize: '0.875rem', maxWidth: '400px', lineHeight: 1.5 }}>
            You don't have any live scheduled video interviews at the moment. Recruiters will email or update you once a session is booked.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {interviews.map(item => (
            <div key={item.id} className="sd-card" style={{ borderLeft: `4px solid ${item.status === 'completed' ? '#10b981' : 'var(--sd-accent)'}`, border: '1px solid var(--sd-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800 }}>
                    Interview with {item.recruiterName}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem', opacity: 0.85, color: 'var(--sd-muted)' }}>
                    <span>🏢 {item.companyName}</span>
                    <span>•</span>
                    <span>📅 {item.scheduledDate}</span>
                    <span>•</span>
                    <span>⏱ {item.scheduledTime}</span>
                  </div>
                  
                  {item.feedback && (
                    <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(16,185,129,0.04)', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.15)' }}>
                      <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>⭐ Recruiter Rating: {item.feedback.rating}/10</div>
                      {item.feedback.notes && <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--sd-text)' }}>Notes: {item.feedback.notes}</p>}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span className="sd-badge" style={{ 
                    background: item.status === 'completed' ? 'rgba(16,185,129,0.12)' : 'rgba(124,58,237,0.12)',
                    color: item.status === 'completed' ? '#10b981' : '#a78bfa',
                    border: `1px solid ${item.status === 'completed' ? 'rgba(16,185,129,0.3)' : 'rgba(124,58,237,0.3)'}`,
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}>
                    {item.status}
                  </span>
                  
                  {item.status !== 'completed' && (
                    <button 
                      className="sd-btn"
                      onClick={() => navigate(`/dashboard/interview-room/${item.roomId}`)}
                      style={{ 
                        background: 'linear-gradient(135deg, var(--sd-accent), var(--sd-accent-light))', 
                        color: 'white',
                        padding: '0.5rem 1.25rem', 
                        fontSize: '0.85rem',
                        fontWeight: 750
                      }}
                    >
                      🎙️ Enter Jitsi Room
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* General Guidelines */}
      <div className="sd-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--sd-border)' }}>
        <div className="sd-card-title" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--sd-text)' }}>Important Guidelines</div>
        <ul style={{ color: 'var(--sd-muted)', fontSize: '0.85rem', lineHeight: 1.8, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: 0 }}>
          <li>Grant webcam and microphone permission immediately upon entering the call.</li>
          <li>For premium visual output, please check your network and lighting setup.</li>
          <li>The interviewer will grade your feedback, technical acumen, and overall score directly.</li>
          <li>If disconnected, rejoin using the same link on this dashboard instantly.</li>
        </ul>
      </div>
    </div>
  );
}
