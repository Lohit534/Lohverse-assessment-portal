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
        <h1 className="sd-page-title">🏆 Assessment Submitted</h1>
        <p className="sd-page-sub">{assessment?.title}</p>
      </div>

      <div className="sd-card" style={{ textAlign: 'center', padding: '3.5rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🎉</div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--sd-text)', marginBottom: '0.75rem' }}>
          Assessment Completed Successfully!
        </div>
        <p style={{ color: 'var(--sd-muted)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
          Your responses have been recorded and sent to the recruitment team for evaluation. You will be notified of the updates once the evaluation is finalized.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <button className="sd-btn sd-btn-primary" onClick={() => navigate('/dashboard/assessments')} style={{ minWidth: 200 }}>
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
    <div className="sd-page" style={{ maxWidth: '100%', width: '100%', padding: '1rem 2rem' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <h1 className="sd-page-title" style={{ fontSize: '1.25rem', margin: 0 }}>{assessment?.title}</h1>
          <p className="sd-page-sub" style={{ margin: '4px 0 0 0' }}>
            {q?.isCoding ? `Coding Challenge [${q.difficulty}]` : `MCQ question: ${answeredMCQs} of ${totalMCQs} answered`}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: '1.25rem', overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: 'linear-gradient(90deg,#7c3aed,#a78bfa)',
          width: `${((currentQ + 1) / questions.length) * 100}%`,
          transition: 'width 0.3s',
        }} />
      </div>

      {/* Grid Layout: Main Workspace on the left, Sidebar on the right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: MCQ or Coding Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {q?.isCoding ? (
            /* CODING SPLIT VIEW */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem', height: 'calc(100vh - 240px)', minHeight: '550px' }}>
              
              {/* Description */}
              <div className="sd-card" style={{ overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className={`sd-badge ${q.difficulty === 'Easy' ? 'sd-badge-green' : q.difficulty === 'Hard' ? 'sd-badge-red' : 'sd-badge-purple'}`}>
                    {q.difficulty}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--sd-accent-light)', fontWeight: 700 }}>{q.marks} Marks</span>
                </div>
                
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--sd-text)' }}>{q.title}</h2>
                <div style={{ color: 'var(--sd-text)', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-line', marginBottom: '1rem', flex: 1 }}>
                  {q.description}
                </div>

                {q.constraints && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.75rem', color: 'var(--sd-accent-light)', textTransform: 'uppercase', marginBottom: '0.2' }}>Constraints</h4>
                    <pre style={{ background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: 6, fontSize: '0.75rem', fontFamily: 'monospace' }}>{q.constraints}</pre>
                  </div>
                )}

                {q.sampleInput && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.75rem', color: 'var(--sd-muted)', marginBottom: '0.2rem' }}>Sample Input</h4>
                      <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 6, fontSize: '0.75rem', fontFamily: 'monospace' }}>{q.sampleInput}</pre>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.75rem', color: 'var(--sd-muted)', marginBottom: '0.2rem' }}>Sample Output</h4>
                      <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 6, fontSize: '0.75rem', fontFamily: 'monospace' }}>{q.sampleOutput}</pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Editor & Execution Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
                <div className="sd-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0.75rem', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                     <span style={{ fontSize: '0.75rem', color: 'var(--sd-muted)', fontWeight: 600 }}>ENVIRONMENT</span>
                     <select
                       value={codeDrafts[q.id]?.language || 'python'}
                       onChange={(e) => handleLanguageChange(e.target.value)}
                       style={{
                         background: 'var(--sd-card)', color: 'var(--sd-text)', border: '1px solid var(--sd-border)',
                         padding: '0.25rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer'
                       }}
                     >
                       <option value="python">Python 3</option>
                       <option value="javascript">JavaScript</option>
                       <option value="cpp">C++</option>
                       <option value="java">Java</option>
                     </select>
                   </div>

                   <div style={{ flex: 1, background: '#1e1e1e', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--sd-border)' }}>
                     <Editor
                       height="100%"
                       theme="vs-dark"
                       language={codeDrafts[q.id]?.language || 'python'}
                       value={codeDrafts[q.id]?.code || ''}
                       onChange={handleCodeChange}
                       options={{
                         fontSize: 13,
                         minimap: { enabled: false },
                         automaticLayout: true,
                         scrollbar: { vertical: 'visible' }
                       }}
                     />
                   </div>

                   <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                     <button className="sd-btn sd-btn-outline" onClick={handleRunCode} disabled={runningCode || submittingCode} style={{ padding: '0.45rem 1rem', fontSize: '0.78rem' }}>
                       {runningCode ? '⌛ Run...' : '▶ Run Custom Input'}
                     </button>
                     <button className="sd-btn sd-btn-primary" onClick={handleSubmitCode} disabled={runningCode || submittingCode} style={{ padding: '0.45rem 1rem', fontSize: '0.78rem' }}>
                       {submittingCode ? '⌛ Submit...' : '🚀 Submit Code'}
                     </button>
                   </div>
                 </div>

                 {/* Console Output logs */}
                 {(codeOutput || testCaseResults) && (
                   <div className="sd-card" style={{ maxHeight: '150px', overflowY: 'auto', padding: '0.75rem' }}>
                     {codeOutput && (
                       <pre style={{ fontSize: '0.75rem', color: codeOutput.success ? '#34d399' : '#f87171', margin: 0, fontFamily: 'monospace' }}>
                         {codeOutput.stdout || codeOutput.stderr || codeOutput.status}
                       </pre>
                     )}
                     {testCaseResults && (
                       <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#34d399' }}>
                         Passed {testCaseResults.passedCases}/{testCaseResults.totalCases} secret cases.
                       </span>
                     )}
                   </div>
                 )}
               </div>
             </div>
           ) : (
             /* MCQ QUESTION VIEW */
             <div className="sd-card" style={{ padding: '1.5rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                 <span style={{ fontSize: '0.75rem', color: 'var(--sd-muted)', fontWeight: 600 }}>QUESTION {currentQ + 1} OF {questions.length}</span>
                 <span className="sd-badge sd-badge-purple">{q?.marks} Marks</span>
               </div>
               <p style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.5, marginBottom: '1.25rem', color: 'var(--sd-text)' }}>
                 {q?.questionText}
               </p>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 {[
                   { key: 'a', label: 'A', text: q?.optionA },
                   { key: 'b', label: 'B', text: q?.optionB },
                   { key: 'c', label: 'C', text: q?.optionC },
                   { key: 'd', label: 'D', text: q?.optionD },
                 ].map(opt => {
                   const selected = answers[String(q?.id)] === opt.key;
                   return (
                     <button
                       key={opt.key}
                       onClick={() => handleSelectMCQ(q.id, opt.key)}
                       style={{
                         display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                         border: selected ? '1px solid #7c3aed' : '1px solid var(--sd-border)',
                         borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                         background: selected ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.02)',
                         color: selected ? '#e2d9f3' : 'var(--sd-muted)',
                         fontFamily: 'inherit', fontSize: '0.85rem', width: '100%'
                       }}
                     >
                       <span style={{
                         width: 24, height: 24, borderRadius: '50%',
                         background: selected ? '#7c3aed' : 'rgba(255,255,255,0.06)',
                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                         fontWeight: 700, fontSize: '0.75rem', color: selected ? 'white' : 'var(--sd-muted)'
                       }}>{opt.label}</span>
                       {opt.text}
                     </button>
                   );
                 })}
               </div>
             </div>
           )}

           {/* Navigation controls at the bottom of the left column */}
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
         </div>

         {/* RIGHT COLUMN (SIDEBAR): Timer & Navigator & Submit */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: '1rem' }}>
           
           {/* Unified Navigator Box containing Timer & Navigator */}
           <div className="sd-card" style={{ padding: '1rem', border: '1px solid var(--sd-border)' }}>
             <div style={{ marginBottom: '1rem' }}>
               <Timer
                 totalSeconds={assessment.durationMins * 60}
                 onExpire={() => handleSubmitAssessment(true)}
               />
             </div>
             
             <div className="sd-card-title" style={{ fontSize: '0.8rem', marginBottom: '0.5rem', color: 'var(--sd-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
               Questions Map
             </div>
             
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '2px' }}>
               {questions.map((item, i) => {
                 const isAnswered = item.isCoding
                   ? codeDrafts[item.id]?.code && codeDrafts[item.id].code.length > 50
                   : answers[String(item.id)];
                 
                 return (
                   <button
                     key={i}
                     onClick={() => {
                       setCurrentQ(i);
                       setCodeOutput(null);
                       setTestCaseResults(null);
                     }}
                     style={{
                       height: '32px', borderRadius: '6px', border: 'none',
                       cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem',
                       background: isAnswered
                         ? 'rgba(16,185,129,0.25)' : i === currentQ
                           ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.05)',
                       color: i === currentQ ? '#a78bfa' : isAnswered ? '#34d399' : 'var(--sd-muted)',
                       outline: i === currentQ ? '1.5px solid #7c3aed' : 'none',
                     }}
                   >
                     {i + 1}
                   </button>
                 );
               })}
             </div>
           </div>

           {/* Submit Button placed at the bottom right corner (relative to sidebar/page layout) */}
           <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
             <button
               className="sd-btn sd-btn-primary"
               onClick={() => handleSubmitAssessment(false)}
               disabled={submitting}
               style={{
                 width: '100%',
                 padding: '0.75rem',
                 background: 'linear-gradient(135deg,#059669,#047857)',
                 fontWeight: 800,
                 fontSize: '0.9rem',
                 borderRadius: '8px',
                 boxShadow: '0 4px 12px rgba(4,120,87,0.25)'
               }}
             >
               {submitting ? 'Submitting…' : '✓ Finish & Submit Test'}
             </button>
           </div>

         </div>

       </div>
     </div>
   );
 }
