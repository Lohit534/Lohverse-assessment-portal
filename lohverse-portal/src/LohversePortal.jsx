import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from './api/axios';
import './LohversePortal.css';

const features = [
  {
    icon: '🛡️',
    title: 'Secure Proctored Exams',
    desc: 'AI-powered proctoring ensures exam integrity with real-time monitoring.',
  },
  {
    icon: '📊',
    title: 'Instant Analytics',
    desc: 'Get detailed performance breakdowns immediately after each assessment.',
  },
  {
    icon: '🎯',
    title: 'Skill-Based Matching',
    desc: 'Your results are matched with the best-fit job roles at top companies.',
  },
  {
    icon: '📜',
    title: 'Verified Certificates',
    desc: 'Earn blockchain-verified certificates to showcase your skills.',
  },
];

const steps = [
  { num: '01', title: 'Explore Paths', desc: 'Browse our curriculum tracks publicly and choose your specialization.' },
  { num: '02', title: 'Register Account', desc: 'Create your free Lohverse profile and upload your resume PDF.' },
  { num: '03', title: 'Solve Assessments', desc: 'Attempt coding challenges and MCQs on our split-screen editor.' },
  { num: '04', title: 'Get Shortlisted', desc: 'Top scorers are linked directly with recruiter search boards.' },
];

const stats = [
  { value: '50K+', label: 'Candidates Assessed' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '15K+', label: 'Jobs Applied' },
];

