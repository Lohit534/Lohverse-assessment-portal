import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Profile       from './student/Profile';
import Resume        from './student/Resume';
import Assessments   from './student/Assessments';
import TakeAssessment from './student/TakeAssessment';
import Results       from './student/Results';
import Jobs          from './student/Jobs';
import AIInterview   from './student/AIInterview';
import Interviews    from './student/Interviews';
import InterviewRoom from './student/InterviewRoom';
import './StudentDashboard.css';

const TOP_NAV = [
  { to: '/dashboard/assessments', icon: '📋', label: 'My Tests' },
  { to: '/dashboard/interviews',  icon: '📹', label: 'Interviews' },
  { to: '/dashboard/ai-interview',icon: '🤖', label: 'AI Interview' },
  { to: '/dashboard/jobs',        icon: '💼', label: 'Job Board' },
  { to: '/dashboard/results',     icon: '📊', label: 'My Results' },
  { to: '/dashboard/profile',     icon: '👤', label: 'Profile' },
];

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Toggle Theme Class on body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [isDarkMode]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'S';

  const isTakingTest = location.pathname.includes('/dashboard/assessment/');
  const isAIInterview = location.pathname.includes('/dashboard/ai-interview');
  const isInterviewRoom = location.pathname.includes('/dashboard/interview-room');
  const isFocusMode = isAIInterview || isInterviewRoom;

  // Full proctored test environment layout (focus mode)
  if (isTakingTest) {
    return (
      <div className="sd-shell taking-test">
        <main className="sd-main-focus">
          <Routes>
            <Route path="assessment/:id" element={<TakeAssessment />} />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <div className={`sd-shell-top-nav ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      
      {/* ── DESKTOP & GLOBAL HEADER BAR ── */}
      <header className="sd-top-header">
        {isInterviewRoom ? (
          /* Specialized Interview Room back header */
          <div className="sd-header-left">
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to exit the interview call?")) {
                  navigate('/dashboard/interviews');
                }
              }}
              style={{ 
                background: 'transparent', border: 'none', color: 'var(--sd-text)', 
                fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                gap: '0.4rem', fontWeight: 600, marginRight: '1.25rem' 
              }}
            >
              &lt; Back to Lobby
            </button>
            <div className="sd-logo-container" style={{ borderLeft: '1px solid var(--sd-border)', paddingLeft: '1.25rem' }}>
              <div className="sd-logo-circle-gradient" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <span className="sd-logo-inner-s">📹</span>
              </div>
              <div>
                <div className="sd-header-title">Live Jitsi Call</div>
                <div className="sd-header-sub">Placement Screening Session</div>
              </div>
            </div>
          </div>
        ) : isAIInterview ? (
          /* Specialized AI Interview back arrow header */
          <div className="sd-header-left">
            <button 
              onClick={() => navigate('/dashboard/assessments')}
              style={{ 
                background: 'transparent', border: 'none', color: 'var(--sd-text)', 
                fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                gap: '0.4rem', fontWeight: 600, marginRight: '1.25rem' 
              }}
            >
              &lt; Dashboard
            </button>
            <div className="sd-logo-container" style={{ borderLeft: '1px solid var(--sd-border)', paddingLeft: '1.25rem' }}>
              <div className="sd-logo-circle-gradient">
                <span className="sd-logo-inner-s">S</span>
              </div>
              <div>
                <div className="sd-header-title">AI Interview</div>
              </div>
            </div>
          </div>
        ) : (
          /* Normal Dashboard header */
          <div className="sd-header-left">
            <div className="sd-logo-container">
              <div className="sd-logo-circle-gradient">
                <span className="sd-logo-inner-s">S</span>
              </div>
              <div>
                <div className="sd-header-title">Assessment Portal</div>
                <div className="sd-header-sub">Student Dashboard</div>
              </div>
            </div>
          </div>
        )}

        <div className="sd-header-right">
          <div className="sd-student-profile-chip">
            <div className="sd-welcome-text">Welcome, <strong style={{ color: 'var(--sd-text)' }}>{user?.fullName || 'Student'}</strong></div>
            <div className="sd-institution-text">
              {user?.college || 'BVC Group of Institutions, Amalapuram East Godavari - Andhra Pradesh'} — ID: {user?.id || '4578'}
            </div>
          </div>

          <button className="sd-theme-toggle-btn" title="Toggle Theme" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>

          <button className="sd-header-logout-btn" onClick={handleLogout}>
            <span className="sd-logout-icon">⎋</span> Logout
          </button>
        </div>
      </header>

      {/* ── HORIZONTAL CAPSULE TABS (Hidden when in focus mode) ── */}
      {!isFocusMode && (
        <nav className="sd-horizontal-tab-bar">
          <div className="sd-horizontal-tabs-scroll">
            {TOP_NAV.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `sd-capsule-tab-item ${isActive ? 'active' : ''}`}
              >
                <span className="sd-capsule-icon">{icon}</span>
                <span className="sd-capsule-label">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      {/* Backdrop */}
      {sidebarOpen && (
        <div className="sd-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="sd-main-top-layout">
        <div className="sd-page-content-wrapper">
          <Routes>
            <Route index                    element={<Navigate to="/dashboard/assessments" replace />} />
            <Route path="profile"           element={<Profile />} />
            <Route path="resume"            element={<Resume />} />
            <Route path="jobs"              element={<Jobs />} />
            <Route path="assessments"       element={<Assessments />} />
            <Route path="interviews"        element={<Interviews />} />
            <Route path="interview-room/:roomId" element={<InterviewRoom />} />
            <Route path="results"           element={<Results />} />
            <Route path="ai-interview"      element={<AIInterview />} />
            <Route path="*"                 element={<Navigate to="/dashboard/assessments" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
