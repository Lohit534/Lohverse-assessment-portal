import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './Register.css';

const STEPS = [
  { id: 1, label: 'Personal Info',    sub: 'Name, roll number & contact details' },
  { id: 2, label: 'Academic Details', sub: 'Course name and more' },
  { id: 3, label: 'Account Setup',    sub: 'Email, password & resume' },
  { id: 4, label: 'Review & Confirm', sub: 'Verify your details before confirming' },
];

const INIT = {
  fullName: '', rollNumber: '', phone: '', address: '',
  college: '', course: '', branch: '', year: '',
  email: '', password: '', confirmPassword: '', resume: null,
};

export default function Register({ onBack }) {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [step, setStep]   = useState(1);
  const [form, setForm]   = useState(INIT);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };
  const setFile = (k, file) => { setForm(f => ({ ...f, [k]: file })); setErrors(e => ({ ...e, [k]: '' })); };

  /* ── Validation per step ── */
  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!form.fullName.trim())    e.fullName    = 'Full name is required';
      if (!form.rollNumber.trim())  e.rollNumber  = 'Roll number is required';
      if (!/^\d{10}$/.test(form.phone)) e.phone  = 'Enter a valid 10-digit phone number';
      if (!form.address.trim())     e.address     = 'Address is required';
    }
    if (step === 2) {
      if (!form.college.trim())  e.college  = 'College name is required';
      if (!form.course.trim())   e.course   = 'Course is required';
      if (!form.branch.trim())   e.branch   = 'Branch is required';
      if (!form.year)            e.year     = 'Year of passout is required';
    }
    if (step === 3) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
      if (form.password.length < 8)  e.password = 'Password must be at least 8 characters';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
      if (!form.resume) e.resume = 'Please upload your resume';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, 4)); };
  const prev = () => setStep(s => Math.max(s - 1, 1));
  
  const submit = async () => {
    setLoading(true);
    setErrors({});
    
    const formData = new FormData();
    formData.append('fullName', form.fullName);
    formData.append('rollNumber', form.rollNumber);
    formData.append('phone', form.phone);
    formData.append('address', form.address);
    formData.append('college', form.college);
    formData.append('course', form.course);
    formData.append('branch', form.branch);
    formData.append('year', form.year);
    formData.append('email', form.email);
    formData.append('password', form.password);
    if (form.resume) {
      formData.append('resume', form.resume);
    }

    try {
      const formData = new FormData();
      Object.entries({
        fullName: form.fullName, rollNumber: form.rollNumber, phone: form.phone,
        address: form.address, college: form.college, course: form.course,
        branch: form.branch, year: form.year, email: form.email, password: form.password,
      }).forEach(([k, v]) => formData.append(k, v));
      if (form.resume) formData.append('resume', form.resume);

      await register(formData);
      setSubmitted(true);
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || 'Registration failed. Check that your backend is running.' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rg-success">
        <div className="rg-success__card">
          <div className="rg-success__icon">🎉</div>
          <h2>Registration Successful!</h2>
          <p>Welcome to Lohverse, <strong>{form.fullName}</strong>! Your account has been created successfully.</p>
          <button className="rg-btn-primary" onClick={() => navigate('/dashboard/assessments', { replace: true })}>Go to Dashboard →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rg-root">
      {/* ── LEFT SIDEBAR ── */}
      <aside className="rg-sidebar">
        {/* Logo */}
        <div className="rg-sidebar__logo" onClick={onBack} style={{ cursor: 'pointer' }}>
          <div className="rg-logo-icon">L</div>
          <div>
            <div className="rg-logo-name">Lohverse</div>
            <div className="rg-logo-sub">SECURE EXAMINATION PORTAL</div>
          </div>
        </div>

        {/* Headline */}
        <div className="rg-sidebar__headline">
          <h2>Join the <span className="rg-sidebar__accent">Lohverse</span><br />Recruitment Drive</h2>
          <p>Complete 4 quick steps to create your account and access your assessments.</p>
        </div>

        {/* Step list */}
        <ul className="rg-sidebar__steps">
          {STEPS.map(s => (
            <li key={s.id} className={`rg-sidebar__step ${step === s.id ? 'active' : ''} ${step > s.id ? 'done' : ''}`}>
              <div className="rg-step-circle">
                {step > s.id ? '✓' : s.id}
              </div>
              <div className="rg-step-text">
                <span className="rg-step-label">{s.label}</span>
                <span className="rg-step-sub">{s.sub}</span>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* ── RIGHT PANEL ── */}
      <main className="rg-main">
        {/* Top progress row */}
        <div className="rg-progress-row">
          <div className="rg-progress-header">
            <span className="rg-step-counter">STEP {step} OF 4</span>
            <span className="rg-step-current-label">{STEPS[step - 1].label}</span>
          </div>

          <div className="rg-tab-bar">
            {STEPS.map(s => (
              <div key={s.id} className={`rg-tab-item ${step === s.id ? 'active' : ''} ${step > s.id ? 'done' : ''}`}>
                {s.label}
              </div>
            ))}
          </div>

          <div className="rg-progress-bar">
            <div className="rg-progress-fill" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        </div>

        {/* Form content */}
        <div className="rg-form-body">
          <h1 className="rg-form-title">{STEPS[step - 1].label}</h1>
          <p className="rg-form-sub">{STEPS[step - 1].sub}</p>

          {/* STEP 1 – Personal Info */}
          {step === 1 && (
            <div className="rg-fields">
              <Field label="FULL NAME" required error={errors.fullName}>
                <input value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="As per official records" />
              </Field>
              <Field label="STUDENT ROLL NUMBER" required error={errors.rollNumber}>
                <input value={form.rollNumber} onChange={e => set('rollNumber', e.target.value)} placeholder="e.g., 2024CS001" />
              </Field>
              <Field label="PHONE NUMBER" required error={errors.phone}>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="e.g., 9876543210" maxLength={10} />
              </Field>
              <Field label="ADDRESS" required error={errors.address}>
                <textarea value={form.address} onChange={e => set('address', e.target.value)} placeholder="Enter your full address" rows={3} />
              </Field>
            </div>
          )}

          {/* STEP 2 – Academic Details */}
          {step === 2 && (
            <div className="rg-fields">
              <Field label="COLLEGE / UNIVERSITY" required error={errors.college}>
                <input value={form.college} onChange={e => set('college', e.target.value)} placeholder="e.g., Anna University" />
              </Field>
              <Field label="COURSE / DEGREE" required error={errors.course}>
                <input value={form.course} onChange={e => set('course', e.target.value)} placeholder="e.g., B.Tech, BCA, MCA" />
              </Field>
              <Field label="BRANCH / SPECIALIZATION" required error={errors.branch}>
                <input value={form.branch} onChange={e => set('branch', e.target.value)} placeholder="e.g., Computer Science" />
              </Field>
              <Field label="YEAR OF PASSOUT" required error={errors.year}>
                <select value={form.year} onChange={e => set('year', e.target.value)}>
                  <option value="">Select year of passout</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                </select>
              </Field>
            </div>
          )}

          {/* STEP 3 – Account Setup */}
          {step === 3 && (
            <div className="rg-fields">
              <Field label="EMAIL ADDRESS" required error={errors.email}>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="e.g., student@college.edu" />
              </Field>
              <Field label="PASSWORD" required error={errors.password}>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 characters" />
              </Field>
              <Field label="CONFIRM PASSWORD" required error={errors.confirmPassword}>
                <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Re-enter your password" />
              </Field>
              <p className="rg-password-hint">Password must be at least 8 characters and include a number.</p>
              <Field label="UPLOAD RESUME" required error={errors.resume}>
                <div className={`rg-file-drop ${form.resume ? 'has-file' : ''}`}>
                  <input
                    type="file"
                    id="resume-upload"
                    accept=".pdf,.doc,.docx"
                    onChange={e => setFile('resume', e.target.files[0] || null)}
                    className="rg-file-input"
                  />
                  <label htmlFor="resume-upload" className="rg-file-label">
                    {form.resume ? (
                      <><span className="rg-file-icon">📄</span><span className="rg-file-name">{form.resume.name}</span><span className="rg-file-change">Change</span></>
                    ) : (
                      <><span className="rg-file-icon">📎</span><span>Click to upload or drag & drop</span><span className="rg-file-hint">PDF, DOC, DOCX — Max 5MB</span></>
                    )}
                  </label>
                </div>
              </Field>
            </div>
          )}

          {/* STEP 4 – Review & Confirm */}
          {step === 4 && (
            <div className="rg-review">
              <ReviewSection title="Personal Info">
                <ReviewRow label="Full Name"     value={form.fullName} />
                <ReviewRow label="Roll Number"   value={form.rollNumber} />
                <ReviewRow label="Phone"         value={form.phone} />
                <ReviewRow label="Address"       value={form.address} />
              </ReviewSection>
              <ReviewSection title="Academic Details">
                <ReviewRow label="College"  value={form.college} />
                <ReviewRow label="Course"   value={form.course} />
                <ReviewRow label="Branch"   value={form.branch} />
                 <ReviewRow label="Year of Passout"     value={form.year} />
              </ReviewSection>
              <ReviewSection title="Account">
                <ReviewRow label="Email" value={form.email} />
                <ReviewRow label="Password" value="••••••••" />
                <ReviewRow label="Resume" value={form.resume ? form.resume.name : '—'} />
              </ReviewSection>
            </div>
          )}

          {/* Submit/Connection error display */}
          {errors.submit && (
            <div className="rg-error-msg" style={{ marginTop: '20px', padding: '10px', background: '#fff5f5', border: '1px solid #ef4444', borderRadius: '8px' }}>
              ⚠️ {errors.submit}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="rg-nav-btns">
            {step > 1 && (
              <button className="rg-btn-back" onClick={prev} disabled={loading}>← Back</button>
            )}
            {step < 4 && (
              <button className="rg-btn-primary" onClick={next}>Continue →</button>
            )}
            {step === 4 && (
              <button className="rg-btn-primary" onClick={submit} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Registration'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── helpers ── */
function Field({ label, required, error, children }) {
  return (
    <div className={`rg-field ${error ? 'has-error' : ''}`}>
      <label className="rg-label">{label}{required && <span className="rg-req"> *</span>}</label>
      {children}
      {error && <span className="rg-error-msg">{error}</span>}
    </div>
  );
}

function ReviewSection({ title, children }) {
  return (
    <div className="rg-review-section">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="rg-review-row">
      <span className="rg-review-label">{label}</span>
      <span className="rg-review-value">{value || '—'}</span>
    </div>
  );
}
