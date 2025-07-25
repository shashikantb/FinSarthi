
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { translations, type LanguageCode } from '@/lib/translations';
import { LanguageSelectionModal } from '@/components/language-selection-modal';
import { cn } from '@/lib/utils';

const DEFAULT_LANGUAGE: LanguageCode = "en";
const LANGUAGE_STORAGE_KEY = "finmate_language";

interface TranslationsContextType {
  t: (typeof translations)[LanguageCode];
  languageCode: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
}

const TranslationsContext = createContext<TranslationsContextType | undefined>(undefined);

export function TranslationsProvider({ children }: { children: ReactNode }) {
  const [languageCode, setLanguageCode] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [isMounted, setIsMounted] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  useEffect(() => {
    // This effect runs once on the client to check for a saved language.
    const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode | null;
    if (savedLang && translations[savedLang]) {
      setLanguageCode(savedLang);
    } else {
      // If no language is saved, open the modal.
      setIsLanguageModalOpen(true);
    }
    setIsMounted(true);
  }, []);

  const setLanguage = useCallback((code: LanguageCode) => {
    if (translations[code]) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      setLanguageCode(code);
      setIsLanguageModalOpen(false);
    }
  }, []);

  // Effect to register the service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }
  }, []);

  const t = translations[languageCode] || translations[DEFAULT_LANGUAGE];
  
  if (!isMounted) {
    // Render nothing on the server and until the client has mounted.
    // This prevents hydration mismatch.
    return null; 
  }

  return (
    <TranslationsContext.Provider value={{ t, languageCode, setLanguage }}>
       <LanguageSelectionModal 
        isOpen={isLanguageModalOpen}
        onSelectLanguage={setLanguage}
      />
      <div className={cn(isLanguageModalOpen && "blur-sm transition-all")}>
        {children}
      </div>
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
