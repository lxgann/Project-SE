import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSnackbar } from '../context/SnackbarContext';
import './Admin.css';

const API = 'http://localhost:5000/api';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { t } = useLanguage();
  const { showSnackbar } = useSnackbar();
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await fetch(`${API}/admin/users`, { headers });
        const data = await res.json();
        setUsers(data.data?.users || []);
      } else if (activeTab === 'quizzes') {
        const res = await fetch(`${API}/admin/quizzes`, { headers });
        const data = await res.json();
        setQuizzes(data.data || []);
      } else {
        const res = await fetch(`${API}/admin/stats`, { headers });
        const data = await res.json();
        setStats(data.data || null);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const changeRole = async (userId, newRole) => {
    try {
      await fetch(`${API}/admin/users/${userId}`, { method: 'PATCH', headers, body: JSON.stringify({ role: newRole }) });
      showSnackbar(`Role changed to ${newRole}`, 'success');
      fetchData();
    } catch (err) { showSnackbar('Failed', 'error'); }
  };

  const deleteUser = async (userId) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    try {
      await fetch(`${API}/admin/users/${userId}`, { method: 'DELETE', headers });
      showSnackbar('User deactivated', 'success');
      fetchData();
    } catch (err) { showSnackbar('Failed', 'error'); }
  };

  const toggleQuiz = async (quizId, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'hidden' : 'published';
    try {
      await fetch(`${API}/admin/quizzes/${quizId}`, { method: 'PATCH', headers, body: JSON.stringify({ status: newStatus }) });
      showSnackbar(`Quiz ${newStatus}`, 'success');
      fetchData();
    } catch (err) { showSnackbar('Failed', 'error'); }
  };

  const deleteQuiz = async (quizId) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    try {
      await fetch(`${API}/admin/quizzes/${quizId}`, { method: 'DELETE', headers });
      showSnackbar('Quiz deleted', 'success');
      fetchData();
    } catch (err) { showSnackbar('Failed', 'error'); }
  };

  return (
    <div className="admin-container container">
      <h1>{t('admin.title')}</h1>

      <div className="tabs">
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>👥 {t('admin.usersTab')}</button>
        <button className={`tab ${activeTab === 'quizzes' ? 'active' : ''}`} onClick={() => setActiveTab('quizzes')}>📝 {t('admin.quizzesTab')}</button>
        <button className={`tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>📊 {t('admin.reportsTab')}</button>
      </div>

      <div className="glass-panel admin-panel">
        {loading ? <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner"></div></div> : (
          <>
            {activeTab === 'users' && (
              <div className="table-responsive">
                <table>
                  <thead><tr><th>{t('admin.username')}</th><th>{t('admin.email')}</th><th>{t('admin.role')}</th><th>{t('admin.status')}</th><th>{t('admin.joinDate')}</th><th>{t('admin.actions')}</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><img src={u.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />{u.username}</div></td>
                        <td>{u.email}</td>
                        <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                        <td>{u.is_active ? <span style={{ color: 'var(--success)' }}>● {t('admin.active')}</span> : <span style={{ color: 'var(--error)' }}>● {t('admin.inactive')}</span>}</td>
                        <td>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td>
                          {u.role !== 'admin' && (
                            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                              <button className="btn btn-outline btn-sm" onClick={() => changeRole(u.id, u.role === 'participant' ? 'uploader' : 'participant')}>
                                {u.role === 'participant' ? t('admin.promote') : t('admin.demote')}
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>{t('admin.delete')}</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'quizzes' && (
              <div className="table-responsive">
                <table>
                  <thead><tr><th>{t('admin.quizTitle')}</th><th>{t('admin.createdBy')}</th><th>{t('admin.questionCount')}</th><th>{t('admin.attempts')}</th><th>{t('admin.status')}</th><th>{t('admin.actions')}</th></tr></thead>
                  <tbody>
                    {quizzes.map(q => (
                      <tr key={q.id}>
                        <td>{q.title}</td>
                        <td>{q.creator_name || 'Unknown'}</td>
                        <td>{q.question_count}</td>
                        <td>{q.attempt_count}</td>
                        <td><span className={`badge ${q.status === 'published' ? 'badge-participant' : 'badge-admin'}`}>{q.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <button className="btn btn-outline btn-sm" onClick={() => toggleQuiz(q.id, q.status)}>{q.status === 'published' ? t('admin.hide') : t('admin.unhide')}</button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteQuiz(q.id)}>{t('admin.delete')}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'reports' && stats && (
              <div className="reports-grid">
                <div className="report-card"><span className="report-value">{stats.totalUsers}</span><span className="report-label">{t('admin.totalUsers')}</span></div>
                <div className="report-card"><span className="report-value">{stats.totalQuizzes}</span><span className="report-label">{t('admin.totalQuizzes')}</span></div>
                <div className="report-card"><span className="report-value">{stats.totalAttempts}</span><span className="report-label">{t('admin.totalAttempts')}</span></div>
                <div className="report-card"><span className="report-value">{stats.avgScore || 0}</span><span className="report-label">{t('admin.avgScore')}</span></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
