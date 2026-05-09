'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { getNowFromSearch, isSlideActive, msUntilNextMinute } from '@/lib/signage/schedule';
import type {
  SignageClientResolved,
  SignageDisplayConfig,
  SignageDisplaySettings,
  SignageSlide,
} from '@/lib/signage/schema';

import { useSignageT } from '../i18n/SignageI18nProvider';
import { useSignageBridgeStore } from '../runtime/signage-bridge-store';
import '../templates/load-templates';
import { getTemplate } from '../templates/registry';
import './transitions.css';

/**
 * `<SignagePlayer>` — rotación con transitions reales y dayparting runtime.
 *
 * DS2: rotación lineal con cut transition.
 * DS12: 4 transitions (`cut` · `fade` 600ms · `slide-left` 700ms · `slide-up` 700ms).
 * DS13: filtra `playlist` por `slide.schedule` re-evaluando cada minuto. Soporta
 *       dev override `?clock=HH:MM&day=YYYY-MM-DD` (alineado al wall-clock del
 *       cliente vía `client.timezone`). Si todos los slides quedan fuera de
 *       schedule muestra un placeholder "No active slides".
 *
 * Cero touch handlers — view-only puro.
 */
export interface SignagePlayerProps {
  client: SignageClientResolved;
  display: SignageDisplayConfig;
  settings: SignageDisplaySettings;
  playlist: SignageSlide[];
}

type TransitionKind = 'cut' | 'fade' | 'slide-left' | 'slide-up';

const TRANSITION_DURATION_MS: Record<TransitionKind, number> = {
  cut: 0,
  fade: 600,
  'slide-left': 700,
  'slide-up': 700,
};

const ENTER_CLASS: Record<TransitionKind, string> = {
  cut: '',
  fade: 'signage-anim-fade-in',
  'slide-left': 'signage-anim-slide-left-in',
  'slide-up': 'signage-anim-slide-up-in',
};

const EXIT_CLASS: Record<TransitionKind, string> = {
  cut: '',
  fade: 'signage-anim-fade-out',
  'slide-left': 'signage-anim-slide-left-out',
  'slide-up': 'signage-anim-slide-up-out',
};

function readSearchParams(): URLSearchParams | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search);
}

