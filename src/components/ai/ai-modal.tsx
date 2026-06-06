'use client';

import { useGSAP } from '@gsap/react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { Mic, SendHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { SuggestedQuestions } from '@/components/ai/suggested-questions';
import { OnScreenKeyboard, type KeyboardKey } from '@/components/home/on-screen-keyboard';
import { useCurrentLocale, useTextos } from '@/components/i18n-provider';
import { useTavusConversation } from '@/hooks/use-tavus-conversation';
import { useAiStore } from '@/stores/ai-store';

// Re-export para no romper los imports existentes (`ask-ai-trigger`,
// `ask-ai-host`) — la lógica de pre-warm vive ahora en el hook compartido.
export { prewarmAiAvatar } from '@/hooks/use-tavus-conversation';

/**
 * ISO 639-1 → BCP-47 tag para Web Speech API. Mapeo a la variante regional
 * más extendida cuando un locale tiene varias (ej. `pt` → `pt-BR`). Locales
 * fuera del mapa se pasan tal cual al motor del navegador.
 */
const VOICE_LANG_MAP: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-BR',
  ja: 'ja-JP',
  it: 'it-IT',
  nl: 'nl-NL',
  pl: 'pl-PL',
  ru: 'ru-RU',
  zh: 'zh-CN',
  ko: 'ko-KR',
};

interface AiModalTextos {
  title: string;
  subtitle: string;
  inputPlaceholder: string;
  ariaClose: string;
  ariaMic: string;
}

interface AiModalProps {
  heroVideoSrc: string;
  textos: AiModalTextos;
  /** Nombre del cliente — se inyecta en `ai_subtitle` reemplazando `{client_name}`. */
  clientName?: string;
}

type SpeechRecognitionAlt = 'SpeechRecognition' | 'webkitSpeechRecognition';

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

/**
 * Modal full-canvas del módulo Ask AI — verbatim del paquete original
 * (animaciones Framer + GSAP rings) pero adaptado para kiosk 1080×1920:
 *   - Tokens `--ai-*` en lugar de hex hardcoded.
 *   - Textos del cliente activo via prop `textos`.
 *   - `OnScreenKeyboard` del kiosk (en vez del VirtualKeyboard del paquete).
 *   - Web Speech API integrada en el botón mic del hero.
 *   - Dimensiones tipográficas y de controles escaladas ~2.5× respecto al
 *     diseño mobile original para garantizar legibilidad y target táctil
 *     adecuados a un kiosk retrato 1080×1920.
 */
