'use client';

import { ChevronRight, Eye, History, Send, Undo2, Redo2 } from 'lucide-react';
import Link from 'next/link';

import { FaviconBadge } from './FaviconBadge';
import { ProductDropdown } from './ProductDropdown';
import { StudioBrand } from './StudioBrand';
import { ThemeToggle } from './ThemeToggle';

export function TopBar({
  slug,
  nombre,
  favicon,
  currentVersion,
  saveState,
  isDirty,
  onOpenVersions,
  versionsActive,
  onPublish,
}: {
  slug: string;
  nombre: string;
  /** Favicon del kiosk activo (data URL o path). Se muestra como icono
   *  pequeño junto al nombre en el breadcrumb para confirmar visualmente
   *  qué kiosk se está editando. */
  favicon?: string;
  currentVersion: number;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  isDirty: boolean;
  onOpenVersions?: () => void;
  versionsActive?: boolean;
  onPublish?: () => void;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-5 dark:border-zinc-900 dark:bg-zinc-950">
      <div className="flex items-center gap-4">
        <StudioBrand />
        <ProductDropdown />
        <span className="block h-5 w-px bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />
        <nav className="flex items-center gap-1.5 text-[13px] text-zinc-500">
          {/* "Kiosks >" prefix redundant con el ProductDropdown — solo se muestra
              en xl+ donde sobra ancho. <xl muestra solo el kiosk activo. */}
          <Link
            href="/studio"
            className="hidden transition hover:text-zinc-800 xl:inline dark:hover:text-zinc-300"
          >
            Kiosks
          </Link>
          <ChevronRight
            className="hidden h-3.5 w-3.5 text-zinc-400 xl:block dark:text-zinc-700"
            aria-hidden="true"
          />
          <FaviconBadge
            favicon={favicon}
            slug={slug}
            className="block h-4 w-4 rounded-sm object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
          />
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{nombre}</span>
          <VersionBadge currentVersion={currentVersion} />
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {onOpenVersions ? (
          <button
            type="button"
            onClick={onOpenVersions}
            aria-label="Versions & Changelog"
            aria-pressed={versionsActive}
            title="Versions & Changelog"
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[12px] font-medium transition ${
              versionsActive
                ? 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Versions</span>
          </button>
        ) : null}
        <SaveStatusPill state={saveState} isDirty={isDirty} />
        <span className="mx-1 block h-5 w-px bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />

        <button
          type="button"
          aria-label="Undo"
          className="grid h-8 w-8 place-items-center rounded-md text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
        >
          <Undo2 className="h-[15px] w-[15px]" />
        </button>
        <button
          type="button"
          aria-label="Redo"
          className="grid h-8 w-8 place-items-center rounded-md text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
        >
          <Redo2 className="h-[15px] w-[15px]" />
        </button>

        <span className="mx-1 block h-5 w-px bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />

        <ThemeToggle />

        <Link
          href={`/k/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          title={`Open kiosk at /k/${slug}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <Eye className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">Open in tab</span>
        </Link>

        <button
          type="button"
          onClick={onPublish}
          disabled={!onPublish}
          title={isDirty ? 'Save changes first to include them in publish' : 'Publish to filesystem'}
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">Publish</span>
        </button>
      </div>
    </header>
  );
}

/**
 * Badge "v0/v1/…" del breadcrumb (audit F-22).
 *
 * v0     → gray "Draft" (sin publicar todavía)
 * v1+    → green "Live" (la versión visible en /clients/{slug})
 *
 * Tooltip explicativo on hover. No diferenciamos "live reciente" vs
 * "versioned antiguo" todavía — eso requiere `lastPublishedAt` que aún no
 * se persiste fiable en KV. Cuando S7.2 entregue versioning real, este
 * componente expondrá la fecha del publish.
 */
function VersionBadge({ currentVersion }: { currentVersion: number }) {
  const isDraft = currentVersion <= 0;
  const label = `v${currentVersion}`;
  const tooltip = isDraft
    ? 'Draft — this kiosk has not been published yet. Hit Publish to ship v1.'
    : `Live — published as v${currentVersion}.`;
  return (
    <span
      title={tooltip}
      aria-label={tooltip}
      className={
        'ml-1 rounded px-1.5 py-0.5 font-mono text-[11px] ' +
        (isDraft
          ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500'
          : 'bg-emerald-500/15 text-emerald-700 ring-1 ring-inset ring-emerald-500/30 dark:text-emerald-300')
      }
    >
      {label}
    </span>
  );
}

function SaveStatusPill({
  state,
  isDirty,
}: {
  state: 'idle' | 'saving' | 'saved' | 'error';
  isDirty: boolean;
}) {
  const effective = (() => {
    if (state === 'saving')
      return { label: 'Saving…', short: 'Saving…', dot: 'bg-amber-400 animate-pulse', text: 'text-amber-600 dark:text-amber-300' };
    if (state === 'error')
      return { label: 'Save failed', short: 'Error', dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400' };
    if (isDirty)
      return { label: 'Unsaved changes', short: 'Unsaved', dot: 'bg-sky-500 animate-pulse', text: 'text-sky-600 dark:text-sky-400' };
    if (state === 'saved')
      return { label: 'All changes saved', short: 'Saved', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
    return { label: 'No pending changes', short: 'Idle', dot: 'bg-zinc-400 dark:bg-zinc-600', text: 'text-zinc-500' };
  })();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-1.5 text-[11.5px] ${effective.text}`}
      title={effective.label}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${effective.dot}`} />
      {/* lg-xl: short. xl+: full. <lg: solo el dot con tooltip. */}
      <span className="hidden lg:inline xl:hidden">{effective.short}</span>
      <span className="hidden xl:inline">{effective.label}</span>
    </span>
  );
}
