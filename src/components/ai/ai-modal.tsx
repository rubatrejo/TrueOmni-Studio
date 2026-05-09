'use client';

import DailyIframe from '@daily-co/daily-js';
import { useGSAP } from '@gsap/react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { Mic, SendHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { SuggestedQuestions } from '@/components/ai/suggested-questions';
import { OnScreenKeyboard, type KeyboardKey } from '@/components/home/on-screen-keyboard';
import { useCurrentLocale, useTextos } from '@/components/i18n-provider';
import { useAiStore } from '@/stores/ai-store';

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

/* ────────────────────────────────────────────────────────────────────────── */
/*  Pre-warm Tavus — cache de conversación a nivel de módulo                 */
/* ────────────────────────────────────────────────────────────────────────── */

interface PrewarmedConversation {
  conversationId: string;
  conversationUrl: string;
  warmedAt: number;
  /** clientName usado para construir el greeting de esta conversación. */
  clientName: string;
}

let prewarmCache: PrewarmedConversation | null = null;
let prewarmPromise: Promise<PrewarmedConversation | null> | null = null;
let prewarmPendingClientName = '';
const PREWARM_TTL_MS = 50_000; // bajo el participant_absent_timeout (60s) de Tavus

async function fetchStart(clientName?: string): Promise<PrewarmedConversation | null> {
  try {
    const res = await fetch('/api/ai-avatar/start', {
      method: 'POST',
      headers: clientName ? { 'Content-Type': 'application/json' } : undefined,
      body: clientName ? JSON.stringify({ clientName }) : undefined,
    });
    const data = (await res.json().catch(() => null)) as {
      ok: boolean;
      conversationId?: string;
      conversationUrl?: string;
    } | null;
    if (!res.ok || !data?.ok || !data.conversationUrl || !data.conversationId) return null;
    return {
      conversationId: data.conversationId,
      conversationUrl: data.conversationUrl,
      warmedAt: Date.now(),
      clientName: clientName ?? '',
    };
  } catch {
    return null;
  }
}

/**
 * Lanza /start en background y cachea el resultado. Si ya hay una pendiente,
 * no dispara otra. Llamar en cualquier momento es idempotente.
 *
 * Acepta `clientName` opcional — el server-side `/start` lo usa como
 * override de `cfg.client.nombre` para interpolar `{client_name}` en el
 * greeting. Necesario para Studio preview donde KIOSK_CLIENT=default
 * pero el operador editó el nombre del nuevo kiosk.
 *
 * Exportada para que `<AskAiTrigger>` la dispare en touchstart/mouseenter
 * del bubble flotante — así para cuando el modal abre el conversation_url
 * casi siempre ya está listo.
 */
export function prewarmAiAvatar(clientName?: string): void {
  const wanted = clientName ?? '';
  if (
    prewarmCache &&
    prewarmCache.clientName === wanted &&
    Date.now() - prewarmCache.warmedAt < PREWARM_TTL_MS
  ) {
    return;
  }
  if (prewarmPromise && prewarmPendingClientName === wanted) return;
  prewarmPendingClientName = wanted;
  prewarmPromise = fetchStart(clientName).then((result) => {
    prewarmCache = result;
    prewarmPromise = null;
    return result;
  });
}

