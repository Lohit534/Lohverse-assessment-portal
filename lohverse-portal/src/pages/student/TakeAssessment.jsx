import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import API from '../../api/axios';
import '../StudentDashboard.css';

// ─── Instructions Modal ───────────────────────────────────────────
function Instructions({ assessment, onStart, onBack }) {
  return (
    <div className="sd-page">
      <div className="sd-page-header">
        <h1 className="sd-page-title">📋 Assessment Instructions</h1>
        <p className="sd-page-sub">{assessment.title}</p>
      </div>

      <div className="sd-card" style={{ marginBottom: '1.5rem' }}>
        <div className="sd-card-title">ℹ️ Before You Begin</div>
        <ul style={{ color: 'var(--sd-muted)', fontSize: '0.9rem', lineHeight: 1.8, paddingLeft: '1.5rem' }}>
          <li>This assessment is a <strong style={{ color: 'var(--sd-accent-light)' }}>{assessment.assessmentType?.toUpperCase() || 'MCQ'}</strong> test.</li>
          <li>It contains <strong style={{ color: 'var(--sd-text)' }}>{assessment.questionCount} questions</strong> total.</li>
          <li>You have <strong style={{ color: 'var(--sd-text)' }}>{assessment.durationMins} minutes</strong> to complete it.</li>
          <li>Passing marks: <strong style={{ color: 'var(--sd-text)' }}>{assessment.passingMarks} / {assessment.totalMarks}</strong>.</li>
          <li>For coding tasks, you can select between <strong style={{ color: 'var(--sd-text)' }}>Python, JavaScript, C++, or Java</strong>.</li>
          <li>Your code can be run with custom inputs before final submission.</li>
          <li>The test will <strong style={{ color: '#f87171' }}>auto-submit</strong> when the timer runs out.</li>
          <li>Do not refresh or close the browser during the test.</li>
        </ul>
      </div>

      {assessment.description && (
        <div className="sd-card" style={{ marginBottom: '1.5rem' }}>
          <div className="sd-card-title">📄 Description</div>
          <p style={{ color: 'var(--sd-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{assessment.description}</p>
        </div>
      )}

      {assessment.questionCount === 0 && (
        <div className="sd-card" style={{ marginBottom: '1.5rem', border: '1px solid var(--sd-danger)', background: 'rgba(239,68,68,0.06)' }}>
          <div className="sd-card-title" style={{ color: 'var(--sd-danger)' }}>⚠️ Assessment is Empty</div>
          <p style={{ color: 'var(--sd-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            This assessment currently contains no questions. Please notify your recruiter to add questions to this test bank before attempting to start.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {assessment.questionCount > 0 ? (
          <button className="sd-btn sd-btn-primary" onClick={onStart} style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}>
            🚀 Start Assessment
          </button>
        ) : (
          <button className="sd-btn sd-btn-outline" disabled style={{ opacity: 0.65, fontSize: '1rem', padding: '0.875rem 2rem', borderColor: 'var(--sd-danger)', color: 'var(--sd-danger)', cursor: 'not-allowed' }}>
            🔒 Test Locked (No Questions)
          </button>
        )}
        <button className="sd-btn sd-btn-outline" onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}

// ─── Timer ────────────────────────────────────────────────────────
function Timer({ totalSeconds, onExpire }) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [onExpire]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct  = (remaining / totalSeconds) * 100;
  const urgent = remaining < 300;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.5rem 1rem',
      background: urgent ? 'rgba(239,68,68,0.15)' : 'rgba(124,58,237,0.15)',
      border: `1px solid ${urgent ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,237,0.25)'}`,
      borderRadius: '10px',
      color: urgent ? '#f87171' : 'var(--sd-accent-light)',
      transition: 'all 0.3s',
    }}>
      <span style={{ fontSize: '1.1rem' }}>{urgent ? '⚠️' : '⏱'}</span>
      <span style={{ fontWeight: 800, fontSize: '1.2rem', fontVariantNumeric: 'tabular-nums' }}>
        {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
      </span>
      <div style={{
        width: 60, height: 4, background: 'rgba(255,255,255,0.1)',
        borderRadius: 4, overflow: 'hidden',
      }}>
        <div style={{ height: '100%', width: `${pct}%`, background: urgent ? '#ef4444' : '#7c3aed', transition: 'width 1s linear' }} />
      </div>
    </div>
  );
}

// Default coding templates mapping
const DEFAULT_TEMPLATES = {
  python: `# Python 3 template\nimport sys\n\ndef solve():\n    # Read all inputs from sys.stdin\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    print("Hello, World!")\n\nif __name__ == '__main__':\n    solve()`,
  javascript: `// JavaScript / Node.js template\nconst fs = require('fs');\n\nfunction solve() {\n    const input = fs.readFileSync('/dev/stdin', 'utf-8');\n    console.log("Hello, World!");\n}\n\nsolve();`,
  cpp: `// C++ template\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Fast I/O\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    cout << "Hello, World!" << "\\n";\n    return 0;\n}`,
  java: `// Java template\nimport java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        System.out.println("Hello, World!");\n    }\n}`
};

// ─── Main TakeAssessment ──────────────────────────────────────────
export default function TakeAssessment() {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [phase, setPhase]           = useState('loading'); // loading|instructions|test|result
  const [assessment, setAssessment] = useState(null);
  const [attempt, setAttempt]       = useState(null);
  const [questions, setQuestions]   = useState([]);
  const [answers, setAnswers]       = useState({}); // MCQ Answers
  
  // Coding variables
  const [codeDrafts, setCodeDrafts] = useState({}); // {questionId: {code, language}}
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [customInput, setCustomInput] = useState('');
  const [codeOutput, setCodeOutput] = useState(null); // {status, stdout, stderr, success}
  const [runningCode, setRunningCode] = useState(false);
  const [submittingCode, setSubmittingCode] = useState(false);
  const [testCaseResults, setTestCaseResults] = useState(null); // Results from code submission

  const [currentQ, setCurrentQ]     = useState(0);
  const [result, setResult]         = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const autoSaveRef = useRef(null);

  // Load assessment details
  useEffect(() => {
    API.get(`/assessments/${id}`)
      .then(r => { setAssessment(r.data.assessment); setPhase('instructions'); })
      .catch(e => { setError(e.response?.data?.error || 'Failed to load assessment'); setPhase('error'); });
  }, [id]);

  // Auto-save MCQ answers every 30 seconds during test
  const autoSave = useCallback(async () => {
    if (!attempt) return;
    try {
      await API.put(`/assessments/${id}/attempt/${attempt.id}/save`, { answers });
    } catch {}
  }, [attempt, id, answers]);

  useEffect(() => {
    if (phase === 'test') {
      autoSaveRef.current = setInterval(autoSave, 30000);
    }
    return () => clearInterval(autoSaveRef.current);
  }, [phase, autoSave]);

  const handleStart = async () => {
    try {
      const res = await API.post(`/assessments/${id}/start`);
      const { attempt: att, assessment: assess, questions: mcqs } = res.data;
      
      let allQuestions = [...mcqs];
      
      // If assessment type is coding or combined, fetch coding questions too
      if (assess.assessmentType === 'coding' || assess.assessmentType === 'combined') {
        const codingRes = await API.get(`/assessments/${id}/questions/coding`);
        const codings = codingRes.data.questions.map(q => ({ ...q, isCoding: true }));
        allQuestions = [...allQuestions, ...codings];
      }
      
      // Initialize code drafts
      const drafts = {};
      allQuestions.forEach(q => {
        if (q.isCoding) {
          drafts[q.id] = {
            code: q.templatePython || DEFAULT_TEMPLATES.python,
            language: 'python'
          };
        }
      });

      setAttempt(att);
      setAssessment(assess);
      setQuestions(allQuestions);
      setCodeDrafts(drafts);
      setPhase('test');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to start assessment');
    }
  };

  const handleSelectMCQ = (qId, answer) => {
    setAnswers(prev => ({ ...prev, [String(qId)]: answer }));
  };

  const handleCodeChange = (value) => {
    const q = questions[currentQ];
    if (!q) return;
    setCodeDrafts(prev => ({
      ...prev,
      [q.id]: {
        ...prev[q.id],
        code: value
      }
    }));
  };

  const handleLanguageChange = (lang) => {
    const q = questions[currentQ];
    if (!q) return;
    setSelectedLanguage(lang);
    
    // Switch to starting template of that language if student hasn't typed anything substantial
    const typedCode = codeDrafts[q.id]?.code || '';
    const currentLang = codeDrafts[q.id]?.language || 'python';
    
    const isDefault = typedCode === (q.templatePython || DEFAULT_TEMPLATES.python) ||
                      typedCode === (q.templateJavascript || DEFAULT_TEMPLATES.javascript) ||
                      typedCode === (q.templateCpp || DEFAULT_TEMPLATES.cpp) ||
                      typedCode === (q.templateJava || DEFAULT_TEMPLATES.java) ||
                      typedCode === '';
                      
    if (isDefault) {
      let nextCode = DEFAULT_TEMPLATES[lang];
      if (lang === 'python' && q.templatePython) nextCode = q.templatePython;
      if (lang === 'javascript' && q.templateJavascript) nextCode = q.templateJavascript;
      if (lang === 'cpp' && q.templateCpp) nextCode = q.templateCpp;
      if (lang === 'java' && q.templateJava) nextCode = q.templateJava;

      setCodeDrafts(prev => ({
        ...prev,
        [q.id]: { code: nextCode, language: lang }
      }));
    } else {
      setCodeDrafts(prev => ({
        ...prev,
        [q.id]: { ...prev[q.id], language: lang }
      }));
    }
  };

  const handleRunCode = async () => {
    const q = questions[currentQ];
    if (!q || !attempt) return;
    
    setRunningCode(true);
    setCodeOutput(null);
    try {
      const draft = codeDrafts[q.id] || { code: '', language: 'python' };
      const res = await API.post(`/assessments/${id}/attempt/${attempt.id}/run`, {
        code: draft.code,
        language: draft.language,
        input: customInput || q.sampleInput || ''
      });
      setCodeOutput(res.data);
    } catch (e) {
      setCodeOutput({
        success: false,
        status: 'Error',
        stderr: e.response?.data?.error || 'Failed to run code.'
      });
    } finally {
      setRunningCode(false);
    }
  };

  const handleSubmitCode = async () => {
    const q = questions[currentQ];
    if (!q || !attempt) return;

    setSubmittingCode(true);
    setTestCaseResults(null);
    try {
      const draft = codeDrafts[q.id] || { code: '', language: 'python' };
      const res = await API.post(`/assessments/${id}/attempt/${attempt.id}/submit-code`, {
        questionId: q.id,
        code: draft.code,
        language: draft.language
      });
      setTestCaseResults(res.data);
      alert(`Submission Grade: Passed ${res.data.passedCases}/${res.data.totalCases} cases.`);
    } catch (e) {
      alert(e.response?.data?.error || 'Evaluation failed.');
    } finally {
      setSubmittingCode(false);
    }
  };

  const handleSubmitAssessment = async (forced = false) => {
    if (!attempt) return;
    
    // Count answered MCQs
    const mcqQuestions = questions.filter(q => !q.isCoding);
    const answeredMCQs = Object.keys(answers).length;
    
    if (!forced) {
      if (mcqQuestions.length > 0 && answeredMCQs < mcqQuestions.length) {
        const unanswered = mcqQuestions.length - answeredMCQs;
        if (!window.confirm(`You have ${unanswered} unanswered MCQ questions. Submit anyway?`)) return;
      } else {
        if (!window.confirm("Are you sure you want to finalize and submit your assessment?")) return;
      }
    }
    
    clearInterval(autoSaveRef.current);
    setSubmitting(true);
    try {
      // Submit attempt
      const res = await API.post(`/assessments/${id}/attempt/${attempt.id}/submit`, { answers });
      setResult(res.data.attempt);
      setPhase('result');
    } catch (e) {
      setError(e.response?.data?.error || 'Submission failed');
      setSubmitting(false);
    }
  };

  if (phase === 'loading') return <div className="sd-loading">⟳ Loading…</div>;
  if (phase === 'error')   return (
    <div className="sd-page">
      <div className="sd-alert sd-alert-error">✕ {error}</div>
      <button className="sd-btn sd-btn-outline" onClick={() => navigate('/dashboard/assessments')}>← Back</button>
    </div>
  );

  if (phase === 'instructions') return (
    <Instructions
      assessment={assessment}
      onStart={handleStart}
      onBack={() => navigate('/dashboard/assessments')}
    />
  );

  if (phase === 'result') return (
    <div className="sd-page">
      <div className="sd-page-header">
        <h1 className="sd-page-title">🏆 Assessment Result</h1>
        <p className="sd-page-sub">{assessment?.title}</p>
      </div>

      <div className="sd-card" style={{ textAlign: 'center', padding: '2.5rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          {result?.passed ? '🎉' : '😔'}
        </div>
        <div style={{ fontSize: '3rem', fontWeight: 900, color: result?.passed ? '#34d399' : '#f87171', marginBottom: '0.5rem' }}>
          {result?.score} / {assessment?.totalMarks}
        </div>
        <div style={{ fontSize: '1.1rem', color: 'var(--sd-muted)', marginBottom: '1rem' }}>
          {result?.percentage}% · {result?.passed ? 'PASSED ✓' : 'FAILED ✗'}
        </div>
        <span className={`sd-badge ${result?.passed ? 'sd-badge-green' : 'sd-badge-red'}`} style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
          {result?.passed ? 'Congratulations! You passed.' : 'Better luck next time.'}
        </span>
      </div>

      <div className="sd-grid-3" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Score', value: `${result?.score}/${assessment?.totalMarks}`, icon: '🎯', color: 'purple' },
          { label: 'MCQ Score',  value: result?.mcqScore,  icon: '📝', color: 'blue' },
          { label: 'Coding Score',value: result?.codingScore, icon: '💻', color: 'green' },
          { label: 'Global Rank', value: `#${result?.rank}`,    icon: '🏅', color: 'yellow' },
          { label: 'Percentage',  value: `${result?.percentage}%`, icon: '📊', color: 'blue' },
          { label: 'Status',      value: result?.passed ? 'Pass' : 'Fail', icon: '📋', color: result?.passed ? 'green' : 'red' },
        ].map(s => (
          <div key={s.label} className="sd-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sd-text)' }}>{s.value ?? '—'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--sd-muted)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="sd-btn sd-btn-primary" onClick={() => navigate('/dashboard/results')}>
          📊 View All Results
        </button>
        <button className="sd-btn sd-btn-outline" onClick={() => navigate('/dashboard/assessments')}>
          ← Back to Assessments
        </button>
      </div>
    </div>
  );

  // ── TEST PHASE ──
  const q = questions[currentQ];
  const answeredMCQs = Object.keys(answers).length;
  const totalMCQs = questions.filter(x => !x.isCoding).length;

  return (
    <div className="sd-page" style={{ maxWidth: q?.isCoding ? '100%' : '1100px', width: '100%' }}>
      {/* Header with timer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="sd-page-title" style={{ fontSize: '1.25rem' }}>{assessment?.title}</h1>
          <p className="sd-page-sub">
            {q?.isCoding ? `Coding Challenge [${q.difficulty}]` : `MCQ question: ${answeredMCQs} of ${totalMCQs} answered`}
          </p>
        </div>
        <Timer
          totalSeconds={assessment.durationMins * 60}
          onExpire={() => handleSubmitAssessment(true)}
        />
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: '1rem', overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: 'linear-gradient(90deg,#7c3aed,#a78bfa)',
          width: `${((currentQ + 1) / questions.length) * 100}%`,
          transition: 'width 0.3s',
        }} />
      </div>

      {/* Question Grid Navigator */}
      <div className="sd-card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div className="sd-card-title" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Question Navigator</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {questions.map((item, i) => {
            const isAnswered = item.isCoding 
              ? codeDrafts[item.id]?.code && codeDrafts[item.id].code.length > 50
              : answers[String(item.id)];
            
            return (
              <button
                key={i}
                onClick={() => {
                  setCurrentQ(i);
                  // Reset output logs for coding when switching questions
                  setCodeOutput(null);
                  setTestCaseResults(null);
                }}
                style={{
                  width: 36, height: 36, borderRadius: '8px', border: 'none',
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                  background: isAnswered
                    ? 'rgba(16,185,129,0.3)' : i === currentQ
                      ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.07)',
                  color: i === currentQ ? '#a78bfa' : isAnswered ? '#34d399' : 'var(--sd-muted)',
                  outline: i === currentQ ? '2px solid #7c3aed' : 'none',
                }}
              >
                {item.isCoding ? `💻${i+1}` : i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Split pane for coding vs MCQ */}
      {q?.isCoding ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', height: 'calc(100vh - 280px)', minHeight: '600px' }}>
          
          {/* LEFT PANEL: Challenge Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '0.25rem' }}>
            <div className="sd-card" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className={`sd-badge ${q.difficulty === 'Easy' ? 'sd-badge-green' : q.difficulty === 'Hard' ? 'sd-badge-red' : 'sd-badge-purple'}`}>
                  {q.difficulty}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--sd-accent-light)', fontWeight: 700 }}>{q.marks} Marks</span>
              </div>
              
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--sd-text)' }}>{q.title}</h2>
              
              <div style={{ color: 'var(--sd-text)', fontSize: '0.925rem', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>
                {q.description}
              </div>

              {q.constraints && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--sd-accent-light)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Constraints</h4>
                  <pre style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: 6, fontSize: '0.85rem' }}>{q.constraints}</pre>
                </div>
              )}

              {q.input_format && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--sd-accent-light)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Input Format</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--sd-muted)' }}>{q.input_format}</p>
                </div>
              )}

              {q.output_format && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--sd-accent-light)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Output Format</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--sd-muted)' }}>{q.output_format}</p>
                </div>
              )}

              {q.sampleInput && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--sd-muted)', marginBottom: '0.25rem' }}>Sample Input</h4>
                    <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: 8, fontSize: '0.8rem', fontFamily: 'monospace' }}>{q.sampleInput}</pre>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--sd-muted)', marginBottom: '0.25rem' }}>Sample Output</h4>
                    <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: 8, fontSize: '0.8rem', fontFamily: 'monospace' }}>{q.sampleOutput}</pre>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT PANEL: Monaco Code Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', paddingRight: '0.25rem' }}>
            <div className="sd-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0.75rem', overflow: 'hidden', minHeight: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--sd-muted)', fontWeight: 600 }}>SELECT ENVIRONMENT</span>
                <select
                  value={codeDrafts[q.id]?.language || 'python'}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  style={{
                    background: 'var(--sd-card)', color: 'var(--sd-text)', border: '1px solid var(--sd-border)',
                    padding: '0.35rem 1rem', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                  }}
                >
                  <option value="python" style={{ background: 'var(--sd-sidebar-bg)', color: 'var(--sd-text)' }}>Python 3 (3.8.1)</option>
                  <option value="javascript" style={{ background: 'var(--sd-sidebar-bg)', color: 'var(--sd-text)' }}>JavaScript / Node.js</option>
                  <option value="cpp" style={{ background: 'var(--sd-sidebar-bg)', color: 'var(--sd-text)' }}>C++ (GCC 9.2)</option>
                  <option value="java" style={{ background: 'var(--sd-sidebar-bg)', color: 'var(--sd-text)' }}>Java (OpenJDK 13)</option>
                </select>
              </div>

              {/* Editor wrapper */}
              <div style={{ flex: 1, background: '#1e1e1e', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--sd-border)' }}>
                <Editor
                  height="100%"
                  theme="vs-dark"
                  language={codeDrafts[q.id]?.language === 'javascript' ? 'javascript' : codeDrafts[q.id]?.language === 'cpp' ? 'cpp' : codeDrafts[q.id]?.language === 'java' ? 'java' : 'python'}
                  value={codeDrafts[q.id]?.code || ''}
                  onChange={handleCodeChange}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    automaticLayout: true,
                    scrollbar: { vertical: 'visible' },
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on'
                  }}
                />
              </div>

              {/* Code execution console triggers */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button
                  className="sd-btn sd-btn-outline"
                  onClick={handleRunCode}
                  disabled={runningCode || submittingCode}
                  style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
                >
                  {runningCode ? '⌛ Compiling…' : '▶ Run Custom Input'}
                </button>
                <button
                  className="sd-btn sd-btn-primary"
                  onClick={handleSubmitCode}
                  disabled={runningCode || submittingCode}
                  style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem', background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}
                >
                  {submittingCode ? '⌛ Evaluating…' : '🚀 Submit Code Challenge'}
                </button>
              </div>
            </div>

            {/* Custom Input / Compilation Output box */}
            <div className="sd-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div className="sd-card-title" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Custom Stdin Input</div>
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter command line inputs here..."
                    style={{
                      width: '100%', height: '60px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--sd-border)',
                      borderRadius: 8, padding: '0.4rem 0.6rem', color: 'var(--sd-text)', fontSize: '0.8rem', fontFamily: 'monospace', resize: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Compilation logs */}
              {codeOutput && (
                <div style={{ background: 'rgba(0,0,0,0.35)', padding: '0.75rem', borderRadius: 8, borderLeft: `4px solid ${codeOutput.success ? '#10b981' : '#ef4444'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <strong style={{ fontSize: '0.85rem', color: codeOutput.success ? '#34d399' : '#f87171' }}>
                      Status: {codeOutput.status}
                    </strong>
                    {codeOutput.time_ms && <span style={{ fontSize: '0.75rem', color: 'var(--sd-muted)' }}>Runtime: {codeOutput.time_ms}ms</span>}
                  </div>
                  {codeOutput.stdout && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--sd-muted)' }}>Stdout:</div>
                      <pre style={{ fontSize: '0.8rem', color: 'var(--sd-text)', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{codeOutput.stdout}</pre>
                    </div>
                  )}
                  {codeOutput.stderr && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#f87171' }}>Stderr:</div>
                      <pre style={{ fontSize: '0.8rem', color: '#f87171', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{codeOutput.stderr}</pre>
                    </div>
                  )}
                </div>
              )}

              {/* Test Cases Score Details */}
              {testCaseResults && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--sd-accent-light)', display: 'block', marginBottom: '0.25rem' }}>Secret Test Cases Evaluation:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {testCaseResults.testTestCaseResults?.map((tc, index) => (
                      <span
                        key={index}
                        title={tc.status}
                        style={{
                          fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold',
                          background: tc.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                          color: tc.passed ? '#34d399' : '#f87171', border: `1px solid ${tc.passed ? '#10b981' : '#ef4444'}`
                        }}
                      >
                        Case {index + 1}: {tc.passed ? 'PASS ✓' : 'FAIL ✗'} {tc.isHidden ? '(Secret)' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* MCQ QUESTION VIEW */
        q && (
          <div className="sd-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--sd-muted)', fontWeight: 600 }}>
                QUESTION {currentQ + 1} OF {questions.length}
              </span>
              <span className="sd-badge sd-badge-purple">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
            </div>

            <p style={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.6, marginBottom: '1.5rem', color: 'var(--sd-text)' }}>
              {q.questionText}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { key: 'a', label: 'A', text: q.optionA },
                { key: 'b', label: 'B', text: q.optionB },
                { key: 'c', label: 'C', text: q.optionC },
                { key: 'd', label: 'D', text: q.optionD },
              ].map(opt => {
                const selected = answers[String(q.id)] === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleSelectMCQ(q.id, opt.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.875rem',
                      padding: '0.875rem 1rem',
                      border: selected ? '1px solid #7c3aed' : '1px solid var(--sd-border)',
                      borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                      background: selected ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
                      color: selected ? '#e2d9f3' : 'var(--sd-muted)',
                      transition: 'all 0.15s', fontFamily: 'inherit', fontSize: '0.9rem',
                    }}
                  >
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: selected ? '#7c3aed' : 'rgba(255,255,255,0.07)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                      color: selected ? 'white' : 'var(--sd-muted)',
                    }}>{opt.label}</span>
                    {opt.text}
                  </button>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Footer Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="sd-btn sd-btn-outline" onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}>
            ← Prev
          </button>
          <button 
            className="sd-btn sd-btn-outline" 
            onClick={async () => {
              await autoSave();
              setCurrentQ(Math.min(questions.length - 1, currentQ + 1));
            }} 
            disabled={currentQ === questions.length - 1}
          >
            Save & Next →
          </button>
        </div>
        <button
          className="sd-btn sd-btn-primary"
          onClick={() => handleSubmitAssessment(false)}
          disabled={submitting}
          style={{ background: 'linear-gradient(135deg,#059669,#047857)', minWidth: 180 }}
        >
          {submitting ? '⟳ Submitting…' : '✓ Finish & Submit Test'}
        </button>
      </div>
    </div>
  );
}
