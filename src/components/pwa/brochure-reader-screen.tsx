'use client';

import { useRouter } from 'next/navigation';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useEffect, useRef, useState } from 'react';

import { BrochurePdfPage } from '@/components/digital-brochure/brochure-pdf-page';
import type { BrochureItem, PwaDigitalBrochureModuleConfig } from '@/lib/config';
import { loadPdf } from '@/lib/pdfjs-setup';
import { pwaShare } from '@/lib/pwa-share';

import { PwaBottomNav } from './bottom-nav';
import { BrochureGridOverlay } from './brochure-grid-overlay';
import { ShareIconButton } from './share-icon-button';

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;
const FIT_ZOOM = 1;
/**
 * Resolución FIJA del canvas (independiente del zoom). El zoom visual se aplica
 * por ancho (% del stage), no re-renderizando el canvas — así se ve realmente el
 * zoom (con maxWidth:100% el canvas quedaba topado al ancho del contenedor) y el
 * pinch es fluido. 2× da nitidez retina sobre el ancho móvil.
 */
const RENDER_SCALE = 2;
/** Distancia mínima (px) de swipe horizontal para pasar página. */
const SWIPE_THRESHOLD = 45;

const BRAND = 'hsl(var(--brand-primary))';
const READER_BG = 'hsl(var(--pwa-reader-bg))';
const STAGE = 'hsl(var(--pwa-reader-stage))';
const SECONDARY = 'hsl(var(--brand-secondary))';
const OPEN_SANS = 'var(--font-open-sans)';
const WHITE_SOFT = 'hsl(0 0% 100% / 0.15)';
const WHITE_FAINT = 'hsl(0 0% 100% / 0.06)';

