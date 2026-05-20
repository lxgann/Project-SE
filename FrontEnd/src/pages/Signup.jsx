import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSnackbar } from '../context/SnackbarContext';
import './Login.css';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useLanguage();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const isValidUsername = /^[a-zA-Z0-9]{3,20}$/.test(username);
  const isValidPassword = password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPw) { setError(t('signup.passwordMismatch')); return; }
    setLoading(true);
    try {
      await register(username, email, password);
      showSnackbar(t('signup.signupSuccess'), 'success');
      navigate('/');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo"><img src="/logo.png" alt="GameGuessr" /></div>
        <h2 className="login-title">{t('signup.title')}</h2>
        <p style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', marginBottom: '1.2rem' }}>{t('signup.subtitle')}</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSignup} className="login-form">
          <div className="form-field">
            <label>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder={t('signup.usernamePlaceholder')} required />
            {username && !isValidUsername && <span style={{ color: '#f44336', fontSize: '0.75rem' }}>3-20 alphanumeric characters</span>}
          </div>
          <div className="form-field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('signup.emailPlaceholder')} required />
          </div>
          <div className="form-field">
            <label>Password</label>
            <div className="password-field">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('signup.passwordPlaceholder')} required />
              <button type="button" className="toggle-pw" onClick={() => setShowPw(!showPw)}>{showPw ? '🙈' : '👁️'}</button>
            </div>
            {password && !isValidPassword && <span style={{ color: '#f44336', fontSize: '0.75rem' }}>Min 8 chars, 1 letter + 1 number</span>}
          </div>
          <div className="form-field">
            <label>Confirm Password</label>
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder={t('signup.confirmPasswordPlaceholder')} required />
            {confirmPw && password !== confirmPw && <span style={{ color: '#f44336', fontSize: '0.75rem' }}>{t('signup.passwordMismatch')}</span>}
          </div>
          <button type="submit" className="login-btn" disabled={loading || !isValidUsername || !isValidPassword || password !== confirmPw}>
            {loading ? '...' : t('signup.signupButton')}
          </button>
        </form>
        <p className="signup-prompt">{t('signup.alreadyHaveAccount')} <Link to="/login">{t('signup.loginLink')}</Link></p>
      </div>
    </div>
  );
};

export default Signup;
