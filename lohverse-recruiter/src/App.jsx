import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToastContainer } from './components/Toast';

const RecruiterLogin    = lazy(() => import('./pages/RecruiterLogin'));
const RecruiterRegister = lazy(() => import('./pages/RecruiterRegister'));
const RecruiterDashboard = lazy(() => import('./pages/RecruiterDashboard'));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0d0d1a',color:'#a78bfa' }}>Loading…</div>;
  if (!user || user.role !== 'recruiter') return <Navigate to="/login" replace />;
  return children;
}

const Loader = () => (
  <div style={{ minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#0d0d1a',gap:'1rem' }}>
    <div style={{ width:48,height:48,borderRadius:'50%',border:'3px solid transparent',borderTopColor:'#7c3aed',borderRightColor:'#a78bfa',animation:'spin 0.9s linear infinite' }} />
    <span style={{ color:'#a78bfa',fontSize:'0.95rem',fontWeight:600 }}>Loading…</span>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export default function App() {
  const { user } = useAuth();

  return (
    <Suspense fallback={<Loader />}>
      <ToastContainer />
      <Routes>
        <Route path="/" element={user?.role === 'recruiter' ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        <Route path="/login"    element={<RecruiterLogin />} />
        <Route path="/register" element={<RecruiterRegister />} />
        <Route path="/dashboard/*" element={
          <ProtectedRoute><RecruiterDashboard /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
