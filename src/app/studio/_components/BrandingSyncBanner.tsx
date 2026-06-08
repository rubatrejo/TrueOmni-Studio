'use client';

import { Info } from 'lucide-react';
import Link from 'next/link';

/**
 * Banner mostrado encima del editor de branding del kiosk y del signage.
 * Recuerda al operador que el branding es source-of-truth en la Vista del
 * Cliente; los cambios desde el editor del producto se sincronizan via
 * `syncFromKioskSave` / `syncFromSignageSave` (Fase 4 del refactor cliente-
 * primero), pero el flujo recomendado es editarlo desde la vista unificada.
 *
 * Plan: `~/.claude/plans/ok-listo-ahora-quiero-wondrous-sphinx.md`.
 */
export function BrandingSyncBanner({
  slug,
  product: _product,
}: {
  slug: string;
  product: 'kiosk' | 'signage' | 'pwa';
}) {
  return (
    <div className="mb-3 flex items-start gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-[12px] text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      <div className="flex-1">
        <span className="font-medium">Branding synced.</span> Any change here propagates to the
        client&apos;s unified branding and the other products automatically.{' '}
        <Link
          href={`/studio/${slug}`}
          className="font-medium underline-offset-2 transition hover:underline"
        >
          Edit from the Client View →
        </Link>
      </div>
    </div>
  );
}
