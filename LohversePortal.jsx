import React, { useState } from 'react';
import './LohversePortal.css';

export default function LohversePortal() {
  const [tests] = useState([
    {
      id: 1,
      title: 'Full Stack Development Assessment',
      duration: '90 mins',
      questions: '30 Questions',
      attempts: '3 Attempts Remaining',
      availability: 'Available until Jan 15, 2026',
      status: 'start',
    },
    {
      id: 2,
      title: 'Advanced React Patterns Quiz',
      duration: '60 mins',
      questions: '25 Questions',
      status: 'Scheduled',
      availability: 'Available from Feb 1, 2026',
    },
    {
      id: 3,
      title: 'DevOps & Cloud Mastery',
      duration: '120 mins',
      questions: '40 Questions',
      status: 'Scheduled',
      availability: 'Available from Mar 1, 2026',
    },
  ]);

  return (
    <div className="lohverse-container">
      {/* Header */}
      <header className="navbar">
        <div className="navbar-left">
          <div className="logo">
            <div className="logo-icon">L</div>
            <span className="logo-text">Lohverse</span>
          </div>
          <nav className="nav-links">
            <a href="#home">Home</a>
            <a href="#courses">Courses</a>
            <a href="#assessments">Assessments</a>
            <a href="#support">Support</a>
          </nav>
        </div>
        <div className="navbar-right">
          <button className="btn-signin">Sign In</button>
          <button className="btn-register">Start Free</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-wrapper">
          {/* Left Section */}
          <section className="left-section">
            <div className="breadcrumb">
              <span className="breadcrumb-icon">★</span>
              <span>Learning Portal</span>
            </div>

            <h1 className="main-heading">
              Lohverse <span className="heading-highlight">Skills</span>
              <br />
              Academy
            </h1>

            <p className="description">
              Master in-demand skills with our comprehensive assessment platform. 
              Take interactive quizzes, track your progress, and earn certifications 
              to advance your career.
            </p>

            <div className="button-group">
              <button className="btn-primary">Start Learning Now</button>
              <button className="btn-secondary">Explore Courses</button>
            </div>

            <div className="features">
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Industry-Recognized Certificates</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Expert-Led Training</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Lifetime Access</span>
              </div>
            </div>
          </section>

          {/* Right Section - Assigned Tests */}
          <section className="right-section">
            <div className="tests-card">
              <div className="tests-header">
                <div className="tests-icon">📚</div>
                <div className="tests-title-group">
                  <h2>Your Learning Path</h2>
                  <p className="tests-count">{tests.length} courses available</p>
                </div>
                <span className="status-badge">Active</span>
              </div>

              <div className="tests-list">
                {tests.map((test) => (
                  <div key={test.id} className="test-item">
                    <div className="test-info">
                      <h3>{test.title}</h3>
                      <div className="test-meta">
                        <span>{test.duration}</span>
                        <span>•</span>
                        <span>{test.questions}</span>
                        {test.attempts && (
                          <>
                            <span>•</span>
                            <span>{test.attempts}</span>
                          </>
                        )}
                      </div>
                      <p className="test-availability">{test.availability}</p>
                    </div>
                    {test.status === 'start' ? (
                      <button className="btn-start-test">Start Now</button>
                    ) : (
                      <span className="test-status-badge">{test.status}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
