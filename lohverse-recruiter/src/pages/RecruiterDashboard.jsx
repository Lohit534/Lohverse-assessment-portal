import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Overview        from './recruiter/Overview';
import Jobs            from './recruiter/Jobs';
import CreateJob       from './recruiter/CreateJob';
import EditJob         from './recruiter/EditJob';
import Assessments     from './recruiter/Assessments';
import CreateAssessment from './recruiter/CreateAssessment';
import QuestionBank    from './recruiter/QuestionBank';
import Candidates      from './recruiter/Candidates';
import CandidateDetail from './recruiter/CandidateDetail';
import Interviews       from './recruiter/Interviews';
import InterviewRoom    from './recruiter/InterviewRoom';
import JobApplicants    from './recruiter/JobApplicants';
import CourseManager    from './recruiter/CourseManager';
import './RecruiterDashboard.css';

const NAV = [
  { to: '/dashboard',             icon: '📊', label: 'Overview',    exact: true },
  { to: '/dashboard/jobs',        icon: '💼', label: 'Jobs' },
  { to: '/dashboard/assessments', icon: '📝', label: 'Assessments' },
  { to: '/dashboard/interviews',  icon: '📹', label: 'Interviews' },
  { to: '/dashboard/candidates',  icon: '👥', label: 'Candidates' },
  { to: '/dashboard/courses',     icon: '📚', label: 'Courses' },
];

export default function RecruiterDashboard() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'R';

  return (
    <div className={`rd2-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* SIDEBAR */}
      <aside className="rd2-sidebar">
        <div className="rd2-logo">
          <div className="rd2-logo-icon">L</div>
          <div>
            <div className="rd2-logo-name">Lohverse</div>
            <div className="rd2-logo-sub">Recruiter Console</div>
          </div>
        </div>

        <nav className="rd2-nav">
          {NAV.map(({ to, icon, label, exact }) => (
            <NavLink
              key={label}
              to={to}
              end={exact}
              className={({ isActive }) => `rd2-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="rd2-nav-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="rd2-sidebar-footer">
          <div className="rd2-user-chip">
            <div className="rd2-avatar">{initials}</div>
            <div className="rd2-user-info">
              <div className="rd2-user-name">{user?.fullName || 'Recruiter'}</div>
              <div className="rd2-user-email">{user?.email}</div>
            </div>
          </div>
          <button className="rd2-logout-btn" onClick={handleLogout}>
            <span>⎋</span> Logout
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="rd2-mobile-header">
        <button className="rd2-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <span /><span /><span />
        </button>
        <div className="rd2-mobile-logo">Lohverse Recruiter</div>
        <div className="rd2-avatar sm">{initials}</div>
      </header>

      {sidebarOpen && <div className="rd2-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* MAIN */}
      <main className="rd2-main">
        <Routes>
          <Route index           element={<Overview />} />
          <Route path="jobs"     element={<Jobs />} />
          <Route path="jobs/create" element={<CreateJob />} />
          <Route path="jobs/:id/edit" element={<EditJob />} />
          <Route path="assessments"   element={<Assessments />} />
          <Route path="assessments/create" element={<CreateAssessment />} />
          <Route path="assessments/:id/questions" element={<QuestionBank />} />
          <Route path="interviews"    element={<Interviews />} />
          <Route path="interview-room/:roomId" element={<InterviewRoom />} />
          <Route path="candidates"    element={<Candidates />} />
          <Route path="courses"       element={<CourseManager />} />
          <Route path="jobs/:jobId/applicants" element={<JobApplicants />} />
          <Route path="candidates/:id" element={<CandidateDetail />} />
          <Route path="*"            element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
