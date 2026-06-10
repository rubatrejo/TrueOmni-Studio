'use client';

import { useEffect, useState, type MutableRefObject } from 'react';

/**
 * Subida de assets a Vercel Blob vía `POST /api/studio/upload` — util compartido
 * del Studio (F-PWA-3 del audit STUDIO-AUDIT-2026-06-09).
 *
 * Antes vivía privado en `MediaField`; lo consumen también `ImageField` y
 * `PdfField` para sacar los data-URI base64 del config (KV + config.json).
 *
 * Usa XMLHttpRequest (no fetch) para exponer progress events. Devuelve la URL
 * pública del blob. El caller decide el fallback (data-URI) cuando no hay token
 * — usa `useBlobAvailable()` para saberlo antes de intentar.
 */

export type UploadKind = 'image' | 'video' | 'doc';
export type UploadProduct = 'kiosk' | 'signage';

export function uploadToBlob(
  file: File,
  {
    slug,
    kind,
    product,
    onProgress,
    xhrRef,
  }: {
    slug: string;
    kind: UploadKind;
    product: UploadProduct;
    /** Callback de progreso 0–100. Opcional. */
    onProgress?: (pct: number) => void;
    /** Ref opcional para poder abortar la subida desde el caller. */
    xhrRef?: MutableRefObject<XMLHttpRequest | null>;
  },
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    if (xhrRef) xhrRef.current = xhr;

    const params = new URLSearchParams({ slug, kind, product });
    xhr.open('POST', `/api/studio/upload?${params.toString()}`);

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) {
        onProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };

    xhr.onload = () => {
      let body: { url?: string; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText) as typeof body;
      } catch {
        // ignore
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.url) {
        resolve(body.url);
      } else {
        reject(new Error(body.error || `Upload failed (HTTP ${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload aborted'));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.name);
    xhr.send(formData);
  });
}

/**
 * Probe one-shot de si Vercel Blob está configurado (`BLOB_READ_WRITE_TOKEN`).
 * `null` mientras carga; luego `true`/`false`. Sin token → los fields caen al
 * fallback de data-URI inline.
 */
export function useBlobAvailable(): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/studio/upload')
      .then((r) => (r.ok ? r.json() : { available: false }))
      .then((data) => {
        if (!cancelled) setAvailable(Boolean(data.available));
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return available;
}
