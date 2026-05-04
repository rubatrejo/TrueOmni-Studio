'use client';

/**
 * Barra de controles inferior del reader:
 *   [1/68]  [⊞]  [=======●=======]  [−]  [+]
 *
 * - Counter izq "current/total".
 * - Botón ⊞ (grid overview): abre vista con todas las páginas.
 * - Slider de página (seek 1..total).
 * - Botones `−` / `+` zoom out / in.
 */
export function BrochureReaderControls({
  currentPage,
  totalPages,
  zoom,
  minZoom,
  maxZoom,
  onSeek,
  onZoomIn,
  onZoomOut,
  onOpenGrid,
}: {
  currentPage: number;
  totalPages: number;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  onSeek: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onOpenGrid: () => void;
}) {
  const canZoomIn = zoom < maxZoom;
  const canZoomOut = zoom > minZoom;

  return (
    <div
      className="flex items-center"
      style={{
        width: '1080px',
        height: '132px',
        backgroundColor: '#1f1f22',
        padding: '0 34px',
        columnGap: '28px',
        flexShrink: 0,
      }}
    >
      <span
        className="font-sans"
        style={{
          fontSize: '26px',
          lineHeight: '26px',
          color: '#ffffff',
          fontWeight: 700,
          minWidth: '120px',
        }}
      >
        {currentPage}/{totalPages}
      </span>

      <button
        type="button"
        onClick={onOpenGrid}
        aria-label="Ver todas las páginas"
        className="flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '10px',
          backgroundColor: 'rgba(255,255,255,0.12)',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden>
          <rect x="3" y="3" width="8" height="8" rx="1" fill="#ffffff" />
          <rect x="13" y="3" width="8" height="8" rx="1" fill="#ffffff" />
          <rect x="3" y="13" width="8" height="8" rx="1" fill="#ffffff" />
          <rect x="13" y="13" width="8" height="8" rx="1" fill="#ffffff" />
        </svg>
      </button>

      <input
        type="range"
        min={1}
        max={Math.max(1, totalPages)}
        value={currentPage}
        onChange={(e) => onSeek(Number(e.currentTarget.value))}
        aria-label="Ir a página"
        style={{ flex: 1, accentColor: 'hsl(var(--brand-secondary))', height: '10px' }}
      />

      <button
        type="button"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        aria-label="Alejar"
        className="flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '32px',
          backgroundColor: canZoomOut ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
          color: '#fff',
          opacity: canZoomOut ? 1 : 0.4,
          cursor: canZoomOut ? 'pointer' : 'not-allowed',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
          <path d="M5 12h14" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        aria-label="Acercar"
        className="flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '32px',
          backgroundColor: canZoomIn ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
          color: '#fff',
          opacity: canZoomIn ? 1 : 0.4,
          cursor: canZoomIn ? 'pointer' : 'not-allowed',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
