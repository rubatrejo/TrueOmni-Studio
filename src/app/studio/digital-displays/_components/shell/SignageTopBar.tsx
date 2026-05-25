'use client';

import { Eye, Send } from 'lucide-react';
import Link from 'next/link';

import { Breadcrumb, ScreenCrumbIcon } from '../../../_components/Breadcrumb';
import { SaveStatusPill } from '../../../_components/SaveStatusPill';
import { StudioBrand } from '../../../_components/StudioBrand';
import { ThemeToggle } from '../../../_components/ThemeToggle';

/**
 * `<SignageTopBar>` — top bar del editor de signage theme.
 *
 * Mismo lenguaje visual que `<TopBar>` del kiosk. Ajusta:
 *  - Breadcrumb: "Digital Displays > {nombre}".
 *  - Open in tab apunta al runtime `/signage/<slug>/<displaySlug>`.
 *  - El botón Publish dispara la modal del Publish tab (DSS7.5).
 *
 * No expone Versions button propio (la sección Versions es un tab del sidebar).
 * No expone Export/Import por ahora (lo entrega el display editor).
 */
export interface SignageTopBarProps {
  slug: string;
  /** Slug del cliente (sin el display). Se usa para el breadcrumb y para
   *  enlazar de regreso a la Vista de Cliente. */
  clientSlug: string;
  nombre: string;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  isDirty: boolean;
  previewHref: string | null;
  onPublish?: () => void;
  /** Override del breadcrumb del producto. Default "Digital Displays". */
  productLabel?: string;
  /** Override del href del breadcrumb del producto. Default `/studio/<slug>`. */
  productHref?: string;
  /** Label del cliente en el breadcrumb. Default reusa `clientSlug`. */
  clientLabel?: string;
}

export function SignageTopBar({
  slug,
  clientSlug,
  nombre,
  saveState,
  isDirty,
  previewHref,
  onPublish,
  productLabel = 'Digital Displays',
  productHref,
  clientLabel,
}: SignageTopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-5 dark:border-zinc-900 dark:bg-zinc-950">
      <div className="flex items-center gap-4">
        <StudioBrand />
        <span className="block h-5 w-px bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />
        {/* Breadcrumb canónico compartido (mismo componente que el kiosk).
            Trail: Clients › {Cliente} › {Producto} › {Ítem}. */}
        <Breadcrumb
          items={[
            { label: 'Clients', href: '/studio' },
            ...(clientLabel ? [{ label: clientLabel, href: `/studio/${clientSlug}` }] : []),
            { label: productLabel, href: productHref ?? `/studio/${clientSlug}` },
            { label: nombre, icon: <ScreenCrumbIcon />, slug },
          ]}
        />
      </div>

      <div className="flex items-center gap-2">
        <SaveStatusPill state={saveState} isDirty={isDirty} />
        <span className="mx-1 block h-5 w-px bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />
        <ThemeToggle />

        {previewHref ? (
          <Link
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open runtime ${previewHref}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Open in tab</span>
          </Link>
        ) : null}

        <button
          type="button"
          onClick={onPublish}
          disabled={!onPublish}
          title={
            isDirty
              ? 'Save changes first to include them in publish'
              : 'Publish (filesystem in dev, GitHub PR in production)'
          }
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">Publish</span>
        </button>
      </div>
    </header>
  );
}
