'use client';

import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useEffect, useState } from 'react';

import { BackButton } from '@/components/listings/back-button';
import { SendConfirmationPopup } from '@/components/listings/send-confirmation-popup';
import { SendToEmailModal } from '@/components/listings/send-to-email-modal';
import { SendToPhoneModal } from '@/components/listings/send-to-phone-modal';
import type { BrochureItem } from '@/lib/config';
import { loadPdf } from '@/lib/pdfjs-setup';

import { BrochureGridOverview } from './brochure-grid-overview';
import { BrochurePdfPage } from './brochure-pdf-page';
import { BrochureReaderControls } from './brochure-reader-controls';
import { BrochureReaderHeader } from './brochure-reader-header';

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;
const FIT_ZOOM = 1.2;
const RENDER_SCALE_BASE = 1.6;

/**
 * Reader custom de brochures con pdf.js:
 *   - Header azul con título + SEND TO EMAIL/PHONE.
 *   - Stage oscuro con la página renderizada en canvas + flechas ← → grandes.
 *   - Controles inferiores: counter, grid, slider de página, zoom ± .
 *   - Grid overlay con todas las páginas como thumbnails.
 *   - BackButton flotante pill azul (estilo home).
 */
export function BrochureReader({
  brochure,
  moduleKey,
}: {
  brochure: BrochureItem;
  moduleKey: string;
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState<number>(brochure.pageCount);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(FIT_ZOOM);
  const [gridOpen, setGridOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);

  const [emailOpen, setEmailOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | {
    kind: 'email' | 'phone';
    destination: string;
  }>(null);

  // Carga del PDF
  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setProgress(null);
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
        const message = err instanceof Error ? err.message : 'Unknown error';
        setLoadError(message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brochure.pdfUrl]);

  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const seek = (p: number) => setCurrentPage(Math.max(1, Math.min(totalPages, p)));
  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));

  const handleEmailSent = (email: string) => {
    setEmailOpen(false);
    setConfirm({ kind: 'email', destination: email });
  };
  const handlePhoneSent = (phone: string) => {
    setPhoneOpen(false);
    setConfirm({ kind: 'phone', destination: phone });
  };

  return (
    <div className="relative flex h-full w-full flex-col" style={{ backgroundColor: '#1f1f22' }}>
      <BrochureReaderHeader
        title={brochure.title}
        onSendEmail={() => setEmailOpen(true)}
        onSendPhone={() => setPhoneOpen(true)}
      />

      <BrochureReaderControls
        currentPage={currentPage}
        totalPages={totalPages}
        zoom={zoom}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        onSeek={seek}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onOpenGrid={() => setGridOpen(true)}
      />

      {/* Stage */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        style={{ backgroundColor: '#28292d' }}
      >
        {/* Prev arrow */}
        <button
          type="button"
          onClick={goPrev}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
          className="absolute flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          style={{
            left: '24px',
            top: '35%',
            transform: 'translateY(-50%)',
            width: '88px',
            height: '88px',
            borderRadius: '50%',
            backgroundColor: '#004f8b',
            color: '#fff',
            opacity: currentPage <= 1 ? 0.4 : 1,
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 18px rgba(0,0,0,0.35)',
            zIndex: 3,
          }}
        >
          <svg width="36" height="36" viewBox="0 0 32 32" aria-hidden>
            <path
              d="M20 6l-10 10 10 10"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Next arrow */}
        <button
          type="button"
          onClick={goNext}
          disabled={currentPage >= totalPages}
          aria-label="Siguiente página"
          className="absolute flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          style={{
            right: '24px',
            top: '35%',
            transform: 'translateY(-50%)',
            width: '88px',
            height: '88px',
            borderRadius: '50%',
            backgroundColor: '#004f8b',
            color: '#fff',
            opacity: currentPage >= totalPages ? 0.4 : 1,
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 18px rgba(0,0,0,0.35)',
            zIndex: 3,
          }}
        >
          <svg width="36" height="36" viewBox="0 0 32 32" aria-hidden>
            <path
              d="M12 6l10 10-10 10"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div
          className="scrollbar-hide"
          style={{
            maxHeight: '100%',
            maxWidth: '100%',
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          {loadError ? (
            <ErrorState message={loadError} pdfUrl={brochure.pdfUrl} />
          ) : !pdf ? (
            <LoadingState progress={progress} />
          ) : (
            <BrochurePdfPage pdf={pdf} pageNumber={currentPage} scale={zoom * RENDER_SCALE_BASE} />
          )}
        </div>
      </div>

      <BrochureGridOverview
        open={gridOpen}
        pdf={pdf}
        totalPages={totalPages}
        onSelect={(p) => {
          setCurrentPage(p);
          setGridOpen(false);
        }}
        onClose={() => setGridOpen(false)}
      />

      <BackButton href={`/home/${moduleKey}`} ariaLabel="Volver al listado" />

      <SendToEmailModal
        open={emailOpen}
        listingTitle={brochure.title}
        onCancel={() => setEmailOpen(false)}
        onSent={handleEmailSent}
      />
      <SendToPhoneModal
        open={phoneOpen}
        listingTitle={brochure.title}
        onCancel={() => setPhoneOpen(false)}
        onSent={handlePhoneSent}
        onSwitchToKeyboard={() => {
          setPhoneOpen(false);
          setEmailOpen(true);
        }}
      />
      <SendConfirmationPopup
        open={confirm !== null}
        kind={confirm?.kind ?? 'email'}
        destination={confirm?.destination ?? ''}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}

function LoadingState({ progress }: { progress: { loaded: number; total: number } | null }) {
  const pct =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.loaded / progress.total) * 100))
      : null;
  const mb = progress ? (progress.loaded / 1024 / 1024).toFixed(1) : null;
  return (
    <div
      className="font-sans"
      style={{
        color: '#d8d8d8',
        padding: '32px',
        textAlign: 'center',
        width: '520px',
      }}
    >
      <div style={{ fontSize: '20px', lineHeight: '24px', marginBottom: '18px' }}>
        Loading brochure{pct !== null ? ` — ${pct}%` : '…'}
      </div>
      {pct !== null ? (
        <div
          aria-hidden
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '4px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              backgroundColor: '#1796d6',
              transition: 'width 120ms linear',
            }}
          />
        </div>
      ) : null}
      {mb ? (
        <div style={{ fontSize: '13px', opacity: 0.6, marginTop: '10px' }}>{mb} MB downloaded</div>
      ) : null}
    </div>
  );
}

function ErrorState({ message, pdfUrl }: { message: string; pdfUrl: string }) {
  return (
    <div
      className="font-sans"
      style={{
        color: '#ff9b9b',
        padding: '32px',
        textAlign: 'center',
        maxWidth: '640px',
        fontSize: '18px',
        lineHeight: '26px',
      }}
    >
      Could not load this brochure.
      <br />
      <span style={{ fontSize: '14px', opacity: 0.75 }}>{message}</span>
      <br />
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          marginTop: '14px',
          color: '#1796d6',
          textDecoration: 'underline',
          fontSize: '14px',
        }}
      >
        Open PDF directly
      </a>
    </div>
  );
}
