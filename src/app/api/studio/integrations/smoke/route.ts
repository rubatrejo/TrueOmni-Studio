import { NextResponse, type NextRequest } from 'next/server';

import { listClientSlugs } from '@/lib/studio/client-manifest';
import {
  runIntegrationChecks,
  type IntegrationCheckResult,
} from '@/lib/studio/integrations-health';
import { kv, kvKeys } from '@/lib/studio/kv';
import { studioLog } from '@/lib/studio/logger';
import type { KioskConfig } from '@/lib/studio/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * `GET /api/studio/integrations/smoke` — recorre todos los clientes con
 * kiosk activo y dispara el check existente
 * (`POST /api/studio/integrations/check`) para cada integración configurada.
 *
 * Hallazgo S-45 del audit panorámico v2: el tab Integrations tenía un
 * botón "Check" por integración pero no había forma de saber si todas las
 * llaves seguían vivas (rotation de tokens, providers caídos, etc.). Este
 * endpoint sirve la vista batch consumida desde /studio/diagnostics.
 *
 * La lógica de "qué checks correr y cómo" vive en
 * `@/lib/studio/integrations-health` (motor compartido con el endpoint
 * por-cliente `/integrations/health/[slug]`, F-HUB-7). Solo se lanza el check
 * para integraciones con credenciales no vacías; las no configuradas se
 * reportan con `skipped`.
 */
export async function GET(req: NextRequest) {
  const slugs = await listClientSlugs();
  const origin = new URL(req.url).origin;

  const results: ClientSmokeResult[] = [];
  for (const slug of slugs) {
    const cfg = await kv.get<KioskConfig>(kvKeys.cfg(slug));
    if (!cfg) {
      results.push({ slug, error: 'no kiosk config', integrations: [] });
      continue;
    }
    const integrations = await runIntegrationChecks(cfg.integrations, { origin });

    const failed = integrations.filter((c) => c.status === 'failed');
    if (failed.length > 0) {
      studioLog.warn({ event: 'integrations.smoke.failed', slug, details: { failed } });
    }

    results.push({ slug, name: cfg.nombre, integrations });
  }

  const totals = computeTotals(results);
  studioLog.info({
    event: 'integrations.smoke.done',
    details: { ...totals },
  });

  return NextResponse.json({
    computedAt: new Date().toISOString(),
    totals,
    clients: results,
  });
}

interface ClientSmokeResult {
  slug: string;
  name?: string;
  error?: string;
  integrations: IntegrationCheckResult[];
}

interface SmokeTotals {
  clients: number;
  ok: number;
  failed: number;
  skipped: number;
}

function computeTotals(results: ClientSmokeResult[]): SmokeTotals {
  let ok = 0;
  let failed = 0;
  let skipped = 0;
  for (const r of results) {
    for (const i of r.integrations) {
      if (i.status === 'ok') ok += 1;
      else if (i.status === 'failed') failed += 1;
      else skipped += 1;
    }
  }
  return { clients: results.length, ok, failed, skipped };
}