export function SignagePlayer({
  client: serverClient,
  display: serverDisplay,
  settings: serverSettings,
  playlist: serverPlaylist,
}: SignagePlayerProps) {
  const t = useSignageT();

  // DSS5: overrides reactivos del display vía bridge. Si el editor pushea
  // `signage:display-update`, mergeamos shallow con la prop server. El
  // editor envía siempre el draft completo, así que el merge funciona sin
  // deep merge (settings + playlist son estructuras self-contained).
  const displayPatch = useSignageBridgeStore((s) => s.displayPatch);
  const clientPatch = useSignageBridgeStore((s) => s.clientPatch);
  const display: SignageDisplayConfig = useMemo(
    () => (displayPatch ? { ...serverDisplay, ...displayPatch } : serverDisplay),
    [displayPatch, serverDisplay],
  );
  // Merge cliente: branding (logos, fonts) y header se actualizan live cuando
  // el editor pushea changes. Los tokens CSS los aplica `<SignageBridgeStyleApplier>`
  // directo al :root; aquí mergeamos los campos no-tokenizados (logos, fonts,
  // header layout, name, website) para que el SignageHeader y otros consumers
  // los lean del client patcheado.
  const client: SignageClientResolved = useMemo(() => {
    if (!clientPatch) return serverClient;
    return {
      ...serverClient,
      ...(clientPatch.name ? { name: clientPatch.name } : null),
      ...(clientPatch.website !== undefined ? { website: clientPatch.website } : null),
      branding: clientPatch.branding
        ? { ...serverClient.branding, ...clientPatch.branding }
        : serverClient.branding,
      header: clientPatch.header
        ? { ...serverClient.header, ...clientPatch.header }
        : serverClient.header,
    };
  }, [clientPatch, serverClient]);
  const settings: SignageDisplaySettings = display.settings ?? serverSettings;
  // Playlist activa: si hay `playlists[]`, leer la activa; si no, fallback a
  // `playlist` legacy o al server.
  const playlist: SignageSlide[] = useMemo(() => {
    if (display.playlists && display.playlists.length > 0) {
      const active =
        display.playlists.find((p) => p.id === display.activePlaylistId) ?? display.playlists[0];
      return active?.slides ?? [];
    }
    return display.playlist ?? serverPlaylist;
  }, [display.playlists, display.activePlaylistId, display.playlist, serverPlaylist]);
  // Dev override `?clock=HH:MM&day=YYYY-MM-DD`: lo leemos en mount (client-only).
  // SSR siempre arranca con `new Date()` real; el cliente sustituye en mount si
  // hay override. Es para QA del gate (DS15), no para producción.
  const [now, setNow] = useState<Date>(() => new Date());
  const [hasOverride, setHasOverride] = useState(false);

  useEffect(() => {
    const sp = readSearchParams();
    if (sp && (sp.get('clock') || sp.get('day'))) {
      setNow(getNowFromSearch(sp, client.timezone));
      setHasOverride(true);
    }
  }, [client.timezone]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [outgoingIdx, setOutgoingIdx] = useState<number | null>(null);
  const [transitionKind, setTransitionKind] = useState<TransitionKind>('cut');
  /** Cuando es true, los effects de dayparting/filter no resetean el
   *  currentIdx automáticamente — el operator está navegando manualmente
   *  desde el editor y queremos respetarlo aunque el slide esté fuera de
   *  schedule. Se desactiva al primer auto-advance natural. */
  const manualOverrideRef = useRef(false);

  const cleanupTimerRef = useRef<number | null>(null);
  const tickTimerRef = useRef<number | null>(null);

  // Listener para jump-slide del editor (signage:jump-slide). Permite que el
  // operator click en un slide de la playlist y el preview salte ahí sin
  // esperar al ciclo natural. Sin animación de transición — es navegación.
  useEffect(() => {
    function handler(event: MessageEvent) {
      const data = event.data as {
        type?: string;
        slideId?: string;
        direction?: 'prev' | 'next';
      } | null;
      if (!data) return;
      if (data.type === 'signage:jump-slide' && data.slideId) {
        const idx = playlist.findIndex((s) => s.id === data.slideId);
        if (idx >= 0) {
          if (cleanupTimerRef.current !== null) {
            window.clearTimeout(cleanupTimerRef.current);
            cleanupTimerRef.current = null;
          }
          manualOverrideRef.current = true;
          setOutgoingIdx(null);
          setTransitionKind('cut');
          setCurrentIdx(idx);
        }
      } else if (data.type === 'signage:nav-slide' && data.direction) {
        if (cleanupTimerRef.current !== null) {
          window.clearTimeout(cleanupTimerRef.current);
          cleanupTimerRef.current = null;
        }
        manualOverrideRef.current = true;
        setOutgoingIdx(null);
        setTransitionKind('cut');
        setCurrentIdx((idx) => {
          const len = playlist.length;
          if (len === 0) return 0;
          return data.direction === 'next' ? (idx + 1) % len : (idx - 1 + len) % len;
        });
      }
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [playlist]);

  // Emite `signage:slide-active` al parent cuando cambia el slide activo.
  // Solo se dispara cuando el slideId / index / total realmente cambian
  // (comparación por valor primitivo, no por referencia del slide object,
  // que se recrea en cada render por el merge clientPatch/displayPatch).
  const currentSlide = playlist[currentIdx];
  const activeSlideId = currentSlide?.id ?? null;
  const activeTemplateId = currentSlide?.templateId ?? null;
  const playlistLength = playlist.length;
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.parent === window) return;
    if (!activeSlideId) return;
    try {
      window.parent.postMessage(
        {
          type: 'signage:slide-active',
          slideId: activeSlideId,
          index: currentIdx,
          total: playlistLength,
          templateId: activeTemplateId,
        },
        '*',
      );
    } catch {
      // ignored
    }
  }, [activeSlideId, currentIdx, playlistLength, activeTemplateId]);

  // Re-evaluación cada minuto del wall-clock. Aligned al boundary del minuto
  // exacto para evitar drift de 30s. Si hay dev override la evaluación se
  // congela (no cambia hasta que el usuario refresque la URL).
  useEffect(() => {
    if (hasOverride) return;
    let cancelled = false;

    function schedule() {
      const delay = msUntilNextMinute(new Date());
      tickTimerRef.current = window.setTimeout(() => {
        if (cancelled) return;
        setNow(new Date());
        schedule();
      }, delay);
    }

    schedule();

    return () => {
      cancelled = true;
      if (tickTimerRef.current !== null) {
        window.clearTimeout(tickTimerRef.current);
        tickTimerRef.current = null;
      }
    };
  }, [hasOverride]);

  // `effectivePlaylist` filtrada por dayparting. useMemo para que el setTimeout
  // de avance no se reagende a cada render irrelevante.
  const effectivePlaylist = useMemo(
    () => playlist.filter((s) => isSlideActive(s.schedule, now, client.timezone)),
    [playlist, now, client.timezone],
  );

  // Si la `effectivePlaylist` cambia y el `currentIdx` queda out of bounds o
  // apunta a otro slide, re-anclar al primer slide activo (o 0 si vaciamos).
  // Comparamos por id para mantener el slide visible si sigue activo aunque
  // su índice haya cambiado por filtrado.
  const currentSlideId = playlist[currentIdx]?.id;
  useEffect(() => {
    // Operator manual override (jump/nav desde editor): respetar siempre,
    // aunque el slide esté fuera de schedule.
    if (manualOverrideRef.current) return;
    if (effectivePlaylist.length === 0) {
      if (currentIdx !== 0) setCurrentIdx(0);
      return;
    }
    const stillActive = effectivePlaylist.some((s) => s.id === currentSlideId);
    if (!stillActive) {
      // El slide actual salió de schedule: jump al primer activo (sin animación).
      const firstActiveOriginalIdx = playlist.findIndex((s) => s.id === effectivePlaylist[0]?.id);
      if (firstActiveOriginalIdx >= 0 && firstActiveOriginalIdx !== currentIdx) {
        if (cleanupTimerRef.current !== null) {
          window.clearTimeout(cleanupTimerRef.current);
          cleanupTimerRef.current = null;
        }
        setOutgoingIdx(null);
        setTransitionKind('cut');
        setCurrentIdx(firstActiveOriginalIdx);
      }
    }
  }, [effectivePlaylist, playlist, currentIdx, currentSlideId]);

  const slide = playlist[currentIdx];
  const duration = slide?.durationMs ?? settings.defaultDurationMs;

  // Avance automático del slide. Solo agenda si hay 2+ slides activos.
  // Cuando hay manual override (jump del editor), pausa el auto-advance
  // hasta que el operator vuelva a navegar — facilita el preview/QA del
  // slide concreto sin que se vaya solo.
  useEffect(() => {
    if (effectivePlaylist.length <= 1) return;
    if (manualOverrideRef.current) return;
    const tickId = window.setTimeout(() => {
      // Buscar el siguiente slide ACTIVO en la playlist original, partiendo
      // del current. Esto preserva el orden original entre slides activos.
      let nextIdx = (currentIdx + 1) % playlist.length;
      let safetyHops = 0;
      while (
        safetyHops < playlist.length &&
        !effectivePlaylist.some((s) => s.id === playlist[nextIdx]?.id)
      ) {
        nextIdx = (nextIdx + 1) % playlist.length;
        safetyHops += 1;
      }
      if (safetyHops >= playlist.length) return; // ningún activo (no debería pasar aquí).

      const nextSlide = playlist[nextIdx];
      const kind: TransitionKind = (nextSlide?.transition ??
        settings.defaultTransition) as TransitionKind;

      if (cleanupTimerRef.current !== null) {
        window.clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }

      setTransitionKind(kind);
      if (kind === 'cut') {
        setOutgoingIdx(null);
        setCurrentIdx(nextIdx);
      } else {
        setOutgoingIdx(currentIdx);
        setCurrentIdx(nextIdx);
        const animMs = TRANSITION_DURATION_MS[kind] + 50;
        cleanupTimerRef.current = window.setTimeout(() => {
          setOutgoingIdx(null);
          cleanupTimerRef.current = null;
        }, animMs);
      }
    }, duration);

    return () => {
      window.clearTimeout(tickId);
    };
  }, [currentIdx, duration, playlist, effectivePlaylist, settings.defaultTransition]);

  // Cleanup global en unmount.
  useEffect(() => {
    return () => {
      if (cleanupTimerRef.current !== null) {
        window.clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }
      if (tickTimerRef.current !== null) {
        window.clearTimeout(tickTimerRef.current);
        tickTimerRef.current = null;
      }
    };
  }, []);

  if (playlist.length === 0) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-signage-surface text-signage-text-muted"
        aria-hidden="true"
      >
        <div className="text-center">
          <p className="text-2xl font-medium">{t('signage.runtime.no_slides.title')}</p>
          <p className="mt-2 text-base">
            {t('signage.runtime.no_slides.body').replace('{display}', display.slug)}
          </p>
        </div>
      </div>
    );
  }

  if (effectivePlaylist.length === 0) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-signage-surface text-signage-text-muted"
        aria-hidden="true"
      >
        <div className="text-center">
          <p className="text-2xl font-medium">{t('signage.runtime.no_active.title')}</p>
          <p className="mt-2 text-base">{t('signage.runtime.no_active.body')}</p>
        </div>
      </div>
    );
  }

  if (!slide) {
    return null;
  }

  const outgoingSlide = outgoingIdx !== null ? playlist[outgoingIdx] : null;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {outgoingSlide ? (
        <SlideHost
          key={`outgoing-${outgoingSlide.id}-${outgoingIdx}`}
          slide={outgoingSlide}
          client={client}
          display={display}
          animationClass={EXIT_CLASS[transitionKind]}
        />
      ) : null}
      <SlideHost
        key={`current-${slide.id}-${currentIdx}`}
        slide={slide}
        client={client}
        display={display}
        animationClass={transitionKind === 'cut' ? '' : ENTER_CLASS[transitionKind]}
      />
    </div>
  );
}

interface SlideHostProps {
  slide: SignageSlide;
  client: SignageClientResolved;
  display: SignageDisplayConfig;
  animationClass: string;
}

function SlideHost({ slide, client, display, animationClass }: SlideHostProps) {
  const t = useSignageT();
  const template = getTemplate(slide.templateId);
  if (!template) {
    return (
      <div
        className={`signage-transition-host ${animationClass} flex items-center justify-center bg-signage-destructive text-signage-text-on-brand`}
        aria-hidden="true"
      >
        <div className="text-center">
          <p className="text-2xl font-medium">{t('signage.runtime.unknown_template.title')}</p>
          <p className="mt-2 font-mono text-base">{slide.templateId}</p>
        </div>
      </div>
    );
  }

  const { Render } = template;
  return (
    <div className={`signage-transition-host ${animationClass}`} aria-hidden="true">
      <Render slots={slide.slots} client={client} display={display} />
    </div>
  );
}
