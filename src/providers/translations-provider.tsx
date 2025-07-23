
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, type LanguageCode } from '@/lib/translations';
import { LanguageSelectionModal } from '@/components/language-selection-modal';
import { cn } from '@/lib/utils';

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
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("finmate_language") as LanguageCode | null;
    if (savedLang && translations[savedLang]) {
      setLanguageCode(savedLang);
    } else {
      setIsLanguageModalOpen(true);
    }
    setIsMounted(true);
  }, []);

  const setLanguage = (code: LanguageCode) => {
    if (translations[code]) {
      localStorage.setItem("finmate_language", code);
      setLanguageCode(code);
      setIsLanguageModalOpen(false);
      // Optional: a gentle reload could still be useful in some complex cases
      // window.location.reload(); 
    }
  };

  const t = translations[languageCode] || translations[DEFAULT_LANGUAGE];
  
  if (!isMounted) {
    // Render nothing on the server and until the client has mounted
    // This prevents hydration mismatch.
    return null; 
  }

  return (
    <TranslationsContext.Provider value={{ t, languageCode, setLanguage }}>
       <LanguageSelectionModal 
        isOpen={isLanguageModalOpen}
        onSelectLanguage={setLanguage}
      />
      <div className={cn(isLanguageModalOpen && "blur-sm")}>
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
