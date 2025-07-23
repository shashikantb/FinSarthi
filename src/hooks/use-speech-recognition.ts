
// src/hooks/use-speech-recognition.ts
// This hook uses the browser's built-in Web Speech API for speech-to-text functionality.
// It does not require any external npm packages.
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SpeechRecognitionOptions {
  onTranscript?: (transcript: string) => void;
}

export function useSpeechRecognition({ onTranscript }: SpeechRecognitionOptions = {}) {
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

    recognition.continuous = false; // We want to process after each pause
    recognition.interimResults = false; // We only care about the final result

    recognition.onresult = (event) => {
      const finalTranscript = event.results[event.results.length - 1][0].transcript.trim();
      setTranscript(finalTranscript);
      if (onTranscript && finalTranscript) {
        onTranscript(finalTranscript);
      }
      setIsListening(false); // Stop listening after a result is finalized
    };

    recognition.onend = () => {
      // This can be triggered by speech ending, or by calling .stop()
      // We set isListening to false here to ensure the state is always correct.
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
  }, [onTranscript]);

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
