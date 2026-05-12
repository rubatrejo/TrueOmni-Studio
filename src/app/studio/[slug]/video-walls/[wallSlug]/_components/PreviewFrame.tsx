'use client';

import { ExternalLink, Maximize2, Monitor } from 'lucide-react';
import { useMemo, useState } from 'react';

import { GRID_CONFIGS, type GridConfig } from '@/lib/video-walls/dimensions';

/**
 * <PreviewFrame> — iframe del runtime video-walls con selector de celda
 * y toggle de bezels.
 *
 * VW5 minimal: solo carga `/video-walls/{c}/{w}` y opcionalmente
 * `?cell=r,c` para inspeccionar el crop de una celda específica. VW6+
 * añade el bridge live (postMessage) para que los cambios del editor
 * se reflejen sin recargar.
 */
export interface PreviewFrameProps {
  clientSlug: string;
  wallSlug: string;
  grid: GridConfig;
  /** Cualquier cambio en el wall que requiera reload del iframe.
   *  El editor pasa una key derivada del JSON del wall para forzar
   *  reload cuando autosave persiste cambios. */
  reloadKey?: string;
}

export function PreviewFrame({ clientSlug, wallSlug, grid, reloadKey }: PreviewFrameProps) {
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const [showBezels, setShowBezels] = useState(true);

  const { cols, rows } = GRID_CONFIGS[grid];
  const canvasW = cols * 1920;
  const canvasH = rows * 1080;
  const previewAspect = focusedCell ? '16 / 9' : `${canvasW} / ${canvasH}`;

  const iframeSrc = useMemo(() => {
    const qs = new URLSearchParams();
    if (focusedCell) qs.set('cell', `${focusedCell.row},${focusedCell.col}`);
    if (!showBezels) qs.set('bezels', '0');
    const tail = qs.toString();
    return `/video-walls/${clientSlug}/${wallSlug}${tail ? `?${tail}` : ''}`;
  }, [clientSlug, wallSlug, focusedCell, showBezels]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-zinc-500" />
          <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-200">
            {focusedCell
              ? `Cell ${focusedCell.row},${focusedCell.col} · 1920×1080`
              : `Full canvas · ${canvasW}×${canvasH}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-[11.5px] text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={showBezels}
              onChange={(e) => setShowBezels(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            Show bezels
          </label>
          <a
            href={iframeSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Open runtime URL in new tab"
          >
            <ExternalLink className="h-3 w-3" />
            Open
          </a>
        </div>
      </div>

      {/* Cell selector grid */}
      <div className="flex items-center gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
        <span className="text-[11px] uppercase tracking-wider text-zinc-500">View</span>
        <button
          type="button"
          onClick={() => setFocusedCell(null)}
          className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-medium transition ${
            focusedCell === null
              ? 'border-sky-500 bg-sky-50 text-sky-900 dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-200'
              : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900'
          }`}
        >
          <Maximize2 className="h-3 w-3" />
          Full canvas
        </button>
        <div
          className="inline-grid gap-0.5 rounded border border-zinc-200 bg-zinc-200 p-0.5 dark:border-zinc-700 dark:bg-zinc-800"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((__, c) => {
              const active = focusedCell?.row === r && focusedCell?.col === c;
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => setFocusedCell({ row: r, col: c })}
                  className={`h-7 w-9 font-mono text-[10px] transition ${
                    active
                      ? 'bg-sky-500 text-white'
                      : 'bg-white text-zinc-500 hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-500 dark:hover:bg-zinc-900'
                  }`}
                  title={`Cell ${r},${c}`}
                >
                  {r},{c}
                </button>
              );
            }),
          )}
        </div>
      </div>

      {/* Iframe wrapper con aspect */}
      <div className="flex flex-1 items-center justify-center overflow-auto bg-zinc-100 p-8 dark:bg-zinc-950">
        <div
          className="relative w-full max-w-full overflow-hidden rounded-lg border border-zinc-300 bg-black shadow-xl dark:border-zinc-700"
          style={{ aspectRatio: previewAspect }}
        >
          <iframe
            key={reloadKey}
            src={iframeSrc}
            title={`Preview ${wallSlug}`}
            className="absolute inset-0 h-full w-full"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
