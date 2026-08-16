import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { toast, PageLoader } from '../../components/Toast';
import '../RecruiterDashboard.css';

export default function CourseManager() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentCourseId, setCurrentCourseId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [duration, setDuration] = useState('');
  const [instructor, setInstructor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [syllabus, setSyllabus] = useState([]);

  const loadData = () => {
    setLoading(true);
    API.get('/courses')
      .then((cRes) => {
        setCourses(cRes.data.courses || []);
      })
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const openCreateForm = () => {
    setIsEditing(true);
    setCurrentCourseId(null);
    setTitle('');
    setDescription('');
    setDifficulty('beginner');
    setDuration('');
    setInstructor('');
    setImageUrl('');
    setSyllabus([]);
  };

  const openEditForm = async (courseId) => {
    setLoading(true);
    try {
      const res = await API.get(`/courses/${courseId}`);
      const c = res.data.course;
      setIsEditing(true);
      setCurrentCourseId(c.id);
      setTitle(c.title || '');
      setDescription(c.description || '');
      setDifficulty(c.difficulty || 'beginner');
      setDuration(c.duration || '');
      setInstructor(c.instructor || '');
      setImageUrl(c.imageUrl || '');
      setSyllabus(c.syllabus || []);
    } catch (e) {
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChapter = () => {
    setSyllabus(prev => [...prev, { title: '', description: '', topics: '', studyMaterial: '', gfgLink: '', leetcodeLinks: '' }]);
  };

  const handleRemoveChapter = (idx) => {
    setSyllabus(prev => prev.filter((_, i) => i !== idx));
  };

  const handleChapterChange = (idx, field, value) => {
    setSyllabus(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Course title is required');

    const payload = {
      title,
      description,
      difficulty,
      duration,
      instructor,
      imageUrl,
      syllabus
    };

    try {
      if (currentCourseId) {
        await API.put(`/recruiter/courses/${currentCourseId}`, payload);
        toast.success('Course updated successfully');
      } else {
        await API.post('/recruiter/courses', payload);
        toast.success('Course created successfully');
      }
      setIsEditing(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save course');
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Delete this course?')) return;
    try {
      await API.delete(`/recruiter/courses/${courseId}`);
      toast.success('Course deleted successfully');
      loadData();
    } catch (e) {
      toast.error('Failed to delete course');
    }
  };

  if (loading && !isEditing) return <PageLoader label="Loading courses..." />;

  return (
    <div className="rp-page">
      <div className="rp-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="rp-title">📚 Course Management</h1>
          <p className="rp-sub">Create curricula, add GFG references, and map LeetCode practice problems.</p>
        </div>
        {!isEditing && (
          <button className="rp-btn-blue" onClick={openCreateForm}>
            ➕ Add Course
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="rp-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' }}>
          <h2>{currentCourseId ? '✏️ Edit Course' : '➕ Create New Course'}</h2>
          
          <div className="rp-form-group">
            <label className="rp-label">Course Title*</label>
            <input type="text" className="rp-input" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div className="rp-form-group">
            <label className="rp-label">Description</label>
            <textarea className="rp-textarea" rows="3" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="rp-form-group">
              <label className="rp-label">Difficulty Level</label>
              <select className="rp-input" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="rp-form-group">
              <label className="rp-label">Duration (e.g. "6 hours", "4 weeks")</label>
              <input type="text" className="rp-input" value={duration} onChange={e => setDuration(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="rp-form-group">
              <label className="rp-label">Lead Instructor</label>
              <input type="text" className="rp-input" value={instructor} onChange={e => setInstructor(e.target.value)} />
            </div>
            <div className="rp-form-group">
              <label className="rp-label">Image URL</label>
              <input type="text" className="rp-input" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>📚 Syllabus Curriculum</h3>
              <button type="button" className="rp-btn-blue" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={handleAddChapter}>
                ➕ Add Chapter
              </button>
            </div>
            
            {syllabus.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.9rem', fontStyle: 'italic' }}>No chapters added yet. Click "Add Chapter" to create your curriculum.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {syllabus.map((chapter, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1.25rem', position: 'relative' }}>
                    <button type="button" onClick={() => handleRemoveChapter(idx)} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none', border: 'none', color: '#ef4444', fontSize: '1.2rem', cursor: 'pointer' }}>
                      ✕
                    </button>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#a78bfa' }}>Chapter {idx + 1}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <input type="text" placeholder="Chapter Title" className="rp-input" value={chapter.title} onChange={e => handleChapterChange(idx, 'title', e.target.value)} />
                      <textarea placeholder="Brief overview of chapter goals" className="rp-textarea" rows="2" value={chapter.description} onChange={e => handleChapterChange(idx, 'description', e.target.value)} />
                      <input type="text" placeholder="Topics covered (comma-separated)" className="rp-input" value={chapter.topics} onChange={e => handleChapterChange(idx, 'topics', e.target.value)} />
                      <textarea placeholder="Chapter Study Material (text / code snippets for candidate tutorials)" className="rp-textarea" rows="4" value={chapter.studyMaterial || ''} onChange={e => handleChapterChange(idx, 'studyMaterial', e.target.value)} />
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.25rem' }}>
                        <div className="rp-form-group" style={{ margin: 0 }}>
                          <label className="rp-label" style={{ fontSize: '0.75rem', color: '#a78bfa' }}>GeeksforGeeks Reference Link (URL)</label>
                          <input type="url" placeholder="https://www.geeksforgeeks.org/..." className="rp-input" value={chapter.gfgLink || ''} onChange={e => handleChapterChange(idx, 'gfgLink', e.target.value)} />
                        </div>
                        <div className="rp-form-group" style={{ margin: 0 }}>
                          <label className="rp-label" style={{ fontSize: '0.75rem', color: '#a78bfa' }}>LeetCode Practice Links (comma-separated URLs)</label>
                          <input type="text" placeholder="https://leetcode.com/problems/...,https://..." className="rp-input" value={chapter.leetcodeLinks || ''} onChange={e => handleChapterChange(idx, 'leetcodeLinks', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="rp-btn-blue">
              Save Course
            </button>
            <button type="button" className="rp-btn-red" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="rp-table-container">
          {courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: '#9ca3af' }}>
              No courses configured yet. Click "Add Course" to get started!
            </div>
          ) : (
            <table className="rp-table">
              <thead>
                <tr>
                  <th>Course Title</th>
                  <th>Difficulty</th>
                  <th>Duration</th>
                  <th>Instructor</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.id}>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>{course.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                        {course.description ? (course.description.length > 80 ? `${course.description.substring(0, 80)}...` : course.description) : '—'}
                      </div>
                    </td>
                    <td>
                      <span className={`rp-badge ${course.difficulty === 'advanced' ? 'rp-badge-red' : course.difficulty === 'intermediate' ? 'rp-badge-yellow' : 'rp-badge-green'}`}>
                        {course.difficulty}
                      </span>
                    </td>
                    <td>{course.duration || '—'}</td>
                    <td>{course.instructor || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="rp-btn-blue" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => openEditForm(course.id)}>
                          Edit
                        </button>
                        <button className="rp-btn-red" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleDelete(course.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}