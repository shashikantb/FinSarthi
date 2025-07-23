
// src/hooks/use-browser-tts.ts
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface BrowserTtsOptions {
    onEnd?: () => void;
}

export function useBrowserTts({ onEnd }: BrowserTtsOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const handleVoicesChanged = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    
    // Initial load
    handleVoicesChanged();

    // The 'voiceschanged' event is fired when the list of voices is ready
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
    
    // Find a matching voice from the loaded voices
    const voice = voices.find(v => v.lang === lang || v.lang.startsWith(lang.split('-')[0]));
    if (voice) {
      utterance.voice = voice;
    } else {
        console.warn(`No voice found for language: ${lang}. Using browser's default.`);
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      utteranceRef.current = null;
      onEnd?.();
    };
    utterance.onerror = (e) => {
        if (e.error !== 'canceled') {
            console.error("SpeechSynthesis Error", e);
        }
        setIsPlaying(false);
        utteranceRef.current = null;
        onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  };

  const stop = useCallback(() => {
      if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
  }, []);

  return { speak, stop, isPlaying };
}