async function consumePrewarmOrCreate(clientName?: string): Promise<PrewarmedConversation | null> {
  const wanted = clientName ?? '';
  // Cache fresca y mismo clientName → la usamos.
  if (
    prewarmCache &&
    prewarmCache.clientName === wanted &&
    Date.now() - prewarmCache.warmedAt < PREWARM_TTL_MS
  ) {
    const cached = prewarmCache;
    prewarmCache = null;
    return cached;
  }
  // Cache obsoleta o clientName cambió: invalidamos antes de la fresh call.
  if (prewarmCache) prewarmCache = null;
  // Pre-warm en vuelo CON el mismo clientName: esperamos.
  if (prewarmPromise && prewarmPendingClientName === wanted) {
    const result = await prewarmPromise;
    prewarmCache = null;
    if (result && Date.now() - result.warmedAt < PREWARM_TTL_MS) return result;
  }
  // Sin cache válido → request fresca con clientName actual.
  return fetchStart(clientName);
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

  // ── Tavus live avatar — reemplaza el heroVideo cuando hay creds. ─────────
  // Estrategia: NO usamos Daily Prebuilt (createFrame) porque su prejoin
  // lobby ("Are you ready to join?") es property del room y Tavus rechaza
  // `enable_prejoin_ui: false`. En su lugar usamos `createCallObject()` —
  // modo headless sin UI propia — y renderizamos los tracks del avatar
  // (video + audio) directamente en un <video> propio.
  //
  // Mic local: se ADQUIERE en join (audioSource: true) pero arranca muteado
  // vía setLocalAudio(false). Push-to-talk lo toggla. NO se puede usar
  // audioSource:false aquí porque entonces no hay mic que toglear y el
  // avatar nunca escucha al usuario.
  const [, setTavusReady] = useState(false);
  const [, setTavusUnavailable] = useState(false);
  const [caption, setCaption] = useState<string>('');
  const tavusConvIdRef = useRef<string | null>(null);
  const avatarVideoRef = useRef<HTMLVideoElement | null>(null);
  const captionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dailyCallRef = useRef<{
    leave: () => Promise<unknown>;
    destroy: () => Promise<unknown>;
    setLocalAudio: (on: boolean) => unknown;
    updateReceiveSettings: (settings: unknown) => Promise<unknown>;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setTavusReady(false);
    setTavusUnavailable(false);

    // Pre-arranca el <video> con autoplay dentro del gesture del click del
    // trigger. Aunque srcObject siga null, llamar play() acá preserva la
    // user-activation para que después attachTrack() pueda reproducir audio
    // sin que Chrome lo bloquee por autoplay-policy.
    const video = avatarVideoRef.current;
    if (video) {
      video.muted = false;
      video.play().catch(() => {});
    }

    (async () => {
      try {
        console.info('[ai-modal] resolving Tavus conversation (prewarm or fresh)…');
        const conv = await consumePrewarmOrCreate(clientName);
        if (!active) return;
        if (!conv) {
          console.warn('[ai-modal] start failed');
          setTavusUnavailable(true);
          return;
        }
        tavusConvIdRef.current = conv.conversationId;
        console.info('[ai-modal] conversation:', conv.conversationId);

        // Daily no permite dos call objects activos a la vez. En StrictMode
        // dev la cleanup del primer effect run intenta destroy(), pero a
        // veces queda lingering — buscamos cualquier instancia previa global
        // y la matamos antes de crear la nueva.
        const Lib = DailyIframe as unknown as {
          getCallInstance?: () => { destroy?: () => Promise<unknown> } | undefined;
        };
        const existing = Lib.getCallInstance?.();
        if (existing?.destroy) {
          await existing.destroy().catch(() => {});
        }

        const call = DailyIframe.createCallObject({
          audioSource: true, // mic se adquiere para push-to-talk
          videoSource: false,
          subscribeToTracksAutomatically: true,
        });
        dailyCallRef.current = call as unknown as typeof dailyCallRef.current;
        console.info('[ai-modal] daily callObject created');

        const attachTrack = (track: MediaStreamTrack) => {
          const el = avatarVideoRef.current;
          if (!el) return;
          // Solo asignamos srcObject la PRIMERA vez. Después modificamos
          // los tracks del MediaStream existente para no resetear el
          // playback state (cada `el.srcObject = ...` re-arma autoplay y
          // a veces pausa el audio en Chrome).
          let stream = el.srcObject as MediaStream | null;
          if (!stream) {
            stream = new MediaStream();
            el.srcObject = stream;
            el.muted = false;
            const playPromise = el.play();
            if (playPromise) {
              playPromise.then(
                () => console.info('[ai-modal] avatar element playing'),
                (err) => console.warn('[ai-modal] avatar play() blocked:', err?.name, err?.message),
              );
            }
          }
          stream
            .getTracks()
            .filter((t) => t.kind === track.kind)
            .forEach((t) => stream!.removeTrack(t));
          stream.addTrack(track);
        };

        const onTrackStarted = (event: {
          participant: { local: boolean; user_name?: string } | null;
          track: MediaStreamTrack;
        }) => {
          const p = event.participant;
          const t = event.track;
          if (!p || !t) return;
          console.info('[ai-modal] track-started', {
            kind: t.kind,
            local: p.local,
            user: p.user_name,
            readyState: t.readyState,
          });
          if (p.local) return;
          attachTrack(t);
          if (active && t.kind === 'video') setTavusReady(true);
        };

        const onJoined = () => {
          console.info('[ai-modal] local joined-meeting — muting mic + max receive quality');
          try {
            call.setLocalAudio(false);
          } catch {}
          // Solicita la capa de simulcast más alta para todos los participantes
          // remotos (avatar) — sube la calidad del video del avatar al máximo
          // que esté publicando Tavus en lugar de la capa por defecto.
          try {
            call.updateReceiveSettings({
              base: {
                video: { layer: 2 },
                screenVideo: { layer: 2 },
              },
            });
          } catch (err) {
            console.warn('[ai-modal] updateReceiveSettings failed', err);
          }
        };

        // Helper común — actualiza el caption visible y reinicia el auto-clear.
        const showCaption = (text: string) => {
          if (!text || !active) return;
          setCaption(text);
          if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
          captionTimerRef.current = setTimeout(() => setCaption(''), 4500);
        };

        const onTranscription = (event: {
          text?: string;
          is_final?: boolean;
          participant?: { local?: boolean };
        }) => {
          const text = event.text?.trim();
          if (!text) return;
          // Filtramos al usuario local; solo mostramos lo que dice el avatar.
          if (event.participant?.local) return;
          // Aceptamos tanto interim como final → caption en tiempo real.
          showCaption(text);
        };

        const onParticipantJoined = (event: {
          participant: { local: boolean; user_name?: string };
        }) => {
          console.info(
            '[ai-modal] participant-joined',
            event.participant.user_name,
            'local=',
            event.participant.local,
          );
        };

        const onError = (err: unknown) => {
          console.error('[ai-modal] daily error', err);
          if (active) {
            setTavusReady(false);
            setTavusUnavailable(true);
          }
        };

        call.on('track-started', onTrackStarted);
        call.on('joined-meeting', onJoined);
        call.on('participant-joined', onParticipantJoined);
        call.on('error', onError);
        call.on('transcription-message', onTranscription);

        // Tavus emite múltiples app-message events durante una utterance del
        // avatar. Para captions en tiempo real usamos el PRIMERO que llega
        // con el texto del speech — típicamente `replica.started_speaking`,
        // que se emite antes de que el audio empiece, así que el caption
        // aparece sincronizado con la voz en lugar de delayed.
        call.on(
          'app-message',
          (event: { data?: { event_type?: string; properties?: Record<string, unknown> } }) => {
            const ev = event?.data;
            const type = ev?.event_type;
            if (!type || !type.startsWith('conversation.')) return;
            // Solo eventos del replica/avatar — ignoramos los del user.
            if (type.includes('user.')) return;
            const props = ev?.properties ?? {};
            const speech = (props.speech ?? props.text ?? props.transcript) as string | undefined;
            const trimmed = typeof speech === 'string' ? speech.trim() : '';
            if (!trimmed) return;
            // Aceptamos cualquier evento con texto: started_speaking, utterance,
            // replica.utterance, etc. El primero que llega gana.
            showCaption(trimmed);
          },
        );

        try {
          await call.join({ url: conv.conversationUrl });
          console.info('[ai-modal] call.join() resolved');
        } catch (err) {
          console.error('[ai-modal] join() failed', err);
          if (active) {
            setTavusReady(false);
            setTavusUnavailable(true);
          }
        }
      } catch (err) {
        console.error('[ai-modal] tavus mount failed', err);
        if (active) setTavusUnavailable(true);
      }
    })();

    return () => {
      active = false;
      const id = tavusConvIdRef.current;
      const call = dailyCallRef.current;
      tavusConvIdRef.current = null;
      dailyCallRef.current = null;
      setTavusReady(false);
      setTavusUnavailable(false);
      setCaption('');
      if (captionTimerRef.current) {
        clearTimeout(captionTimerRef.current);
        captionTimerRef.current = null;
      }
      if (avatarVideoRef.current) avatarVideoRef.current.srcObject = null;
      if (call) {
        call.leave().catch(() => {});
        call.destroy().catch(() => {});
      }
      if (id) {
        fetch(`/api/ai-avatar/end/${encodeURIComponent(id)}`, { method: 'POST' }).catch(() => {});
      }
    };
  }, [isOpen]);

  useEffect(() => {
    const call = dailyCallRef.current;
    if (!call) return;
    try {
      call.setLocalAudio(isListening);
      console.info('[ai-modal] mic →', isListening ? 'unmuted' : 'muted');
    } catch (err) {
      console.warn('[ai-modal] setLocalAudio failed', err);
    }
  }, [isListening]);

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
