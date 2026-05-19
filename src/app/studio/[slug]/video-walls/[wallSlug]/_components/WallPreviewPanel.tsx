'use client';

import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minus,
  Monitor,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';

import {
  canvasDimensionsOf,
  GRID_CONFIG_IDS,
  GRID_CONFIGS,
  type GridConfig,
} from '@/lib/video-walls/dimensions';
import type { VideoWallSlide } from '@/lib/video-walls/schema';

/**
 * <WallPreviewPanel> — clone visual del SignagePreviewPanel del DD.
 *
 * Toolbar igual: device pill (con el grid actual) + zoom +/- + reset +
 * full screen + open in new tab. Holder centrado con iframe escalado
 * via `transform: scale()` sobre la bounding box del canvas total.
 *
 * Diferencia vs signage: en lugar de toggle landscape/portrait, hay un
 * selector visual de celda (full canvas + N botones row,col). El crop
 * por celda se aplica con `?cell=row,col` en la URL del iframe.
 */
export interface WallPreviewPanelProps {
  clientSlug: string;
  wallSlug: string;
  wallName: string;
  grid: GridConfig;
  reloadKey: number;
  /** Playlist completa para el slide navigator pill. */
  slides: VideoWallSlide[];
  /** Índice del slide activo en el preview (0-based). */
  currentSlideIndex: number;
  /** Navegar prev/next desde el pill. */
  onNavSlide: (direction: 'prev' | 'next') => void;
  /** Ref del iframe gestionado por el bridge live. Si se provee, el host
   *  puede hacer `postMessage` al runtime sin reload (VW9.5). */
  iframeRef?: RefObject<HTMLIFrameElement | null>;
  /** Callback al `load` del iframe para que el bridge resincronice patches
   *  (race condition: el iframe puede no haber montado el listener todavía
   *  cuando el editor empuja el primer cambio). */
  onIframeLoad?: () => void;
  /** Cambia el grid del wall (3x2/4x2/2x2). El shell decide si pedir
   *  confirmación según si hay slides en la playlist activa (los templates
   *  son específicos del grid actual). */
  onGridChange?: (next: GridConfig) => void;
}

