import { NextResponse } from 'next/server';

/**
 * `POST /api/studio/integrations/check`
 *
 * Body discriminated union por `kind`:
 *   - { kind: 'mapbox', token: string }
 *   - { kind: 'api', baseUrl: string }
 *   - { kind: 'analytics', gaId: string }
 *   - { kind: 'openweather', apiKey: string, city: string, units?: 'metric'|'imperial' }
 *
 * Devuelve `{ ok: boolean, message: string }`. Timeout 5s por request.
 */

const TIMEOUT_MS = 5000;

const GA_REGEX = /^(G-[A-Z0-9]+|UA-\d+-\d+)$/;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const kind = typeof body.kind === 'string' ? body.kind : '';

    switch (kind) {
      case 'mapbox':
        return NextResponse.json(await checkMapbox(String(body.token ?? '')));
      case 'api':
        return NextResponse.json(await checkApi(String(body.baseUrl ?? '')));
      case 'analytics':
        return NextResponse.json(checkAnalytics(String(body.gaId ?? '')));
      case 'openweather':
        return NextResponse.json(
          await checkOpenWeather(
            String(body.apiKey ?? ''),
            String(body.city ?? ''),
            (String(body.units ?? 'metric') as 'metric' | 'imperial') || 'metric',
          ),
        );
      case 'satisfi':
        return NextResponse.json(
          checkSatisfi(String(body.apiKey ?? ''), String(body.hubId ?? '')),
        );
      case 'tavus':
        return NextResponse.json(
          await checkTavus(String(body.apiKey ?? ''), String(body.replicaId ?? '')),
        );
      case 'bandwango':
        return NextResponse.json(
          checkBandwango(String(body.apiKey ?? ''), String(body.partnerId ?? '')),
        );
      case 'crowdriff':
        return NextResponse.json(
          checkCrowdriff(String(body.apiKey ?? ''), String(body.galleryId ?? '')),
        );
      case 'viator':
        return NextResponse.json(
          await checkViator(String(body.apiKey ?? ''), String(body.partnerId ?? '')),
        );
      default:
        return NextResponse.json(
          { ok: false, message: `Unknown kind "${kind}"` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('[api/studio/integrations/check]', error);
    const message = error instanceof Error ? error.message : 'Check failed';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

async function checkMapbox(token: string): Promise<{ ok: boolean; message: string }> {
  if (!token) return { ok: false, message: 'Token is empty.' };
  const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${encodeURIComponent(token)}`;
  try {
    const res = await fetchWithTimeout(url);
    if (res.ok) return { ok: true, message: 'Token valid (200 OK from Mapbox).' };
    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: `Invalid token (${res.status} from Mapbox).` };
    }
    return { ok: false, message: `Unexpected status ${res.status} from Mapbox.` };
  } catch (err) {
    const m = err instanceof Error ? err.message : 'Network error';
    return { ok: false, message: `Network error: ${m}` };
  }
}

async function checkApi(baseUrl: string): Promise<{ ok: boolean; message: string }> {
  const trimmed = baseUrl.trim();
  if (!trimmed) return { ok: false, message: 'Base URL is empty.' };
  if (!/^https?:\/\//i.test(trimmed)) {
    return { ok: false, message: 'Base URL must start with http:// or https://.' };
  }
  try {
    const res = await fetchWithTimeout(trimmed, { method: 'GET' });
    if (res.ok) return { ok: true, message: `Reachable (${res.status} ${res.statusText}).` };
    return { ok: false, message: `Server responded ${res.status} ${res.statusText}.` };
  } catch (err) {
    const m = err instanceof Error ? err.message : 'Network error';
    return { ok: false, message: `Network error: ${m}` };
  }
}

function checkAnalytics(gaId: string): { ok: boolean; message: string } {
  const trimmed = gaId.trim();
  if (!trimmed) return { ok: false, message: 'ID is empty.' };
  if (GA_REGEX.test(trimmed)) {
    return {
      ok: true,
      message: `Format valid (${trimmed.startsWith('G-') ? 'GA4' : 'Universal Analytics'}).`,
    };
  }
  return { ok: false, message: 'Use G-XXXXXXX (GA4) or UA-XXXXX-X (Universal).' };
}

function checkSatisfi(apiKey: string, hubId: string): { ok: boolean; message: string } {
  const k = apiKey.trim();
  const h = hubId.trim();
  if (!k) return { ok: false, message: 'API key is empty.' };
  if (!h) return { ok: false, message: 'Hub ID is empty.' };
  if (k.length < 16) return { ok: false, message: 'API key looks too short.' };
  return {
    ok: true,
    message: `Credentials format valid · hub ${h}.`,
  };
}

async function checkTavus(
  apiKey: string,
  replicaId: string,
): Promise<{ ok: boolean; message: string }> {
  const k = apiKey.trim();
  if (!k) return { ok: false, message: 'API key is empty.' };
  // Tavus API: https://docs.tavus.io — the replicas list endpoint validates the key cheaply.
  try {
    const res = await fetchWithTimeout('https://tavusapi.com/v2/replicas?limit=1', {
      headers: { 'x-api-key': k },
    });
    if (res.ok) {
      return {
        ok: true,
        message: replicaId.trim()
          ? `API key valid · using replica ${replicaId.trim()}.`
          : 'API key valid · pick a replica ID below.',
      };
    }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: `Invalid API key (${res.status} from Tavus).` };
    }
    return { ok: false, message: `Unexpected status ${res.status} from Tavus.` };
  } catch (err) {
    const m = err instanceof Error ? err.message : 'Network error';
    return { ok: false, message: `Network error: ${m}` };
  }
}

function checkBandwango(apiKey: string, partnerId: string): { ok: boolean; message: string } {
  const k = apiKey.trim();
  const p = partnerId.trim();
  if (!k) return { ok: false, message: 'API key is empty.' };
  if (!p) return { ok: false, message: 'Partner ID is empty.' };
  if (k.length < 16) return { ok: false, message: 'API key looks too short.' };
  return {
    ok: true,
    message: `Credentials format valid · partner ${p}.`,
  };
}

function checkCrowdriff(apiKey: string, galleryId: string): { ok: boolean; message: string } {
  const k = apiKey.trim();
  const g = galleryId.trim();
  if (!k) return { ok: false, message: 'API key is empty.' };
  if (!g) return { ok: false, message: 'Gallery ID is empty.' };
  if (k.length < 16) return { ok: false, message: 'API key looks too short.' };
  return {
    ok: true,
    message: `Credentials format valid · gallery ${g}.`,
  };
}

async function checkViator(
  apiKey: string,
  partnerId: string,
): Promise<{ ok: boolean; message: string }> {
  const k = apiKey.trim();
  const p = partnerId.trim();
  if (!k) return { ok: false, message: 'API key is empty.' };
  // Viator Partner API: validamos formato + ping al endpoint de taxonomy
  // que es liviano y devuelve 401 si la key es inválida.
  try {
    const res = await fetchWithTimeout(
      'https://api.viator.com/partner/taxonomy/destinations?count=1',
      {
        headers: {
          'exp-api-key': k,
          Accept: 'application/json;version=2.0',
          'Accept-Language': 'en-US',
        },
      },
    );
    if (res.ok) {
      return {
        ok: true,
        message: p ? `API key valid · partner ${p}.` : 'API key valid.',
      };
    }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: `Invalid API key (${res.status} from Viator).` };
    }
    return { ok: false, message: `Unexpected status ${res.status} from Viator.` };
  } catch (err) {
    const m = err instanceof Error ? err.message : 'Network error';
    return { ok: false, message: `Network error: ${m}` };
  }
}

async function checkOpenWeather(
  apiKey: string,
  city: string,
  units: 'metric' | 'imperial',
): Promise<{ ok: boolean; message: string }> {
  if (!apiKey) return { ok: false, message: 'API key is empty.' };
  if (!city) return { ok: false, message: 'City is empty.' };
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${encodeURIComponent(apiKey)}&units=${units}`;
  try {
    const res = await fetchWithTimeout(url);
    if (res.ok) {
      const data = (await res.json()) as { name?: string; main?: { temp?: number } };
      const temp = data?.main?.temp;
      const unitSymbol = units === 'metric' ? '°C' : '°F';
      const tempText = typeof temp === 'number' ? ` (${temp}${unitSymbol} now)` : '';
      return {
        ok: true,
        message: `Connected to "${data?.name ?? city}"${tempText}.`,
      };
    }
    if (res.status === 401) {
      return { ok: false, message: 'Invalid API key (401 from OpenWeather).' };
    }
    if (res.status === 404) {
      return { ok: false, message: `City "${city}" not found (404).` };
    }
    return { ok: false, message: `Unexpected status ${res.status} from OpenWeather.` };
  } catch (err) {
    const m = err instanceof Error ? err.message : 'Network error';
    return { ok: false, message: `Network error: ${m}` };
  }
}
