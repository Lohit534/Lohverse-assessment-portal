import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import API from '../../api/axios';
import '../RecruiterDashboard.css';

const BLANK_Q = { questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'a', marks: 1 };
const BLANK_BULK = `Question 1|Option A|Option B|Option C|Option D|a|1
Question 2|Option A|Option B|Option C|Option D|b|1`;

const BLANK_CODING = {
  title: '',
  description: '',
  difficulty: 'Medium',
  inputFormat: '',
  outputFormat: '',
  constraints: '',
  sampleInput: '',
  sampleOutput: '',
  testCases: [{ input: '', output: '', is_hidden: false }],
  templatePython: '',
  templateJava: '',
  templateCpp: '',
  templateJavascript: '',
  marks: 10
};

export default function QuestionBank() {
  const { id }   = useParams(); // assessment id
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions]   = useState([]); // MCQ
  const [codingQuestions, setCodingQuestions] = useState([]); // Coding
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [activeTab, setActiveTab]   = useState('mcq'); // mcq | coding

  // MCQ Forms
  const [addForm, setAddForm]       = useState({ ...BLANK_Q });
  const [addLoading, setAddLoading] = useState(false);
  const [editId, setEditId]         = useState(null);
  const [editForm, setEditForm]     = useState({});
  const [bulkText, setBulkText]     = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulk, setShowBulk]     = useState(false);

  // Coding Forms
  const [codingForm, setCodingForm] = useState({ ...BLANK_CODING });
  const [codingLoading, setCodingLoading] = useState(false);
  const [editCodingId, setEditCodingId] = useState(null);
  const [editCodingForm, setEditCodingForm] = useState({});
  const [templateEditorLang, setTemplateEditorLang] = useState('python');

  const load = () => {
    setLoading(true);
    // Load MCQs
    API.get(`/assessments/${id}/questions`)
      .then(r => { 
        setAssessment(r.data.assessment); 
        setQuestions(r.data.questions || []); 
      })
      .catch(() => setError('Failed to load MCQs'));

    // Load Codings
    API.get(`/assessments/${id}/questions/coding`)
      .then(r => {
        setCodingQuestions(r.data.questions || []);
      })
      .catch(() => setError('Failed to load coding questions'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  // MCQ Handlers
  const setAF = (k, v) => setAddForm(p => ({ ...p, [k]: v }));
  const setEF = (k, v) => setEditForm(p => ({ ...p, [k]: v }));

  const handleAddMCQ = async (e) => {
    e.preventDefault();
    setAddLoading(true); setError(''); setSuccess('');
    try {
      await API.post(`/assessments/${id}/questions`, addForm);
      setSuccess('MCQ added successfully!');
      setAddForm({ ...BLANK_Q });
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to add');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteMCQ = async (qid) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await API.delete(`/assessments/${id}/questions/${qid}`);
      setSuccess('Question deleted');
      setQuestions(q => q.filter(x => x.id !== qid));
    } catch (e) {
      setError(e.response?.data?.error || 'Delete failed');
    }
  };

  const startEditMCQ = (q) => {
    setEditId(q.id);
    setEditForm({
      questionText:  q.questionText,
      optionA:       q.optionA,
      optionB:       q.optionB,
      optionC:       q.optionC,
      optionD:       q.optionD,
      correctAnswer: q.correctAnswer || 'a',
      marks:         q.marks,
    });
  };

  const saveEditMCQ = async (qid) => {
    try {
      await API.put(`/assessments/${id}/questions/${qid}`, editForm);
      setSuccess('MCQ updated successfully!');
      setEditId(null);
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Update failed');
    }
  };

  const handleBulk = async () => {
    if (!bulkText.trim()) return;
    setBulkLoading(true); setError(''); setSuccess('');
    try {
      const lines = bulkText.trim().split('\n').filter(l => l.trim());
      const qList = lines.map(line => {
        const parts = line.split('|').map(p => p.trim());
        return {
          questionText:  parts[0] || '',
          optionA:       parts[1] || '',
          optionB:       parts[2] || '',
          optionC:       parts[3] || '',
          optionD:       parts[4] || '',
          correctAnswer: (parts[5] || 'a').toLowerCase(),
          marks:         parseInt(parts[6] || '1') || 1,
        };
      });
      const res = await API.post(`/assessments/${id}/questions/bulk`, { questions: qList });
      setSuccess(`${res.data.added} MCQ questions added!`);
      setBulkText('');
      setShowBulk(false);
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Bulk upload failed');
    } finally {
      setBulkLoading(false);
    }
  };

  // Coding Question Handlers
  const handleAddCoding = async (e) => {
    e.preventDefault();
    setCodingLoading(true); setError(''); setSuccess('');
    try {
      // Validate test cases
      if (codingForm.testCases.length === 0 || !codingForm.testCases[0].output) {
        throw new Error("You must define at least one valid test case.");
      }
      
      const payload = {
        ...codingForm,
        testCases: JSON.stringify(codingForm.testCases)
      };
      
      await API.post(`/assessments/${id}/questions/coding`, payload);
      setSuccess('Coding Challenge added successfully!');
      setCodingForm({ ...BLANK_CODING });
      load();
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to add coding question.');
    } finally {
      setCodingLoading(false);
    }
  };

  const handleDeleteCoding = async (qid) => {
    if (!window.confirm('Delete this coding challenge?')) return;
    try {
      await API.delete(`/assessments/${id}/questions/coding/${qid}`);
      setSuccess('Coding challenge deleted');
      setCodingQuestions(q => q.filter(x => x.id !== qid));
    } catch (e) {
      setError(e.response?.data?.error || 'Delete failed');
    }
  };

  const startEditCoding = (q) => {
    setEditCodingId(q.id);
    let parsedTestCases = [{ input: '', output: '', is_hidden: false }];
    try {
      parsedTestCases = JSON.parse(q.testCases || '[]');
    } catch {}
    
    setEditCodingForm({
      title: q.title,
      description: q.description,
      difficulty: q.difficulty || 'Medium',
      inputFormat: q.inputFormat || '',
      outputFormat: q.outputFormat || '',
      constraints: q.constraints || '',
      sampleInput: q.sampleInput || '',
      sampleOutput: q.sampleOutput || '',
      testCases: parsedTestCases,
      templatePython: q.templatePython || '',
      templateJava: q.templateJava || '',
      templateCpp: q.templateCpp || '',
      templateJavascript: q.templateJavascript || '',
      marks: q.marks || 10
    });
  };

  const saveEditCoding = async (qid) => {
    try {
      const payload = {
        ...editCodingForm,
        testCases: JSON.stringify(editCodingForm.testCases)
      };
      await API.put(`/assessments/${id}/questions/coding/${qid}`, payload);
      setSuccess('Coding challenge updated!');
      setEditCodingId(null);
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Update failed');
    }
  };

  const addTestCase = (isEdit = false) => {
    if (isEdit) {
      setEditCodingForm(p => ({
        ...p,
        testCases: [...p.testCases, { input: '', output: '', is_hidden: false }]
      }));
    } else {
      setCodingForm(p => ({
        ...p,
        testCases: [...p.testCases, { input: '', output: '', is_hidden: false }]
      }));
    }
  };

  const updateTestCase = (index, key, value, isEdit = false) => {
    if (isEdit) {
      const updated = [...editCodingForm.testCases];
      updated[index][key] = value;
      setEditCodingForm(p => ({ ...p, testCases: updated }));
    } else {
      const updated = [...codingForm.testCases];
      updated[index][key] = value;
      setCodingForm(p => ({ ...p, testCases: updated }));
    }
  };

  const removeTestCase = (index, isEdit = false) => {
    if (isEdit) {
      const updated = editCodingForm.testCases.filter((_, i) => i !== index);
      setEditCodingForm(p => ({ ...p, testCases: updated }));
    } else {
      const updated = codingForm.testCases.filter((_, i) => i !== index);
      setCodingForm(p => ({ ...p, testCases: updated }));
    }
  };

  if (loading) return <div className="rp-loading">⟳ Loading…</div>;

  return (
    <div className="rp-page">
      <div className="rp-header">
        <div>
          <h1 className="rp-title">❓ Question Bank</h1>
          <p className="rp-sub">{assessment?.title} · ({questions.length} MCQ, {codingQuestions.length} Coding)</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="rp-btn rp-btn-outline" onClick={() => navigate('/dashboard/assessments')}>← Back</button>
        </div>
      </div>

      {error   && <div className="rp-alert-error">✕ {error}</div>}
      {success && <div className="rp-alert-success">✓ {success}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--r-border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('mcq')}
          className={`rp-btn ${activeTab === 'mcq' ? 'rp-btn-primary' : 'rp-btn-outline'}`}
          style={{ padding: '0.5rem 1.5rem' }}
        >
          📝 Multiple Choice (MCQ)
        </button>
        <button
          onClick={() => setActiveTab('coding')}
          className={`rp-btn ${activeTab === 'coding' ? 'rp-btn-primary' : 'rp-btn-outline'}`}
          style={{ padding: '0.5rem 1.5rem' }}
        >
          💻 Coding Challenges
        </button>
      </div>

      {activeTab === 'mcq' ? (
        /* MCQ SECTION */
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="rp-btn rp-btn-outline" style={{ fontSize: '0.8rem' }} onClick={() => setShowBulk(!showBulk)}>
              📋 Bulk Upload MCQ
            </button>
          </div>

          {/* Bulk Upload Panel */}
          {showBulk && (
            <div className="rp-card" style={{ marginBottom: '1.5rem' }}>
              <div className="rp-card-title">📋 Bulk Upload MCQ Questions</div>
              <p style={{ color: 'rgba(200,185,230,0.6)', fontSize: '0.825rem', marginBottom: '0.75rem' }}>
                Format: <code style={{ background: 'rgba(255,255,255,0.07)', padding: '2px 6px', borderRadius: 4 }}>
                  Question Text|Option A|Option B|Option C|Option D|correct(a/b/c/d)|marks
                </code> — one per line.
              </p>
              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder={BLANK_BULK}
                style={{
                  width: '100%', minHeight: 150, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--r-border)', borderRadius: 8, padding: '0.75rem',
                  color: 'var(--r-text)', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical',
                }}
              />
              <button className="rp-btn rp-btn-primary" style={{ marginTop: '0.75rem' }} onClick={handleBulk} disabled={bulkLoading}>
                {bulkLoading ? '⟳ Uploading…' : '⬆️ Upload MCQ'}
              </button>
            </div>
          )}

          {/* Add Single Question */}
          <div className="rp-card" style={{ marginBottom: '1.5rem' }}>
            <div className="rp-card-title">+ Add MCQ Question</div>
            <form onSubmit={handleAddMCQ}>
              <div className="rp-field" style={{ marginBottom: '0.75rem' }}>
                <label>Question Text *</label>
                <textarea style={{ minHeight: 60 }} value={addForm.questionText} onChange={e => setAF('questionText', e.target.value)} required placeholder="Type your question here..." />
              </div>
              <div className="rp-grid-2" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                {['A','B','C','D'].map(opt => (
                  <div key={opt} className="rp-field">
                    <label>Option {opt} *</label>
                    <input value={addForm[`option${opt}`]} onChange={e => setAF(`option${opt}`, e.target.value)} placeholder={`Option {opt}`} required />
                  </div>
                ))}
              </div>
              <div className="rp-grid-2" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="rp-field">
                  <label>Correct Answer *</label>
                  <select value={addForm.correctAnswer} onChange={e => setAF('correctAnswer', e.target.value)}>
                    {['a','b','c','d'].map(v => <option key={v} value={v}>Option {v.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="rp-field">
                  <label>Marks</label>
                  <input type="number" min={1} value={addForm.marks} onChange={e => setAF('marks', parseInt(e.target.value))} />
                </div>
              </div>
              <button type="submit" className="rp-btn rp-btn-primary" disabled={addLoading}>
                {addLoading ? '⟳ Adding…' : '+ Add Question'}
              </button>
            </form>
          </div>

          {/* Questions List */}
          <div className="rp-card">
            <div className="rp-card-title">📋 MCQ Questions ({questions.length})</div>
            {questions.length === 0 && <div className="rp-empty">No MCQs yet. Add some above!</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {questions.map((q, i) => (
                <div key={q.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--r-border)', borderRadius: 12, padding: '1rem' }}>
                  {editId === q.id ? (
                    <div>
                      <div className="rp-field" style={{ marginBottom: '0.75rem' }}>
                        <label>Question</label>
                        <textarea value={editForm.questionText} onChange={e => setEF('questionText', e.target.value)} style={{ minHeight: 56 }} />
                      </div>
                      <div className="rp-grid-2" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                        {['A','B','C','D'].map(opt => (
                          <div key={opt} className="rp-field">
                            <label>Option {opt}</label>
                            <input value={editForm[`option${opt}`]} onChange={e => setEF(`option${opt}`, e.target.value)} />
                          </div>
                        ))}
                      </div>
                      <div className="rp-grid-2" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div className="rp-field">
                          <label>Correct Answer</label>
                          <select value={editForm.correctAnswer} onChange={e => setEF('correctAnswer', e.target.value)}>
                            {['a','b','c','d'].map(v => <option key={v} value={v}>Option {v.toUpperCase()}</option>)}
                          </select>
                        </div>
                        <div className="rp-field">
                          <label>Marks</label>
                          <input type="number" min={1} value={editForm.marks} onChange={e => setEF('marks', parseInt(e.target.value))} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="rp-btn rp-btn-primary" onClick={() => saveEditMCQ(q.id)}>💾 Save</button>
                        <button className="rp-btn rp-btn-outline" onClick={() => setEditId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.6rem', fontSize: '0.95rem' }}>
                          <span style={{ color: 'var(--r-muted)', marginRight: '0.5rem' }}>{i+1}.</span>{q.questionText}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                          {['A','B','C','D'].map((opt) => {
                            const key = `option${opt}`;
                            const isCorrect = q.correctAnswer === opt.toLowerCase();
                            return (
                              <div key={opt} style={{
                                padding: '0.3rem 0.6rem', borderRadius: 6, fontSize: '0.825rem',
                                background: isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(167,139,250,0.1)'}`,
                                color: isCorrect ? '#34d399' : 'var(--r-muted)',
                              }}>
                                <strong>{opt}.</strong> {q[key]}
                                {isCorrect && ' ✓'}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
                        <span className="rp-badge rp-badge-yellow">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="rp-btn rp-btn-outline" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => startEditMCQ(q)}>✏️ Edit</button>
                          <button className="rp-btn rp-btn-danger"  style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => handleDeleteMCQ(q.id)}>🗑️</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* CODING CHALLENGES SECTION */
        <div>
          {/* Add Coding Challenge */}
          <div className="rp-card" style={{ marginBottom: '1.5rem' }}>
            <div className="rp-card-title">+ Create Coding Challenge</div>
            <form onSubmit={handleAddCoding}>
              <div className="rp-grid-2" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="rp-field">
                  <label>Challenge Title *</label>
                  <input value={codingForm.title} onChange={e => setCodingForm(p => ({ ...p, title: e.target.value }))} required placeholder="e.g. Reverse an Array" />
                </div>
                <div className="rp-field">
                  <label>Difficulty *</label>
                  <select value={codingForm.difficulty} onChange={e => setCodingForm(p => ({ ...p, difficulty: e.target.value }))}>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="rp-field" style={{ marginBottom: '0.75rem' }}>
                <label>Problem Description *</label>
                <textarea style={{ minHeight: 80 }} value={codingForm.description} onChange={e => setCodingForm(p => ({ ...p, description: e.target.value }))} required placeholder="Describe the constraints, requirements, and logic..." />
              </div>

              <div className="rp-grid-3" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="rp-field">
                  <label>Input Format</label>
                  <input value={codingForm.inputFormat} onChange={e => setCodingForm(p => ({ ...p, inputFormat: e.target.value }))} placeholder="e.g. An integer N, followed by..." />
                </div>
                <div className="rp-field">
                  <label>Output Format</label>
                  <input value={codingForm.outputFormat} onChange={e => setCodingForm(p => ({ ...p, outputFormat: e.target.value }))} placeholder="e.g. The reversed values..." />
                </div>
                <div className="rp-field">
                  <label>Constraints</label>
                  <input value={codingForm.constraints} onChange={e => setCodingForm(p => ({ ...p, constraints: e.target.value }))} placeholder="e.g. 1 <= N <= 10^5" />
                </div>
              </div>

              <div className="rp-grid-2" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="rp-field">
                  <label>Sample Input</label>
                  <textarea style={{ minHeight: 50, fontFamily: 'monospace' }} value={codingForm.sampleInput} onChange={e => setCodingForm(p => ({ ...p, sampleInput: e.target.value }))} placeholder="e.g. 5\n1 2 3 4 5" />
                </div>
                <div className="rp-field">
                  <label>Sample Output</label>
                  <textarea style={{ minHeight: 50, fontFamily: 'monospace' }} value={codingForm.sampleOutput} onChange={e => setCodingForm(p => ({ ...p, sampleOutput: e.target.value }))} placeholder="e.g. 5 4 3 2 1" />
                </div>
              </div>

              {/* Starter Templates */}
              <div className="rp-field" style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label>Languages Starter Templates (Monaco Editor Enabled)</label>
                  <select value={templateEditorLang} onChange={e => setTemplateEditorLang(e.target.value)} style={{ background: 'var(--r-bg-body)', color: 'white', border: '1px solid var(--r-border)', padding: '2px 8px', borderRadius: 4, fontSize: '0.8rem' }}>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                  </select>
                </div>
                
                <div style={{ height: '140px', background: '#1e1e1e', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--r-border)' }}>
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    language={templateEditorLang === 'javascript' ? 'javascript' : templateEditorLang === 'cpp' ? 'cpp' : templateEditorLang === 'java' ? 'java' : 'python'}
                    value={
                      templateEditorLang === 'python' ? codingForm.templatePython :
                      templateEditorLang === 'javascript' ? codingForm.templateJavascript :
                      templateEditorLang === 'cpp' ? codingForm.templateCpp :
                      codingForm.templateJava
                    }
                    onChange={(val) => {
                      const key = templateEditorLang === 'python' ? 'templatePython' :
                                  templateEditorLang === 'javascript' ? 'templateJavascript' :
                                  templateEditorLang === 'cpp' ? 'templateCpp' :
                                  'templateJava';
                      setCodingForm(p => ({ ...p, [key]: val }));
                    }}
                    options={{ fontSize: 13, minimap: { enabled: false } }}
                  />
                </div>
              </div>

              {/* Test Cases Builder */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--r-text)' }}>Test Cases Configuration *</strong>
                  <button type="button" className="rp-btn rp-btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }} onClick={() => addTestCase(false)}>
                    + Add Test Case
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {codingForm.testCases.map((tc, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 40px', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.4rem', borderRadius: 6 }}>
                      <input
                        placeholder="Input (e.g. 5)"
                        value={tc.input}
                        onChange={(e) => updateTestCase(index, 'input', e.target.value, false)}
                        style={{ fontSize: '0.8rem', padding: '0.35rem' }}
                      />
                      <input
                        placeholder="Expected Output (e.g. 10)"
                        value={tc.output}
                        onChange={(e) => updateTestCase(index, 'output', e.target.value, false)}
                        style={{ fontSize: '0.8rem', padding: '0.35rem' }}
                        required
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', cursor: 'pointer', margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={tc.is_hidden}
                          onChange={(e) => updateTestCase(index, 'is_hidden', e.target.checked, false)}
                        />
                        Secret case?
                      </label>
                      <button type="button" className="rp-btn rp-btn-danger" style={{ padding: '0.25rem', fontSize: '0.8rem' }} onClick={() => removeTestCase(index, false)} disabled={codingForm.testCases.length === 1}>
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rp-grid-2" style={{ gap: '0.75rem', marginBottom: '1rem', maxWidth: 400 }}>
                <div className="rp-field">
                  <label>Award Marks</label>
                  <input type="number" min={1} value={codingForm.marks} onChange={e => setCodingForm(p => ({ ...p, marks: parseInt(e.target.value) || 10 }))} />
                </div>
              </div>

              <button type="submit" className="rp-btn rp-btn-primary" disabled={codingLoading}>
                {codingLoading ? '⟳ Creating Challenge…' : '✓ Create Challenge'}
              </button>
            </form>
          </div>

          {/* Coding Challenges List */}
          <div className="rp-card">
            <div className="rp-card-title">💻 Custom Coding Challenges ({codingQuestions.length})</div>
            {codingQuestions.length === 0 && <div className="rp-empty">No coding challenges defined yet. Define one above!</div>}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {codingQuestions.map((q, i) => {
                let tcCount = 0;
                try { tcCount = JSON.parse(q.testCases || '[]').length; } catch {}
                
                return (
                  <div key={q.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--r-border)', borderRadius: 12, padding: '1rem' }}>
                    {editCodingId === q.id ? (
                      /* Edit Coding challenge form */
                      <div>
                        <div className="rp-grid-2" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <div className="rp-field">
                            <label>Title</label>
                            <input value={editCodingForm.title} onChange={e => setEditCodingForm(p => ({ ...p, title: e.target.value }))} />
                          </div>
                          <div className="rp-field">
                            <label>Difficulty</label>
                            <select value={editCodingForm.difficulty} onChange={e => setEditCodingForm(p => ({ ...p, difficulty: e.target.value }))}>
                              <option value="Easy">Easy</option>
                              <option value="Medium">Medium</option>
                              <option value="Hard">Hard</option>
                            </select>
                          </div>
                        </div>

                        <div className="rp-field" style={{ marginBottom: '0.75rem' }}>
                          <label>Description</label>
                          <textarea style={{ minHeight: 70 }} value={editCodingForm.description} onChange={e => setEditCodingForm(p => ({ ...p, description: e.target.value }))} />
                        </div>

                        <div className="rp-grid-3" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <div className="rp-field">
                            <label>Input Format</label>
                            <input value={editCodingForm.inputFormat} onChange={e => setEditCodingForm(p => ({ ...p, inputFormat: e.target.value }))} />
                          </div>
                          <div className="rp-field">
                            <label>Output Format</label>
                            <input value={editCodingForm.outputFormat} onChange={e => setEditCodingForm(p => ({ ...p, outputFormat: e.target.value }))} />
                          </div>
                          <div className="rp-field">
                            <label>Constraints</label>
                            <input value={editCodingForm.constraints} onChange={e => setEditCodingForm(p => ({ ...p, constraints: e.target.value }))} />
                          </div>
                        </div>

                        {/* Test case edit */}
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <label style={{ fontWeight: 600 }}>Test Cases Configurations:</label>
                            <button type="button" className="rp-btn rp-btn-outline" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }} onClick={() => addTestCase(true)}>
                              + Add Case
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {editCodingForm.testCases?.map((tc, index) => (
                              <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 40px', gap: '0.4rem', alignItems: 'center' }}>
                                <input
                                  value={tc.input}
                                  onChange={(e) => updateTestCase(index, 'input', e.target.value, true)}
                                  placeholder="Input"
                                  style={{ padding: '0.3rem', fontSize: '0.8rem' }}
                                />
                                <input
                                  value={tc.output}
                                  onChange={(e) => updateTestCase(index, 'output', e.target.value, true)}
                                  placeholder="Output"
                                  style={{ padding: '0.3rem', fontSize: '0.8rem' }}
                                  required
                                />
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', margin: 0 }}>
                                  <input
                                    type="checkbox"
                                    checked={tc.is_hidden}
                                    onChange={(e) => updateTestCase(index, 'is_hidden', e.target.checked, true)}
                                  />
                                  Secret?
                                </label>
                                <button type="button" className="rp-btn rp-btn-danger" style={{ padding: '0.2rem' }} onClick={() => removeTestCase(index, true)} disabled={editCodingForm.testCases.length === 1}>
                                  🗑️
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rp-grid-2" style={{ gap: '0.75rem', marginBottom: '1rem', maxWidth: 400 }}>
                          <div className="rp-field">
                            <label>Marks</label>
                            <input type="number" value={editCodingForm.marks} onChange={e => setEditCodingForm(p => ({ ...p, marks: parseInt(e.target.value) || 10 }))} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button type="button" className="rp-btn rp-btn-primary" onClick={() => saveEditCoding(q.id)}>💾 Save Challenge</button>
                          <button type="button" className="rp-btn rp-btn-outline" onClick={() => setEditCodingId(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      /* Read-only view of Coding question */
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <span style={{ color: 'var(--r-muted)', fontWeight: 600 }}>{i + 1}.</span>
                            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--r-text)' }}>{q.title}</span>
                            <span className={`rp-badge ${q.difficulty === 'Easy' ? 'rp-badge-green' : q.difficulty === 'Hard' ? 'rp-badge-red' : 'rp-badge-yellow'}`}>
                              {q.difficulty}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--r-muted)' }}>({tcCount} Test Cases)</span>
                          </div>
                          
                          <p style={{ color: 'var(--r-muted)', fontSize: '0.85rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '0.5rem' }}>
                            {q.description.substring(0, 180)}{q.description.length > 180 ? '...' : ''}
                          </p>
                          
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {q.templatePython && <span style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', color: '#a78bfa' }}>Python 3</span>}
                            {q.templateJavascript && <span style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', color: '#60a5fa' }}>JavaScript</span>}
                            {q.templateCpp && <span style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', color: '#34d399' }}>C++</span>}
                            {q.templateJava && <span style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', color: '#f59e0b' }}>Java</span>}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                          <span className="rp-badge rp-badge-yellow" style={{ fontSize: '0.85rem' }}>{q.marks} Marks</span>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button className="rp-btn rp-btn-outline" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => startEditCoding(q)}>✏️ Edit</button>
                            <button className="rp-btn rp-btn-danger" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => handleDeleteCoding(q.id)}>🗑️</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
