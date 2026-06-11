import Link from 'next/link';
import type { ReactNode } from 'react';

import type { HomeModule } from '@/lib/config';

import { FloatingHomeButton } from './floating-home-button';

/**
 * Pantalla de SUB-CATEGORÍAS del kiosk (1080×1920). Al entrar a un módulo de
 * listings con sub-categorías, se muestra esta rejilla de tiles (foto + nombre)
 * antes de la lista — equivalente al grid de la PWA, adaptado al retrato.
 *
 * Cada tile navega a `/home/<module>?cat=<nombre>` → la page renderiza
 * `ListingsModule` pre-filtrado por esa sub-categoría. La foto sale de
 * `module.subcategoryImages[name]` (editable en el Studio); si falta, cae al
 * `heroImage` del módulo. Los nombres son CONTENT (del config), no chrome.
 */
export function SubcategoryScreen({
  moduleKey,
  module: mod,
  header,
}: {
  moduleKey: string;
  module: HomeModule;
  /** Hero + header server-rendered (pasado por la page), igual que ListingsModule. */
  header: ReactNode;
}) {
  const images = mod.subcategoryImages ?? {};
  const tiles = mod.subcategories.filter((name) => name && name.trim() !== '');

  return (
    <div className="relative h-full w-full">
      {header}
      <div className="absolute inset-x-0 bottom-0 overflow-y-auto" style={{ top: 620 }}>
        <div
          className="grid"
          style={{
            gridTemplateColumns: '465px 465px',
            columnGap: '50px',
            rowGap: '50px',
            padding: '50px',
          }}
        >
          {tiles.map((name) => {
            const image = images[name] || mod.heroImage || '';
            return (
              <Link
                key={name}
                href={`/home/${moduleKey}?cat=${encodeURIComponent(name)}`}
                aria-label={name}
                className="relative block overflow-hidden rounded-[16px] bg-cover bg-center"
                style={{
                  height: 300,
                  backgroundImage: image ? `url("${image}")` : undefined,
                  backgroundColor: image ? undefined : 'hsl(var(--brand-primary, 210 80% 30%))',
                }}
              >
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{ backgroundColor: 'hsl(0 0% 0% / 0.42)' }}
                />
                <span className="absolute inset-x-0 bottom-0 flex items-end px-6 pb-6">
                  <span className="font-display text-[34px] font-bold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                    {name}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      <FloatingHomeButton />
    </div>
  );
}
