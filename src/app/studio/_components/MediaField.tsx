'use client';

import { Film, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { resolveStudioAsset } from '../_lib/asset-resolve';
import { readFileAsDataURL } from '../_lib/image-utils';
import { useStudioSlug } from '../_lib/slug-context';

interface MediaFieldProps {
  /** Texto principal del campo. */
  label: string;
  /** Subtítulo descriptivo (ej. medidas recomendadas). */
  hint: string;
  /** Aspect ratio del preview. Default '9/16' (portrait kiosk). */
  aspect?: string;
  /** Tamaño máximo permitido en bytes. Default 5MB. */
  maxBytes?: number;
  /** Data URL o path actual. */
  value?: string;
  /** Mejor si recibe el `kind` actual del valor para renderizar acorde. */
  kind?: 'image' | 'video';
  onChange: (next: { src: string; kind: 'image' | 'video' } | undefined) => void;
}

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
  maxBytes = 5 * 1024 * 1024,
  value,
  kind,
  onChange,
}: MediaFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bytes, setBytes] = useState<number | null>(null);
  const slug = useStudioSlug();
  const previewSrc = slug ? resolveStudioAsset(slug, value) : value;

  const detectedKind: 'image' | 'video' =
    kind ?? (value && /\.mp4(\?|$)|\.webm(\?|$)|^data:video\//i.test(value) ? 'video' : 'image');

  const pickFile = async (file: File) => {
    setError(null);
    if (file.size > maxBytes) {
      setError(
        `File too large (${formatBytes(file.size)}). Max ${formatBytes(maxBytes)}.`,
      );
      return;
    }
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      setError(`Unsupported file type: ${file.type || 'unknown'}.`);
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await readFileAsDataURL(file);
      setBytes(file.size);
      onChange({ src: dataUrl, kind: isVideo ? 'video' : 'image' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
    } finally {
      setBusy(false);
    }
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

        {/* Spinner overlay durante upload */}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-black/40 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-1.5">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
              <span className="text-[11px] font-medium text-white">Reading…</span>
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
    </div>
  );
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)}KB`;
  return `${(b / (1024 * 1024)).toFixed(1)}MB`;
}
