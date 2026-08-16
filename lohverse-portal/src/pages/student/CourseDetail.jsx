import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import '../StudentDashboard.css';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedChapters, setExpandedChapters] = useState({});
  
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

      {/* Curriculum Accordion */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📚 Course Syllabus Curriculum
        </h2>
        
        {(!course.syllabus || course.syllabus.length === 0) ? (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '3rem' }}>Syllabus contents are being prepared by faculty. Stay tuned!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {course.syllabus.map((chapter, idx) => {
              const isExpanded = expandedChapters[idx];
              
              // Parse Leetcode Links
              const leetcodeList = chapter.leetcodeLinks
                ? chapter.leetcodeLinks.split(',').map(link => link.trim()).filter(Boolean)
                : [];

              return (
                <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', overflow: 'hidden', transition: 'all 0.3s' }}>
                  <div onClick={() => toggleChapter(idx)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', cursor: 'pointer', background: 'rgba(255, 255, 255, 0.01)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ color: '#a78bfa', fontWeight: '700', fontSize: '1.1rem' }}>{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}</span>
                      <span style={{ fontWeight: '600', fontSize: '1.05rem' }}>{chapter.title}</span>
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                  
                  {isExpanded && (
                    <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.04)', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      
                      <div>
                        <h4 style={{ fontSize: '0.85rem', color: '#a78bfa', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: '700' }}>Overview:</h4>
                        <p style={{ color: '#d1d5db', fontSize: '0.95rem', lineHeight: '1.6' }}>{chapter.description}</p>
                      </div>

                      {chapter.topics && (
                        <div>
                          <h4 style={{ fontSize: '0.85rem', color: '#a78bfa', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: '700' }}>Topics covered:</h4>
                          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{chapter.topics}</p>
                        </div>
                      )}

                      {/* GFG & LeetCode Professional Redirection Links */}
                      {(chapter.gfgLink || leetcodeList.length > 0) && (
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          {chapter.gfgLink && (
                            <a href={chapter.gfgLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#22c55e', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '700', textDecoration: 'none', transition: 'all 0.2s' }}>
                              <span>🟢</span> GeeksforGeeks Reference Course
                            </a>
                          )}
                          
                          {leetcodeList.map((link, lIdx) => {
                            // Extract problem name from URL for clean label
                            let problemName = `Practice Problem ${lIdx + 1}`;
                            try {
                              const pathParts = new URL(link).pathname.split('/').filter(Boolean);
                              if (pathParts[0] === 'problems' && pathParts[1]) {
                                problemName = pathParts[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                              }
                            } catch (e) {}

                            return (
                              <a key={lIdx} href={link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#eab308', color: '#000', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '700', textDecoration: 'none', transition: 'all 0.2s' }}>
                                <span>💻</span> {problemName} (LeetCode)
                              </a>
                            );
                          })}
                        </div>
                      )}

                      {chapter.studyMaterial && (
                        <div style={{ marginTop: '0.5rem', background: '#07070e', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '8px', padding: '1.5rem' }}>
                          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a78bfa', fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
                            📖 Chapter Tutorial Guide
                          </h4>
                          <div style={{ color: '#d1d5db', fontSize: '0.92rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', fontFamily: 'Courier New, monospace', background: 'rgba(255,255,255,0.01)', padding: '1rem', borderRadius: '6px' }}>
                            {chapter.studyMaterial}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}