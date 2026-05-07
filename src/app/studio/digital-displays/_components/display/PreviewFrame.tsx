'use client';

import { ExternalLink, RotateCw } from 'lucide-react';
import { useState } from 'react';

/**
 * `<PreviewFrame>` — Iframe wrapper con preview live del runtime signage (DSS2).
 *
 * Embed `<iframe src="/signage/<client>/<display>" />` con aspect-video (16:9)
 * que escala al ancho disponible. El runtime internamente hace fit-contain
 * con letterbox vía `<SignageStage>`, así que la proporción siempre se preserva.
 *
 * Toolbar:
 *  - Reload: bump del `key` del iframe → desmonta + remonta. Más robusto que
 *    tocar `src` (algunos navegadores cachean).
 *  - Open in new tab: abre el runtime en una pestaña nueva.
 *
 * **DSS2:** sin bridge bidireccional. El iframe muestra el runtime tal cual,
 * leyendo desde fs. DSS3 introduce `postMessage` + KV para refrescar el iframe
 * cuando el editor cambia algo en el sidebar.
 */
export interface PreviewFrameProps {
  clientSlug: string;
  displaySlug: string;
  displayName: string;
}

export function PreviewFrame({ clientSlug, displaySlug, displayName }: PreviewFrameProps) {
  const runtimeUrl = `/signage/${clientSlug}/${displaySlug}`;
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
            Live preview
          </h3>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            Runtime hidrata desde{' '}
            <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[11.5px] dark:bg-zinc-800">
              clients-signage/{clientSlug}/
            </code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            title="Reload preview"
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80"
          >
            <RotateCw className="h-3 w-3" strokeWidth={2} />
            Reload
          </button>
          <a
            href={runtimeUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open ${displayName} in new tab`}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80"
          >
            <ExternalLink className="h-3 w-3" strokeWidth={2} />
            New tab
          </a>
        </div>
      </header>

      <div
        className="relative w-full overflow-hidden rounded-xl border border-zinc-200 bg-black shadow-sm dark:border-zinc-800"
        style={{ aspectRatio: '16 / 9' }}
      >
        <iframe
          key={reloadKey}
          src={runtimeUrl}
          title={`Preview ${displayName}`}
          loading="lazy"
          allow="autoplay; fullscreen"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    </section>
  );
}
