import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Footer.css';

const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-links">
          <a href="#about">{t('footer.about')}</a>
          <a href="#faq">{t('footer.faq')}</a>
          <a href="#terms">{t('footer.terms')}</a>
          <a href="#privacy">{t('footer.privacy')}</a>
          <a href="#contact">{t('footer.contact')}</a>
        </div>
        <p className="footer-copy">{t('footer.copyright')}</p>
      </div>
    </footer>
  );
};

export default Footer;
