import { useState, useCallback, useRef, useEffect } from 'react';

const SpeechRecognition =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

export function useSpeechRecognition(options = {}) {
  const { continuous = true, interimResults = true, lang = 'en-US' } = options;
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const start = useCallback(() => {
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }
    setError(null);
    setTranscript('');
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      let full = '';
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript;
      }
      setTranscript(full);
    };

    recognition.onerror = (e) => {
      if (e.error === 'not-allowed') setError('Microphone access was denied.');
      else if (e.error !== 'aborted') setError(e.error || 'Speech recognition error.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [continuous, interimResults, lang]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore abort errors when the recognition session is already closed.
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranscript('');
    setError(null);
  }, [stop]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore abort errors during cleanup.
        }
      }
    };
  }, []);

  return {
    transcript,
    isListening,
    error,
    isSupported: !!SpeechRecognition,
    start,
    stop,
    reset,
  };
}
