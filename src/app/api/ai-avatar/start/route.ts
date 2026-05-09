import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

import { DEFAULT_CLIENT_SLUG, getClientSlug } from '@/lib/client-env';
import { getConfig } from '@/lib/config';

/**
 * `POST /api/ai-avatar/start`
 *
 * Crea una conversación CVI de Tavus para el cliente activo (KIOSK_CLIENT)
 * y devuelve la URL del iframe que el modal Ask AI embebe en lugar del
 * video placeholder.
 *
 * Lookup order de credenciales:
 *   1. clients/<slug>/config.json:integraciones.tavus_*  ← override per-cliente
 *   2. process.env.TAVUS_*                                ← default global
 *
 * Si faltan API key o replica_id, devuelve 503 con `{ ok: false }`. El modal
 * cae al modo "sin hero video" (option B aprobada por Rubén 2026-04-30).
 *
 * Custom greeting se compone de `textos.ai_greeting` con `{client_name}`
 * interpolado a `client.nombre` (mismo flujo que el modal hoy).
 */

const DEFAULT_API_URL = 'https://tavusapi.com/v2/';
const TIMEOUT_MS = 8000;

function readTavusCreds(
  cfg: Awaited<ReturnType<typeof getConfig>>,
): { apiKey: string; replicaId: string; personaId: string; apiUrl: string } | null {
  const intg = cfg.integraciones ?? {};
  const apiKey = intg.tavus_api_key || process.env.TAVUS_API_KEY || '';
  const replicaId = intg.tavus_replica_id || process.env.TAVUS_REPLICA_ID || '';
  const personaId = intg.tavus_persona_id || process.env.TAVUS_PERSONA_ID || '';
  const apiUrl = process.env.TAVUS_API_URL || DEFAULT_API_URL;
  if (!apiKey || !replicaId) return null;
  return { apiKey, replicaId, personaId, apiUrl };
}

async function readI18nGreeting(slug: string, locale: string): Promise<string | null> {
  const filePath = path.join(process.cwd(), 'clients', slug, 'i18n', `${locale}.json`);
  try {
    const raw = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, string>;
    const v = parsed.ai_greeting;
    return typeof v === 'string' && v.trim().length > 0 ? v : null;
  } catch {
    return null;
  }
}

async function buildGreeting(
  cfg: Awaited<ReturnType<typeof getConfig>>,
  overrideClientName?: string,
): Promise<string> {
  // Priorizamos el clientName del request body (Studio preview lo pasa con
  // el reactiveClientName del bridge). Sin override, fallback a cfg.
  const clientName =
    (overrideClientName?.trim().length ?? 0) > 0
      ? (overrideClientName as string).trim()
      : (cfg.client?.nombre ?? '');
  const slug = getClientSlug();
  const locale = cfg.client?.locale ?? 'en';

  // Prioridad de lookup (mismo orden que el AiModalHost):
  //   1. i18n/<locale>.json:ai_greeting  (la key oficial del kiosk)
  //   2. config.json:features.home.askAi.greeting  (fallback)
  //   3. config.json:textos.ai_greeting  (legacy)
  const askAi = (cfg.features?.home as { askAi?: { greeting?: string } } | undefined)?.askAi;
  const fromI18n = await readI18nGreeting(slug, locale);
  const fromI18nDefault =
    fromI18n ??
    (slug !== DEFAULT_CLIENT_SLUG ? await readI18nGreeting(DEFAULT_CLIENT_SLUG, locale) : null);
  const raw = fromI18nDefault ?? askAi?.greeting ?? cfg.textos?.ai_greeting ?? '';
  return raw.replaceAll('{client_name}', clientName).trim();
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const cfg = await getConfig();
    // Body opcional con override del clientName (Studio preview).
    let overrideClientName: string | undefined;
    try {
      const body = (await req.json()) as { clientName?: unknown } | null;
      if (body && typeof body.clientName === 'string') {
        overrideClientName = body.clientName;
      }
    } catch {
      /* sin body, está bien */
    }
    const creds = readTavusCreds(cfg);
    if (!creds) {
      const intg = cfg.integraciones ?? {};
      console.warn('[ai-avatar/start] missing creds', {
        hasApiKey: Boolean(process.env.TAVUS_API_KEY),
        hasReplicaId: Boolean(process.env.TAVUS_REPLICA_ID),
        hasPersonaId: Boolean(process.env.TAVUS_PERSONA_ID),
        hasApiUrl: Boolean(process.env.TAVUS_API_URL),
        intgHasApiKey: Boolean(intg.tavus_api_key),
        intgHasReplicaId: Boolean(intg.tavus_replica_id),
      });
      return NextResponse.json(
        {
          ok: false,
          message: 'Tavus credentials not configured.',
          diag: {
            envApiKey: Boolean(process.env.TAVUS_API_KEY),
            envReplicaId: Boolean(process.env.TAVUS_REPLICA_ID),
          },
        },
        { status: 503 },
      );
    }

    const greeting = await buildGreeting(cfg, overrideClientName);
    const body: Record<string, unknown> = {
      replica_id: creds.replicaId,
      conversation_name: `kiosk-${cfg.client.slug}-${Date.now()}`,
      properties: {
        max_call_duration: 600, // hard cap 10 min por sesión
        participant_left_timeout: 30,
        participant_absent_timeout: 60,
        enable_recording: false,
        // Closed captions + transcription on para overlay en el modal.
        enable_closed_captions: true,
        enable_transcription: true,
      },
    };
    if (creds.personaId) body.persona_id = creds.personaId;
    if (greeting) body.custom_greeting = greeting;
    console.info('[ai-avatar/start]', {
      conversation_name: body.conversation_name,
      replica_id: creds.replicaId,
      persona_id: creds.personaId || '(none)',
      greeting_chars: greeting.length,
    });

    const url = `${creds.apiUrl.replace(/\/+$/, '')}/conversations`;
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'x-api-key': creds.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[ai-avatar/start] Tavus error', res.status, text);
      return NextResponse.json(
        { ok: false, message: `Tavus responded ${res.status}.` },
        { status: 502 },
      );
    }

    const data = (await res.json()) as {
      conversation_id?: string;
      conversation_url?: string;
      status?: string;
    };
    if (!data.conversation_url || !data.conversation_id) {
      return NextResponse.json(
        { ok: false, message: 'Tavus response missing conversation_url/id.' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      conversationId: data.conversation_id,
      conversationUrl: data.conversation_url,
    });
  } catch (error) {
    console.error('[ai-avatar/start]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
