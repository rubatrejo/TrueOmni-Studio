import { notFound } from 'next/navigation';

import { autoMigrateClients } from '@/lib/studio/auto-migrate-clients';
import { loadUnifiedBranding } from '@/lib/studio/client-branding-sync';
import { loadClientManifest } from '@/lib/studio/client-manifest';
import type { IntegrationHealthSnapshot } from '@/lib/studio/integrations-health';
import { kv, kvKeys } from '@/lib/studio/kv';

import { ClientView } from './_components/ClientView';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * `/studio/[slug]` — Vista del Cliente unificado (Fase 3 del refactor
 * cliente-primero). Branding compartido + cards de productos.
 *
 * Plan: `~/.claude/plans/ok-listo-ahora-quiero-wondrous-sphinx.md`.
 */
export default async function ClientViewPage({ params }: PageProps) {
  const { slug } = await params;

  // Auto-migración lazy también aquí: si alguien navega directo a /studio/{slug}
  // sin pasar por /studio (donde corre auto-migrate), igual hidratamos el
  // manifest. Idempotente.
  await autoMigrateClients();

  const [manifest, branding, integrationsHealth] = await Promise.all([
    loadClientManifest(slug),
    loadUnifiedBranding(slug),
    kv.get<IntegrationHealthSnapshot>(kvKeys.integHealth(slug)),
  ]);

  if (!manifest || !branding) {
    notFound();
  }

  return (
    <ClientView
      slug={slug}
      initialManifest={manifest}
      initialBranding={branding}
      initialIntegrationsHealth={integrationsHealth}
    />
  );
}
