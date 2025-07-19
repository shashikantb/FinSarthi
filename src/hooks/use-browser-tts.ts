// src/hooks/use-browser-tts.ts
"use client";

import { useState, useEffect, useRef } from "react";

export function useBrowserTts() {
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = (text: string, lang = "en-US") => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      console.warn("Browser Speech Synthesis not supported.");
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    utterance.lang = lang;
    
    // Find a matching voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === lang);
    if (voice) {
      utterance.voice = voice;
    } else {
        console.warn(`No voice found for language: ${lang}. Using default.`);
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (e) => {
        console.error("SpeechSynthesis Error", e);
        setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    // Ensure voices are loaded
    window.speechSynthesis.getVoices();
    
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { speak, isPlaying };
}
