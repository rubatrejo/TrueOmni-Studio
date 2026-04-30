'use client';

import { useEffect, useState } from 'react';

import { BILLBOARD_LOGO_SIZE_PX, type BillboardLogoSize } from '@/lib/studio/schema';

import { KIOSK_BILLBOARD_OVERRIDE_EVENT } from '../studio-bridge';

type BillboardOverride = {
  logoSize?: BillboardLogoSize;
  modules?: string[];
};

type BillboardOverrideWindow = Window & {
  __kioskBillboardOverride?: BillboardOverride;
};

/**
 * Hook compartido para que `billboard-{0,1,2,3}.tsx` lean en tiempo real
 * los overrides empujados por el Studio (logoSize + modules) sin tocar
 * el config global ni recargar.
 *
 * El bridge dispara `KIOSK_BILLBOARD_OVERRIDE_EVENT` con detalle
 * `{ variant, idleTimeoutSec, logoSize?, modules? }`. Aquí solo nos
 * interesan logoSize y modules. Cacheamos el último valor en
 * `window.__kioskBillboardOverride` por si un Billboard se monta
 * tarde (navegación interna del iframe).
 */
export function useBillboardOverride(): BillboardOverride {
  const [override, setOverride] = useState<BillboardOverride>(() => {
    if (typeof window === 'undefined') return {};
    return (window as BillboardOverrideWindow).__kioskBillboardOverride ?? {};
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: Event) => {
      const custom = event as CustomEvent<
        BillboardOverride & { variant?: number; idleTimeoutSec?: number }
      >;
      const detail = custom.detail ?? {};
      const next: BillboardOverride = {
        logoSize: detail.logoSize,
        modules: Array.isArray(detail.modules) ? detail.modules : undefined,
      };
      (window as BillboardOverrideWindow).__kioskBillboardOverride = next;
      setOverride(next);
    };
    window.addEventListener(KIOSK_BILLBOARD_OVERRIDE_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(KIOSK_BILLBOARD_OVERRIDE_EVENT, handler as EventListener);
    };
  }, []);

  return override;
}

/** Devuelve la altura en px del logo idle según el override (default M=128). */
export function useBillboardLogoHeight(): number {
  const { logoSize } = useBillboardOverride();
  return BILLBOARD_LOGO_SIZE_PX[logoSize ?? 'M'];
}

/**
 * Devuelve un mapa para resolver `index → moduleKey` usando
 * billboard.modules. Si el slot no tiene módulo asignado, devuelve
 * `undefined` y el componente debe caer al hardcoded del SVG.
 */
export function useBillboardSlotKey(index: number): string | undefined {
  const { modules } = useBillboardOverride();
  if (!modules || index >= modules.length) return undefined;
  const key = modules[index];
  return key && key.length > 0 ? key : undefined;
}
