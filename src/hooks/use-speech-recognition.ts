
// src/hooks/use-speech-recognition.ts
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SpeechRecognitionOptions {
  onTranscriptChange?: (transcript: string) => void;
}

export function useSpeechRecognition({ onTranscriptChange }: SpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      console.warn("Speech recognition not supported by this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.continuous = false; 
    recognition.interimResults = false; 

    recognition.onresult = (event) => {
      const finalTranscript = event.results[event.results.length - 1][0].transcript.trim();
      setTranscript(finalTranscript);
      if (onTranscriptChange && finalTranscript) {
        onTranscriptChange(finalTranscript);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.error("Speech recognition error", event.error);
      }
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscriptChange]);

  const startListening = useCallback(({lang = 'en-US'} = {}) => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.lang = lang;
        recognitionRef.current.start();
        setIsListening(true);
        setTranscript("");
      } catch(e) {
        console.error("Speech recognition could not start: ", e);
        setIsListening(false);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
  };
}
