import { useCallback, useEffect, useRef, useState } from 'react';

function pickVoice(lang, voices) {
  const pref =
    lang === 'es'
      ? ['es-ES', 'es-MX', 'es-419', 'es-US', 'es_AR', 'es']
      : ['en-US', 'en-GB', 'en-AU', 'en'];
  for (const p of pref) {
    const v = voices.find((x) => x.lang.toLowerCase().startsWith(p.toLowerCase()));
    if (v) return v;
  }
  return null;
}

export function available() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Reproduce verso a verso un capítulo con resaltado (índice activo).
// El síntoma limpio del guard en `stop` evita setState redundante.
export function useSpeech() {
  const [status, setStatus] = useState('idle'); // idle | playing | paused
  const [activeIdx, setActiveIdx] = useState(null);
  const [total, setTotal] = useState(0);
  const sessionRef = useRef(null);

  const teardown = useCallback(() => {
    sessionRef.current = null;
    setActiveIdx(null);
    setTotal(0);
    setStatus('idle');
  }, []);

  const speak = useCallback(
    (texts, { start = 0, lang = 'es', rate = 1 } = {}) => {
      const synth = window.speechSynthesis;
      if (!synth || !texts?.length) return;
      synth.cancel();
      const voices = synth.getVoices();
      sessionRef.current = {
        texts,
        lang,
        rate,
        idx: Math.min(Math.max(0, start), texts.length - 1),
        paused: false,
      };
      fire = () => {
        const s = sessionRef.current || { idx: 0, texts: [] };
        setTotal(s.texts.length);
        setActiveIdx(s.idx);
        const text = s.texts[s.idx];
        if (text === undefined) {
          teardown();
          return;
        }
        const u = new SpeechSynthesisUtterance(text);
        u.lang = s.lang;
        u.rate = s.rate;
        const vo = pickVoice(s.lang, voices);
        if (vo) u.voice = vo;
        u.onend = () => {
          if (!sessionRef.current) return;
          sessionRef.current.idx += 1;
          fire();
        };
        u.onerror = () => {
          if (!sessionRef.current) return;
          sessionRef.current.idx += 1;
          fire();
        };
        synth.speak(u);
      };
      setStatus('playing');
      fire();
    },
    [teardown]
  );

  const stop = useCallback(() => {
    if (!sessionRef.current && status === 'idle') return;
    window.speechSynthesis?.cancel();
    teardown();
  }, [status, teardown]);

  const pause = useCallback(() => {
    if (!sessionRef.current) return;
    window.speechSynthesis?.pause();
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    if (!sessionRef.current) return;
    window.speechSynthesis?.resume();
    setStatus('playing');
  }, []);

  const toggle = useCallback(() => {
    if (status === 'paused') resume();
    else if (status === 'playing') pause();
  }, [status, pause, resume]);

  // Freno de seguridad por si el usuario navega lejos.
  useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
    },
    []
  );

  return { status, activeIdx, total, speak, stop, pause, resume, toggle };
}