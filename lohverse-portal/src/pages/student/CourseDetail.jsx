import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/Toast';
import '../StudentDashboard.css';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('syllabus');
  const [expandedChapters, setExpandedChapters] = useState({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAssessmentId, setPendingAssessmentId] = useState(null);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourseDetail = async () => {
      try {
        const res = await API.get(`/courses/${id}`);
        setCourse(res.data.course);
      } catch (e) {
        setError('Failed to fetch course details');
      } finally {
        setLoading(false);
      }
    };
    fetchCourseDetail();
  }, [id]);

  const toggleChapter = (index) => {
    setExpandedChapters(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleStartAssessment = (assessmentId) => {
    if (!user) {
      setPendingAssessmentId(assessmentId);
      setShowAuthModal(true);
    } else {
      navigate(`/dashboard/assessments`);
      toast.info('Redirected to assessments page. Locate this assessment and start.');
    }
  };

  const handleAuthModalRedirect = (type) => {
    setShowAuthModal(false);
    if (type === 'login') {
      navigate('/login');
    } else {
      navigate('/register');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a14', color: '#a78bfa' }}>
        <span style={{ fontSize: '1.5rem', animation: 'spin 1s linear infinite' }}>⟳</span>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a14', color: '#fff' }}>
        <p style={{ color: '#ef4444', marginBottom: '1.5rem' }}>{error || 'Course not found'}</p>
        <button onClick={() => navigate('/courses')} style={{ background: '#7c3aed', border: 'none', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer' }}>Back to Courses</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ background: '#0a0a14', minHeight: '100vh', color: '#fff' }}>
      {/* Navbar */}
      <header className="lv-nav" style={{ background: 'rgba(10, 10, 20, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="lv-nav__inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto', padding: '1rem 2rem' }}>
          <div className="lv-nav__logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div className="lv-logo-icon" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>L</div>
            <div className="lv-logo-text" style={{ marginLeft: '0.75rem' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Lohverse</div>
              <div style={{ fontSize: '0.7rem', color: '#a78bfa' }}>LEARNING & PLACEMENT</div>
            </div>
          </div>
          <div className="lv-nav__actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="lv-btn-ghost" onClick={() => navigate('/courses')} style={{ color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer' }}>All Courses</button>
            {user ? (
              <>
                <button className="lv-btn-ghost" onClick={() => navigate('/dashboard/profile')} style={{ color: '#fff', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>My Dashboard</button>
                <button className="lv-btn-solid" onClick={logout} style={{ background: '#ef4444', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Log Out</button>
              </>
            ) : (
              <>
                <button className="lv-btn-ghost" onClick={() => navigate('/login')} style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>Sign In</button>
                <button className="lv-btn-solid" onClick={() => navigate('/register')} style={{ background: '#7c3aed', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Register</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section style={{ background: 'radial-gradient(ellipse at bottom, rgba(124, 58, 237, 0.08), transparent)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '4rem 0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              padding: '0.3rem 0.75rem',
              borderRadius: '12px',
              background: course.difficulty === 'advanced' ? 'rgba(239, 68, 68, 0.15)' : course.difficulty === 'intermediate' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: course.difficulty === 'advanced' ? '#f87171' : course.difficulty === 'intermediate' ? '#fbbf24' : '#34d399'
            }}>
              {course.difficulty}
            </span>
            <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>⏱ {course.duration || 'Self-paced'}</span>
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.3', marginBottom: '1rem', color: '#fff' }}>{course.title}</h1>
          <p style={{ color: '#d1d5db', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }}>{course.description || 'Master this program path.'}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>👤</div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Instructor</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600' }}>{course.instructor || 'Lohverse Faculty'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '2rem', paddingBottom: '0.5rem' }}>
          <button onClick={() => setActiveTab('syllabus')} style={{ background: 'none', border: 'none', color: activeTab === 'syllabus' ? '#a78bfa' : '#9ca3af', borderBottom: activeTab === 'syllabus' ? '2px solid #7c3aed' : 'none', padding: '0.5rem 1rem', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
            📚 Syllabus Curriculum
          </button>
          <button onClick={() => setActiveTab('assessments')} style={{ background: 'none', border: 'none', color: activeTab === 'assessments' ? '#a78bfa' : '#9ca3af', borderBottom: activeTab === 'assessments' ? '2px solid #7c3aed' : 'none', padding: '0.5rem 1rem', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
            📝 Assessments ({course.assessments?.length || 0})
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'syllabus' ? (
          <div>
            {(!course.syllabus || course.syllabus.length === 0) ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '3rem' }}>Syllabus contents are being prepared by faculty. Stay tuned!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {course.syllabus.map((chapter, idx) => {
                  const isExpanded = expandedChapters[idx];
                  return (
                    <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                      <div onClick={() => toggleChapter(idx)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', cursor: 'pointer', background: 'rgba(255, 255, 255, 0.01)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ color: '#a78bfa', fontWeight: '700', fontSize: '1.1rem' }}>{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}</span>
                          <span style={{ fontWeight: '600', fontSize: '1.05rem' }}>{chapter.title}</span>
                        </div>
                        <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>{isExpanded ? '▲' : '▼'}</span>
                      </div>
                      
                      {isExpanded && (
                        <div style={{ padding: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.04)', background: 'rgba(0,0,0,0.2)' }}>
                          <p style={{ color: '#d1d5db', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1rem' }}>{chapter.description}</p>
                          {chapter.topics && (
                            <div>
                              <h4 style={{ fontSize: '0.85rem', color: '#a78bfa', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '700' }}>Topics covered:</h4>
                              <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{chapter.topics}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            {(!course.assessments || course.assessments.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ color: '#9ca3af', fontSize: '1.05rem', marginBottom: '1rem' }}>No assessments are currently linked to this course.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {course.assessments.map(assess => (
                  <div key={assess.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '1.5rem' }}>
                    <div>
                      <span style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>{assess.assessmentType}</span>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginTop: '0.5rem', marginBottom: '0.5rem' }}>{assess.title}</h3>
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#9ca3af' }}>
                        <span>⏱ {assess.durationMins} mins</span>
                        <span>• Passing: {assess.passingMarks}/{assess.totalMarks}</span>
                        <span>• Questions: {assess.questionCount}</span>
                      </div>
                    </div>
                    <button onClick={() => handleStartAssessment(assess.id)} style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                      Start Assessment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Auth Modal */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#11111f', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: '16px', padding: '2.5rem', maxWidth: '450px', width: '90%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.75rem' }}>Sign Up to Start Assessment</h2>
            <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
              Attempting course assessments requires a free candidate profile. Create your profile to get proctored scores and matching placements.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={() => handleAuthModalRedirect('register')} style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>
                Create Free Account (Sign Up)
              </button>
              <button onClick={() => handleAuthModalRedirect('login')} style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>
                I already have an account (Log In)
              </button>
              <button onClick={() => setShowAuthModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', padding: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}