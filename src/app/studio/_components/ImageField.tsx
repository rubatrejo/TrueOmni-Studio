'use client';

import { Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { compressImage } from '../_lib/image-utils';

interface ImageFieldProps {
  label: string;
  hint: string;
  /** Tipos MIME aceptados. Default: imagen. */
  accept?: string;
  /** Tamaño máx en bytes antes de aviso (default 500KB). */
  maxBytes?: number;
  /** Data URL o path actual. */
  value?: string;
  onChange: (next: string | undefined) => void;
  /** `compact`: layout horizontal pequeño (logos múltiples). `square`: aspect 1:1 (default). */
  layout?: 'compact' | 'square';
}

/**
 * Field de upload de imagen con preview thumbnail.
 *
 * - Click → file picker.
 * - Drop → file directo.
 * - Auto-comprime imágenes raster grandes.
 * - SVG pasa sin tocar.
 * - Botón X para borrar.
 */
export function ImageField({
  label,
  hint,
  accept = 'image/svg+xml,image/png,image/jpeg,image/webp,image/x-icon',
  maxBytes = 500 * 1024,
  value,
  onChange,
  layout = 'square',
}: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFile = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      const dataUrl = await compressImage(file, { maxBytes });
      onChange(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
    } finally {
      setBusy(false);
    }
  };

  if (layout === 'compact') {
    return (
      <div
        className={`relative flex items-center gap-2.5 rounded-lg border border-dashed bg-zinc-50/50 p-2 transition ${
          hover
            ? 'border-sky-500/50 bg-sky-500/5'
            : 'border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/20'
        }`}
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
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void pickFile(file);
          }}
        />

        {/* Thumbnail / drop zone */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-md bg-white ring-1 ring-zinc-200 transition hover:ring-sky-500/40 dark:bg-zinc-900 dark:ring-zinc-800"
          aria-label={value ? `Change ${label}` : `Upload ${label}`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt={label}
              className="block h-full w-full object-contain p-1"
            />
          ) : (
            <Upload className="h-3.5 w-3.5 text-zinc-400" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-medium text-zinc-700 dark:text-zinc-200">
            {label}
          </div>
          <div className="mt-0.5 truncate text-[10.5px] text-zinc-500 dark:text-zinc-500">
            {error ? <span className="text-red-600">{error}</span> : busy ? 'Reading…' : hint}
          </div>
        </div>

        {value ? (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label={`Remove ${label}`}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10.5px] font-medium text-zinc-600 transition hover:border-sky-500/30 hover:bg-sky-500/5 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-sky-500/5 dark:hover:text-sky-300"
          >
            Upload
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed bg-zinc-50/50 px-3 py-4 transition ${
        hover
          ? 'border-sky-500/50 bg-sky-500/5'
          : 'border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/20'
      }`}
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
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void pickFile(file);
        }}
      />

      {value ? (
        <>
          <div className="grid h-full w-full place-items-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label}
              className="max-h-[80%] max-w-[80%] object-contain"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label={`Remove ${label}`}
            className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-zinc-900/80 text-white transition hover:bg-zinc-900 dark:bg-zinc-100/90 dark:text-zinc-900"
          >
            <X className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={`Change ${label}`}
          />
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex flex-col items-center gap-1.5 text-zinc-500 transition hover:text-sky-700 disabled:opacity-50 dark:hover:text-sky-300"
        >
          <Upload className="h-4 w-4" />
          <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-200">
            {busy ? 'Reading…' : label}
          </span>
          <span className="text-center text-[10.5px] text-zinc-400 dark:text-zinc-600">
            {hint}
          </span>
        </button>
      )}

      {error && (
        <p
          role="alert"
          className="absolute inset-x-0 bottom-1 truncate text-center text-[10px] text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
