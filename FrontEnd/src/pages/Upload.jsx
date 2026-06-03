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
  const [titleEn, setTitleEn] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
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
          title, 
          title_en: titleEn, 
          description, 
          description_en: descriptionEn, 
          category_tags: categoryTags,
          time_limit: timePerQuestion, 
          image_url: gameImageUrl,
          questions: questionsWithImage
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
      <Link to="/" className="back-btn">← {t('common.goBack')}</Link>
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

            <div className="glass-panel upload-guidelines" style={{ padding: '1.5rem', marginBottom: '2.5rem', borderRadius: '12px', borderLeft: '4px solid var(--accent)', background: 'rgba(255, 255, 255, 0.02)', textAlign: 'left' }}>
              <h4 style={{ color: 'var(--accent)', marginBottom: '0.75rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
                📋 Ketentuan Unggah Kuis / Quiz Upload Guidelines
              </h4>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 1.25rem 0' }}>
                <li><strong>Format File:</strong> Gunakan file <strong>.txt</strong> dengan format khusus di bawah — 100% tanpa AI, langsung di-parse oleh server.</li>
                <li><strong>Jumlah Pertanyaan:</strong> Minimal <strong>3 pertanyaan</strong> (disarankan 5 atau lebih).</li>
                <li><strong>Opsi Pilihan:</strong> Setiap pertanyaan wajib punya <strong>4 pilihan (A, B, C, D)</strong> dan kunci jawaban.</li>
                <li><strong>Dukungan 2 Bahasa:</strong> Tambahkan baris <code style={{background:'rgba(255,255,255,0.08)',padding:'1px 6px',borderRadius:'4px',fontFamily:'monospace'}}>Question_EN:</code>, <code style={{background:'rgba(255,255,255,0.08)',padding:'1px 6px',borderRadius:'4px',fontFamily:'monospace'}}>A_EN:</code> dst. untuk versi Inggris. Kalau tidak ada, otomatis pakai versi Indonesia.
                </li>
              </ul>
              <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '10px', padding: '1rem 1.25rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#a3e635', lineHeight: '1.7', overflowX: 'auto' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>📄 Contoh format file .txt:</div>
                <div>Question: Siapa pencipta Minecraft?</div>
                <div>Question_EN: Who created Minecraft?</div>
                <div>A: Markus Persson (Notch)</div>
                <div>A_EN: Markus Persson (Notch)</div>
                <div>B: Gabe Newell</div>
                <div>B_EN: Gabe Newell</div>
                <div>C: Todd Howard</div>
                <div>C_EN: Todd Howard</div>
                <div>D: Steve Jobs</div>
                <div>D_EN: Steve Jobs</div>
                <div>Answer: A</div>
                <div style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.35)' }}># (baris kosong antara pertanyaan)</div>
              </div>
            </div>

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
            <h2>{t('upload.step2')}: Info Kuis</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>Isi judul, deskripsi, dan kategori kuis. Pertanyaan akan diambil otomatis dari file .txt yang diunggah.</p>
            <div className="config-form">
              <div className="form-field-dark">
                <label>Quiz Title (ID / Main)</label>
                <input type="text" className="input-glass" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('upload.quizTitle')} maxLength={100} />
              </div>
              <div className="form-field-dark">
                <label>Quiz Title (English Translation)</label>
                <input type="text" className="input-glass" value={titleEn} onChange={e => setTitleEn(e.target.value)} placeholder="Enter English translation of the title" maxLength={100} />
              </div>
              <div className="form-field-dark">
                <label>Description (ID / Main)</label>
                <textarea className="input-glass" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('upload.quizDesc')} maxLength={500} />
              </div>
              <div className="form-field-dark">
                <label>Description (English Translation)</label>
                <textarea className="input-glass" rows={2} value={descriptionEn} onChange={e => setDescriptionEn(e.target.value)} placeholder="Enter English translation of the description" maxLength={500} />
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
                {loading ? '⏳ Memproses file...' : '📋 Parse Pertanyaan dari File'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <div className="step-header-row">
              <h2>{t('upload.step3')}: Edit Questions</h2>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>✏️ Periksa dan edit pertanyaan sebelum dipublikasi</span>
            </div>

            <div className="questions-editor">
              {questions.map((q, idx) => (
                <div key={idx} className="question-editor-item">
                  <div className="q-header">
                    <span className="q-num">Q{idx + 1}</span>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteQuestion(idx)}>{t('upload.deleteQuestion')}</button>
                  </div>
                   <input className="input-glass q-input" placeholder="Question Text (ID / Main)" value={q.question_text} onChange={e => updateQuestion(idx, 'question_text', e.target.value)} />
                   <input className="input-glass q-input" placeholder="Question Text (English Translation)" value={q.question_text_en || ''} onChange={e => updateQuestion(idx, 'question_text_en', e.target.value)} style={{ marginTop: '0.5rem' }} />
                   
                   <div className="options-editor" style={{ marginTop: '1.25rem' }}>
                     {['A', 'B', 'C', 'D'].map(key => (
                       <div key={key} className="option-edit-row" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem', width: '100%' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                           <label className={`correct-radio ${q.correct_option === key ? 'is-correct' : ''}`} style={{ minWidth: '40px' }}>
                             <input type="radio" name={`correct_${idx}`} checked={q.correct_option === key} onChange={() => updateQuestion(idx, 'correct_option', key)} />
                             {key}
                           </label>
                           <input className="input-glass q-input" placeholder={`Option ${key} (ID / Main)`} value={q[`option_${key.toLowerCase()}`]} onChange={e => updateQuestion(idx, `option_${key.toLowerCase()}`, e.target.value)} style={{ flex: 1 }} />
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '3.5rem' }}>
                           <input className="input-glass q-input" placeholder={`Option ${key} (English Translation)`} value={q[`option_${key.toLowerCase()}_en`] || ''} onChange={e => updateQuestion(idx, `option_${key.toLowerCase()}_en`, e.target.value)} style={{ flex: 1 }} />
                         </div>
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