export function WallPreviewPanel({
  clientSlug,
  wallSlug,
  wallName,
  grid,
  reloadKey,
  slides,
  currentSlideIndex,
  onNavSlide,
  iframeRef,
  onIframeLoad,
  onGridChange,
}: WallPreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoFit, setAutoFit] = useState(0.1);
  const [userZoom, setUserZoom] = useState(1);
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const [showBezels, setShowBezels] = useState(true);
  const [fullScreen, setFullScreen] = useState(false);
  const [gridMenuOpen, setGridMenuOpen] = useState(false);
  const gridMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridMenuOpen) return;
    function onClick(e: MouseEvent) {
      if (!gridMenuRef.current) return;
      if (!gridMenuRef.current.contains(e.target as Node)) setGridMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setGridMenuOpen(false);
    }
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [gridMenuOpen]);

  const { cols, rows } = GRID_CONFIGS[grid];
  const { width: canvasW, height: canvasH } = canvasDimensionsOf(grid);
  const viewportW = focusedCell ? 1920 : canvasW;
  const viewportH = focusedCell ? 1080 : canvasH;
  const scale = autoFit * userZoom;

  // Compute autoFit del holder. Estrategia robusta contra la race
  // condition que antes dejaba el iframe minúsculo cuando el panel se
  // montaba dentro de un tab oculto (display:none → clientWidth=0).
  //
  // Pipeline:
  //  1. useLayoutEffect lee dims DESPUÉS del layout, no antes.
  //  2. Si el holder reporta 0×0 (todavía no laid out), retry vía
  //     requestAnimationFrame hasta que reporte dims válidas.
  //  3. ResizeObserver para tracking continuo de cambios de size.
  //  4. visibilitychange / focus listeners para hidden→visible
  //     transitions que algunos browsers no propagan via RO.
  useLayoutEffect(() => {
    const holder = containerRef.current?.parentElement;
    if (!holder) return;
    let raf: number | undefined;
    const compute = () => {
      const availW = holder.clientWidth;
      // Reserva ~150px para el pill (mt-20 + ~50 height) que vive
      // dentro del holder debajo del container.
      const availH = holder.clientHeight - 150;
      if (availW <= 0 || availH <= 0) {
        raf = requestAnimationFrame(compute);
        return;
      }
      const fit = Math.min(availW / viewportW, availH / viewportH);
      setAutoFit(Math.max(0.02, fit));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(holder);
    const onVis = () => {
      raf = requestAnimationFrame(compute);
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    return () => {
      ro.disconnect();
      if (raf !== undefined) cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onVis);
    };
  }, [viewportW, viewportH]);

  useEffect(() => {
    setUserZoom(1);
  }, [focusedCell, grid]);

  const iframeSrc = useMemo(() => {
    const qs = new URLSearchParams();
    if (focusedCell) qs.set('cell', `${focusedCell.row},${focusedCell.col}`);
    if (!showBezels) qs.set('bezels', '0');
    if (currentSlideIndex > 0) qs.set('slide', String(currentSlideIndex));
    // El editor preview consume KV (donde el operador guarda) — sin
    // `?source=fs` para que los cambios de branding/header/events/social
    // se reflejen al instante en el iframe.
    const tail = qs.toString();
    return `/video-walls/${clientSlug}/${wallSlug}${tail ? `?${tail}` : ''}`;
  }, [clientSlug, wallSlug, focusedCell, showBezels, currentSlideIndex]);

  const activeSlide = slides[currentSlideIndex] ?? null;

  return (
    <div className="flex h-full w-full flex-col">
      {/* Toolbar superior */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-6 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <div className="relative" ref={gridMenuRef}>
            <button
              type="button"
              onClick={() => onGridChange && setGridMenuOpen((v) => !v)}
              disabled={!onGridChange}
              aria-haspopup="menu"
              aria-expanded={gridMenuOpen}
              title={onGridChange ? 'Change grid configuration' : 'Grid configuration (read-only)'}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[12px] text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-default disabled:hover:border-zinc-200 disabled:hover:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 dark:disabled:hover:border-zinc-700 dark:disabled:hover:bg-zinc-950"
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="font-mono">{grid}</span>
              <span className="text-zinc-400">·</span>
              <span className="font-mono text-zinc-500">
                {canvasW}×{canvasH}
              </span>
              {onGridChange ? <ChevronDown className="h-3 w-3 text-zinc-400" /> : null}
            </button>
            {gridMenuOpen && onGridChange ? (
              <div
                role="menu"
                className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-[200px] overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
              >
                <div className="border-b border-zinc-100 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800">
                  Grid configuration
                </div>
                {GRID_CONFIG_IDS.map((g) => {
                  const dims = canvasDimensionsOf(g);
                  const isActive = g === grid;
                  return (
                    <button
                      key={g}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isActive}
                      onClick={() => {
                        setGridMenuOpen(false);
                        if (g !== grid) onGridChange(g);
                      }}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-[12px] transition ${
                        isActive
                          ? 'bg-sky-50 text-sky-900 dark:bg-sky-500/10 dark:text-sky-200'
                          : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <span className="font-mono font-medium">{g}</span>
                      <span className="font-mono text-[11px] text-zinc-500">
                        {dims.width}×{dims.height}
                      </span>
                      {isActive ? (
                        <Check className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                      ) : (
                        <span className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11.5px] text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={showBezels}
              onChange={(e) => setShowBezels(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            Bezels
          </label>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-zinc-500">
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            aria-label="Zoom out 10%"
            disabled={userZoom <= 0.4}
            onClick={() => setUserZoom((z) => Math.max(0.4, Math.round((z - 0.1) * 100) / 100))}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="min-w-[44px] rounded border border-zinc-200 bg-white px-2 py-0.5 text-center font-mono text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
            aria-label="Reset zoom to fit"
            title="Reset zoom to fit"
            onClick={() => setUserZoom(1)}
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            aria-label="Zoom in 10%"
            disabled={userZoom >= 3}
            onClick={() => setUserZoom((z) => Math.min(3, Math.round((z + 0.1) * 100) / 100))}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="ml-1 grid h-7 w-7 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            aria-label="Reload preview"
            title="Reload iframe"
            onClick={() => window.location.reload()}
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

      {fullScreen ? (
        <FullScreenWallPreview
          iframeSrc={iframeSrc}
          wallName={wallName}
          viewportW={viewportW}
          viewportH={viewportH}
          onClose={() => setFullScreen(false)}
        />
      ) : null}

      {/* Cell selector */}
      <div className="flex items-center gap-3 border-y border-zinc-200 bg-zinc-50 px-6 py-2 dark:border-zinc-800 dark:bg-zinc-900/40">
        <span className="text-[11px] uppercase tracking-wider text-zinc-500">View</span>
        <button
          type="button"
          onClick={() => setFocusedCell(null)}
          className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-medium transition ${
            focusedCell === null
              ? 'border-sky-500 bg-sky-50 text-sky-900 dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-200'
              : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900'
          }`}
        >
          <Maximize className="h-3 w-3" />
          Full canvas
        </button>
        <div
          className="inline-grid gap-0.5 rounded border border-zinc-200 bg-zinc-200 p-0.5 dark:border-zinc-700 dark:bg-zinc-800"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((__, c) => {
              const active = focusedCell?.row === r && focusedCell?.col === c;
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => setFocusedCell({ row: r, col: c })}
                  className={`h-7 w-9 font-mono text-[10px] transition ${
                    active
                      ? 'bg-sky-500 text-white'
                      : 'bg-white text-zinc-500 hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-500 dark:hover:bg-zinc-900'
                  }`}
                  title={`Cell ${r},${c}`}
                >
                  {r},{c}
                </button>
              );
            }),
          )}
        </div>
      </div>

      {/* Stage holder. Wall card sized al aspect del wall (autoFit*viewport).
          Pill abajo con mt-20. items-center/justify-center mantienen ambos
          centrados sin stretching. */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-zinc-100 dark:bg-zinc-950/60">
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-lg border border-zinc-300 bg-black shadow-xl dark:border-zinc-700"
          style={{
            width: viewportW * scale,
            height: viewportH * scale,
          }}
        >
          <iframe
            key={`${reloadKey}-${currentSlideIndex}`}
            ref={iframeRef}
            src={iframeSrc}
            title={`Preview ${wallName}`}
            onLoad={onIframeLoad}
            className="absolute left-0 top-0"
            style={{
              width: viewportW,
              height: viewportH,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              border: 0,
            }}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>

        {/* Slide navigator pill — 80px debajo del iframe (igual que DD). */}
        {slides.length > 0 ? (
          <div className="mt-20 inline-flex items-center gap-3 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500 to-sky-600 px-3 py-2 shadow-lg shadow-sky-500/20 dark:border-sky-400/40 dark:from-sky-500 dark:to-sky-700 dark:shadow-sky-500/30">
            <button
              type="button"
              onClick={() => onNavSlide('prev')}
              aria-label="Previous slide"
              title="Previous slide"
              disabled={slides.length <= 1}
              className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-white transition hover:bg-white/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <div className="flex min-w-[200px] flex-col items-center gap-0.5 px-3 text-center">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                Slide {currentSlideIndex + 1} / {slides.length}
              </span>
              {activeSlide?.templateId ? (
                <span className="font-display text-[14px] font-semibold leading-tight text-white">
                  {labelFromTemplate(activeSlide.templateId)}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onNavSlide('next')}
              aria-label="Next slide"
              title="Next slide"
              disabled={slides.length <= 1}
              className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-white transition hover:bg-white/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-zinc-200 bg-white px-6 py-2 text-[11px] text-zinc-500 dark:border-zinc-900 dark:bg-zinc-950">
        <span className="font-mono">
          {focusedCell
            ? `cell ${focusedCell.row},${focusedCell.col} · 1920×1080`
            : `full canvas · ${canvasW}×${canvasH}`}
        </span>
        <span className="font-mono">{iframeSrc}</span>
      </div>
    </div>
  );
}

function FullScreenWallPreview({
  iframeSrc,
  wallName,
  viewportW,
  viewportH,
  onClose,
}: {
  iframeSrc: string;
  wallName: string;
  viewportW: number;
  viewportH: number;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function fit() {
      const padding = 80;
      const availH = window.innerHeight - padding * 2;
      const availW = window.innerWidth - padding * 2;
      setScale(Math.min(availH / viewportH, availW / viewportW, 1));
    }
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [viewportW, viewportH]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Full screen preview of ${wallName}`}
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
        className="relative overflow-hidden shadow-2xl"
        style={{
          width: viewportW * scale,
          height: viewportH * scale,
          backgroundColor: '#000',
        }}
      >
        <iframe
          src={iframeSrc}
          title={`${wallName} full screen`}
          className="absolute left-0 top-0 block border-0"
          style={{
            width: viewportW,
            height: viewportH,
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
          }}
          allow="autoplay; fullscreen"
          loading="eager"
        />
      </div>
      <span className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[11.5px] text-zinc-500 dark:text-zinc-500">
        {wallName} · {viewportW}×{viewportH} · {Math.round(scale * 100)}% · ESC to close
      </span>
    </div>
  );
}

/** Stringify del templateId para mostrar en el pill. `02-video-image-ad`
 *  → "Video + Ad". Replica el patrón signage `labelFromTemplate`. */
function labelFromTemplate(templateId: string): string {
  // Quita prefijo numérico opcional ("02-").
  const stripped = templateId.replace(/^\d+-/, '');
  return stripped
    .split('-')
    .map((part) => {
      if (part === 'video' || part === 'image') return 'Video/Image';
      if (part === 'ad' || part === 'ads') return 'Ad';
      if (part === 'social' || part === 'wall') return 'Social';
      if (part === 'events') return 'Events';
      if (part === 'full') return 'Full';
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .filter((s, i, arr) => arr.indexOf(s) === i)
    .join(' + ');
}
