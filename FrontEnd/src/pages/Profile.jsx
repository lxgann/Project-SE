import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSnackbar } from '../context/SnackbarContext';
import './Profile.css';

const API = 'http://localhost:5000/api';

const Profile = () => {
  const { user, token, updateProfile } = useAuth();
  const { t } = useLanguage();
  const { showSnackbar } = useSnackbar();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/quizzes/history/me`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setHistory(data.data?.history || []);
        setStats(data.data?.stats || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    try {
      await updateProfile({ display_name: displayName });
      showSnackbar('Profile updated!', 'success');
      setEditing(false);
    } catch (err) { showSnackbar(err.message, 'error'); }
  };

  return (
    <div className="profile-container container">
      <div className="profile-grid">
        <div className="glass-panel profile-info-card">
          <div className="profile-avatar-section">
            <img src={user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt="" className="profile-avatar" />
            <h2>{user?.display_name || user?.username}</h2>
            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
          </div>
          {editing ? (
            <div className="edit-form">
              <div className="form-field-dark">
                <label>{t('profile.displayName')}</label>
                <input className="input-glass" value={displayName} onChange={e => setDisplayName(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-primary btn-sm" onClick={handleSave}>{t('profile.saveChanges')}</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>{t('common.cancel')}</button>
              </div>
            </div>
          ) : (
            <div className="profile-details">
              <div className="detail-row"><span className="detail-label">{t('profile.email')}</span><span>{user?.email}</span></div>
              <div className="detail-row"><span className="detail-label">{t('profile.role')}</span><span>{user?.role}</span></div>
              <button className="btn btn-outline btn-sm" style={{ marginTop: '1rem' }} onClick={() => setEditing(true)}>✏️ {t('profile.editProfile')}</button>
            </div>
          )}
        </div>

        <div className="profile-content">
          {stats && (
            <div className="stats-grid">
              <div className="glass-panel stat-card"><span className="stat-value">{stats.total_quizzes || 0}</span><span className="stat-label">{t('profile.totalQuizzes')}</span></div>
              <div className="glass-panel stat-card"><span className="stat-value">{stats.avg_score || 0}</span><span className="stat-label">{t('profile.avgScore')}</span></div>
              <div className="glass-panel stat-card"><span className="stat-value">{stats.highest_score || 0}</span><span className="stat-label">{t('profile.highestScore')}</span></div>
              <div className="glass-panel stat-card"><span className="stat-value">{(stats.total_score || 0).toLocaleString()}</span><span className="stat-label">{t('profile.totalPoints')}</span></div>
            </div>
          )}

          <div className="glass-panel history-card">
            <h2>{t('profile.quizHistory')}</h2>
            {loading ? <div className="flex-center" style={{ padding: '2rem' }}><div className="spinner"></div></div> :
              history.length === 0 ? <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>{t('profile.noHistory')}</p> : (
                <div className="table-responsive">
                  <table>
                    <thead><tr><th>Quiz</th><th>{t('leaderboard.score')}</th><th>{t('leaderboard.rank')}</th><th>{t('home.date')}</th></tr></thead>
                    <tbody>
                      {history.map((h, i) => (
                        <tr key={i}>
                          <td>{h.quiz_title}</td>
                          <td><strong>{h.score}</strong></td>
                          <td>#{h.rank}</td>
                          <td>{new Date(h.finished_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
