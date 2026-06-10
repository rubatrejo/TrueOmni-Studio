import 'server-only';

import type { IntegrationsConfig } from '@/lib/studio/schema';

/**
 * Motor de salud de integraciones (F-HUB-7 del audit STUDIO-AUDIT-2026-06-09).
 *
 * Centraliza la lógica que antes vivía inline en
 * `api/studio/integrations/smoke/route.ts`: a partir de la config de
 * integraciones de un cliente, decide qué checks correr y los dispara contra
 * el endpoint existente `POST /api/studio/integrations/check` (self-fetch,
 * mismo patrón que el smoke, con límite de concurrencia).
 *
 * Se consume desde dos sitios:
 *  - el smoke global (`/integrations/smoke`) — barrido de todos los clientes;
 *  - el endpoint por-cliente (`/integrations/health/[slug]`) que persiste el
 *    último snapshot para el badge del hub y el "Test all" del editor.
 *
 * NO se extraen las funciones de check (mapbox/tavus/...) a este módulo: viven
 * en `/integrations/check/route.ts` y se reusan por HTTP. Decisión de diseño:
 * menor churn/riesgo (ver DESIGN F-HUB-7 §2).
 */

export type IntegrationKind =
  | 'mapbox'
  | 'api'
  | 'analytics'
  | 'openweather'
  | 'satisfi'
  | 'tavus'
  | 'bandwango'
  | 'crowdriff'
  | 'viator';

export type CheckStatus = 'ok' | 'failed' | 'skipped';

export interface IntegrationCheckResult {
  kind: IntegrationKind;
  status: CheckStatus;
  message?: string;
}

export type HealthSource = 'working-copy' | 'saved';
export type OverallHealth = 'healthy' | 'degraded' | 'untested';

export interface HealthTotals {
  /** Checks que pasaron. */
  ok: number;
  /** Checks que fallaron (credencial configurada pero inválida/inalcanzable). */
  failed: number;
  /** Integraciones sin credenciales → no se testean. */
  skipped: number;
  /** Integraciones con credenciales (ok + failed). */
  configured: number;
}

export interface IntegrationHealthSnapshot {
  /** ISO timestamp del momento del barrido. */
  computedAt: string;
  /** De dónde salió la config testeada: la copia en edición o la guardada en KV. */
  source: HealthSource;
  totals: HealthTotals;
  overall: OverallHealth;
  results: IntegrationCheckResult[];
}

/** Payload tipado por `kind` que espera `POST /integrations/check`. */
type CheckPayload = { kind: IntegrationKind } & Record<string, unknown>;

/**
 * Construye, a partir de la config, la lista ordenada de checks a correr.
 * Cada entrada trae su `payload` (→ se testea) o `null` (→ se reporta como
 * `skipped`, sin credenciales). Cubre los 9 providers con check disponible.
 */
export function buildChecks(
  integ: IntegrationsConfig | undefined,
): Array<{ kind: IntegrationKind; payload: CheckPayload | null }> {
  return [
    {
      kind: 'mapbox',
      payload: integ?.mapbox?.token ? { kind: 'mapbox', token: integ.mapbox.token } : null,
    },
    {
      kind: 'api',
      payload: integ?.api?.baseUrl ? { kind: 'api', baseUrl: integ.api.baseUrl } : null,
    },
    {
      kind: 'analytics',
      payload: integ?.analytics?.gaId ? { kind: 'analytics', gaId: integ.analytics.gaId } : null,
    },
    {
      // openweather solo si provider="openweather" + key + city
      kind: 'openweather',
      payload:
        integ?.weather?.provider === 'openweather' && integ.weather.apiKey && integ.weather.city
          ? {
              kind: 'openweather',
              apiKey: integ.weather.apiKey,
              city: integ.weather.city,
              units: integ.weather.units ?? 'metric',
            }
          : null,
    },
    {
      kind: 'satisfi',
      payload:
        integ?.satisfi?.apiKey && integ.satisfi.hubId
          ? { kind: 'satisfi', apiKey: integ.satisfi.apiKey, hubId: integ.satisfi.hubId }
          : null,
    },
    {
      kind: 'tavus',
      payload: integ?.tavus?.apiKey
        ? { kind: 'tavus', apiKey: integ.tavus.apiKey, replicaId: integ.tavus.replicaId ?? '' }
        : null,
    },
    {
      kind: 'bandwango',
      payload:
        integ?.bandwango?.apiKey && integ.bandwango.partnerId
          ? {
              kind: 'bandwango',
              apiKey: integ.bandwango.apiKey,
              partnerId: integ.bandwango.partnerId,
            }
          : null,
    },
    {
      kind: 'crowdriff',
      payload:
        integ?.crowdriff?.apiKey && integ.crowdriff.galleryId
          ? {
              kind: 'crowdriff',
              apiKey: integ.crowdriff.apiKey,
              galleryId: integ.crowdriff.galleryId,
            }
          : null,
    },
    {
      kind: 'viator',
      payload:
        integ?.viator?.apiKey && integ.viator.partnerId
          ? { kind: 'viator', apiKey: integ.viator.apiKey, partnerId: integ.viator.partnerId }
          : null,
    },
  ];
}

/**
 * Corre los checks de una config contra `POST /integrations/check`.
 * Concurrency 4 — los providers son externos y queremos respetar rate
 * limits razonables (mismo límite que el smoke previo).
 */
export async function runIntegrationChecks(
  integ: IntegrationsConfig | undefined,
  { origin }: { origin: string },
): Promise<IntegrationCheckResult[]> {
  const specs = buildChecks(integ);

  const tasks: Array<Promise<IntegrationCheckResult>> = specs.map((spec) =>
    spec.payload === null
      ? Promise.resolve<IntegrationCheckResult>({
          kind: spec.kind,
          status: 'skipped',
          message: 'not configured',
        })
      : callCheck(origin, spec.kind, spec.payload),
  );

  const out: IntegrationCheckResult[] = [];
  const CONCURRENCY = 4;
  for (let i = 0; i < tasks.length; i += CONCURRENCY) {
    const batch = await Promise.all(tasks.slice(i, i + CONCURRENCY));
    out.push(...batch);
  }
  return out;
}

/** Totales + estado global derivados de la lista de resultados. */
export function summarizeHealth(results: IntegrationCheckResult[]): {
  totals: HealthTotals;
  overall: OverallHealth;
} {
  let ok = 0;
  let failed = 0;
  let skipped = 0;
  for (const r of results) {
    if (r.status === 'ok') ok += 1;
    else if (r.status === 'failed') failed += 1;
    else skipped += 1;
  }
  const configured = ok + failed;
  const overall: OverallHealth = failed > 0 ? 'degraded' : configured > 0 ? 'healthy' : 'untested';
  return { totals: { ok, failed, skipped, configured }, overall };
}

async function callCheck(
  origin: string,
  kind: IntegrationKind,
  payload: CheckPayload,
): Promise<IntegrationCheckResult> {
  try {
    const res = await fetch(`${origin}/api/studio/integrations/check`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const body = (await res.json()) as { ok?: boolean; message?: string };
    return { kind, status: body.ok ? 'ok' : 'failed', message: body.message };
  } catch (e) {
    return {
      kind,
      status: 'failed',
      message: e instanceof Error ? e.message : 'check failed',
    };
  }
}
