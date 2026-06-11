'use client';

import { Rss } from 'lucide-react';
import Link from 'next/link';

/**
 * Banner mostrado encima de un editor de módulo (Listings / Events) cuando ese
 * módulo se alimenta de un feed de proveedor (`feedConnected`). El contenido se
 * gestiona a nivel cliente desde la tab "Data feeds" (en /studio/{slug},
 * Branding & info), así que el editor por-producto queda read-only para no
 * editar a mano lo que sincroniza el feed.
 *
 * Sigue el patrón visual del `BrandingSyncBanner` (aviso ámbar, icono + texto
 * + deep-link). La tab Data feeds vive en estado local de `BrandingForm`, sin
 * query param/hash, así que el deep-link apunta a `/studio/{slug}` y el texto
 * nombra la "Data feeds tab".
 */
export function FeedManagedBanner({ slug }: { slug: string | null }) {
  return (
    <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
      <Rss className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      <div className="flex-1">
        <span className="font-medium">Managed from Data feeds.</span> This module&apos;s content
        syncs from a provider feed and is read-only here. Edit it in the client&apos;s Data feeds
        tab.{' '}
        {slug ? (
          <Link
            href={`/studio/${slug}`}
            className="font-medium underline-offset-2 transition hover:underline"
          >
            Open Data feeds →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
