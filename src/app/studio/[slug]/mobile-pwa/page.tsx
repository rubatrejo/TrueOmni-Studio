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

import { PwaShell } from './_components/PwaShell';

export const metadata = {
  title: 'Mobile PWA · TrueOmni Studio',
};

export const dynamic = 'force-dynamic';

/**
 * `/studio/[slug]/mobile-pwa` — Editor de la PWA Mobile del cliente.
 *
 * Reemplaza el stub "Coming Soon" (fase Pz). La PWA edita `features.pwa` como
 * un slice aislado (`pwa:<slug>` en KV) y hereda branding + data del kiosk.
 */
export default async function MobilePwaEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const manifest = await loadClientManifest(slug).catch(() => null);
  if (!manifest) notFound();

  // Si el producto está activo, asegura el slice en KV (idempotente).
  if (manifest.products.mobilePwa) {
    await ensurePwaSlice(slug).catch(() => {});
  }

  const [pwa, meta, unified, fsClient] = await Promise.all([
    loadPwaSlice(slug),
    loadPwaMeta(slug),
    loadUnifiedBranding(slug),
    // F-PWA-7: idiomas que el cliente ofrece (config kiosk), para que el editor
    // i18n traduzca a esos y no a una lista hardcodeada. Best-effort: si el fs no
    // tiene el cliente, el editor cae a su default.
    readClientFs(slug).catch(() => ({ config: null, tokensCss: null })),
  ]);
  const availableLocales = fsClient.config?.features?.languages?.available ?? null;
  const mapboxToken = fsClient.config?.integraciones?.mapbox_token ?? '';

  // systemModules del Kiosk (KV studioConfig) → fuente de la herencia de
  // visibilidad de módulos en la PWA. Fallback a defaults (todo ON) si el KV
  // está frío: la PWA hereda "todo visible", que es el estado sin customizar.
  const rawKiosk = await kv.get<KioskConfig>(kvKeys.cfg(slug)).catch(() => null);
  const kioskSystemModules = {
    ...DEFAULT_SYSTEM_MODULES,
    ...(rawKiosk?.modules?.systemModules ?? {}),
  };
  // Mapa key → image de las tiles del Kiosk → fuente de la herencia silenciosa
  // de imágenes de los tiles del Dashboard PWA (ver resolvePwaImages).
  const kioskTileImages: Record<string, string> = {};
  for (const t of rawKiosk?.modules?.tiles ?? []) {
    if (t.image) kioskTileImages[t.key] = t.image;
  }

  // Fallback defensivo: si el cliente aún no tiene unified branding, lo
  // materializamos con defaults para que el editor abra (edge case raro —
  // el auto-migrate normalmente ya lo creó).
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
      availableLocales={availableLocales}
      mapboxToken={mapboxToken}
    />
  );
}
