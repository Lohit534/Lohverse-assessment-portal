import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import '../StudentDashboard.css';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await API.get('/courses');
        setCourses(res.data.courses || []);
      } catch (e) {
        setError('Failed to fetch courses');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="dashboard-container" style={{ background: '#0a0a14', minHeight: '100vh', color: '#fff' }}>
      {/* Navbar */}
      <header className="lv-nav" style={{ background: 'rgba(10, 10, 20, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="lv-nav__inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto', padding: '1rem 2rem' }}>
          <div className="lv-nav__logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div className="lv-logo-icon" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>L</div>
            <div className="lv-logo-text" style={{ marginLeft: '0.75rem' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '0.5px' }}>Lohverse</div>
              <div style={{ fontSize: '0.7rem', color: '#a78bfa' }}>LEARNING & PLACEMENT</div>
            </div>
          </div>
          <div className="lv-nav__actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="lv-btn-solid" onClick={() => navigate('/')} style={{ background: '#7c3aed', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '500' }}>Back to Home</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <span style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '500', border: '1px solid rgba(124, 58, 237, 0.2)' }}>Syllabus & Career Track</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginTop: '1rem', background: 'linear-gradient(to right, #fff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Explore Learning Paths</h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', marginTop: '0.75rem' }}>Advance your programming expertise with structured chapters and benchmark assessments linked to top tech jobs.</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
            <span style={{ fontSize: '1.5rem', color: '#a78bfa', animation: 'spin 1s linear infinite' }}>⟳</span>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
            <p style={{ color: '#ef4444' }}>{error}</p>
          </div>
        ) : courses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>No courses are currently available. Check back soon!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
            {courses.map(course => (
              <div key={course.id} className="lv-assess-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '1.5rem', transition: 'all 0.3s ease', cursor: 'pointer' }} onClick={() => navigate(`/courses/${course.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '12px',
                    background: course.difficulty === 'advanced' ? 'rgba(239, 68, 68, 0.15)' : course.difficulty === 'intermediate' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: course.difficulty === 'advanced' ? '#f87171' : course.difficulty === 'intermediate' ? '#fbbf24' : '#34d399'
                  }}>
                    {course.difficulty}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>⏱ {course.duration || 'Self-paced'}</span>
                </div>
                
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', marginBottom: '0.75rem', lineHeight: '1.4' }}>{course.title}</h3>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.5', flexGrow: 1, marginBottom: '1.5rem' }}>
                  {course.description ? (course.description.length > 120 ? `${course.description.substring(0, 120)}...` : course.description) : 'No description provided.'}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.85rem', color: '#a78bfa', fontWeight: '500' }}>By {course.instructor || 'Lohverse Faculty'}</span>
                  <button className="lv-btn-explore" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500' }}>Explore →</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}