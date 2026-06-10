'use client';

import DailyIframe from '@daily-co/daily-js';
import { useEffect, useRef, useState, type RefObject } from 'react';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Pre-warm Tavus — cache de conversación a nivel de módulo                  */
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
 * Exportada para que los triggers (kiosk y PWA) la disparen en
 * touchstart/mouseenter del bubble flotante — así para cuando el modal abre el
 * conversation_url casi siempre ya está listo.
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

/* ────────────────────────────────────────────────────────────────────────── */
/*  Hook compartido — conversación de video en vivo con Tavus (Daily CVI)     */
/* ────────────────────────────────────────────────────────────────────────── */

export interface UseTavusConversation {
  /** Asignar a un `<video>` propio: el avatar (video + audio) se renderiza ahí. */
  avatarVideoRef: RefObject<HTMLVideoElement | null>;
  /** Transcripción en vivo del avatar (caption); se auto-limpia tras 4.5 s. */
  caption: string;
  /** True cuando ya llegó el track de video del avatar. */
  isReady: boolean;
  /** True si faltan credenciales o la conexión falló. */
  isUnavailable: boolean;
}

/**
 * Encapsula el ciclo de vida de la conversación Tavus (Daily CVI) en modo
 * headless: NO usa Daily Prebuilt (createFrame) porque su prejoin lobby es
 * property del room y Tavus rechaza `enable_prejoin_ui: false`. En su lugar usa
 * `createCallObject()` y renderiza los tracks del avatar en un `<video>` propio
 * provisto por el consumidor (`avatarVideoRef`).
 *
 * Mic local: se ADQUIERE en join (audioSource: true) pero arranca muteado;
 * `isListening` lo toggla (push-to-talk) — no se puede usar audioSource:false
 * porque entonces no hay mic que toglear y el avatar nunca escucha al usuario.
 *
 * Agnóstico del producto: lo consumen el modal del kiosk (`ai-modal.tsx`) y el
 * de la PWA (`pwa-ask-ai-modal.tsx`) — sólo cambia la UI alrededor del `<video>`.
 */
export function useTavusConversation({
  isOpen,
  isListening,
  clientName,
}: {
  isOpen: boolean;
  isListening: boolean;
  clientName?: string;
}): UseTavusConversation {
  const [isReady, setTavusReady] = useState(false);
  const [isUnavailable, setTavusUnavailable] = useState(false);
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
        // eslint-disable-next-line no-console -- log de diagnóstico de la integración Tavus
        console.info('[tavus] resolving Tavus conversation (prewarm or fresh)…');
        const conv = await consumePrewarmOrCreate(clientName);
        if (!active) return;
        if (!conv) {
          // eslint-disable-next-line no-console -- log de diagnóstico de la integración Tavus
          console.warn('[tavus] start failed');
          setTavusUnavailable(true);
          return;
        }
        tavusConvIdRef.current = conv.conversationId;
        // eslint-disable-next-line no-console -- log de diagnóstico de la integración Tavus
        console.info('[tavus] conversation:', conv.conversationId);

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
        // eslint-disable-next-line no-console -- log de diagnóstico de la integración Tavus
        console.info('[tavus] daily callObject created');

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
                // eslint-disable-next-line no-console -- log de diagnóstico de la integración Tavus
                () => console.info('[tavus] avatar element playing'),
                // eslint-disable-next-line no-console -- log de diagnóstico de la integración Tavus
                (err) => console.warn('[tavus] avatar play() blocked:', err?.name, err?.message),
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
          // eslint-disable-next-line no-console -- log de diagnóstico de la integración Tavus
          console.info('[tavus] track-started', {
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
          // eslint-disable-next-line no-console -- log de diagnóstico de la integración Tavus
          console.info('[tavus] local joined-meeting — muting mic + max receive quality');
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
            // eslint-disable-next-line no-console -- log de diagnóstico de la integración Tavus
            console.warn('[tavus] updateReceiveSettings failed', err);
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
          // eslint-disable-next-line no-console -- log de diagnóstico de la integración Tavus
          console.info(
            '[tavus] participant-joined',
            event.participant.user_name,
            'local=',
            event.participant.local,
          );
        };

        const onError = (err: unknown) => {
          // eslint-disable-next-line no-console -- log de diagnóstico de la integración Tavus
          console.error('[tavus] daily error', err);
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
          // eslint-disable-next-line no-console -- log de diagnóstico de la integración Tavus
          console.info('[tavus] call.join() resolved');
        } catch (err) {
          // eslint-disable-next-line no-console -- log de diagnóstico de la integración Tavus
          console.error('[tavus] join() failed', err);
          if (active) {
            setTavusReady(false);
            setTavusUnavailable(true);
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console -- log de diagnóstico de la integración Tavus
        console.error('[tavus] tavus mount failed', err);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    const call = dailyCallRef.current;
    if (!call) return;
    try {
      call.setLocalAudio(isListening);
      // eslint-disable-next-line no-console -- log de diagnóstico de la integración Tavus
      console.info('[tavus] mic →', isListening ? 'unmuted' : 'muted');
    } catch (err) {
      // eslint-disable-next-line no-console -- log de diagnóstico de la integración Tavus
      console.warn('[tavus] setLocalAudio failed', err);
    }
  }, [isListening]);

  return { avatarVideoRef, caption, isReady, isUnavailable };
}
