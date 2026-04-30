import { NextResponse } from 'next/server';

import { getConfig } from '@/lib/config';

/**
 * `POST /api/ai-avatar/end/<conversationId>`
 *
 * Cierra una conversación CVI de Tavus para que no siga consumiendo minutos
 * cuando el modal Ask AI se cierra. Idempotente: si la conversación ya no
 * existe, devolvemos `ok: true` igualmente.
 */

const DEFAULT_API_URL = 'https://tavusapi.com/v2/';
const TIMEOUT_MS = 5000;
const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    if (!ID_PATTERN.test(id)) {
      return NextResponse.json({ ok: false, message: 'Invalid id.' }, { status: 400 });
    }

    const cfg = await getConfig();
    const intg = cfg.integraciones ?? {};
    const apiKey = intg.tavus_api_key || process.env.TAVUS_API_KEY || '';
    const apiUrl = process.env.TAVUS_API_URL || DEFAULT_API_URL;
    if (!apiKey) {
      // Sin key no hay nada que terminar. No es un error desde la perspectiva
      // del kiosk — el modal ya se cerró y no quedan recursos colgando.
      return NextResponse.json({ ok: true, skipped: true });
    }

    const url = `${apiUrl.replace(/\/+$/, '')}/conversations/${encodeURIComponent(id)}/end`;
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
    });
    // Tavus devuelve 200 en éxito, 404 si ya no existe → ambos OK desde nuestro lado.
    if (res.ok || res.status === 404) {
      return NextResponse.json({ ok: true });
    }
    const text = await res.text().catch(() => '');
    console.error('[ai-avatar/end]', res.status, text);
    return NextResponse.json(
      { ok: false, message: `Tavus responded ${res.status}.` },
      { status: 502 },
    );
  } catch (error) {
    console.error('[ai-avatar/end]', error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
