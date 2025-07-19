// src/hooks/use-speech-recognition.ts
// This hook uses the browser's built-in Web Speech API for speech-to-text functionality.
// It does not require any external npm packages.
"use client";

import { useState, useEffect, useRef } from "react";

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

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript);
      if (onTranscript && finalTranscript) {
        onTranscript(finalTranscript);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      // The "aborted" and "network" errors are common and can be safely ignored.
      if (event.error !== 'aborted' && event.error !== 'network') {
        console.error("Speech recognition error", event.error);
      }
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  const startListening = ({lang = 'en-US'} = {}) => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.lang = lang;
        recognitionRef.current.start();
        setIsListening(true);
        setTranscript("");
      } catch(e) {
        // This can happen if start is called while already started.
        console.error(e);
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
  };
}
