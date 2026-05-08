'use client';

import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Maximize,
  Minus,
  Monitor,
  Plus,
  RotateCcw,
  Smartphone,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';

import type { SignageActiveSlide } from '../../_lib/use-signage-bridge';

interface DeviceFormat {
  key: 'digital-display' | 'kiosk-portrait';
  label: string;
  width: number;
  height: number;
  glyph: 'tv' | 'kiosk';
  available: boolean;
}

const DEVICE_FORMATS: DeviceFormat[] = [
  {
    key: 'digital-display',
    label: 'Digital Display',
    width: 1920,
    height: 1080,
    glyph: 'tv',
    available: true,
  },
  {
    key: 'kiosk-portrait',
    label: 'Kiosk Portrait',
    width: 1080,
    height: 1920,
    glyph: 'kiosk',
    available: false, // se habilita cuando esté el runtime portrait.
  },
];

/**
 * `<SignagePreviewPanel>` — preview live del runtime signage en landscape
 * 1920×1080 escalado al área disponible.
 *
 * Mismo lenguaje visual que `<PreviewPanel>` del kiosk:
 *  - Toolbar con device pill (Digital Display TV) + zoom +/- + reset + Full screen.
 *  - Holder centrado con el iframe escalado vía `transform: scale()` sobre la
 *    bounding box natural 1920×1080.
 *  - Footer con bridge state + ruta del runtime.
 *
 * Si no hay displays, muestra placeholder coherente con el resto de placeholders
 * "coming soon" del Studio.
 */
export interface SignagePreviewPanelProps {
  clientSlug: string;
  displaySlug: string | null;
  displayName: string | null;
  reloadKey: number;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  onIframeLoad: () => void;
  onReload: () => void;
  activeSlide?: SignageActiveSlide | null;
  onNavSlide?: (direction: 'prev' | 'next') => void;
}

