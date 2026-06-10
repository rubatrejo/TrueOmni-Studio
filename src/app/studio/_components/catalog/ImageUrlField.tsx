'use client';

import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { compressImage } from '../../_lib/image-utils';

interface ImageUrlFieldProps {
  label: string;
  value?: string;
  onChange: (next: string | undefined) => void;
  helpText?: string;
  /** Cap blando en bytes — si el data URL excede, muestra warning. */
  maxBytes?: number;
}

const URL_PATTERN = /^(https?:\/\/|data:image\/|\/)/i;
const DEFAULT_MAX_BYTES = 200 * 1024; // 200 KB

/**
 * Field combinado URL / dropzone para imágenes de catálogo.
 *
 *   - Input de texto: pega URL externa o path relativo a `/clients/<slug>/assets/`.
 *   - Drop / click → file picker → compressImage → data URL.
 *   - Cap blando 200 KB (warning, no bloquea).
 */
export function ImageUrlField({
  label,
  value,
  onChange,
  helpText,
  maxBytes = DEFAULT_MAX_BYTES,
}: ImageUrlFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataUrlBytes = value && value.startsWith('data:') ? Math.ceil((value.length * 3) / 4) : 0;
  const oversize = dataUrlBytes > maxBytes;

  const handleFile = async (file: File) => {
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

  const urlValid = !value || URL_PATTERN.test(value);

  return (
    <div className="space-y-1.5">
      <label className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <div
        className={`flex items-stretch gap-2 rounded-md border bg-zinc-50 p-1.5 transition dark:bg-zinc-900/40 ${
          hover
            ? 'border-sky-500/60 bg-sky-500/5 dark:bg-sky-500/5'
            : 'border-zinc-200 dark:border-zinc-800'
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
          if (file) void handleFile(file);
        }}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label={value ? `Change ${label}` : `Upload ${label}`}
          className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-white ring-1 ring-zinc-200 transition hover:ring-sky-500/40 dark:bg-zinc-950 dark:ring-zinc-800"
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              loading="lazy"
              src={value}
              alt={label}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <ImageIcon className="h-4 w-4 text-zinc-500" />
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />

        <input
          type="text"
          value={value ?? ''}
          onChange={(ev) => onChange(ev.target.value || undefined)}
          placeholder="https://… or /assets/…"
          className="flex-1 bg-transparent px-2 text-[12px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600"
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-sky-500/10 hover:text-sky-300"
          aria-label={`Upload file for ${label}`}
        >
          <Upload className="h-4 w-4" />
        </button>

        {value ? (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="grid h-12 w-9 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
            aria-label={`Clear ${label}`}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {helpText ? <p className="text-[11px] text-zinc-500">{helpText}</p> : null}

      {!urlValid ? (
        <p className="text-[11px] text-amber-400">
          URL must start with http(s)://, data:image/, or /
        </p>
      ) : null}

      {oversize ? (
        <p className="text-[11px] text-amber-400">
          {`Image is ${(dataUrlBytes / 1024).toFixed(0)} KB (limit ${(maxBytes / 1024).toFixed(0)} KB). Consider hosting externally.`}
        </p>
      ) : null}

      {busy ? <p className="text-[11px] text-zinc-500">Reading…</p> : null}
      {error ? (
        <p role="alert" className="text-[11px] text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
