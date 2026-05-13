import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import zh from '@/locales/zh';
import en from '@/locales/en';

type Language = 'zh' | 'en';
type Translations = typeof zh;

interface LanguageContextProps {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
}

const translations = { zh, en };

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('zh');

  useEffect(() => {
    const savedLang = localStorage.getItem('nexus_language') as Language;
    if (savedLang && ['zh', 'en'].includes(savedLang)) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('nexus_language', lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
