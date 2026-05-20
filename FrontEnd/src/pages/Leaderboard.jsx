import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Leaderboard.css';

const API = 'http://localhost:5000/api';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, isLoggedIn } = useAuth();
  const { t } = useLanguage();
  const query = new URLSearchParams(useLocation().search);

  useEffect(() => {
    const quizIdParam = query.get('quizId');
    if (quizIdParam) setSelectedQuiz(quizIdParam);
    fetch(`${API}/quizzes`).then(r => r.json()).then(d => setQuizzes(d.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = selectedQuiz ? `${API}/quizzes/${selectedQuiz}/leaderboard` : `${API}/quizzes/leaderboard/global`;
    fetch(url).then(r => r.json()).then(d => { setLeaderboard(d.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, [selectedQuiz]);

  const getMedal = (idx) => idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1;

  const formatTime = (s) => s ? `${Math.floor(s / 60)}m ${s % 60}s` : '-';

  return (
    <div className="leaderboard-container container">
      <div className="leaderboard-header">
        <h1>{t('leaderboard.title')}</h1>
        <select className="select-glass quiz-filter" value={selectedQuiz} onChange={e => setSelectedQuiz(e.target.value)}>
          <option value="">{t('leaderboard.globalLeaderboard')}</option>
          {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
        </select>
      </div>

      <div className="glass-panel leaderboard-panel">
        {loading ? (
          <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner"></div></div>
        ) : leaderboard.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>{t('leaderboard.noScores')}</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>{t('leaderboard.rank')}</th>
                  <th>{t('leaderboard.player')}</th>
                  <th>{t('leaderboard.score')}</th>
                  <th>{selectedQuiz ? t('leaderboard.timeTaken') : 'Quizzes'}</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => {
                  const isMe = isLoggedIn && (entry.username === user?.username || entry.user_id === user?.id);
                  return (
                    <tr key={idx} className={isMe ? 'highlight-row' : ''}>
                      <td><span className="leaderboard-rank">{getMedal(idx)}</span></td>
                      <td>
                        <div className="player-cell">
                          <img src={entry.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.username}`} alt="" className="lb-avatar" />
                          <span className="lb-name">{entry.display_name || entry.username}</span>
                          {isMe && <span className="you-badge">YOU</span>}
                        </div>
                      </td>
                      <td><strong>{(entry.total_score || entry.score || 0).toLocaleString()}</strong></td>
                      <td>{selectedQuiz ? formatTime(entry.time_taken) : `${entry.quizzes_taken || 0}`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
