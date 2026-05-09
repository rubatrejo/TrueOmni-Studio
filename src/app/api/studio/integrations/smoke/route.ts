import { NextResponse, type NextRequest } from 'next/server';

import { listClientSlugs } from '@/lib/studio/client-manifest';
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
 * Solo se lanza el check para integraciones que tienen credentials no
 * vacíos. Las "configured: false" se reportan con `skipped` para que el
 * operador vea cuáles del catálogo no están conectadas.
 *
 * Concurrency 4 — los providers son externos y queremos respetar rate
 * limits razonables.
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
    const integrations = await runChecksForKiosk(slug, cfg, origin);
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

type CheckStatus = 'ok' | 'failed' | 'skipped';

interface IntegrationSmoke {
  kind: string;
  status: CheckStatus;
  message?: string;
}

interface ClientSmokeResult {
  slug: string;
  name?: string;
  error?: string;
  integrations: IntegrationSmoke[];
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

async function runChecksForKiosk(
  slug: string,
  cfg: KioskConfig,
  origin: string,
): Promise<IntegrationSmoke[]> {
  const integ = cfg.integrations;
  const checks: Array<Promise<IntegrationSmoke>> = [];

  if (integ?.mapbox?.token) {
    checks.push(callCheck(origin, { kind: 'mapbox', token: integ.mapbox.token }));
  } else {
    checks.push(skip('mapbox'));
  }

  if (integ?.api?.baseUrl) {
    checks.push(callCheck(origin, { kind: 'api', baseUrl: integ.api.baseUrl }));
  } else {
    checks.push(skip('api'));
  }

  if (integ?.analytics?.gaId) {
    checks.push(callCheck(origin, { kind: 'analytics', gaId: integ.analytics.gaId }));
  } else {
    checks.push(skip('analytics'));
  }

  // openweather solo si provider="openweather" + key + city
  if (
    integ?.weather?.provider === 'openweather' &&
    integ.weather.apiKey &&
    integ.weather.city
  ) {
    checks.push(
      callCheck(origin, {
        kind: 'openweather',
        apiKey: integ.weather.apiKey,
        city: integ.weather.city,
        units: integ.weather.units ?? 'metric',
      }),
    );
  } else {
    checks.push(skip('openweather'));
  }

  if (integ?.satisfi?.apiKey && integ.satisfi.hubId) {
    checks.push(
      callCheck(origin, {
        kind: 'satisfi',
        apiKey: integ.satisfi.apiKey,
        hubId: integ.satisfi.hubId,
      }),
    );
  } else {
    checks.push(skip('satisfi'));
  }

  if (integ?.tavus?.apiKey) {
    checks.push(
      callCheck(origin, {
        kind: 'tavus',
        apiKey: integ.tavus.apiKey,
        replicaId: integ.tavus.replicaId ?? '',
      }),
    );
  } else {
    checks.push(skip('tavus'));
  }

  // Concurrency limit: el endpoint upstream puede tirar rate-limits si
  // disparamos 8 a la vez para 20 clientes. Lo limitamos a 4 in-flight.
  const out: IntegrationSmoke[] = [];
  const CONCURRENCY = 4;
  for (let i = 0; i < checks.length; i += CONCURRENCY) {
    const batch = await Promise.all(checks.slice(i, i + CONCURRENCY));
    out.push(...batch);
  }

  // Si hubo failed, log estructurado para alertas.
  const failed = out.filter((c) => c.status === 'failed');
  if (failed.length > 0) {
    studioLog.warn({
      event: 'integrations.smoke.failed',
      slug,
      details: { failed },
    });
  }

  return out;
}

function skip(kind: string): Promise<IntegrationSmoke> {
  return Promise.resolve({ kind, status: 'skipped', message: 'not configured' });
}

async function callCheck(
  origin: string,
  payload: Record<string, unknown> & { kind: string },
): Promise<IntegrationSmoke> {
  try {
    const res = await fetch(`${origin}/api/studio/integrations/check`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const body = (await res.json()) as { ok?: boolean; message?: string };
    return {
      kind: payload.kind,
      status: body.ok ? 'ok' : 'failed',
      message: body.message,
    };
  } catch (e) {
    return {
      kind: payload.kind,
      status: 'failed',
      message: e instanceof Error ? e.message : 'check failed',
    };
  }
}
