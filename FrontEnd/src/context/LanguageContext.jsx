import React, { createContext, useContext, useState, useCallback } from 'react';
import en from '../i18n/en.json';
import id from '../i18n/id.json';

const LanguageContext = createContext();

const translations = { en, id };

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  const switchLanguage = useCallback((newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  }, []);

  const t = useCallback((path, replacements = {}) => {
    const keys = path.split('.');
    let value = translations[lang];
    for (const key of keys) {
      value = value?.[key];
    }
    if (typeof value !== 'string') return path;
    
    let result = value;
    Object.entries(replacements).forEach(([k, v]) => {
      result = result.replace(`{${k}}`, v);
    });
    return result;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang: switchLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