/** Flecha circular de navegación (prev/next). */
function NavArrow({
  dir,
  disabled,
  onClick,
}: {
  dir: 'prev' | 'next';
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'prev' ? 'Previous page' : 'Next page'}
      className="absolute top-1/2 z-[3] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full"
      style={{
        [dir === 'prev' ? 'left' : 'right']: 12,
        backgroundColor: BRAND,
        color: '#fff',
        opacity: disabled ? 0.35 : 1,
        boxShadow: '0 4px 12px hsl(0 0% 0% / 0.35)',
      }}
    >
      <svg width={20} height={20} viewBox="0 0 32 32" aria-hidden>
        <path
          d={dir === 'prev' ? 'M20 6l-10 10 10 10' : 'M12 6l10 10-10 10'}
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/**
 * Digital Brochure #2 — reader (`/pwa/digital-brochure/[slug]`). Réplica mobile del
 * `BrochureReader` del kiosk: header (back + título + Share nativo), barra de
 * controles (contador + grid + slider + zoom ±), stage oscuro con la página del PDF
 * (canvas pdf.js reutilizado) + flechas prev/next. Gestos: swipe horizontal para
 * pasar página (cuando no hay zoom) y pinch-to-zoom; pan por scroll del stage.
 * Bottom nav fijo (sin `active`). White-label: textos desde
 * `config.features.pwa.digitalBrochure`; el brochure desde `home.modules`.
 */
export function BrochureReaderScreen({
  brochure,
  texts,
}: {
  brochure: BrochureItem;
  texts: PwaDigitalBrochureModuleConfig;
}) {
  const router = useRouter();
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState<number>(brochure.pageCount);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(FIT_ZOOM);
  const [gridOpen, setGridOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef(zoom);
  const pageRef = useRef({ current: currentPage, total: totalPages });
  zoomRef.current = zoom;
  pageRef.current = { current: currentPage, total: totalPages };

  // Carga del PDF (mismo flujo que el reader del kiosk).
  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setProgress(null);
    setPdf(null);
    (async () => {
      try {
        const doc = await loadPdf(brochure.pdfUrl, (info) => {
          if (!cancelled) setProgress(info);
        });
        if (cancelled) return;
        setPdf(doc);
        setTotalPages(doc.numPages);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Unknown error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brochure.pdfUrl]);

  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNext = () => setCurrentPage((p) => Math.min(pageRef.current.total, p + 1));
  const seek = (p: number) => setCurrentPage(Math.max(1, Math.min(totalPages, p)));
  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));

  // Gestos táctiles (listeners no-pasivos para poder preventDefault en pinch).
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    let pinchStartDist = 0;
    let pinchStartZoom = 1;
    let swipeStartX = 0;
    let swipeStartY = 0;
    let pinching = false;
    let tracking = false;

    const dist = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinching = true;
        tracking = false;
        pinchStartDist = dist(e.touches);
        pinchStartZoom = zoomRef.current;
      } else if (e.touches.length === 1) {
        tracking = true;
        pinching = false;
        swipeStartX = e.touches[0].clientX;
        swipeStartY = e.touches[0].clientY;
      }
    };

    const onMove = (e: TouchEvent) => {
      if (pinching && e.touches.length === 2) {
        e.preventDefault();
        const ratio = dist(e.touches) / (pinchStartDist || 1);
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinchStartZoom * ratio));
        setZoom(+next.toFixed(2));
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (pinching) {
        if (e.touches.length === 0) pinching = false;
        return;
      }
      if (!tracking) return;
      tracking = false;
      // Swipe de página solo cuando NO hay zoom (con zoom, el drag hace pan/scroll).
      if (zoomRef.current > FIT_ZOOM) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - swipeStartX;
      const dy = t.clientY - swipeStartY;
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) goNext();
        else goPrev();
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, []);

  const canZoomIn = zoom < MAX_ZOOM;
  const canZoomOut = zoom > MIN_ZOOM;
  const pct =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.loaded / progress.total) * 100))
      : null;
  const mb = progress ? (progress.loaded / 1024 / 1024).toFixed(1) : null;

  return (
    <div className="relative flex h-full w-full flex-col" style={{ backgroundColor: READER_BG }}>
      {/* Header brand: back + título + share */}
      <div
        className="flex shrink-0 items-center gap-2 px-3 pb-2 pt-11"
        style={{ backgroundColor: BRAND }}
      >
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.push('/pwa/digital-brochure')}
          className="flex h-9 w-8 shrink-0 items-center justify-center text-white"
        >
          <svg width={11} height={19} viewBox="0 0 11.87 20.36" fill="#fff" aria-hidden>
            <path d="M.292,10.946a.975.975,0,0,1,0-1.392L9.537.417a1.456,1.456,0,0,1,2.041,0,1.415,1.415,0,0,1,0,2.016L3.669,10.25l7.909,7.815a1.417,1.417,0,0,1,0,2.017,1.456,1.456,0,0,1-2.041,0Z" />
          </svg>
        </button>
        <span
          className="min-w-0 flex-1 truncate text-center font-bold text-white"
          style={{ fontSize: 16, fontFamily: OPEN_SANS }}
        >
          {brochure.title}
        </span>
        <span className="flex h-9 w-8 shrink-0 items-center justify-center text-white">
          <ShareIconButton
            size={18}
            onShare={() =>
              pwaShare({ title: brochure.title, text: brochure.title, url: brochure.pdfUrl })
            }
          />
        </span>
      </div>

      {/* Barra de controles: contador + grid + slider + zoom ± */}
      <div
        className="flex shrink-0 items-center gap-3 px-4"
        style={{ height: 56, backgroundColor: READER_BG }}
      >
        <span
          className="font-bold text-white"
          style={{ fontSize: 14, fontFamily: OPEN_SANS, minWidth: 52 }}
        >
          {currentPage}/{totalPages}
        </span>
        <button
          type="button"
          onClick={() => setGridOpen(true)}
          aria-label="All pages"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]"
          style={{ backgroundColor: WHITE_SOFT }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
            <rect x="3" y="3" width="8" height="8" rx="1" fill="#fff" />
            <rect x="13" y="3" width="8" height="8" rx="1" fill="#fff" />
            <rect x="3" y="13" width="8" height="8" rx="1" fill="#fff" />
            <rect x="13" y="13" width="8" height="8" rx="1" fill="#fff" />
          </svg>
        </button>
        <input
          type="range"
          min={1}
          max={Math.max(1, totalPages)}
          value={currentPage}
          onChange={(e) => seek(Number(e.currentTarget.value))}
          aria-label="Go to page"
          style={{ flex: 1, accentColor: SECONDARY, height: 22 }}
        />
        <button
          type="button"
          onClick={zoomOut}
          disabled={!canZoomOut}
          aria-label="Zoom out"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: canZoomOut ? WHITE_SOFT : WHITE_FAINT,
            opacity: canZoomOut ? 1 : 0.4,
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
            <path d="M5 12h14" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={zoomIn}
          disabled={!canZoomIn}
          aria-label="Zoom in"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: canZoomIn ? WHITE_SOFT : WHITE_FAINT,
            opacity: canZoomIn ? 1 : 0.4,
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Stage. El zoom escala el ANCHO de la página (% del stage); el canvas se
          renderiza a resolución fija y el stage hace scroll (pan) cuando hay zoom. */}
      <div
        ref={stageRef}
        className="scrollbar-hide relative flex flex-1 overflow-auto"
        style={{ backgroundColor: STAGE, touchAction: 'pan-x pan-y' }}
      >
        {/* Las flechas de página solo cuando NO hay zoom: con zoom el stage hace
            pan y las flechas (pinneadas al viewport) taparían la página. */}
        {zoom <= FIT_ZOOM && (
          <>
            <NavArrow dir="prev" disabled={currentPage <= 1} onClick={goPrev} />
            <NavArrow dir="next" disabled={currentPage >= totalPages} onClick={goNext} />
          </>
        )}

        {loadError ? (
          <div
            className="m-auto px-8 text-center"
            style={{
              color: 'hsl(0 100% 80%)',
              fontSize: 14,
              lineHeight: 1.5,
              fontFamily: OPEN_SANS,
            }}
          >
            {texts.errorTitle}
            <br />
            <span style={{ fontSize: 12, opacity: 0.75 }}>{loadError}</span>
            <br />
            <a
              href={brochure.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block underline"
              style={{ color: SECONDARY, fontSize: 13 }}
            >
              {texts.openPdfDirectly}
            </a>
          </div>
        ) : !pdf ? (
          <div
            className="m-auto px-8 text-center"
            style={{ color: 'hsl(0 0% 85%)', fontFamily: OPEN_SANS, width: 280 }}
          >
            <div style={{ fontSize: 15, marginBottom: 14 }}>
              {texts.loadingLabel}
              {pct !== null ? ` — ${pct}%` : '…'}
            </div>
            {pct !== null && (
              <div
                aria-hidden
                className="overflow-hidden rounded-full"
                style={{ width: '100%', height: 6, backgroundColor: 'hsl(0 0% 100% / 0.1)' }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    backgroundColor: SECONDARY,
                    transition: 'width 120ms linear',
                  }}
                />
              </div>
            )}
            {mb && (
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
                {mb} {texts.mbDownloaded}
              </div>
            )}
          </div>
        ) : (
          // `margin:auto` en flex centra vertical y horizontalmente cuando la página
          // cabe; cuando hay zoom (overflow) permite hacer scroll/pan a todos los bordes.
          <div className="p-3" style={{ width: `${zoom * 100}%`, margin: 'auto' }}>
            <BrochurePdfPage
              pdf={pdf}
              pageNumber={currentPage}
              scale={RENDER_SCALE}
              canvasStyle={{ width: '100%', maxWidth: 'none', height: 'auto', margin: '0 auto' }}
            />
          </div>
        )}
      </div>

      <PwaBottomNav />

      <BrochureGridOverlay
        open={gridOpen}
        pdf={pdf}
        totalPages={totalPages}
        onSelect={(p) => {
          setCurrentPage(p);
          setGridOpen(false);
        }}
        onClose={() => setGridOpen(false)}
      />
    </div>
  );
}
