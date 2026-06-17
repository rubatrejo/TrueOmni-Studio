'use client';

import { useEffect } from 'react';

import { dispatchModuleHero } from '@/components/studio-bridge';
import { resolveAssetUrl } from '@/lib/asset-url';

/**
 * Empuja el hero EFECTIVO del módulo al `<HeroBackgroundLayer>` del
 * `<HomeHeader>` (que es un Server Component estático y no reacciona por sí
 * solo al override del módulo). Úsalo en cada componente client de módulo
 * pasando el hero que el módulo realmente pinta arriba (`effective.heroImage`).
 *
 * Resolvemos el path con `resolveAssetUrl` para que el src coincida con el
 * `initialSrc` del SSR (paths relativos `assets/…` → URL servible). En runtime
 * real (sin Studio) el dispatch es idempotente: mismo URL que el SSR → no-op
 * visual. En el preview del Studio, el override actualiza el hero en vivo.
 *
 * El efecto depende de `[src, kind]`; el dispatch no re-dispara el efecto.
 */
export function useModuleHeroBridge(
  src: string | null | undefined,
  kind: 'image' | 'video' = 'image',
) {
  useEffect(() => {
    if (!src) return;
    dispatchModuleHero(resolveAssetUrl(src), kind);
  }, [src, kind]);
}
