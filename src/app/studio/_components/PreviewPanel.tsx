'use client';

import { Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Live Preview Panel.
 *
 * Carga el kiosk runtime en un iframe escalado al área disponible.
 * El bridge `usePreviewBridge()` (vivido en el Shell) envía postMessage
 * al iframe en cada cambio del editor. Aquí solo asignamos la `iframeRef`
 * y notificamos `onLoad` para que el bridge pueda re-handshake al
 * cambiar de orientación / reload.
 */
export function PreviewPanel({
  slug,
  nombre,
  reloadKey,
  iframeRef,
  onIframeLoad,
}: {
  slug: string;
  nombre: string;
  reloadKey: number;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  onIframeLoad?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.36);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Auto-fit del kiosk dentro del area disponible.
  useEffect(() => {
    function fit() {
      const el = containerRef.current?.parentElement;
      if (!el) return;
      const padding = 56;
      const availH = el.clientHeight - padding * 2;
      const availW = el.clientWidth - padding * 2;
      const wantedW = orientation === 'portrait' ? 1080 : 1920;
      const wantedH = orientation === 'portrait' ? 1920 : 1080;
      const next = Math.min(availH / wantedH, availW / wantedW);
      setScale(Math.min(next, 0.65));
    }
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [orientation]);

  const w = orientation === 'portrait' ? 1080 : 1920;
  const h = orientation === 'portrait' ? 1920 : 1080;
  // Apuntamos a la raíz del kiosk (`/`), que es el Billboard idle / splash —
  // la primera pantalla que ve el usuario antes de tocar y entrar a /home.
  // Fase S0 lo cambiará por `/preview/${client.slug}`.
  const previewSrc = '/';

  return (
    <div className="flex h-full w-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between px-6 pb-3 pt-4">
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-900 dark:bg-zinc-950">
          <DeviceTab
            active={orientation === 'portrait'}
            onClick={() => setOrientation('portrait')}
            icon={<KioskGlyph />}
            label="Kiosk · 1080×1920"
          />
          <DeviceTab
            active={orientation === 'landscape'}
            onClick={() => setOrientation('landscape')}
            icon={<LandscapeGlyph />}
            label="Landscape · 1920×1080"
          />
        </div>

        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <span className="rounded border border-zinc-200 bg-white px-2 py-0.5 font-mono dark:border-zinc-900 dark:bg-zinc-950">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            aria-label="Reset zoom"
            onClick={() => setScale(0.36)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            aria-label="Zoom out"
            onClick={() => setScale((s) => Math.max(0.15, s - 0.05))}
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            aria-label="Zoom in"
            onClick={() => setScale((s) => Math.min(1, s + 0.05))}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Frame holder: ÚNICAMENTE el iframe escalado, sin chrome (no border, no
          rounded, no shadow, no bg propio). El kiosk de /home renderiza ya con
          su propio fondo, así que cualquier wrapper extra mete artefactos. */}
      <div className="flex flex-1 items-center justify-center overflow-hidden p-6">
        <div
          ref={containerRef}
          className="relative overflow-hidden"
          style={{
            width: w * scale,
            height: h * scale,
          }}
        >
          <iframe
            ref={iframeRef}
            key={`${slug}-${orientation}-${reloadKey}`}
            src={previewSrc}
            title={`${nombre} live preview`}
            className="absolute left-0 top-0 block border-0"
            style={{
              width: w,
              height: h,
              transform: `scale(${scale})`,
              transformOrigin: '0 0',
            }}
            loading="eager"
            onLoad={onIframeLoad}
          />
        </div>
      </div>

      {/* Footer caption */}
      <div className="flex shrink-0 items-center justify-between border-t border-zinc-200 px-6 py-2.5 text-[11px] text-zinc-500 dark:border-zinc-900 dark:text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />
          Live preview · debounced 120 ms · postMessage bridge
        </span>
        <span className="font-mono">/preview/{slug}</span>
      </div>
    </div>
  );
}

function DeviceTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
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
    </button>
  );
}

function KioskGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="1.5" width="8" height="13" rx="1.2" />
      <line x1="6.8" y1="13" x2="9.2" y2="13" />
    </svg>
  );
}

function LandscapeGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="4" width="13" height="8" rx="1.2" />
      <line x1="13" y1="6.8" x2="13" y2="9.2" />
    </svg>
  );
}