export default function LohversePortal({ onRegister, onSignIn }) {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/courses')
      .then(res => {
        setCourses(res.data.courses || []);
      })
      .catch(err => {
        console.error('Failed to load courses on landing page', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className={`lv-root ${darkMode ? 'dark' : ''}`}>
      {/* ── NAVBAR ── */}
      <header className="lv-nav">
        <div className="lv-nav__inner">
          <div className="lv-nav__logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="lv-logo-icon">
              <span>L</span>
            </div>
            <div className="lv-logo-text">
              <span className="lv-logo-main">Lohverse</span>
              <span className="lv-logo-sub">LEARNING & ASSESSMENT PORTAL</span>
            </div>
          </div>

          <nav className={`lv-nav__links ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#courses">Courses Track</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/courses'); }}>Syllabus</a>
          </nav>

          <div className="lv-nav__actions">
            <button className="lv-btn-icon" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button className="lv-btn-ghost" onClick={onSignIn}>Sign In</button>
            <button className="lv-btn-solid" onClick={onRegister}>Register Now</button>
            <button className="lv-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="lv-hero" id="home">
        <div className="lv-hero__left">
          <div className="lv-badge">
            <span className="lv-badge__dot" />
            Lohverse Learning & Assessments
          </div>

          <h1 className="lv-hero__title">
            Lohverse <span className="lv-hero__accent">Learning</span><br />Portal
          </h1>

          <p className="lv-hero__desc">
            Explore programming tracks, master multi-chapter syllabus paths, and benchmark your engineering skills with industry coding challenges.
          </p>

          <div className="lv-hero__ctas">
            <button className="lv-btn-primary" onClick={() => navigate('/courses')}>Explore Learning Tracks</button>
            <button className="lv-btn-outline" onClick={onRegister}>Sign Up & Take Exam</button>
          </div>

          <div className="lv-hero__checks">
            <span><span className="lv-check">✓</span> Self-Paced Courses</span>
            <span><span className="lv-check">✓</span> Monaco Code Runner</span>
            <span><span className="lv-check">✓</span> Direct Placement Connect</span>
          </div>
        </div>

        {/* Dynamic Available Courses instead of Assigned Tests */}
        <div className="lv-hero__right">
          <div className="lv-tests-card">
            <div className="lv-tests-card__header">
              <div className="lv-tests-icon">📚</div>
              <div>
                <h2>Featured Courses</h2>
                <p>Prepare for placement drives</p>
              </div>
              <span className="lv-active-badge" style={{ background: 'rgba(124, 58, 237, 0.15)', color: '#a78bfa' }}>Available</span>
            </div>

            <div className="lv-tests-list" style={{ minHeight: '240px' }}>
              {loading ? (
                <div style={{ color: '#a78bfa', textAlign: 'center', padding: '4rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
                  <span>Loading courses…</span>
                </div>
              ) : courses.length === 0 ? (
                <div style={{ color: '#9ca3af', textAlign: 'center', padding: '4rem 0' }}>
                  <p>No learning courses loaded.</p>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>Courses will seed dynamically when the server runs.</p>
                </div>
              ) : (
                courses.slice(0, 3).map(course => (
                  <div key={course.id} className="lv-test-item">
                    <div className="lv-test-tag" style={{
                      background: course.difficulty === 'advanced' ? 'rgba(239, 68, 68, 0.15)' : course.difficulty === 'intermediate' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: course.difficulty === 'advanced' ? '#f87171' : course.difficulty === 'intermediate' ? '#fbbf24' : '#34d399'
                    }}>
                      {course.difficulty}
                    </div>
                    <div className="lv-test-info">
                      <h3>{course.title}</h3>
                      <div className="lv-test-meta">
                        <span>⏱ {course.duration || 'Self-paced'}</span>
                        <span>• By {course.instructor || 'Lohverse Faculty'}</span>
                      </div>
                    </div>
                    <button className="lv-btn-start" onClick={() => navigate(`/courses/${course.id}`)} style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', width: 'auto', padding: '0.4rem 1rem' }}>
                      Explore
                    </button>
                  </div>
                ))
              )}
            </div>
            
            {!loading && courses.length > 3 && (
              <div style={{ textAlign: 'center', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                <button onClick={() => navigate('/courses')} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>
                  View All {courses.length} Courses →
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lv-hero__blob lv-blob1" />
        <div className="lv-hero__blob lv-blob2" />
      </section>

      {/* ── STATS ── */}
      <section className="lv-stats">
        {stats.map((s, i) => (
          <div className="lv-stat-item" key={i}>
            <span className="lv-stat-val">{s.value}</span>
            <span className="lv-stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── FEATURES ── */}
      <section className="lv-section lv-features-section" id="features">
        <div className="lv-section__label">Why Choose Us</div>
        <h2 className="lv-section__title">Everything You Need to <span className="lv-accent">Succeed</span></h2>
        <p className="lv-section__sub">Lohverse brings together cutting-edge technology and industry expertise to give candidates the best assessment experience.</p>

        <div className="lv-features-grid">
          {features.map((f, i) => (
            <div className="lv-feature-card" key={i}>
              <div className="lv-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ASSESSMENTS/COURSES SECTION ── */}
      <section className="lv-section lv-assess-section" id="courses">
        <div className="lv-section__label">Course Curriculum</div>
        <h2 className="lv-section__title">Available <span className="lv-accent">Learning Modules</span></h2>
        <p className="lv-section__sub">Browse and specializate in backend engineering, interactive frontends, or algorithm interview tracks.</p>

        <div className="lv-assess-grid">
          {[
            { icon: '🐍', cat: 'Python & ML Track', count: '4 Chapters', level: 'Intermediate to Expert' },
            { icon: '⚛️', cat: 'Frontend & React Track', count: '4 Chapters', level: 'Beginner to Expert' },
            { icon: '🧠', cat: 'Data Structures & Algorithmic Track', count: '4 Chapters', level: 'Advanced' },
          ].map((a, i) => (
            <div className="lv-assess-card" key={i} onClick={() => navigate('/courses')} style={{ cursor: 'pointer' }}>
              <span className="lv-assess-icon">{a.icon}</span>
              <h3>{a.cat}</h3>
              <p>{a.count}</p>
              <span className="lv-assess-level">{a.level}</span>
              <button className="lv-btn-explore" onClick={(e) => { e.stopPropagation(); navigate('/courses'); }}>Explore →</button>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lv-section lv-how-section" id="how-it-works">
        <div className="lv-section__label">Process</div>
        <h2 className="lv-section__title">How It <span className="lv-accent">Works</span></h2>
        <p className="lv-section__sub">Four simple steps from registration to your dream job placement.</p>

        <div className="lv-steps">
          {steps.map((s, i) => (
            <div className="lv-step" key={i}>
              <div className="lv-step__num">{s.num}</div>
              <div className="lv-step__connector" />
              <h3 className="lv-step__title">{s.title}</h3>
              <p className="lv-step__desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="lv-cta-banner">
        <div className="lv-cta-banner__inner">
          <h2>Ready to Kickstart Your Career?</h2>
          <p>Join 50,000+ candidates who have already taken the first step with Lohverse.</p>
          <div className="lv-cta-banner__btns">
            <button className="lv-btn-white" onClick={() => navigate('/courses')}>Start Learning Tracks</button>
            <button className="lv-btn-outline-white" onClick={onRegister}>Create Profile</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lv-footer">
        <div className="lv-footer__inner">
          <div className="lv-footer__brand">
            <div className="lv-logo-icon sm">
              <span>L</span>
            </div>
            <div>
              <div className="lv-logo-main">Lohverse</div>
              <div className="lv-logo-sub">SECURE LEARNING & PLACEMENT PORTAL</div>
            </div>
          </div>
          <p className="lv-footer__tagline">Empowering candidates. Enabling recruiters. Transforming careers.</p>

          <div className="lv-footer__links">
            <div className="lv-footer__col">
              <h4>Platform</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/courses'); }}>Learning Catalog</a>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Student Portal</a>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>Assessment Core</a>
            </div>
            <div className="lv-footer__col">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
            </div>
            <div className="lv-footer__col">
              <h4>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">Contact Us</a>
              <a href="#">Status</a>
            </div>
            <div className="lv-footer__col">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>

          <div className="lv-footer__bottom">
            <span>© 2026 Lohverse. All rights reserved.</span>
            <div className="lv-footer__socials">
              <a href="#" aria-label="Twitter">𝕏</a>
              <a href="#" aria-label="LinkedIn">in</a>
              <a href="#" aria-label="GitHub">⌥</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}