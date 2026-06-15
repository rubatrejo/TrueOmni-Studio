'use client';

import { useEffect, useState } from 'react';

import { Billboard0 } from './billboard-0';
import { Billboard1 } from './billboard-1';
import { Billboard2 } from './billboard-2';
import { Billboard3 } from './billboard-3';
import { Billboard4 } from './billboard-4';

const VARIANTS = {
  0: Billboard0,
  1: Billboard1,
  2: Billboard2,
  3: Billboard3,
  4: Billboard4,
} as const;

type BillboardVariant = keyof typeof VARIANTS;

/**
 * Versión client-side del switcher de Billboards. Renderea el variant
 * inicial del cliente y cambia en vivo cuando el Studio emite
 * `kiosk:billboard-override` (sin recargar la página).
 *
 * El KioskCanvas se monta fuera (en `page.tsx`) para que el dev-nav
 * quede fuera del transform.
 */
export function BillboardLiveSwitcher({
  initial,
  languagesEnabled = true,
}: {
  initial: BillboardVariant;
  languagesEnabled?: boolean;
}) {
  const [variant, setVariant] = useState<BillboardVariant>(initial);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ variant?: number }>).detail;
      const v = detail?.variant;
      if (typeof v === 'number' && v in VARIANTS) {
        setVariant(v as BillboardVariant);
      }
    };
    window.addEventListener('kiosk:billboard-override', handler);
    return () => window.removeEventListener('kiosk:billboard-override', handler);
  }, []);

  const Component = VARIANTS[variant];
  return <Component languagesEnabled={languagesEnabled} />;
}
