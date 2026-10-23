import { useCallback, useEffect, useRef, useState } from "react";

// Ported from the old BrainDrainApp transcription panel.
const LYRIC_LINE_COMMAND = /\b(?:new line|next line|line break|new paragraph)\b/i;
const LYRIC_LINE_COMMAND_GLOBAL = /\b(?:new line|next line|line break|new paragraph)\b/gi;
const LYRIC_PAUSE_BREAK_MS = 1400;
const SETTINGS_KEY = "brain-drain-dictation";

export const TRANSCRIBE_LANGUAGES = [
  { label: "Auto (Browser)", value: "auto" },
  { label: "English (US)", value: "en-US" },
  { label: "English (UK)", value: "en-GB" },
  { label: "Spanish (US)", value: "es-US" },
  { label: "Spanish (Puerto Rico)", value: "es-PR" },
  { label: "Spanish (Spain)", value: "es-ES" },
  { label: "Spanglish (English + Spanish)", value: "spanglish" },
  { label: "French", value: "fr-FR" },
  { label: "German", value: "de-DE" },
  { label: "Portuguese (Brazil)", value: "pt-BR" },
  { label: "Italian", value: "it-IT" },
  { label: "Japanese", value: "ja-JP" },
  { label: "Korean", value: "ko-KR" },
  { label: "Hindi", value: "hi-IN" },
];

function getRecognitionLang(selection) {
  if (selection === "auto") return navigator.language || "en-US";
  if (selection === "spanglish") return "es-US";
  return selection;
}

function formatTranscriptChunk(rawChunk, { lyricsLineBreaks, pauseMs }) {
  if (!rawChunk) return "";

  const compact = rawChunk.replace(/\s+/g, " ").trim();
  if (!compact) return "";

  if (!lyricsLineBreaks) {
    return `${compact} `;
  }

  const explicitBreakRequested = LYRIC_LINE_COMMAND.test(rawChunk);
  const commandProcessed = rawChunk
    .replace(LYRIC_LINE_COMMAND_GLOBAL, "\n")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!commandProcessed) {
    return explicitBreakRequested ? "\n" : "";
  }

  const shouldBreakFromPause = typeof pauseMs === "number" && pauseMs > LYRIC_PAUSE_BREAK_MS;
  const prefix = shouldBreakFromPause ? "\n" : "";
  const suffix = commandProcessed.endsWith("\n") ? "" : "\n";

  return `${prefix}${commandProcessed}${suffix}`;
}

function readSettings() {
  const fallbackLang = TRANSCRIBE_LANGUAGES.some((l) => l.value === navigator.language) ? navigator.language : "auto";
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");
    return {
      language: TRANSCRIBE_LANGUAGES.some((l) => l.value === parsed.language) ? parsed.language : fallbackLang,
      lyricsLineBreaks: Boolean(parsed.lyricsLineBreaks),
    };
  } catch {
    return { language: fallbackLang, lyricsLineBreaks: false };
  }
}

const SpeechRecognitionImpl =
  typeof window === "undefined" ? null : window.SpeechRecognition || window.webkitSpeechRecognition || null;

// onFinal receives formatted text chunks ready to append to a note.
export function useDictation(onFinal) {
  const [settings, setSettings] = useState(readSettings);
  const [isRecording, setIsRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef(null);
  const lastFinalAtRef = useRef(null);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Settings are a convenience; ignore storage failures.
    }
  }, [settings]);

  const reset = useCallback(() => {
    recognitionRef.current = null;
    lastFinalAtRef.current = null;
    setIsRecording(false);
    setInterim("");
  }, []);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore stop errors when recognition has already ended.
    }
    reset();
  }, [reset]);

  const start = useCallback(() => {
    if (!SpeechRecognitionImpl) {
      alert("Voice input isn't supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }
    if (recognitionRef.current) return;

    const rec = new SpeechRecognitionImpl();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = getRecognitionLang(settings.language);
    const { lyricsLineBreaks } = settings;

    rec.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += chunk;
        else interimText += chunk;
      }
      if (finalText) {
        const nowTs = typeof event.timeStamp === "number" ? event.timeStamp : Date.now();
        const pauseMs = lastFinalAtRef.current == null ? null : nowTs - lastFinalAtRef.current;
        onFinalRef.current?.(formatTranscriptChunk(finalText, { lyricsLineBreaks, pauseMs }));
        lastFinalAtRef.current = nowTs;
      }
      setInterim(interimText);
    };

    // Ignore late events from a session that was already stopped and replaced.
    rec.onerror = (event) => {
      if (recognitionRef.current === rec) reset();
      if (event.error === "not-allowed") {
        alert("Microphone access was denied. Allow the microphone for this site and try again.");
      }
    };

    rec.onend = () => {
      if (recognitionRef.current === rec) reset();
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setIsRecording(true);
    } catch {
      reset();
    }
  }, [settings, reset]);

  useEffect(() => () => recognitionRef.current?.abort?.(), []);

  return {
    canUseSpeech: Boolean(SpeechRecognitionImpl),
    isRecording,
    interim,
    start,
    stop,
    language: settings.language,
    setLanguage: (language) => setSettings((s) => ({ ...s, language })),
    lyricsLineBreaks: settings.lyricsLineBreaks,
    setLyricsLineBreaks: (lyricsLineBreaks) => setSettings((s) => ({ ...s, lyricsLineBreaks })),
  };
}
