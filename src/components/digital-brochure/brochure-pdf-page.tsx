'use client';

import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useEffect, useRef, useState } from 'react';

/**
 * Renderiza una página del PDF en un `<canvas>` con el `scale` dado.
 * Cancela renders pendientes si cambia page o scale.
 */
export function BrochurePdfPage({
  pdf,
  pageNumber,
  scale,
  className,
  style,
  canvasStyle,
}: {
  pdf: PDFDocumentProxy | null;
  pageNumber: number;
  scale: number;
  className?: string;
  style?: React.CSSProperties;
  /** Override opcional del estilo del `<canvas>` (p.ej. el reader PWA controla el
   *  ancho visual del zoom). Por defecto el canvas usa `maxWidth:100%` (kiosk). */
  canvasStyle?: React.CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pdf) return;
    let cancelled = false;
    let currentTask: { cancel: () => void } | null = null;

    setLoading(true);
    (async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const task = page.render({ canvasContext: ctx, viewport });
        currentTask = task;
        await task.promise;
        if (!cancelled) setLoading(false);
      } catch {
        /* silencioso — cancelación normal al cambiar page/scale */
      }
    })();

    return () => {
      cancelled = true;
      currentTask?.cancel();
    };
  }, [pdf, pageNumber, scale]);

  return (
    <div className={className} style={{ position: 'relative', ...style }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          borderRadius: '4px',
          backgroundColor: '#fff',
          ...canvasStyle,
        }}
      />
      {loading ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ccc',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: '18px',
          }}
        >
          Loading…
        </div>
      ) : null}
    </div>
  );
}
