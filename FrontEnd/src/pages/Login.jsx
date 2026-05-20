import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSnackbar } from '../context/SnackbarContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      showSnackbar(t('login.loginSuccess'), 'success');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src="/logo.png" alt="GameGuessr" />
        </div>
        <h2 className="login-title">{t('login.title')}</h2>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-field">
            <label>{t('login.emailLabel')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('login.emailPlaceholder')} required />
          </div>
          <div className="form-field">
            <div className="label-row">
              <label>{t('login.passwordLabel')}</label>
              <a href="#" className="forgot-link">{t('login.forgotPassword')}</a>
            </div>
            <div className="password-field">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('login.passwordPlaceholder')} required />
              <button type="button" className="toggle-pw" onClick={() => setShowPw(!showPw)}>{showPw ? '🙈' : '👁️'}</button>
            </div>
          </div>
          <button type="submit" className="login-btn" disabled={loading}>{loading ? '...' : t('login.loginButton')}</button>
        </form>

        <p className="signup-prompt">
          {t('login.orSignUp')}<br />
          <Link to="/signup">{t('login.signUpLink')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
