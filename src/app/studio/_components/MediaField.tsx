'use client';

import { Film, Image as ImageIcon, Link as LinkIcon, Loader2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { resolveStudioAsset } from '../_lib/asset-resolve';
import { compressImage, readFileAsDataURL } from '../_lib/image-utils';
import { useStudioSlug } from '../_lib/slug-context';

interface MediaFieldProps {
  label: string;
  hint: string;
  aspect?: string;
  /** Límite de tamaño RAW del file de imagen. Default 5MB (la imagen se
   *  comprime después a ~1.2MB para encajar en el body limit de Vercel). */
  maxImageBytes?: number;
  /** Límite de tamaño RAW del file de video. Default 2MB (data URL ~2.7MB,
   *  encaja en el límite 4.5MB del body Vercel hobby). Para videos más
   *  grandes el operador debe pegar URL externa abajo. */
  maxVideoBytes?: number;
  value?: string;
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
  maxImageBytes = 5 * 1024 * 1024,
  maxVideoBytes = 2 * 1024 * 1024,
  value,
  kind,
  onChange,
}: MediaFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bytes, setBytes] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const slug = useStudioSlug();
  const previewSrc = slug ? resolveStudioAsset(slug, value) : value;

  const detectedKind: 'image' | 'video' =
    kind ?? (value && /\.mp4(\?|$)|\.webm(\?|$)|^data:video\//i.test(value) ? 'video' : 'image');

  const pickFile = async (file: File) => {
    setError(null);
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      setError(`Unsupported file type: ${file.type || 'unknown'}.`);
      return;
    }
    const limit = isVideo ? maxVideoBytes : maxImageBytes;
    if (file.size > limit) {
      setError(
        isVideo
          ? `Video too large (${formatBytes(file.size)}). Max ${formatBytes(limit)} for inline upload — paste a CDN URL below for larger files.`
          : `Image too large (${formatBytes(file.size)}). Max ${formatBytes(limit)}.`,
      );
      return;
    }
    setBusy(true);
    try {
      // Imagen: comprime a maxBytes 1.2MB → data URL ~1.6MB, dentro del
      // límite 4.5MB de body Vercel. Calidad 0.9 + maxDim 2160 preservan
      // bien un hero 1080×1920 (no se ve compresión visible).
      // Video: pasa raw — ya enforzamos 2MB de límite arriba.
      const dataUrl = isVideo
        ? await readFileAsDataURL(file)
        : await compressImage(file, {
            maxDim: 2160,
            maxBytes: 1200 * 1024,
            quality: 0.9,
          });
      setBytes(file.size);
      onChange({ src: dataUrl, kind: isVideo ? 'video' : 'image' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
    } finally {
      setBusy(false);
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
