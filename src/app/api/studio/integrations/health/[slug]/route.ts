import { NextResponse } from 'next/server';

import {
  runIntegrationChecks,
  summarizeHealth,
  type IntegrationHealthSnapshot,
} from '@/lib/studio/integrations-health';
import { kv, kvKeys } from '@/lib/studio/kv';
import { studioLog } from '@/lib/studio/logger';
import { IntegrationsConfigSchema, type KioskConfig } from '@/lib/studio/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** TTL del snapshot de salud: 90 días en segundos. */
const HEALTH_TTL_SECONDS = 90 * 24 * 60 * 60;

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * `GET /api/studio/integrations/health/[slug]` — devuelve el último snapshot
 * de salud de integraciones persistido (o `null` si nunca se testeó).
 * Lo consume el badge del hub y el "Test all" del editor al montar.
 */
export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params;
  const snapshot = await kv.get<IntegrationHealthSnapshot>(kvKeys.integHealth(slug));
  return NextResponse.json({ slug, health: snapshot ?? null });
}

/**
 * `POST /api/studio/integrations/health/[slug]` — corre los checks de las
 * integraciones del cliente, persiste el snapshot y lo devuelve (F-HUB-7).
 *
 * Body opcional `{ integrations }`:
 *  - con `integrations` → testea la **working copy** del editor (incluye
 *    llaves sin guardar) → `source: 'working-copy'`.
 *  - sin body → lee `cfg:<slug>` de KV y testea la **config guardada** →
 *    `source: 'saved'`.
 *
 * Ambos escriben el mismo snapshot (`integ:<slug>:health`, TTL 90d); gana el
 * último que corrió.
 */
export async function POST(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  const origin = new URL(req.url).origin;

  // Body es opcional: puede venir vacío (modo "saved") o con la working copy.
  let raw: unknown = null;
  try {
    const text = await req.text();
    raw = text ? JSON.parse(text) : null;
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const provided = (raw as { integrations?: unknown } | null)?.integrations;

  let integrations: KioskConfig['integrations'];
  let source: IntegrationHealthSnapshot['source'];

  if (provided !== undefined) {
    const parsed = IntegrationsConfigSchema.safeParse(provided);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    integrations = parsed.data;
    source = 'working-copy';
  } else {
    const cfg = await kv.get<KioskConfig>(kvKeys.cfg(slug));
    if (!cfg) {
      return NextResponse.json({ error: 'no kiosk config for slug' }, { status: 404 });
    }
    integrations = cfg.integrations;
    source = 'saved';
  }

  const results = await runIntegrationChecks(integrations, { origin });
  const { totals, overall } = summarizeHealth(results);

  const snapshot: IntegrationHealthSnapshot = {
    computedAt: new Date().toISOString(),
    source,
    totals,
    overall,
    results,
  };

  await kv.set(kvKeys.integHealth(slug), snapshot, { ex: HEALTH_TTL_SECONDS });

  studioLog.info({
    event: 'integrations.health.done',
    slug,
    details: { source, ...totals, overall },
  });

  return NextResponse.json({ slug, health: snapshot });
}
