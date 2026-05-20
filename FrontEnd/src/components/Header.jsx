import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Header.css';

const Header = () => {
  const { isLoggedIn, user, logout, isUploader, isAdmin } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="header-container">
      <div className="container flex-between header-content">
        <Link to="/" className="logo flex-center">
          <img src="/logo.png" alt="GameGuessr Logo" className="logo-image" />
        </Link>

        <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
          <span className={`hamburger ${menuOpen ? 'open' : ''}`}></span>
        </button>

        <nav className={`header-nav ${menuOpen ? 'nav-open' : ''}`}>
          {isUploader && (
            <Link to="/upload" className="nav-link" onClick={() => setMenuOpen(false)}>{t('nav.createQuiz')}</Link>
          )}

          <button className="lang-toggle" onClick={() => setLang(lang === 'en' ? 'id' : 'en')} title={t('nav.language')}>
            {lang === 'en' ? '🇬🇧' : '🇮🇩'}
          </button>

          {isLoggedIn ? (
            <div className="user-menu" ref={dropdownRef}>
              <button className="avatar-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <img src={user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt="avatar" className="avatar-img" />
                <span className="avatar-name">{user?.display_name || user?.username}</span>
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    👤 {t('nav.profile')}
                  </Link>
                  <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    📊 {t('nav.myHistory')}
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      🛡️ {t('nav.admin')}
                    </Link>
                  )}
                  <hr className="dropdown-divider" />
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    🚪 {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-btns">
              <Link to="/login" className="btn btn-secondary btn-sm" onClick={() => setMenuOpen(false)}>{t('nav.login')}</Link>
              <Link to="/signup" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>{t('nav.signup')}</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
