
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, type LanguageCode } from '@/lib/translations';

const DEFAULT_LANGUAGE: LanguageCode = "en";

interface TranslationsContextType {
  t: (typeof translations)[LanguageCode];
  languageCode: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
}

const TranslationsContext = createContext<TranslationsContextType | undefined>(undefined);

export function TranslationsProvider({ children }: { children: ReactNode }) {
  const [languageCode, setLanguageCode] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedLang = localStorage.getItem("finmate_language") as LanguageCode | null;
    if (savedLang && translations[savedLang]) {
      setLanguageCode(savedLang);
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "finmate_language" && event.newValue && translations[event.newValue as LanguageCode]) {
        setLanguageCode(event.newValue as LanguageCode);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const setLanguage = (code: LanguageCode) => {
    if (translations[code]) {
      localStorage.setItem("finmate_language", code);
      setLanguageCode(code);
      // Force a reload to apply translations everywhere
      window.location.reload();
    }
  };

  const t = translations[languageCode] || translations[DEFAULT_LANGUAGE];
  
  // Prevent hydration mismatch by not rendering until mounted on client
  if (!isMounted) {
    return null; 
  }

  return (
    <TranslationsContext.Provider value={{ t, languageCode, setLanguage }}>
      {children}
    </TranslationsContext.Provider>
  );
}

export function useAppTranslations() {
  const context = useContext(TranslationsContext);
  if (context === undefined) {
    throw new Error('useAppTranslations must be used within a TranslationsProvider');
  }
  return context;
}
