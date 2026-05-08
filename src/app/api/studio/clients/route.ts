import { NextResponse } from 'next/server';

import { autoMigrateClients } from '@/lib/studio/auto-migrate-clients';
import {
  loadUnifiedBranding,
  toHex,
} from '@/lib/studio/client-branding-sync';
import {
  listClientSlugs,
  loadClientManifest,
  type ClientManifest,
} from '@/lib/studio/client-manifest';

export const dynamic = 'force-dynamic';

export interface ClientSummary {
  slug: string;
  name: string;
  products: ClientManifest['products'];
  /** Hex derivado del unified branding HSL — útil para gradient hero del card. */
  brandPrimaryHex: string;
  brandSecondaryHex: string;
  brandAccentHex: string;
  /** Logo principal (path o data URL). Vacío si el cliente no subió logo. */
  logoUrl: string;
  /** Última edición — del manifest. */
  lastEditedAt: string;
  lastEditor?: string;
}

/**
 * `GET /api/studio/clients` — lista de clientes unificados (post-Fase 2).
 *
 * Auto-migra clientes pre-refactor antes de servir la respuesta. Devuelve
 * un summary listo para renderizar las cards del dashboard `/studio`.
 *
 * Idempotente: re-correrlo no afecta clientes ya migrados.
 *
 * Plan: `~/.claude/plans/ok-listo-ahora-quiero-wondrous-sphinx.md`.
 */
export async function GET() {
  // 1. Auto-migración lazy. Idempotente.
  await autoMigrateClients();

  // 2. Recuperar lista canónica + manifests en paralelo.
  const slugs = await listClientSlugs();
  const summaries = await Promise.all(
    slugs.map(async (slug): Promise<ClientSummary | null> => {
      const [manifest, branding] = await Promise.all([
        loadClientManifest(slug),
        loadUnifiedBranding(slug),
      ]);
      if (!manifest || !branding) return null;
      return {
        slug,
        name: manifest.name,
        products: manifest.products,
        brandPrimaryHex: toHex(branding.brand.primary),
        brandSecondaryHex: toHex(branding.brand.secondary),
        brandAccentHex: toHex(branding.brand.accent),
        logoUrl: branding.logos.default ?? '',
        lastEditedAt: manifest.lastEditedAt,
        lastEditor: manifest.lastEditor,
      };
    }),
  );

  const clients = summaries
    .filter((s): s is ClientSummary => s !== null)
    .sort((a, b) => {
      // `default` siempre primero.
      if (a.slug === 'default') return -1;
      if (b.slug === 'default') return 1;
      return a.name.localeCompare(b.name);
    });

  return NextResponse.json({ clients });
}
