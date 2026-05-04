'use client';

import { Film, Image as ImageIcon, Link as LinkIcon, Loader2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { resolveStudioAsset } from '../_lib/asset-resolve';
import { compressImage, readFileAsDataURL } from '../_lib/image-utils';
import { useStudioSlug } from '../_lib/slug-context';

interface MediaFieldProps {
  label: string;
  hint: string;
  aspect?: string;
  /** Límite de tamaño RAW del file de imagen. Default 5MB. Cuando Vercel
   *  Blob está disponible se sube tal cual (hasta 5MB). Si no, se comprime
   *  a ~1.2MB para encajar en el body limit del KV. */
  maxImageBytes?: number;
  /** Límite de tamaño RAW del file de video. Default 5MB con Blob, 2MB sin él
   *  (data URL ~2.7MB, encaja en el límite 4.5MB del body Vercel hobby).
   *  Para videos más grandes el operador puede pegar URL externa abajo. */
  maxVideoBytes?: number;
  value?: string;
  kind?: 'image' | 'video';
  onChange: (next: { src: string; kind: 'image' | 'video' } | undefined) => void;
}

const BLOB_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Field de upload de imagen o video — pensado para hero backgrounds
 * full-bleed del kiosk. A diferencia del `ImageField` genérico:
 *
 * - Acepta video (mp4/webm) además de imagen, detectando el tipo por MIME.
 * - NO comprime el archivo — un hero 1080×1920 pierde calidad notable
 *   con compressImage(maxDim=1024). Aquí se preserva calidad nativa
 *   hasta `maxBytes` (default 5MB).
 * - Preview full-bleed con aspect ratio del target (9/16 portrait,
 *   sin checkerboard pattern de transparencia que aplicaba `ImageField`).
 * - Cuando el valor es video, el preview muestra `<video autoplay loop muted>`
 *   para que el operador valide el looping in-situ.
 * - Badge `IMAGE`/`VIDEO` arriba a la izq, peso del archivo abajo.
 */
export function MediaField({
  label,
  hint,
  aspect = '9/16',
  maxImageBytes = 5 * 1024 * 1024,
  maxVideoBytes = 2 * 1024 * 1024,
  value,
  kind,
  onChange,
}: MediaFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hover, setHover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bytes, setBytes] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [blobAvailable, setBlobAvailable] = useState<boolean | null>(null);
  const slug = useStudioSlug();
  const previewSrc = slug ? resolveStudioAsset(slug, value) : value;

  useEffect(() => {
    let cancelled = false;
    fetch('/api/studio/upload')
      .then((r) => (r.ok ? r.json() : { available: false }))
      .then((data) => {
        if (!cancelled) setBlobAvailable(Boolean(data.available));
      })
      .catch(() => {
        if (!cancelled) setBlobAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const detectedKind: 'image' | 'video' =
    kind ?? (value && /\.mp4(\?|$)|\.webm(\?|$)|^data:video\//i.test(value) ? 'video' : 'image');

  const pickFile = async (file: File) => {
    setError(null);
    setProgress(0);
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      setError(`Unsupported file type: ${file.type || 'unknown'}.`);
      return;
    }
    const kindRes: 'image' | 'video' = isVideo ? 'video' : 'image';

    // Cuando Blob está disponible aceptamos hasta 5MB raw — el endpoint
    // valida el cap. Cuando no (dev sin token), seguimos en el régimen
    // antiguo de data URL: imagen comprimida + video <= maxVideoBytes.
    const useBlob = blobAvailable === true;
    const rawLimit = useBlob
      ? BLOB_MAX_BYTES
      : isVideo
        ? maxVideoBytes
        : maxImageBytes;
    if (file.size > rawLimit) {
      setError(
        isVideo
          ? `Video too large (${formatBytes(file.size)}). Max ${formatBytes(rawLimit)}${useBlob ? '' : ' for inline upload — paste a CDN URL below for larger files'}.`
          : `Image too large (${formatBytes(file.size)}). Max ${formatBytes(rawLimit)}.`,
      );
      return;
    }

    setBusy(true);
    try {
      if (useBlob && slug) {
        const url = await uploadToBlob(file, slug, kindRes, (pct) => setProgress(pct), xhrRef);
        setBytes(file.size);
        onChange({ src: url, kind: kindRes });
        return;
      }

      // Fallback (dev sin token): comprimir imagen / leer video como
      // data URL — ruta histórica, se queda como red de seguridad.
      const dataUrl = isVideo
        ? await readFileAsDataURL(file)
        : await compressImage(file, {
            maxDim: 2160,
            maxBytes: 1200 * 1024,
            quality: 0.9,
          });
      setBytes(file.size);
      onChange({ src: dataUrl, kind: kindRes });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
    } finally {
      setBusy(false);
      setProgress(0);
      xhrRef.current = null;
    }
  };

  const applyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    const looksVideo = /\.(mp4|webm|mov)(\?|$)/i.test(trimmed);
    onChange({ src: trimmed, kind: looksVideo ? 'video' : 'image' });
    setBytes(null);
    setUrlInput('');
    setError(null);
  };

  return (
    <div className="space-y-1.5">
      <div
        className={`relative overflow-hidden rounded-lg border border-dashed transition ${
          hover
            ? 'border-sky-500/60 bg-sky-500/5'
            : value
              ? 'border-zinc-200 bg-black dark:border-zinc-800'
              : 'border-zinc-300 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40'
        }`}
        style={{ aspectRatio: aspect }}
        onDragOver={(e) => {
          e.preventDefault();
          setHover(true);
        }}
        onDragLeave={() => setHover(false)}
        onDrop={(e) => {
          e.preventDefault();
          setHover(false);
          const file = e.dataTransfer.files[0];
          if (file) void pickFile(file);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void pickFile(file);
          }}
        />

        {value ? (
          <>
            {detectedKind === 'video' ? (
              <video
                key={previewSrc}
                src={previewSrc}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt={label}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}

            {/* Badge tipo arriba-izq */}
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
              {detectedKind === 'video' ? (
                <>
                  <Film className="h-3 w-3" />
                  Video
                </>
              ) : (
                <>
                  <ImageIcon className="h-3 w-3" />
                  Image
                </>
              )}
            </span>

            {/* Botón eliminar */}
            <button
              type="button"
              onClick={() => {
                onChange(undefined);
                setBytes(null);
              }}
              aria-label={`Remove ${label}`}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Replace overlay (todo el área es clickable) */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition hover:bg-black/30 hover:opacity-100"
              aria-label={`Replace ${label}`}
            >
              <span className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-zinc-900 shadow-lg">
                <Upload className="mr-1 inline h-3.5 w-3.5" />
                Replace
              </span>
            </button>

            {/* Tamaño del archivo abajo */}
            {bytes !== null ? (
              <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white backdrop-blur-sm">
                {formatBytes(bytes)}
              </span>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-zinc-500 transition hover:text-sky-700 disabled:opacity-50 dark:hover:text-sky-300"
          >
            <div className="grid h-12 w-12 place-items-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
              <Upload className="h-5 w-5" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">
                {label}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
                Click or drop a file
              </p>
            </div>
          </button>
        )}

        {/* Spinner overlay durante upload, con barra de progreso si > 1MB */}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-black/50 backdrop-blur-sm">
            <div className="flex w-full max-w-[160px] flex-col items-center gap-2 px-4">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
              <span className="text-[11px] font-medium text-white">
                {progress > 0 ? `Uploading… ${progress}%` : 'Reading…'}
              </span>
              {progress > 0 ? (
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full bg-white transition-[width] duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <p className="text-[10.5px] leading-relaxed text-zinc-500 dark:text-zinc-500">
        {hint}
      </p>
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50/70 px-2 py-1 text-[11px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </p>
      ) : null}

      {/* Or paste URL — alternativa para videos grandes via CDN */}
      <div className="flex items-center gap-1.5 pt-1">
        <LinkIcon className="h-3 w-3 shrink-0 text-zinc-400" />
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              applyUrl();
            }
          }}
          placeholder="Or paste a CDN URL (https://…/hero.mp4)"
          className="flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11.5px] text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600"
        />
        <button
          type="button"
          onClick={applyUrl}
          disabled={!urlInput.trim()}
          className="rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Use URL
        </button>
      </div>
    </div>
  );
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)}KB`;
  return `${(b / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * Sube un archivo al endpoint `/api/studio/upload` usando XHR para tener
 * progress events (fetch no los expone). Devuelve la URL pública del
 * blob. Si el endpoint responde 503 (no token), lanza un error con
 * `code: 'no-blob'` para que el caller decida si caer al fallback.
 */
function uploadToBlob(
  file: File,
  slug: string,
  kind: 'image' | 'video',
  onProgress: (pct: number) => void,
  xhrRef: React.MutableRefObject<XMLHttpRequest | null>,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    const params = new URLSearchParams({ slug, kind });
    xhr.open('POST', `/api/studio/upload?${params.toString()}`);

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
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
