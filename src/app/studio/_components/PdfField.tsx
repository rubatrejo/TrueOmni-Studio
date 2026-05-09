'use client';

import { FileText, Loader2, Upload, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB cap (KV practical limit)

/**
 * Compact PDF upload field. Lee el archivo como data URL y emite también
 * `pageCount` (extraído contando "/Type /Page " en el binario, sin parser).
 * Para producción real (S7 publish) los PDFs deberían vivir en Vercel Blob,
 * pero como working copy del Studio el data URL en KV está bien.
 */
export function PdfField({
  label,
  hint,
  value,
  onChange,
  pageCount,
  onPageCountChange,
}: {
  label: string;
  hint?: string;
  value?: string;
  onChange: (next: string | undefined) => void;
  pageCount?: number;
  onPageCountChange?: (n: number) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only .pdf files are supported.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`File too large (max ${Math.round(MAX_BYTES / 1024 / 1024)}MB).`);
      return;
    }
    setBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Quick page count: count "/Type /Page" occurrences, ignoring "/Pages".
      // Best-effort heuristic — works for most flat / non-encrypted PDFs.
      const decoded = bytesToLatin1(bytes);
      const matches = decoded.match(/\/Type\s*\/Page[^s]/g);
      const pages = matches ? matches.length : 1;

      // Encode to base64.
      let binary = '';
      const CHUNK = 8 * 1024;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode.apply(
          null,
          Array.from(bytes.subarray(i, Math.min(i + CHUNK, bytes.length))),
        );
      }
      const base64 = btoa(binary);
      const dataUrl = `data:application/pdf;base64,${base64}`;
      onChange(dataUrl);
      onPageCountChange?.(Math.max(1, pages));
    } catch (err) {
      console.error('[PdfField]', err);
      setError(err instanceof Error ? err.message : 'Could not read PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={
        'relative flex items-center gap-2.5 rounded-lg border border-dashed bg-zinc-50/50 p-2 transition ' +
        (hover
          ? 'border-sky-500/50 bg-sky-500/5'
          : 'border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/20')
      }
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
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-md bg-white ring-1 ring-zinc-200 transition hover:ring-sky-500/40 dark:bg-zinc-900 dark:ring-zinc-800"
        aria-label={value ? `Replace ${label}` : `Upload ${label}`}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
        ) : value ? (
          <FileText className="h-4 w-4 text-red-500" />
        ) : (
          <Upload className="h-3.5 w-3.5 text-zinc-400" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium text-zinc-700 dark:text-zinc-200">{label}</div>
        <div className="mt-0.5 truncate text-[10.5px] text-zinc-500 dark:text-zinc-500">
          {error ? (
            <span className="text-red-600">{error}</span>
          ) : busy ? (
            'Reading PDF…'
          ) : value ? (
            `PDF loaded · ${pageCount ?? '?'} pages`
          ) : (
            (hint ?? 'PDF · max 8MB')
          )}
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
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10.5px] font-medium text-zinc-600 transition hover:border-sky-500/30 hover:bg-sky-500/5 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400"
        >
          Upload
        </button>
      )}
    </div>
  );
}

function bytesToLatin1(bytes: Uint8Array): string {
  // Latin-1 decode for /Type /Page heuristic. We don't decode the whole PDF
  // as text (binary data), but the structure we need is ASCII-safe.
  let s = '';
  const CHUNK = 32 * 1024;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, Math.min(i + CHUNK, bytes.length))),
    );
  }
  return s;
}
