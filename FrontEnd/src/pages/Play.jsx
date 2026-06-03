import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSnackbar } from '../context/SnackbarContext';
import './Play.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SERVER_URL = API.endsWith('/api') ? API.slice(0, -4) : API;

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
  
  // Streak and audio effects
  const [streak, setStreak] = useState(0);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const { token, isLoggedIn } = useAuth();
  const { t, lang } = useLanguage();
  const { showSnackbar } = useSnackbar();
  const query = new URLSearchParams(useLocation().search);
  const quizId = query.get('quizId') || '1';

  // SFX Player
  const playSFX = useCallback((type) => {
    const muted = localStorage.getItem('gameguessr_muted') === 'true';
    if (muted) return;

    let audioFile = '';
    let volume = 0.5;

    if (type === 'correct') {
      audioFile = '/audio/correct.wav';
      volume = 0.55;
    } else if (type === 'incorrect') {
      audioFile = '/audio/incorrect.wav';
      volume = 0.55;
    } else if (type === 'tick') {
      audioFile = '/audio/tick.wav';
      volume = 0.4;
    } else if (type === 'click') {
      audioFile = '/audio/click.wav';
      volume = 0.3;
    }

    if (audioFile) {
      const sfx = new Audio(audioFile);
      sfx.volume = volume;
      sfx.play().catch(() => {});
    }
  }, []);



  // Fetch Quiz Data
  useEffect(() => {
    const fetchData = async () => {
      try {
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

        const quizRes = await fetch(`${API}/quizzes/${quizId}?lang=${lang}`);
        const quizData = await quizRes.json();
        if (quizData.data) setTimeLimit(quizData.data.time_limit || 30);

        const qRes = await fetch(`${API}/quizzes/${quizId}/questions?lang=${lang}`);
        const qData = await qRes.json();
        setQuestions(qData.data || []);
        setTimeLeft(quizData.data?.time_limit || 30);
      } catch (err) { console.error(err); }
      finally { setLoading(false); startTimeRef.current = Date.now(); }
    };
    fetchData();
  }, [quizId, token, lang]);

  // Timer Countdown Loop
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

  // Tick Sound effect
  useEffect(() => {
    if (timeLeft > 0 && timeLeft <= 5 && !isAnswered && !quizFinished && !alreadyDone && !loading) {
      playSFX('tick');
    }
  }, [timeLeft, isAnswered, quizFinished, alreadyDone, loading, playSFX]);

  // Trigger streak animation
  useEffect(() => {
    if (streak >= 3 && isCorrect === true) {
      setShowStreakAnimation(true);
      const timer = setTimeout(() => setShowStreakAnimation(false), 1400);
      return () => clearTimeout(timer);
    }
  }, [streak, isCorrect]);

  // Victory Confetti
  useEffect(() => {
    if (!quizFinished) return;
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#ec4899'];
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    }));

    let animationFrame;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();

        if (p.y > canvas.height) {
          particles[idx] = {
            ...p,
            x: Math.random() * canvas.width,
            y: -20,
            tilt: Math.random() * 10 - 5
          };
        }
      });
      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, [quizFinished]);

  const handleTimeUp = useCallback(() => {
    if (isAnswered) return;
    setIsAnswered(true);
    setIsCorrect(false);
    setStreak(0);
    playSFX('incorrect');
    setShowFeedback(true);
    setTimeout(() => { setShowFeedback(false); handleNext(true); }, 1500);
  }, [isAnswered, currentIdx, playSFX]);

  const handleOptionClick = (key) => {
    if (!isAnswered) {
      setSelectedOption(key);
      playSFX('click');
    }
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || isAnswered) return;
    clearInterval(timerRef.current);
    setIsAnswered(true);
    const correct = selectedOption === questions[currentIdx].correct_option;
    setIsCorrect(correct);
    if (correct) {
      setScore(prev => prev + 1000);
      setStreak(prev => prev + 1);
      playSFX('correct');
    } else {
      setStreak(0);
      playSFX('incorrect');
    }
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
      const finalScore = score;
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
      {/* Fullscreen Streak Overlay */}
      {showStreakAnimation && (
        <div className="streak-fullscreen-overlay">
          <div className="streak-content-zoom">
            <span className="streak-fire-icon">🔥</span>
            <h1 className="streak-huge-text">{streak}X COMBO!</h1>
            <p className="streak-sub-text">BERUNTUN MENJAWAB BENAR</p>
          </div>
        </div>
      )}

      {quizFinished && (
        <canvas id="confetti-canvas" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9999 }}></canvas>
      )}

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
            <img 
              src={(() => {
                if (!q.image_url) return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80';
                const filename = q.image_url.split('/').pop();
                const seededImages = [
                  'minecraft.jpg', 'cyberpunk-2077.jpg', 'elden-ring.jpg', 'gta-v.png', 
                  'hollow-knight.png', 'rdr2.png', 'stardew-valley.png', 'super-mario.jpg', 
                  'witcher-3.png', 'zelda-botw.png', 'valorant.jpg', 'mobile-legends.jpg', 
                  'genshin-impact.jpg', 'resident-evil-4.jpg'
                ];
                if (seededImages.includes(filename)) {
                  return `/images/games/${filename}`;
                }
                if (q.image_url.startsWith('/uploads')) {
                  return `${SERVER_URL}${q.image_url}`;
                }
                return q.image_url;
              })()}
              alt="Game" 
              className="game-image"
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80'; }}
            />
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
