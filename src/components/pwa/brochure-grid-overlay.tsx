'use client';

import type { PDFDocumentProxy } from 'pdfjs-dist';

import { BrochurePdfPage } from '@/components/digital-brochure/brochure-pdf-page';
import { useEscapeToClose } from '@/components/listings/use-escape-to-close';

const READER_BG = 'hsl(var(--pwa-reader-bg))';
const OPEN_SANS = 'var(--font-open-sans)';

/**
 * Overlay de miniaturas del reader (móvil) — grid de 2 columnas con todas las
 * páginas del PDF; tap salta a la página. Réplica mobile del `BrochureGridOverview`
 * del kiosk (que es 4-col fullscreen y no escala a 390px). Reusa `BrochurePdfPage`
 * a escala baja para los thumbnails.
 */
export function BrochureGridOverlay({
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
  if (!open) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="absolute inset-0 z-50 flex flex-col" style={{ backgroundColor: READER_BG }}>
      <div className="relative flex h-12 shrink-0 items-center justify-center">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute flex h-9 w-9 items-center justify-center rounded-full"
          style={{ right: 12, backgroundColor: 'hsl(0 0% 100% / 0.15)' }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="scrollbar-hide flex-1 overflow-y-auto px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onSelect(p)}
              className="relative flex items-center justify-center overflow-hidden rounded-[4px]"
              style={{ backgroundColor: 'hsl(0 0% 100% / 0.06)', aspectRatio: '0.707' }}
            >
              <BrochurePdfPage
                pdf={pdf}
                pageNumber={p}
                scale={0.3}
                className="flex h-full w-full items-center justify-center"
              />
              <span
                className="absolute bottom-1 left-1 rounded px-1.5 py-0.5"
                style={{
                  fontSize: 10,
                  color: '#fff',
                  backgroundColor: 'hsl(0 0% 0% / 0.55)',
                  fontFamily: OPEN_SANS,
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
