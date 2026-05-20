import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSnackbar } from '../context/SnackbarContext';
import './Play.css';

const API = 'http://localhost:5000/api';

const Play = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quizFinished, setQuizFinished] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [prevScore, setPrevScore] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timeLimit, setTimeLimit] = useState(30);
  const [totalTime, setTotalTime] = useState(0);
  const [rank, setRank] = useState(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const { token, isLoggedIn } = useAuth();
  const { t } = useLanguage();
  const { showSnackbar } = useSnackbar();
  const query = new URLSearchParams(useLocation().search);
  const quizId = query.get('quizId') || '1';

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if already completed
        if (token) {
          const checkRes = await fetch(`${API}/quizzes/${quizId}/check`, { headers: { 'Authorization': `Bearer ${token}` } });
          const checkData = await checkRes.json();
          if (checkData.data?.completed) {
            setAlreadyDone(true);
            setPrevScore(checkData.data.score);
            setLoading(false);
            return;
          }
        }

        // Get quiz info
        const quizRes = await fetch(`${API}/quizzes/${quizId}`);
        const quizData = await quizRes.json();
        if (quizData.data) setTimeLimit(quizData.data.time_limit || 30);

        // Get questions
        const qRes = await fetch(`${API}/quizzes/${quizId}/questions`);
        const qData = await qRes.json();
        setQuestions(qData.data || []);
        setTimeLeft(quizData.data?.time_limit || 30);
      } catch (err) { console.error(err); }
      finally { setLoading(false); startTimeRef.current = Date.now(); }
    };
    fetchData();
  }, [quizId, token]);

  // Timer
  useEffect(() => {
    if (questions.length === 0 || quizFinished || alreadyDone || loading) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentIdx, questions.length, quizFinished, alreadyDone, loading]);

  const handleTimeUp = useCallback(() => {
    if (isAnswered) return;
    setIsAnswered(true);
    setIsCorrect(false);
    setShowFeedback(true);
    setTimeout(() => { setShowFeedback(false); handleNext(true); }, 1500);
  }, [isAnswered, currentIdx]);

  const handleOptionClick = (key) => { if (!isAnswered) setSelectedOption(key); };

  const handleSubmitAnswer = () => {
    if (!selectedOption || isAnswered) return;
    clearInterval(timerRef.current);
    setIsAnswered(true);
    const correct = selectedOption === questions[currentIdx].correct_option;
    setIsCorrect(correct);
    if (correct) setScore(prev => prev + 1000);
    setShowFeedback(true);
    setTimeout(() => { setShowFeedback(false); }, 1500);
  };

  const handleNext = async (fromTimeout = false) => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsCorrect(null);
      setTimeLeft(timeLimit);
    } else {
      // Quiz finished
      const finalScore = score + (!fromTimeout && selectedOption === questions[currentIdx]?.correct_option ? 1000 : 0);
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      setTotalTime(elapsed);
      setQuizFinished(true);
      clearInterval(timerRef.current);

      if (token) {
        try {
          const res = await fetch(`${API}/quizzes/${quizId}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ score: finalScore, time_taken: elapsed })
          });
          const data = await res.json();
          if (data.data?.rank) setRank(data.data.rank);
          if (res.ok) showSnackbar('Score submitted!', 'success');
        } catch (err) { console.error(err); }
      }
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return <div className="play-container container flex-center" style={{ minHeight: '60vh' }}><div className="spinner"></div></div>;

  if (alreadyDone) return (
    <div className="play-container container" style={{ paddingTop: '3rem' }}>
      <div className="glass-panel play-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>{t('play.alreadyCompleted')}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{t('play.yourScore')}: <strong style={{ color: 'var(--accent)', fontSize: '1.5rem' }}>{prevScore?.score}</strong></p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to={`/leaderboard?quizId=${quizId}`} className="btn btn-primary">{t('play.viewLeaderboards')}</Link>
          <Link to="/" className="btn btn-secondary">{t('play.playAnother')}</Link>
        </div>
      </div>
    </div>
  );

  if (questions.length === 0) return (
    <div className="play-container container" style={{ paddingTop: '3rem' }}>
      <Link to="/" className="back-button">← {t('common.goBack')}</Link>
      <div className="glass-panel play-card" style={{ textAlign: 'center', padding: '4rem' }}>
        <h2>{t('play.noQuestions')}</h2>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>{t('play.backToHome')}</Link>
      </div>
    </div>
  );

  const q = questions[currentIdx];

  return (
    <div className="play-container container">
      <div className="play-header">
        <Link to="/" className="back-button">←</Link>
        <span className="question-progress">{t('play.questionOf', { current: currentIdx + 1, total: questions.length })}</span>
        <div className={`timer ${timeLeft <= 10 ? 'timer-danger' : ''}`}>
          <span className="timer-icon">⏱</span> {formatTime(timeLeft)}
        </div>
        <span className="score-display">{t('play.score')}: {score}</span>
      </div>

      {quizFinished ? (
        <div className="glass-panel play-card result-card">
          <div className="result-icon">🏆</div>
          <h2>{t('play.quizCompleted')}</h2>
          <p className="result-score">{t('play.finalScore')} <strong>{score}</strong></p>
          {rank && <p className="result-rank">Leaderboard Rank: #{rank}</p>}
          <p className="result-time">Time: {formatTime(totalTime)}</p>
          <div className="result-actions">
            <Link to={`/leaderboard?quizId=${quizId}`} className="btn btn-primary">{t('play.viewLeaderboards')}</Link>
            <Link to="/" className="btn btn-secondary">{t('play.backToHome')}</Link>
          </div>
        </div>
      ) : (
        <div className="glass-panel play-card">
          {showFeedback && (
            <div className={`feedback-overlay ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`}>
              <span className="feedback-icon">{isCorrect ? '✓' : '✕'}</span>
              <span>{isCorrect ? t('play.correct') : t('play.incorrect')}</span>
              {!isCorrect && <span className="feedback-answer">{t('play.theAnswerWas')} {q[`option_${q.correct_option.toLowerCase()}`]}</span>}
            </div>
          )}

          <div className="game-image-wrapper">
            <img src={q.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80'} alt="Game" className="game-image" />
          </div>

          <h2 className="question-text">{q.question_text}</h2>

          <div className="options-grid">
            {['A', 'B', 'C', 'D'].map(key => {
              const text = q[`option_${key.toLowerCase()}`];
              let cls = 'option-btn';
              if (selectedOption === key && !isAnswered) cls += ' option-selected';
              if (isAnswered) {
                if (key === q.correct_option) cls += ' option-correct';
                else if (selectedOption === key) cls += ' option-wrong';
                else cls += ' option-dim';
              }
              return (
                <button key={key} className={cls} onClick={() => handleOptionClick(key)} disabled={isAnswered}>
                  <span className="option-key">{key}</span>
                  <span className="option-text">{text}</span>
                </button>
              );
            })}
          </div>

          <div className="play-actions">
            {!isAnswered ? (
              <button className="btn btn-primary action-btn" onClick={handleSubmitAnswer} disabled={!selectedOption}>{t('play.submitAnswer')}</button>
            ) : (
              <button className="btn btn-primary action-btn" onClick={() => handleNext()}>
                {currentIdx + 1 < questions.length ? t('play.nextQuestion') : t('play.finishQuiz')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Play;
