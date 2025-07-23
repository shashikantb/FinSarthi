
"use client";

import { useState, useEffect } from "react";
import { translations, type LanguageCode } from "@/lib/translations";

const DEFAULT_LANGUAGE: LanguageCode = "en";

export function useAppTranslations() {
  const [languageCode, setLanguageCode] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  useEffect(() => {
    // This effect runs on the client after hydration
    const savedLang = localStorage.getItem("finmate_language") as LanguageCode | null;
    if (savedLang && translations[savedLang]) {
      setLanguageCode(savedLang);
    }

    // Optional: Add a listener to update translations if the language changes in another tab
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

  const t = translations[languageCode] || translations[DEFAULT_LANGUAGE];
  
  return { t, languageCode };
}

    
