import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LohversePortal from './LohversePortal'
import Register from './Register'
import SignIn from './SignIn'
import { ToastContainer } from './components/Toast'
import './App.css'

// Lazy-loaded pages
const ForgotPassword   = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword    = lazy(() => import('./pages/ResetPassword'))
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'))
const Courses          = lazy(() => import('./pages/student/Courses'))
const CourseDetail     = lazy(() => import('./pages/student/CourseDetail'))

function HomeRedirect() {
  const { user } = useAuth()
  const navigate = useNavigate()
  if (user?.role === 'student') return <Navigate to="/dashboard/assessments" replace />
  return <LohversePortal
    onRegister={() => navigate('/register')}
    onSignIn={() => navigate('/login')}
  />
}

function RegisterPage() {
  const navigate = useNavigate()
  return <Register onBack={() => navigate('/')} />
}

function SignInPage() {
  const navigate = useNavigate()
  return <SignIn onBack={() => navigate('/')} onRegister={() => navigate('/register')} />
}

const Loader = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#0f0f1a', color: '#a78bfa',
    fontSize: '1.1rem', gap: '0.75rem'
  }}>
    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
    Loading…
  </div>
)

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <ToastContainer />
      <Routes>
        <Route path="/"                  element={<HomeRedirect />} />
        <Route path="/register"          element={<RegisterPage />} />
        <Route path="/login"             element={<SignInPage />} />
        <Route path="/forgot-password"   element={<ForgotPassword />} />
        <Route path="/reset-password"    element={<ResetPassword />} />
        <Route path="/courses"           element={<Courses />} />
        <Route path="/courses/:id"       element={<CourseDetail />} />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute requireRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