export function AiModal({
  heroVideoSrc: _heroVideoSrc,
  textos: incomingTextos,
  clientName,
}: AiModalProps) {
  const t = useTextos();
  const currentLocale = useCurrentLocale();
  const pick = (key: string, fallback: string) => {
    const r = t(key);
    return r === key ? fallback : r;
  };
  const subtitleRaw = pick('ai_subtitle', incomingTextos.subtitle);
  const subtitle = clientName ? subtitleRaw.replaceAll('{client_name}', clientName) : subtitleRaw;
  const textos: AiModalTextos = {
    title: pick('ai_title', incomingTextos.title),
    subtitle,
    inputPlaceholder: pick('ai_input_placeholder', incomingTextos.inputPlaceholder),
    ariaClose: pick('ai_aria_close', incomingTextos.ariaClose),
    ariaMic: pick('ai_aria_mic', incomingTextos.ariaMic),
  };
  const isOpen = useAiStore((s) => s.isOpen);
  const close = useAiStore((s) => s.close);
  const displayedText = useAiStore((s) => s.displayedText);
  const isTyping = useAiStore((s) => s.isTyping);
  const askQuestion = useAiStore((s) => s.askQuestion);

  const [inputFocused, setInputFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const micRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // ── Tavus live avatar (video conversacional) — lógica Daily/Tavus extraída
  // al hook compartido `useTavusConversation` (la misma que usa la PWA). El
  // modal sólo provee el `<video ref={avatarVideoRef}>` y pinta `caption`.
  const { avatarVideoRef, caption } = useTavusConversation({ isOpen, isListening, clientName });

  // Inicializa Web Speech API una vez al montar.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as unknown as Partial<Record<SpeechRecognitionAlt, SpeechRecognitionCtor>>;
    const Ctor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!Ctor) return;

    setVoiceSupported(true);
    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = VOICE_LANG_MAP[currentLocale] ?? currentLocale;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const last = event.results[event.results.length - 1];
      if (last?.isFinal && transcript.trim()) {
        askQuestion(transcript.trim());
      }
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.abort();
    };
  }, [askQuestion, currentLocale]);

  // Mic listening rings — animación GSAP verbatim del paquete original.
  useGSAP(
    () => {
      if (!micRef.current) return;
      gsap.to('.mic-ring-1', {
        scale: 1.5,
        opacity: 0,
        duration: 1.8,
        ease: 'power2.out',
        repeat: -1,
      });
      gsap.to('.mic-ring-2', {
        scale: 1.8,
        opacity: 0,
        duration: 1.8,
        ease: 'power2.out',
        repeat: -1,
        delay: 0.6,
      });
    },
    { scope: micRef },
  );

  function handleSend() {
    const trimmed = inputValue.trim();
    if (!trimmed || isTyping) return;
    askQuestion(trimmed);
    setInputValue('');
    setInputFocused(false);
  }

  function handleKey(key: KeyboardKey) {
    if (key === 'BACKSPACE') {
      setInputValue((v) => v.slice(0, -1));
    } else if (key === 'SPACE') {
      setInputValue((v) => v + ' ');
    } else if (key === 'ENTER') {
      handleSend();
    } else if (typeof key === 'string') {
      setInputValue((v) => v + key);
    }
  }

  function toggleVoice() {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch {
        // start() puede fallar si ya está activo o en un estado inválido — ignorar.
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop con blur — cubre el canvas entero. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-50"
            style={{
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              backgroundColor: 'hsl(var(--ai-text) / 0.18)',
            }}
            onClick={close}
            aria-hidden="true"
          />

          {/* Modal — slide-down desde el top del canvas. */}
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="absolute left-0 right-0 top-0 z-50 flex flex-col overflow-hidden"
            style={{
              height: inputFocused ? '85%' : '65%',
              backgroundColor: 'hsl(var(--ai-surface))',
              boxShadow: '0 20px 100px hsl(var(--ai-text) / 0.18)',
              borderBottomLeftRadius: 60,
              borderBottomRightRadius: 60,
              transition: 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero 16:9 — Tavus live avatar cuando hay creds, video placeholder
                como fallback, hero hidden cuando Tavus está unavailable (option B).
                Altura explícita 608 (1080 * 9/16) + marginBottom: -10 +
                bg blanco explícito garantizan que no aparezca ningún row sub-píxel
                del backdrop oscuro entre hero y body aún con scaling fraccional. */}
            <div
              className="relative flex-shrink-0 overflow-hidden"
              style={{
                height: 608,
                marginBottom: -10,
                backgroundColor: 'hsl(var(--ai-surface))',
              }}
            >
              {/* <video> propio donde renderizamos los tracks (video + audio)
                  del avatar Tavus. Modo headless con createCallObject — sin
                  Daily Prebuilt UI, sin prejoin lobby. Ambos tracks van al
                  mismo MediaStream para que un solo media element reproduzca
                  video + audio sin problemas de autoplay-policy. */}
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                ref={avatarVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
                style={{ background: 'hsl(var(--ai-surface))' }}
                aria-label="AI Avatar"
              />

              {/* Closed Captions overlay — texto del avatar sobre el video.
                  Aparece cuando llega un `transcription-message` o
                  `app-message` de Tavus, fade-out a los 4s. */}
              {caption && (
                <div
                  className="pointer-events-none absolute"
                  style={{
                    left: 32,
                    right: 120,
                    bottom: 130,
                    padding: '14px 22px',
                    borderRadius: 18,
                    backgroundColor: 'hsl(var(--ai-text) / 0.65)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    color: '#fff',
                    fontSize: 26,
                    lineHeight: 1.3,
                    fontWeight: 500,
                    textAlign: 'center',
                  }}
                  aria-live="polite"
                >
                  {caption}
                </div>
              )}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, hsl(var(--ai-text) / 0.25) 0%, hsl(var(--ai-text) / 0) 25%, hsl(var(--ai-surface) / 0) 60%, hsl(var(--ai-surface)) 100%)',
                }}
              />

              {/* Close button (X arriba-derecha) — usa el SVG estándar del kiosk. */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={close}
                aria-label={textos.ariaClose}
                className="absolute flex items-center justify-center rounded-full"
                style={{
                  top: 24,
                  right: 24,
                  width: 80,
                  height: 80,
                  backgroundColor: 'hsl(var(--ai-text) / 0.3)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                <svg width={40} height={40} viewBox="0 0 24 24" aria-hidden>
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="#ffffff"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.button>

              {/* Mic button con listening rings (Web Speech API). */}
              <div ref={micRef} className="absolute" style={{ bottom: 30, right: 30 }}>
                {isListening && (
                  <>
                    <div
                      className="mic-ring-1 absolute rounded-full"
                      style={{
                        width: 110,
                        height: 110,
                        top: 0,
                        left: 0,
                        border: '5px solid hsl(var(--ai-accent-from) / 0.4)',
                      }}
                    />
                    <div
                      className="mic-ring-2 absolute rounded-full"
                      style={{
                        width: 110,
                        height: 110,
                        top: 0,
                        left: 0,
                        border: '5px solid hsl(var(--ai-accent-from) / 0.25)',
                      }}
                    />
                  </>
                )}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleVoice}
                  disabled={!voiceSupported}
                  aria-label={textos.ariaMic}
                  aria-pressed={isListening}
                  className="relative flex items-center justify-center rounded-full"
                  style={{
                    width: 110,
                    height: 110,
                    background:
                      'linear-gradient(145deg, hsl(var(--ai-accent-from)), hsl(var(--ai-accent-to)))',
                    boxShadow: '0 10px 35px hsl(var(--ai-accent-from) / 0.35)',
                    opacity: voiceSupported ? 1 : 0.5,
                  }}
                >
                  <Mic style={{ width: 50, height: 50, color: '#ffffff' }} strokeWidth={2} />
                </motion.button>
              </div>

              {/* Title + subtitle. */}
              <div className="absolute" style={{ bottom: 24, left: 36 }}>
                <p
                  style={{
                    fontSize: 44,
                    lineHeight: 1.1,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    color: 'hsl(var(--ai-text))',
                  }}
                >
                  {textos.title}
                </p>
                <p
                  style={{
                    fontSize: 26,
                    lineHeight: 1.3,
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 400,
                    color: 'hsl(var(--ai-text))',
                    marginTop: 4,
                  }}
                >
                  {textos.subtitle}
                </p>
              </div>
            </div>

            {/* Cuerpo: respuesta typewriter + chips + input + (keyboard si focused). */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Texto de respuesta. */}
              <div
                className="flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ paddingLeft: 48, paddingRight: 48, paddingTop: 28, paddingBottom: 16 }}
              >
                {isTyping && !displayedText ? (
                  <div className="flex items-center" style={{ gap: 18, paddingTop: 8 }}>
                    <div
                      className="flex flex-shrink-0 items-center justify-center rounded-full"
                      style={{
                        width: 70,
                        height: 70,
                        background:
                          'linear-gradient(145deg, hsl(var(--ai-accent-from)), hsl(var(--ai-accent-to)))',
                      }}
                    >
                      <Mic style={{ width: 32, height: 32, color: '#ffffff' }} strokeWidth={2} />
                    </div>
                    <div
                      className="flex items-center"
                      style={{
                        gap: 8,
                        paddingLeft: 26,
                        paddingRight: 26,
                        paddingTop: 18,
                        paddingBottom: 18,
                        borderRadius: 32,
                        backgroundColor: 'hsl(var(--ai-text-soft) / 0.06)',
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="rounded-full"
                          style={{
                            width: 14,
                            height: 14,
                            backgroundColor: 'hsl(var(--ai-accent-from))',
                          }}
                          animate={{ y: [0, -10, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: 'easeInOut',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p
                    style={{
                      fontSize: 30,
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 400,
                      color: 'hsl(var(--ai-text-soft))',
                      lineHeight: 1.5,
                    }}
                  >
                    {displayedText}
                  </p>
                )}
              </div>

              {/* Chips horizontales. */}
              <div
                className="flex-shrink-0"
                style={{
                  paddingTop: 18,
                  paddingBottom: 18,
                  borderTop: '1px solid hsl(var(--ai-text) / 0.06)',
                }}
              >
                <SuggestedQuestions />
              </div>

              {/* Input bar. */}
              <div
                className="flex-shrink-0"
                style={{ paddingLeft: 32, paddingRight: 32, paddingTop: 8, paddingBottom: 24 }}
              >
                <button
                  type="button"
                  className="flex w-full items-center text-left"
                  style={{
                    gap: 16,
                    height: 100,
                    paddingLeft: 36,
                    paddingRight: 36,
                    borderRadius: 9999,
                    backgroundColor: inputFocused
                      ? 'hsl(var(--ai-input-bg))'
                      : 'hsl(var(--ai-text-soft) / 0.05)',
                    border: inputFocused
                      ? '3px solid hsl(var(--ai-accent-from))'
                      : '2px solid hsl(var(--ai-text-soft) / 0.08)',
                    boxShadow: inputFocused ? '0 0 0 8px hsl(var(--ai-accent-from) / 0.1)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setInputFocused(true)}
                >
                  {inputFocused ? (
                    <>
                      <span
                        className="flex-1 truncate"
                        style={{
                          fontSize: 30,
                          fontFamily: 'var(--font-sans)',
                          fontWeight: 400,
                          color: inputValue ? 'hsl(var(--ai-text))' : 'hsl(var(--ai-text) / 0.3)',
                          minHeight: 36,
                        }}
                      >
                        {inputValue || textos.inputPlaceholder}
                        <motion.span
                          className="inline-block"
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                          style={{
                            marginLeft: 4,
                            width: 4,
                            height: 32,
                            backgroundColor: 'hsl(var(--ai-accent-from))',
                            verticalAlign: 'text-bottom',
                          }}
                        />
                      </span>
                      {inputValue.trim() && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSend();
                          }}
                          role="button"
                          aria-label={textos.title}
                        >
                          <SendHorizontal
                            style={{ width: 44, height: 44, color: 'hsl(var(--ai-accent-from))' }}
                            strokeWidth={2}
                          />
                        </motion.span>
                      )}
                    </>
                  ) : (
                    <span
                      style={{
                        fontSize: 30,
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 400,
                        color: 'hsl(var(--ai-text) / 0.3)',
                      }}
                    >
                      {textos.inputPlaceholder}
                    </span>
                  )}
                </button>
              </div>

              {/* OnScreenKeyboard del kiosk — solo visible al focusear el input. */}
              {inputFocused && (
                <motion.div
                  initial={{ y: 420, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 420, opacity: 0 }}
                  transition={{
                    type: 'spring',
                    damping: 32,
                    stiffness: 320,
                    mass: 0.8,
                    opacity: { duration: 0.25 },
                  }}
                  className="flex-shrink-0"
                  style={{ touchAction: 'none' }}
                >
                  <OnScreenKeyboard onKey={handleKey} />
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
