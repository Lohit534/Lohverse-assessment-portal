import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LohversePortal.css';

const tests = [
  {
    id: 1,
    title: 'Java Fundamentals Assessment',
    duration: '60 mins',
    questions: '25 Questions',
    attempts: '2 Attempts Remaining',
    availability: 'Available until Dec 31, 2026',
    status: 'start',
    tag: 'Java',
  },
  {
    id: 2,
    title: 'Data Structures Quiz',
    duration: '45 mins',
    questions: '20 Questions',
    status: 'Scheduled',
    availability: 'Available from jun 15, 2026',
    tag: 'DSA',
  },
  {
    id: 3,
    title: 'Full Stack Web Development',
    duration: '90 mins',
    questions: '35 Questions',
    status: 'Scheduled',
    availability: 'Available from jun 10, 2026',
    tag: 'Web',
  },
];

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
  { num: '01', title: 'Register', desc: 'Create your free Lohverse account and complete your candidate profile.' },
  { num: '02', title: 'Take Assessment', desc: 'Attempt your assigned tests securely from any device, anytime.' },
  { num: '03', title: 'Get Results', desc: 'Receive instant AI-analysed feedback and performance insights.' },
  { num: '04', title: 'Get Hired', desc: 'Top scorers are shortlisted and connected directly with recruiters.' },
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
  const [activeTab, setActiveTab] = useState('all');

  const filteredTests = activeTab === 'all' ? tests : tests.filter(t =>
    activeTab === 'available' ? t.status === 'start' : t.status === 'Scheduled'
  );

  return (
    <div className={`lv-root ${darkMode ? 'dark' : ''}`}>
      {/* ── NAVBAR ── */}
      <header className="lv-nav">
        <div className="lv-nav__inner">
          <div className="lv-nav__logo">
            <div className="lv-logo-icon">
              <span>L</span>
            </div>
            <div className="lv-logo-text">
              <span className="lv-logo-main">Lohverse</span>
              <span className="lv-logo-sub">SECURE EXAMINATION PORTAL</span>
            </div>
          </div>

          <nav className={`lv-nav__links ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#assessments">Assessments</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/courses'); }}>Courses</a>
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
            Student Assessment Portal
          </div>

          <h1 className="lv-hero__title">
            Lohverse <span className="lv-hero__accent">Recruitment</span><br />Portal
          </h1>

          <p className="lv-hero__desc">
            Complete your placement assessment for Lohverse recruitment drives.
            Access assigned tests, take secure exams, and track your results all in one place.
          </p>

          <div className="lv-hero__ctas">
            <button className="lv-btn-primary" onClick={onRegister}>Start Your Assessment</button>
            <button className="lv-btn-outline">Already Registered?</button>
          </div>

          <div className="lv-hero__checks">
            <span><span className="lv-check">✓</span> Secure Proctored Exams</span>
            <span><span className="lv-check">✓</span> Easy Submission</span>
            <span><span className="lv-check">✓</span> Instant Results</span>
          </div>
        </div>

        <div className="lv-hero__right">
          <div className="lv-tests-card">
            <div className="lv-tests-card__header">
              <div className="lv-tests-icon">📋</div>
              <div>
                <h2>Your Assigned Tests</h2>
                <p>{tests.length} tests available</p>
              </div>
              <span className="lv-active-badge">Active</span>
            </div>

            <div className="lv-tab-row">
              {['all', 'available', 'scheduled'].map(tab => (
                <button
                  key={tab}
                  className={`lv-tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="lv-tests-list">
              {filteredTests.map(test => (
                <div key={test.id} className="lv-test-item">
                  <div className="lv-test-tag">{test.tag}</div>
                  <div className="lv-test-info">
                    <h3>{test.title}</h3>
                    <div className="lv-test-meta">
                      <span>⏱ {test.duration}</span>
                      <span>• {test.questions}</span>
                      {test.attempts && <span>• {test.attempts}</span>}
                    </div>
                    <p className="lv-test-avail">{test.availability}</p>
                  </div>
                  {test.status === 'start'
                    ? <button className="lv-btn-start" onClick={onRegister}>Start Test</button>
                    : <span className="lv-scheduled-badge">{test.status}</span>
                  }
                </div>
              ))}
            </div>
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

      {/* ── ASSESSMENTS SECTION ── */}
      <section className="lv-section lv-assess-section" id="assessments">
        <div className="lv-section__label">Assessments</div>
        <h2 className="lv-section__title">Available <span className="lv-accent">Test Categories</span></h2>
        <p className="lv-section__sub">Choose from a wide range of technical and aptitude assessments tailored to your target role.</p>

        <div className="lv-assess-grid">
          {[
            { icon: '☕', cat: 'Java & Backend', count: 12, level: 'Beginner to Expert' },
            { icon: '⚛️', cat: 'Frontend & React', count: 9, level: 'Intermediate' },
            { icon: '🗄️', cat: 'Databases & SQL', count: 7, level: 'All Levels' },
            { icon: '🐍', cat: 'Python & ML', count: 11, level: 'Intermediate to Expert' },
            { icon: '☁️', cat: 'Cloud & DevOps', count: 8, level: 'Advanced' },
            { icon: '🧠', cat: 'Aptitude & Logic', count: 15, level: 'All Levels' },
          ].map((a, i) => (
            <div className="lv-assess-card" key={i}>
              <span className="lv-assess-icon">{a.icon}</span>
              <h3>{a.cat}</h3>
              <p>{a.count} Assessments</p>
              <span className="lv-assess-level">{a.level}</span>
              <button className="lv-btn-explore">Explore →</button>
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
            <button className="lv-btn-white">Start Your Assessment</button>
            <button className="lv-btn-outline-white">Learn More</button>
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
              <div className="lv-logo-sub">SECURE EXAMINATION PORTAL</div>
            </div>
          </div>
          <p className="lv-footer__tagline">Empowering candidates. Enabling recruiters. Transforming careers.</p>

          <div className="lv-footer__links">
            <div className="lv-footer__col">
              <h4>Platform</h4>
              <a href="#">Student Portal</a>
              <a href="#">Recruiter Dashboard</a>
              <a href="#">Analytics Suite</a>
              <a href="#">API Access</a>
            </div>
            <div className="lv-footer__col">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
              <a href="#">Press</a>
            </div>
            <div className="lv-footer__col">
              <h4>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">Contact Us</a>
              <a href="#">Status</a>
              <a href="#">Community</a>
            </div>
            <div className="lv-footer__col">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
              <a href="#">GDPR</a>
            </div>
          </div>

          <div className="lv-footer__bottom">
            <span>© 2025 Lohverse. All rights reserved.</span>
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
