'use client';

import { useEffect, useState } from 'react';

import {
  BILLBOARD_FOOTER_LOGO_SIZE_PX,
  BILLBOARD_LOGO_SIZE_PX,
  DEFAULT_BILLBOARD_B0,
  type BillboardB0Config,
  type BillboardLogoSize,
  type BillboardVariantSettings,
} from '@/lib/studio/schema';

import { KIOSK_BILLBOARD_OVERRIDE_EVENT } from '../studio-bridge';

type BillboardOverride = {
  logoSize?: BillboardLogoSize;
  footerLogoSize?: BillboardLogoSize;
  modules?: string[];
  /** Settings idle del variant 0 (Dark Hero). */
  b0?: Partial<BillboardVariantSettings>;
  /** Settings idle del variant 1 (Grid + Hero). */
  b1?: Partial<BillboardVariantSettings>;
  /** Settings idle del variant 2 (Hero + Carousel). */
  b2?: Partial<BillboardVariantSettings>;
  /** Settings idle del variant 3 (Banner + 4 cards). */
  b3?: Partial<BillboardVariantSettings>;
};

type BillboardOverrideWindow = Window & {
  __kioskBillboardOverride?: BillboardOverride;
};

/**
 * Hook compartido para que `billboard-{0,1,2,3}.tsx` lean en tiempo real
 * los overrides empujados por el Studio (logoSize + modules + settings idle
 * de cada variant) sin tocar el config global ni recargar.
 *
 * El bridge dispara `KIOSK_BILLBOARD_OVERRIDE_EVENT` con el shape completo
 * del `BillboardConfig`. Cacheamos el último valor en
 * `window.__kioskBillboardOverride` por si un Billboard se monta tarde
 * (navegación interna del iframe).
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
        footerLogoSize: detail.footerLogoSize,
        modules: Array.isArray(detail.modules) ? detail.modules : undefined,
        b0: detail.b0,
        b1: detail.b1,
        b2: detail.b2,
        b3: detail.b3,
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

/** Altura del logo del footer según el override (default M=65). */
export function useBillboardFooterLogoHeight(): number {
  const { footerLogoSize } = useBillboardOverride();
  return BILLBOARD_FOOTER_LOGO_SIZE_PX[footerLogoSize ?? 'M'];
}

/**
 * Aplica defaults sobre un patch parcial de settings idle. Garantiza al
 * consumidor que todos los campos están definidos.
 */
function withDefaults(patch: Partial<BillboardVariantSettings> | undefined): BillboardB0Config {
  return {
    background: patch?.background ?? DEFAULT_BILLBOARD_B0.background,
    touchHere: { ...DEFAULT_BILLBOARD_B0.touchHere, ...(patch?.touchHere ?? {}) },
    overlayOpacity: patch?.overlayOpacity ?? DEFAULT_BILLBOARD_B0.overlayOpacity,
    overlay: {
      ...DEFAULT_BILLBOARD_B0.overlay,
      ...(patch?.overlay ?? {}),
      gradient: {
        ...DEFAULT_BILLBOARD_B0.overlay.gradient,
        ...(patch?.overlay?.gradient ?? {}),
      },
    },
  };
}

/**
 * Devuelve los settings idle de la variante pedida con defaults aplicados.
 * Si el Studio no envió override aún, retorna los defaults canónicos.
 */
export function useBillboardSettings(variant: 0 | 1 | 2 | 3): BillboardB0Config {
  const override = useBillboardOverride();
  const slot =
    variant === 0 ? override.b0 : variant === 1 ? override.b1 : variant === 2 ? override.b2 : override.b3;
  return withDefaults(slot);
}

/**
 * Background editable per variant (B1/B2/B3). Si el Studio no envió
 * override, retorna `null` y el componente cae al hardcoded SVG.
 */
export function useBillboardVariantBackground(
  variant: 1 | 2 | 3,
): BillboardB0Config['background'] | null {
  const override = useBillboardOverride();
  const slot = variant === 1 ? override.b1 : variant === 2 ? override.b2 : override.b3;
  return slot?.background ?? null;
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

/**
 * Alias retrocompat para `useBillboardSettings(0)`. Devuelve los settings
 * B0 con defaults aplicados.
 */
export function useBillboardB0(): BillboardB0Config {
  return useBillboardSettings(0);
}
