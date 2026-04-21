'use client';

import type { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * pdf.js v3.11 — setup del worker + cache por URL.
 *
 * Usamos v3 (UMD build) en lugar de v5 porque v5 con Next.js 15 dispara
 * `Object.defineProperty called on non-object` al procesar el ESM. v3 es
 * CJS-compatible y funciona sin configuración especial.
 *
 * Worker en `public/pdfjs/pdf.worker.min.js`.
 */

const pdfCache = new Map<string, Promise<PDFDocumentProxy>>();
let workerConfigured = false;

async function ensureWorker(): Promise<void> {
  if (workerConfigured) return;
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
  workerConfigured = true;
}

export type PdfLoadProgress = (info: { loaded: number; total: number }) => void;

export async function loadPdf(
  url: string,
  onProgress?: PdfLoadProgress,
): Promise<PDFDocumentProxy> {
  await ensureWorker();
  let existing = pdfCache.get(url);
  if (!existing) {
    existing = (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        const task = pdfjs.getDocument({ url, isEvalSupported: false });
        if (onProgress) {
          task.onProgress = (p: { loaded: number; total: number }) => onProgress(p);
        }
        return await task.promise;
      } catch (err) {
        pdfCache.delete(url);
        console.error('[pdfjs] failed to load', url, err);
        throw err;
      }
    })();
    pdfCache.set(url, existing);
  }
  return existing;
}
