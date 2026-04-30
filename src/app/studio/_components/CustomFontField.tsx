'use client';

import { Trash2, Upload } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import type { CustomFont } from '@/lib/studio/schema';

const ACCEPT = '.woff2,.woff,.ttf,.otf';
const MAX_BYTES = 600 * 1024;

const FORMAT_BY_EXT: Record<string, CustomFont['format']> = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'ttf',
  otf: 'otf',
};

const MIME_BY_FORMAT: Record<CustomFont['format'], string> = {
  woff2: 'font/woff2',
  woff: 'font/woff',
  ttf: 'font/ttf',
  otf: 'font/otf',
};

/**
 * Valor canónico para `format()` en `@font-face` segun CSS Fonts spec.
 * Browsers (Chrome/Safari) descartan el @font-face si format() es algo
 * distinto a estos cuatro valores — por eso un .ttf u .otf subido por el
 * usuario "no se aplicaba" y caía al fallback system-ui.
 */
const CSS_FORMAT_BY_EXT: Record<CustomFont['format'], string> = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
};

const injected = new Set<string>();

function injectFontFace(font: CustomFont) {
  if (typeof document === 'undefined') return;
  const id = `studio-custom-font-${font.name.replace(/\s+/g, '-').toLowerCase()}`;
  // Reemplaza el @font-face si los bytes cambiaron (mismo nombre,
  // distinto archivo); browsers no recargan src de un @font-face existente.
  const existing = document.getElementById(id) as HTMLStyleElement | null;
  if (existing) {
    if (existing.dataset.fontHash === font.dataUrl.length.toString()) return;
    existing.remove();
    injected.delete(id);
  }
  const cssFormat = CSS_FORMAT_BY_EXT[font.format] ?? font.format;
  const style = document.createElement('style');
  style.id = id;
  style.dataset.fontHash = font.dataUrl.length.toString();
  style.textContent = `@font-face {
  font-family: "${font.name}";
  src: url(${font.dataUrl}) format("${cssFormat}");
  font-display: swap;
}`;
  document.head.appendChild(style);
  injected.add(id);
}

export function CustomFontField({
  slot,
  value,
  onChange,
}: {
  slot: 'display' | 'body';
  value: CustomFont | undefined;
  onChange: (next: CustomFont | null) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (value) injectFontFace(value);
  }, [value]);

  const handleFile = async (file: File) => {
    setError(null);
    if (file.size > MAX_BYTES) {
      setError(`File too large (max ${Math.round(MAX_BYTES / 1024)}KB).`);
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const format = FORMAT_BY_EXT[ext];
    if (!format) {
      setError('Unsupported format. Use .woff2, .woff, .ttf or .otf.');
      return;
    }
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);
      const dataUrl = `data:${MIME_BY_FORMAT[format]};base64,${base64}`;
      const baseName = file.name.replace(/\.[^.]+$/, '').slice(0, 40);
      const safeName = `${slot === 'display' ? 'CustomDisplay' : 'CustomBody'}-${baseName.replace(/[^a-zA-Z0-9-_]/g, '-')}`;
      const next: CustomFont = { name: safeName, dataUrl, format };
      injectFontFace(next);
      onChange(next);
    } catch (err) {
      console.error('[CustomFontField]', err);
      setError(err instanceof Error ? err.message : 'Could not read font file.');
    }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await handleFile(file);
  };

  if (value) {
    return (
      <div
        className="mb-1.5 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2"
      >
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-[18px] font-bold text-zinc-800 ring-1 ring-emerald-500/20 dark:bg-zinc-950 dark:text-zinc-200"
          style={{ fontFamily: `"${value.name}", system-ui` }}
          aria-hidden
        >
          Aa
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-[12.5px] font-medium leading-tight text-zinc-800 dark:text-zinc-200"
            style={{ fontFamily: `"${value.name}", system-ui` }}
          >
            Custom · {value.name.replace(/^Custom(Display|Body)-/, '')}
          </div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
            .{value.format} · overrides {slot}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500"
          aria-label="Remove custom font"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-1.5">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={
          'flex cursor-pointer items-center gap-2.5 rounded-lg border border-dashed bg-white p-2.5 transition dark:bg-zinc-900/40 ' +
          (dragging
            ? 'border-sky-500/60 bg-sky-500/5 dark:border-sky-400/60'
            : 'border-zinc-300 hover:border-sky-500/40 hover:bg-sky-500/5 dark:border-zinc-800 dark:hover:bg-sky-500/5')
        }
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          <Upload className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
            Drop a custom font for {slot === 'display' ? 'Display' : 'Body'}
          </div>
          <div className="mt-0.5 text-[10.5px] text-zinc-500 dark:text-zinc-500">
            .woff2 · .woff · .ttf · .otf · {Math.round(MAX_BYTES / 1024)}KB max
          </div>
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await handleFile(file);
            if (inputRef.current) inputRef.current.value = '';
          }}
        />
      </label>
      {error && (
        <p className="mt-1 text-[10.5px] text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