export function SignagePreviewPanel({
  clientSlug,
  displaySlug,
  displayName,
  reloadKey,
  iframeRef,
  onIframeLoad,
  onReload,
  activeSlide,
  onNavSlide,
}: SignagePreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [fullScreen, setFullScreen] = useState(false);
  const [formatKey, setFormatKey] =
    useState<DeviceFormat['key']>('digital-display');
  const format =
    DEVICE_FORMATS.find((f) => f.key === formatKey) ?? DEVICE_FORMATS[0];

  useEffect(() => {
    const holder = containerRef.current?.parentElement;
    if (!holder) return;
    const padding = 24;
    const compute = () => {
      const availW = holder.clientWidth - padding * 2;
      const availH = holder.clientHeight - padding * 2;
      if (availW <= 0 || availH <= 0) return;
      const fit = Math.min(availW / format.width, availH / format.height);
      setScale(Math.min(0.6, Math.max(0.15, fit)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(holder);
    return () => ro.disconnect();
  }, [format.width, format.height]);

  if (!displaySlug) {
    return <NoDisplaysState clientSlug={clientSlug} />;
  }

  const runtimeUrl = `/signage/${clientSlug}/${displaySlug}`;

  return (
    <div className="flex h-full w-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-6 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-900 dark:bg-zinc-950">
            {DEVICE_FORMATS.map((f) => (
              <DeviceTab
                key={f.key}
                active={formatKey === f.key}
                onClick={() => setFormatKey(f.key)}
                icon={f.glyph === 'tv' ? <TvGlyph /> : <KioskGlyph />}
                label={`${f.label} · ${f.width}×${f.height}`}
                badge={!f.available ? 'Soon' : undefined}
              />
            ))}
          </div>

        </div>

        <div className="flex items-center gap-1 text-[11px] text-zinc-500">
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            aria-label="Zoom out 10%"
            disabled={scale <= 0.15}
            onClick={() =>
              setScale((s) => Math.max(0.15, Math.round((s - 0.1) * 100) / 100))
            }
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[44px] rounded border border-zinc-200 bg-white px-2 py-0.5 text-center font-mono dark:border-zinc-900 dark:bg-zinc-950">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            aria-label="Zoom in 10%"
            disabled={scale >= 1}
            onClick={() =>
              setScale((s) => Math.min(1, Math.round((s + 0.1) * 100) / 100))
            }
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="ml-1 grid h-7 w-7 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            aria-label="Reload preview"
            title="Reload iframe"
            onClick={onReload}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="ml-1 inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
            aria-label="Open in full screen"
            onClick={() => setFullScreen(true)}
          >
            <Maximize className="h-3.5 w-3.5" />
            Full screen
          </button>
        </div>
      </div>

      {/* Frame holder + nav controls (80px below iframe) */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-hidden p-6">
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-lg shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800"
          style={{
            width: format.width * scale,
            height: format.height * scale,
            backgroundColor: '#000',
          }}
        >
          <iframe
            ref={iframeRef}
            key={`${clientSlug}-${displaySlug}-${reloadKey}-${formatKey}`}
            src={runtimeUrl}
            title={`${displayName ?? displaySlug} live preview`}
            className="absolute left-0 top-0 block border-0"
            style={{
              width: format.width,
              height: format.height,
              transform: `scale(${scale})`,
              transformOrigin: '0 0',
            }}
            allow="autoplay; fullscreen"
            loading="eager"
            onLoad={onIframeLoad}
          />
          {!format.available ? (
            <div className="absolute inset-0 grid place-items-center bg-zinc-950/90 text-center">
              <div className="max-w-[320px] px-6">
                <Smartphone className="mx-auto h-10 w-10 text-zinc-500" strokeWidth={1.5} />
                <p className="mt-3 font-display text-[15px] font-semibold text-white">
                  Kiosk Portrait coming soon
                </p>
                <p className="mt-1 text-[12.5px] text-zinc-400">
                  El runtime portrait 1080×1920 está en desarrollo. Mientras tanto, puedes editar el contenido y publicarlo — al activarse, se renderizará automáticamente en kioskos verticales.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Nav controls — 80px debajo del iframe, grande y colorido. */}
        {onNavSlide ? (
          <div className="mt-20 inline-flex items-center gap-3 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500 to-sky-600 px-3 py-2 shadow-lg shadow-sky-500/20 dark:border-sky-400/40 dark:from-sky-500 dark:to-sky-700 dark:shadow-sky-500/30">
            <button
              type="button"
              onClick={() => onNavSlide('prev')}
              aria-label="Previous slide"
              title="Previous slide"
              className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-white transition hover:bg-white/30 active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <div className="flex min-w-[180px] flex-col items-center gap-0.5 px-3 text-center">
              {activeSlide ? (
                <>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                    Slide {activeSlide.index + 1} / {activeSlide.total}
                  </span>
                  {activeSlide.templateId ? (
                    <span className="font-display text-[14px] font-semibold leading-tight text-white">
                      {labelFromTemplate(activeSlide.templateId)}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="font-mono text-[12px] text-white/60">—</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onNavSlide('next')}
              aria-label="Next slide"
              title="Next slide"
              className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-white transition hover:bg-white/30 active:scale-95"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        ) : null}
      </div>

      {/* Footer caption */}
      <div className="flex shrink-0 items-center justify-between border-t border-zinc-200 px-6 py-2.5 text-[11px] text-zinc-500 dark:border-zinc-900 dark:text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />
          Live preview · debounced 120 ms · postMessage bridge
        </span>
        <a
          href={runtimeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono transition hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          {runtimeUrl}
          <ExternalLink className="h-3 w-3" strokeWidth={2} />
        </a>
      </div>

      {fullScreen ? (
        <FullScreenPreview
          clientSlug={clientSlug}
          displaySlug={displaySlug}
          displayName={displayName}
          onClose={() => setFullScreen(false)}
        />
      ) : null}
    </div>
  );
}

function NoDisplaysState({ clientSlug }: { clientSlug: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
        <Monitor className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <h3 className="font-display text-base font-semibold text-zinc-900 dark:text-white">
        No displays in this theme yet
      </h3>
      <p className="max-w-sm text-[13px] text-zinc-500">
        Crea un display dentro del theme{' '}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11.5px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          {clientSlug}
        </code>{' '}
        para ver aquí el live preview escalado a 1920×1080.
      </p>
    </div>
  );
}

function FullScreenPreview({
  clientSlug,
  displaySlug,
  displayName,
  onClose,
}: {
  clientSlug: string;
  displaySlug: string;
  displayName: string | null;
  onClose: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function fit() {
      const padding = 80;
      const availH = window.innerHeight - padding * 2;
      const availW = window.innerWidth - padding * 2;
      setScale(Math.min(availH / DEVICE_FORMATS[0].height, availW / DEVICE_FORMATS[0].width, 1));
    }
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const url = `/signage/${clientSlug}/${displaySlug}`;
  const label = displayName ?? displaySlug;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Full screen preview of ${label}`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-100 dark:bg-zinc-950"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute left-6 top-6 z-10 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-[13px] font-medium text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <span aria-hidden="true">←</span>
        Back to editor
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close full screen"
        className="absolute right-6 top-6 z-10 grid h-9 w-9 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <X className="h-4 w-4" />
      </button>

      <div
        ref={wrapRef}
        className="relative overflow-hidden shadow-2xl"
        style={{ width: DEVICE_FORMATS[0].width * scale, height: DEVICE_FORMATS[0].height * scale, backgroundColor: '#000' }}
      >
        <iframe
          src={url}
          title={`${label} full screen`}
          className="absolute left-0 top-0 block border-0"
          style={{
            width: DEVICE_FORMATS[0].width,
            height: DEVICE_FORMATS[0].height,
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
          }}
          allow="autoplay; fullscreen"
          loading="eager"
        />
      </div>

      <span className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[11.5px] text-zinc-500 dark:text-zinc-500">
        {label} · {DEVICE_FORMATS[0].width}×{DEVICE_FORMATS[0].height} · {Math.round(scale * 100)}% · ESC to close
      </span>
    </div>
  );
}

/** "01-full-events" → "Full + Events" — mismo estilo que el playlist row. */
function labelFromTemplate(templateId: string): string {
  const stripped = templateId.replace(/^\d+[-_]?/, '');
  if (!stripped) return templateId;
  return stripped
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => {
      const m = w.match(/^(\d+)([a-z].+)$/i);
      if (m) {
        return `${m[1]} ${m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase()}`;
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' + ');
}

function DeviceTab({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] transition ${
        active
          ? 'bg-zinc-100 text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
          : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300'
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge ? (
        <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function KioskGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4.5" y="1.5" width="7" height="13" rx="1" />
      <line x1="7" y1="13" x2="9" y2="13" />
    </svg>
  );
}

function TvGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1.5" y="3" width="13" height="9" rx="1" />
      <line x1="6" y1="14" x2="10" y2="14" />
    </svg>
  );
}
