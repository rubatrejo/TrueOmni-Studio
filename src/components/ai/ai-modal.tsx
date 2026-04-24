'use client';

import { useGSAP } from '@gsap/react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { Mic, SendHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { SuggestedQuestions } from '@/components/ai/suggested-questions';
import { OnScreenKeyboard, type KeyboardKey } from '@/components/home/on-screen-keyboard';
import { useAiStore } from '@/stores/ai-store';

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
 * (animaciones Framer + GSAP rings) pero adaptado para usar:
 *   - Tokens `--ai-*` en lugar de hex hardcoded.
 *   - Textos del cliente activo via prop `textos`.
 *   - `OnScreenKeyboard` del kiosk (en vez del VirtualKeyboard del paquete).
 *   - Web Speech API integrada en el botón mic del hero (en vez de en el
 *     keyboard como hacía el paquete).
 */
export function AiModal({ heroVideoSrc, textos }: AiModalProps) {
  const isOpen = useAiStore((s) => s.isOpen);
  const close = useAiStore((s) => s.close);
  const displayedText = useAiStore((s) => s.displayedText);
  const isTyping = useAiStore((s) => s.isTyping);
  const askQuestion = useAiStore((s) => s.askQuestion);

  const [inputFocused, setInputFocused] = useState(false);
  const [shift, setShift] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const micRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

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
    recognition.lang = 'en-US';

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
  }, [askQuestion]);

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
    } else if (key === 'CLOSE') {
      setInputFocused(false);
    } else if (key === 'SHIFT') {
      setShift((s) => !s);
    } else if (key === 'AT') {
      setInputValue((v) => v + '@');
    } else if (key === 'DOT_COM') {
      setInputValue((v) => v + '.com');
    } else if (typeof key === 'string') {
      // Letras y símbolos: shift mayúsculas/minúsculas según estado.
      setInputValue((v) => v + (shift ? key.toUpperCase() : key.toLowerCase()));
      // Al usar la primera letra mayúscula, soltamos shift (comportamiento iOS).
      if (shift) setShift(false);
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
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              backgroundColor: 'hsl(var(--ai-text) / 0.18)',
            }}
            onClick={close}
            aria-hidden="true"
          />

          {/* Modal — slide-up desde el bottom del canvas. */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="absolute bottom-0 left-0 right-0 z-50 flex flex-col overflow-hidden rounded-t-3xl"
            style={{
              height: inputFocused ? '85%' : '65%',
              backgroundColor: 'hsl(var(--ai-surface))',
              boxShadow: '0 -8px 40px hsl(var(--ai-text) / 0.18)',
              transition: 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero video 16:9 con overlay degradado y mic flotante. */}
            <div
              className="relative flex-shrink-0 overflow-hidden"
              style={{ aspectRatio: '16 / 9' }}
            >
              <video
                src={heroVideoSrc}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, hsl(var(--ai-text) / 0.25) 0%, hsl(var(--ai-text) / 0) 25%, transparent 60%, hsl(var(--ai-surface)) 100%)',
                }}
              />

              {/* Close button (X arriba-derecha) — usa el SVG estándar del
                  kiosk (mismo path que AdCloseButton). */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={close}
                aria-label={textos.ariaClose}
                className="absolute right-3 top-3 flex items-center justify-center rounded-full"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: 'hsl(var(--ai-text) / 0.3)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden>
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="#ffffff"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.button>

              {/* Mic button con listening rings (Web Speech API). */}
              <div ref={micRef} className="absolute" style={{ bottom: 12, right: 12 }}>
                {isListening && (
                  <>
                    <div
                      className="mic-ring-1 absolute rounded-full"
                      style={{
                        width: 44,
                        height: 44,
                        top: 0,
                        left: 0,
                        border: '2px solid hsl(var(--ai-accent-from) / 0.4)',
                      }}
                    />
                    <div
                      className="mic-ring-2 absolute rounded-full"
                      style={{
                        width: 44,
                        height: 44,
                        top: 0,
                        left: 0,
                        border: '2px solid hsl(var(--ai-accent-from) / 0.25)',
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
                    width: 44,
                    height: 44,
                    background:
                      'linear-gradient(145deg, hsl(var(--ai-accent-from)), hsl(var(--ai-accent-to)))',
                    boxShadow: '0 4px 14px hsl(var(--ai-accent-from) / 0.35)',
                    opacity: voiceSupported ? 1 : 0.5,
                  }}
                >
                  <Mic className="h-5 w-5 text-white" strokeWidth={2} />
                </motion.button>
              </div>

              {/* Title + subtitle. */}
              <div className="absolute bottom-3 left-4">
                <p
                  style={{
                    fontSize: 16,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    color: 'hsl(var(--ai-text))',
                  }}
                >
                  {textos.title}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 400,
                    color: 'hsl(var(--ai-text))',
                    marginTop: 1,
                  }}
                >
                  {textos.subtitle}
                </p>
              </div>
            </div>

            {/* Cuerpo: respuesta typewriter + chips + input + (keyboard si focused). */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Texto de respuesta. */}
              <div className="flex-1 overflow-y-auto px-5 pb-2 pt-3">
                {isTyping && !displayedText ? (
                  <div className="flex items-center gap-3 py-2">
                    <div
                      className="flex flex-shrink-0 items-center justify-center rounded-full"
                      style={{
                        width: 28,
                        height: 28,
                        background:
                          'linear-gradient(145deg, hsl(var(--ai-accent-from)), hsl(var(--ai-accent-to)))',
                      }}
                    >
                      <Mic className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                    </div>
                    <div
                      className="flex items-center gap-1 rounded-2xl px-4 py-2.5"
                      style={{ backgroundColor: 'hsl(var(--ai-text-soft) / 0.06)' }}
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="rounded-full"
                          style={{
                            width: 6,
                            height: 6,
                            backgroundColor: 'hsl(var(--ai-accent-from))',
                          }}
                          animate={{ y: [0, -6, 0] }}
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
                      fontSize: 13,
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 400,
                      color: 'hsl(var(--ai-text-soft))',
                      lineHeight: 1.65,
                    }}
                  >
                    {displayedText}
                  </p>
                )}
              </div>

              {/* Chips horizontales. */}
              <div
                className="flex-shrink-0 py-2.5"
                style={{ borderTop: '1px solid hsl(var(--ai-text) / 0.06)' }}
              >
                <SuggestedQuestions />
              </div>

              {/* Input bar. */}
              <div className="flex-shrink-0 px-4 pb-3 pt-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-full px-4 text-left"
                  style={{
                    height: 44,
                    backgroundColor: inputFocused
                      ? 'hsl(var(--ai-input-bg))'
                      : 'hsl(var(--ai-text-soft) / 0.05)',
                    border: inputFocused
                      ? '1.5px solid hsl(var(--ai-accent-from))'
                      : '1px solid hsl(var(--ai-text-soft) / 0.08)',
                    boxShadow: inputFocused ? '0 0 0 3px hsl(var(--ai-accent-from) / 0.1)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setInputFocused(true)}
                >
                  {inputFocused ? (
                    <>
                      <span
                        className="flex-1 truncate"
                        style={{
                          fontSize: 13,
                          fontFamily: 'var(--font-sans)',
                          fontWeight: 400,
                          color: inputValue ? 'hsl(var(--ai-text))' : 'hsl(var(--ai-text) / 0.3)',
                          minHeight: 20,
                        }}
                      >
                        {inputValue || textos.inputPlaceholder}
                        <motion.span
                          className="ml-px inline-block"
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                          style={{
                            width: 1.5,
                            height: 14,
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
                            className="h-5 w-5"
                            style={{ color: 'hsl(var(--ai-accent-from))' }}
                            strokeWidth={2}
                          />
                        </motion.span>
                      )}
                    </>
                  ) : (
                    <span
                      style={{
                        fontSize: 13,
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
                  <OnScreenKeyboard shift={shift} onKey={handleKey} />
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
