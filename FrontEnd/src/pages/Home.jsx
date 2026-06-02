import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Home.css';

const API = 'http://localhost:5000/api';

const Home = () => {
  const { isLoggedIn, token, isUploader } = useAuth();
  const { t, lang } = useLanguage();
  const [quizzes, setQuizzes] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('quizzes');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [qRes, lRes] = await Promise.all([
          fetch(`${API}/quizzes?lang=${lang}`),
          fetch(`${API}/quizzes/leaderboard/global`)
        ]);
        const qData = await qRes.json();
        const lData = await lRes.json();
        setQuizzes(qData.data || []);
        setTopPlayers(lData.data || []);

        if (token) {
          const hRes = await fetch(`${API}/quizzes/history/me`, { headers: { 'Authorization': `Bearer ${token}` } });
          const hData = await hRes.json();
          setHistory(hData.data?.history || []);
        }
      } catch (err) { console.error('Fetch error:', err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [token, lang]);

  const dailyQuiz = quizzes.length > 0 ? quizzes[new Date().getDate() % quizzes.length] : null;

  // Extract unique categories
  const categories = ['All', ...new Set(quizzes.flatMap(q => q.category_tags ? q.category_tags.split(',').map(t => t.trim()) : []))];

  // Filter quizzes by category
  const filteredQuizzes = selectedCategory === 'All'
    ? quizzes
    : quizzes.filter(q => q.category_tags && q.category_tags.split(',').map(t => t.trim()).includes(selectedCategory));

  return (
    <div className="home-container container">
      <section className="hero-section">
        <h1 className="hero-title text-glow">
          <span className="text-white">Game</span>
          <span className="text-accent">Guessr</span>
        </h1>
        <p className="hero-subtitle">{t('home.heroSubtitle')}</p>
        <div className="hero-actions">
          <Link to={dailyQuiz ? `/play?quizId=${dailyQuiz.id}` : '/play'} className="btn btn-primary action-btn">▶ {t('home.playNow')}</Link>
          <Link to="/leaderboard" className="btn btn-glass action-btn">🏆 {t('home.leaderboard')}</Link>
          {isUploader && (
            <Link to="/upload" className="btn btn-glass action-btn">📷 {t('home.uploadImage')}</Link>
          )}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="glass-panel dashboard-card main-card">
          {isLoggedIn && (
            <div className="tabs">
              <button className={`tab ${activeTab === 'quizzes' ? 'active' : ''}`} onClick={() => setActiveTab('quizzes')}>{t('home.availableQuizzes')}</button>
              <button className={`tab ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>{t('home.myRecentActivity')}</button>
            </div>
          )}

          {(!isLoggedIn || activeTab === 'quizzes') && (
            <>
              {dailyQuiz && (
                <div className="daily-challenge">
                  <div className="daily-header">
                    <span>🔥 {t('home.dailyChallenge')}</span>
                  </div>
                  <div className="daily-body">
                    <div className="daily-image">
                      <img src="/images/games/elden-ring.jpg" alt="Daily" />
                    </div>
                    <div className="daily-info">
                      <h3>{t('home.todaysQuiz')}</h3>
                      <p>{t('home.canYouGuess')}</p>
                      <Link to={`/play?quizId=${dailyQuiz.id}`} className="btn btn-primary btn-sm">{t('home.startChallenge')}</Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Category Filter Pills */}
              {!loading && quizzes.length > 0 && (
                <div className="category-pills">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              <div className="quiz-grid">
                {loading ? (
                  <p className="text-muted">{t('home.loading')}</p>
                ) : filteredQuizzes.length === 0 ? (
                  <p className="text-muted">{t('home.noQuizzes')}</p>
                ) : (
                  filteredQuizzes.map(quiz => {
                    const cleanTitle = quiz.title.toLowerCase();
                    let coverImg = '/images/games/minecraft.jpg'; // default fallback

                    if (cleanTitle.includes('minecraft')) {
                      coverImg = '/images/games/minecraft.jpg';
                    } else if (cleanTitle.includes('cyberpunk')) {
                      coverImg = '/images/games/cyberpunk-2077.jpg';
                    } else if (cleanTitle.includes('elden')) {
                      coverImg = '/images/games/elden-ring.jpg';
                    } else if (cleanTitle.includes('gta') || cleanTitle.includes('grand theft auto')) {
                      coverImg = '/images/games/gta-v.png';
                    } else if (cleanTitle.includes('hollow')) {
                      coverImg = '/images/games/hollow-knight.png';
                    } else if (cleanTitle.includes('red dead') || cleanTitle.includes('rdr')) {
                      coverImg = '/images/games/rdr2.png';
                    } else if (cleanTitle.includes('stardew')) {
                      coverImg = '/images/games/stardew-valley.png';
                    } else if (cleanTitle.includes('mario')) {
                      coverImg = '/images/games/super-mario.jpg';
                    } else if (cleanTitle.includes('witcher')) {
                      coverImg = '/images/games/witcher-3.png';
                    } else if (cleanTitle.includes('zelda')) {
                      coverImg = '/images/games/zelda-botw.png';
                    } else if (cleanTitle.includes('valorant')) {
                      coverImg = '/images/games/valorant.jpg';
                    } else if (cleanTitle.includes('mobile legends') || cleanTitle.includes('ml')) {
                      coverImg = '/images/games/mobile-legends.jpg';
                    } else if (cleanTitle.includes('genshin')) {
                      coverImg = '/images/games/genshin-impact.jpg';
                    } else if (cleanTitle.includes('resident evil') || cleanTitle.includes('re4')) {
                      coverImg = '/images/games/resident-evil-4.jpg';
                    }

                    return (
                      <div key={quiz.id} className="quiz-card-wrapper glass-panel">
                        <div className="quiz-card-banner">
                          <img src={coverImg} alt={quiz.title} className="quiz-banner-img" />
                          <div className="quiz-banner-overlay"></div>
                          {quiz.question_count && (
                            <span className="quiz-card-qcount">
                              🎮 {quiz.question_count} {t('home.questions')}
                            </span>
                          )}
                        </div>
                        <div className="quiz-card-content">
                          <h3 className="quiz-card-title">{quiz.title}</h3>
                          <p className="quiz-card-desc">{quiz.description || 'Mainkan dan uji wawasan gaming-mu sekarang!'}</p>
                          {quiz.category_tags && (
                            <div className="quiz-card-tags">
                              {quiz.category_tags.split(',').map(tag => (
                                <span key={tag} className="tag">{tag.trim()}</span>
                              ))}
                            </div>
                          )}
                          <Link to={`/play?quizId=${quiz.id}`} className="btn btn-primary quiz-card-btn">
                            ▶ {t('home.play')}
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {isLoggedIn && activeTab === 'activity' && (
            <div className="quiz-list">
              {history.length === 0 ? <p className="text-muted">{t('home.noActivity')}</p> : history.slice(0, 5).map((h, i) => (
                <div key={i} className="quiz-item">
                  <div className="quiz-item-info">
                    <span className="quiz-item-title">{h.quiz_title}</span>
                    <span className="quiz-item-meta">{t('home.score')}: {h.score} • #{h.rank} • {new Date(h.finished_at).toLocaleDateString()}</span>
                  </div>
                  <Link to={`/leaderboard?quizId=${h.quiz_id}`} className="btn btn-outline btn-sm">🏆</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel dashboard-card side-card">
          <div className="card-header">
            <span>🏆</span>
            <h2>{t('home.topPlayers')}</h2>
          </div>
          <ul className="player-list">
            {loading ? <p className="text-muted">{t('home.loading')}</p> : topPlayers.length === 0 ? <p className="text-muted">No players yet</p> :
              topPlayers.slice(0, 5).map((player, idx) => (
                <li key={player.username} className="player-item">
                  <span className="rank" style={{ color: idx === 0 ? '#f1c40f' : idx === 1 ? '#bdc3c7' : idx === 2 ? '#cd7f32' : 'white' }}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                  </span>
                  <img src={player.avatar_url} alt="" className="player-avatar" />
                  <span className="player-name">{player.display_name || player.username}</span>
                  <span className="player-score">{(player.total_score || 0).toLocaleString()}</span>
                </li>
              ))
            }
          </ul>
        </div>
      </section>
    </div>
  );
};

export default Home;
