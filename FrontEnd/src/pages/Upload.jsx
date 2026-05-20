import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSnackbar } from '../context/SnackbarContext';
import './Upload.css';

const API = 'http://localhost:5000/api';

const Upload = () => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryTags, setCategoryTags] = useState('');
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [numQuestions, setNumQuestions] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishedQuizId, setPublishedQuizId] = useState(null);
  const fileRef = useRef(null);
  const imgRef = useRef(null);

  const { token } = useAuth();
  const { t } = useLanguage();
  const { showSnackbar } = useSnackbar();

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleImageChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setImageFile(f);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target.result);
      reader.readAsDataURL(f);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleUploadAndGenerate = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('num_questions', numQuestions);

      const res = await fetch(`${API}/upload/document`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Upload failed');

      setQuestions(data.data?.questions || []);
      setExtractedText(data.data?.extracted_text || '');
      showSnackbar('Questions generated successfully!', 'success');
      setStep(3);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally { setLoading(false); }
  };

  const handleAutoGenerate = async () => {
    if (!extractedText || extractedText.length < 50) {
      showSnackbar('Need at least 50 characters of text to generate questions', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/upload/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text: extractedText, num_questions: numQuestions })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Generation failed');
      setQuestions(data.data?.questions || []);
      showSnackbar('Questions regenerated!', 'success');
    } catch (err) { showSnackbar(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const updateQuestion = (idx, field, value) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const deleteQuestion = (idx) => setQuestions(questions.filter((_, i) => i !== idx));

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }]);
  };

  const handlePublish = async () => {
    if (!title.trim()) { showSnackbar('Please enter a quiz title', 'warning'); return; }
    if (questions.length === 0) { showSnackbar('Add at least one question', 'warning'); return; }
    setLoading(true);
    try {
      // Upload image if present
      let gameImageUrl = null;
      if (imageFile) {
        const imgForm = new FormData();
        imgForm.append('image', imageFile);
        const imgRes = await fetch(`${API}/upload/image`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: imgForm
        });
        const imgData = await imgRes.json();
        if (imgRes.ok) gameImageUrl = imgData.data?.image_url;
      }

      // Attach image to questions
      const questionsWithImage = questions.map(q => ({
        ...q,
        image_url: q.image_url || (gameImageUrl ? `http://localhost:5000${gameImageUrl}` : null)
      }));

      const res = await fetch(`${API}/upload/create-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title, description, category_tags: categoryTags,
          time_limit: timePerQuestion, questions: questionsWithImage
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Publish failed');
      setPublishedQuizId(data.data?.quizId);
      setPublished(true);
      showSnackbar(t('upload.quizPublished'), 'success');
    } catch (err) { showSnackbar(err.message, 'error'); }
    finally { setLoading(false); }
  };

  if (published) return (
    <div className="upload-container container">
      <div className="glass-panel upload-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h2>{t('upload.quizPublished')}</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem' }}>"{title}" is now available for players</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary">{t('upload.goHome')}</Link>
          <button className="btn btn-secondary" onClick={() => { setPublished(false); setStep(1); setFile(null); setQuestions([]); setTitle(''); setDescription(''); }}>{t('upload.uploadAnother')}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="upload-container container">
      <h1 className="upload-title">{t('upload.title')}</h1>

      <div className="wizard-steps">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`wizard-step ${step >= s ? 'active' : ''} ${step === s ? 'current' : ''}`}>
            <span className="step-num">{s}</span>
            <span className="step-label">{t(`upload.step${s}`)}</span>
          </div>
        ))}
      </div>

      <div className="glass-panel upload-card">
        {step === 1 && (
          <div className="step-content">
            <h2>{t('upload.step1')}: {t('upload.gameImage')} & Document</h2>

            <div className="upload-section">
              <h3>{t('upload.gameImage')}</h3>
              <div className="image-upload-area" onClick={() => imgRef.current?.click()}>
                {imagePreview ? <img src={imagePreview} alt="Preview" className="preview-img" /> : (
                  <div className="upload-placeholder">📷 {t('upload.uploadImage')}</div>
                )}
                <input ref={imgRef} type="file" accept="image/*" onChange={handleImageChange} hidden />
              </div>
            </div>

            <div className="upload-section">
              <h3>Game Description Document</h3>
              <div className="drop-zone" onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
                {file ? (
                  <div className="file-selected">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <>
                    <div className="drop-icon">📁</div>
                    <p>{t('upload.dragDrop')}</p>
                    <p className="drop-sub">{t('upload.orClickBrowse')}</p>
                    <p className="drop-formats">{t('upload.supportedFormats')}</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept=".txt,.pdf,.docx,.json" onChange={handleFileChange} hidden />
              </div>
            </div>

            <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!file}>{t('upload.next')} →</button>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <h2>{t('upload.step2')}: Configure</h2>
            <div className="config-form">
              <div className="form-field-dark">
                <label>Quiz Title</label>
                <input type="text" className="input-glass" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('upload.quizTitle')} maxLength={100} />
              </div>
              <div className="form-field-dark">
                <label>Description</label>
                <textarea className="input-glass" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('upload.quizDesc')} maxLength={500} />
              </div>
              <div className="form-field-dark">
                <label>{t('upload.categoryTags')}</label>
                <input type="text" className="input-glass" value={categoryTags} onChange={e => setCategoryTags(e.target.value)} placeholder="RPG, Adventure, PC" />
              </div>
              <div className="config-row">
                <div className="form-field-dark">
                  <label>{t('upload.timePerQuestion')}: {timePerQuestion}s</label>
                  <input type="range" min={15} max={120} value={timePerQuestion} onChange={e => setTimePerQuestion(parseInt(e.target.value))} className="slider" />
                </div>
                <div className="form-field-dark">
                  <label>{t('upload.numQuestions')}: {numQuestions}</label>
                  <input type="range" min={3} max={20} value={numQuestions} onChange={e => setNumQuestions(parseInt(e.target.value))} className="slider" />
                </div>
              </div>
            </div>
            <div className="step-actions">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>← {t('upload.back')}</button>
              <button className="btn btn-primary" onClick={handleUploadAndGenerate} disabled={loading || !title.trim()}>
                {loading ? t('upload.processing') : t('upload.uploadAndGenerate')}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <div className="step-header-row">
              <h2>{t('upload.step3')}: Edit Questions</h2>
              <button className="btn btn-outline btn-sm" onClick={handleAutoGenerate} disabled={loading}>🤖 {loading ? '...' : t('upload.autoGenerate')}</button>
            </div>

            <div className="questions-editor">
              {questions.map((q, idx) => (
                <div key={idx} className="question-editor-item">
                  <div className="q-header">
                    <span className="q-num">Q{idx + 1}</span>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteQuestion(idx)}>{t('upload.deleteQuestion')}</button>
                  </div>
                  <input className="input-glass q-input" placeholder={t('upload.questionText')} value={q.question_text} onChange={e => updateQuestion(idx, 'question_text', e.target.value)} />
                  <div className="options-editor">
                    {['A', 'B', 'C', 'D'].map(key => (
                      <div key={key} className="option-edit-row">
                        <label className={`correct-radio ${q.correct_option === key ? 'is-correct' : ''}`}>
                          <input type="radio" name={`correct_${idx}`} checked={q.correct_option === key} onChange={() => updateQuestion(idx, 'correct_option', key)} />
                          {key}
                        </label>
                        <input className="input-glass q-input" placeholder={`Option ${key}`} value={q[`option_${key.toLowerCase()}`]} onChange={e => updateQuestion(idx, `option_${key.toLowerCase()}`, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button className="btn btn-outline add-q-btn" onClick={addQuestion}>+ {t('upload.addQuestion')}</button>
            </div>

            <div className="step-actions">
              <button className="btn btn-secondary" onClick={() => setStep(2)}>← {t('upload.back')}</button>
              <button className="btn btn-primary" onClick={() => setStep(4)} disabled={questions.length === 0}>{t('upload.next')} →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step-content">
            <h2>{t('upload.step4')}: Review & Publish</h2>
            <div className="publish-summary">
              {imagePreview && <img src={imagePreview} alt="Game" className="summary-image" />}
              <div className="summary-details">
                <h3>{title}</h3>
                <p>{description}</p>
                {categoryTags && <div className="quiz-tags">{categoryTags.split(',').map(t => <span key={t} className="tag">{t.trim()}</span>)}</div>}
                <p className="text-muted" style={{ marginTop: '0.5rem' }}>{questions.length} questions • {timePerQuestion}s per question</p>
              </div>
            </div>

            <div className="summary-questions">
              {questions.map((q, i) => (
                <div key={i} className="summary-q">
                  <strong>Q{i + 1}:</strong> {q.question_text}
                  <span className="correct-badge">✓ {q[`option_${q.correct_option.toLowerCase()}`]}</span>
                </div>
              ))}
            </div>

            <div className="step-actions">
              <button className="btn btn-secondary" onClick={() => setStep(3)}>← {t('upload.back')}</button>
              <button className="btn btn-success" onClick={handlePublish} disabled={loading}>
                {loading ? t('upload.processing') : `🚀 ${t('upload.publishQuiz')}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
