'use client';

import type { PDFDocumentProxy } from 'pdfjs-dist';

import { useEscapeToClose } from '@/components/listings/use-escape-to-close';

import { BrochurePdfPage } from './brochure-pdf-page';

/**
 * Overlay modal con todas las páginas como thumbnails en grid 4 cols.
 * Click en un thumbnail salta a esa página y cierra el overlay.
 */
export function BrochureGridOverview({
  open,
  pdf,
  totalPages,
  onSelect,
  onClose,
}: {
  open: boolean;
  pdf: PDFDocumentProxy | null;
  totalPages: number;
  onSelect: (page: number) => void;
  onClose: () => void;
}) {
  useEscapeToClose(open, onClose);
  if (!open || !pdf) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Todas las páginas"
      className="absolute inset-0"
      style={{ zIndex: 60, backgroundColor: '#1f1f22' }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute flex items-center justify-center text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
        style={{ right: '24px', top: '24px', width: '70px', height: '70px', zIndex: 2 }}
      >
        <svg width="42" height="42" viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="11" fill="none" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M8 8l8 8M16 8l-8 8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <div
        className="scrollbar-hide h-full w-full overflow-y-auto"
        style={{ padding: '110px 40px 40px 40px' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onSelect(p)}
              aria-label={`Ir a página ${p}`}
              className="focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
              style={{ position: 'relative' }}
            >
              <BrochurePdfPage pdf={pdf} pageNumber={p} scale={0.25} />
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  left: '6px',
                  bottom: '6px',
                  minWidth: '28px',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  fontFamily: 'Helvetica, Arial, sans-serif',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {p}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
