import { notFound } from 'next/navigation';

import { readClientFs } from '@/lib/studio/bootstrap-from-fs';
import {
  loadUnifiedBranding,
  unifiedToKioskBranding,
  UnifiedClientBrandingSchema,
  type UnifiedClientBranding,
} from '@/lib/studio/client-branding-sync';
import { loadClientManifest } from '@/lib/studio/client-manifest';
import { kv, kvKeys } from '@/lib/studio/kv';
import { ensurePwaSlice, loadPwaMeta, loadPwaSlice } from '@/lib/studio/pwa-config';
import { DEFAULT_SYSTEM_MODULES, type KioskConfig } from '@/lib/studio/schema';

import { PwaShell } from '../mobile-pwa/_components/PwaShell';

export const metadata = {
  title: 'Tablets · TrueOmni Studio',
};

export const dynamic = 'force-dynamic';

/**
 * `/studio/[slug]/tablets` — Editor del producto **Tablet** del cliente.
 *
 * El Tablet REUTILIZA todo el editor y los datos de la PWA (`features.pwa`,
 * branding, módulos heredados): es la misma app en otro form-factor. Por eso
 * monta el MISMO `PwaShell` que `mobile-pwa/page.tsx`, con `deviceOverride="tablet"`
 * para que el preview se vea en tablet (tabs Portrait/Landscape). La activación
 * ESPEJA a la PWA: si el cliente tiene `mobilePwa`, el slice PWA está asegurado.
 */
export default async function TabletsEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const manifest = await loadClientManifest(slug).catch(() => null);
  if (!manifest) notFound();

  // Tablet espeja a la PWA: si la PWA está activa, asegura su slice (idempotente).
  if (manifest.products.mobilePwa) {
    await ensurePwaSlice(slug).catch(() => {});
  }

  const [pwa, meta, unified, fsClient] = await Promise.all([
    loadPwaSlice(slug),
    loadPwaMeta(slug),
    loadUnifiedBranding(slug),
    readClientFs(slug).catch(() => ({ config: null, tokensCss: null })),
  ]);
  const availableLocales = fsClient.config?.features?.languages?.available ?? null;
  const defaultLocale = fsClient.config?.features?.languages?.default ?? 'en';
  const mapboxToken = fsClient.config?.integraciones?.mapbox_token ?? '';

  const rawKiosk = await kv.get<KioskConfig>(kvKeys.cfg(slug)).catch(() => null);
  const kioskSystemModules = {
    ...DEFAULT_SYSTEM_MODULES,
    ...(rawKiosk?.modules?.systemModules ?? {}),
  };
  const kioskTileImages: Record<string, string> = {};
  const kioskTileLabels: Record<string, string> = {};
  for (const t of rawKiosk?.modules?.tiles ?? []) {
    if (t.image) kioskTileImages[t.key] = t.image;
    if (t.label) kioskTileLabels[t.key] = t.label;
  }
  const bbBg = rawKiosk?.billboard?.background;
  const brandIdle = rawKiosk?.branding?.idleBackground;
  const kioskIdleBackground = bbBg?.src
    ? bbBg
    : brandIdle?.src
      ? {
          type: brandIdle.kind === 'image' ? ('image' as const) : ('video' as const),
          src: brandIdle.src,
        }
      : undefined;

  const branding: UnifiedClientBranding =
    unified ??
    UnifiedClientBrandingSchema.parse({
      name: manifest.name,
      brand: { primary: '#079EE2', secondary: '#0b4f8a', accent: '#b8a03e' },
      logos: { default: '' },
    });

  return (
    <PwaShell
      slug={slug}
      nombre={manifest.name}
      initialPwa={pwa}
      initialMeta={meta}
      initialBranding={unifiedToKioskBranding(branding)}
      initialUnified={branding}
      kioskSystemModules={kioskSystemModules}
      kioskTileImages={kioskTileImages}
      kioskTileLabels={kioskTileLabels}
      kioskIdleBackground={kioskIdleBackground}
      availableLocales={availableLocales}
      defaultLocale={defaultLocale}
      mapboxToken={mapboxToken}
      deviceOverride="tablet"
      productLabel="Tablets"
    />
  );
}
