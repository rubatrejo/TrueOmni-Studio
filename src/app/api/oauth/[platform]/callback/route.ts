/**
 * OAuth callback — recibe `code` + `state`, intercambia por tokens y persiste
 * en `integrations.socialOauth.{platform}` del kiosk en KV. Después redirige
 * al editor del Studio para feedback visual.
 *
 *   GET /api/oauth/{platform}/callback?code=...&state=...
 *   → 302 a `/studio/{slug}` si OK.
 *   → 400/503 si algo falla (también renderea HTML mínimo con el error).
 *
 * Hallazgo #13 audit Studio (2026-05-05) · stub hasta que las credenciales
 * de developer estén configuradas.
 */

import { NextResponse } from 'next/server';

import { kv, kvKeys } from '@/lib/studio/kv';
import {
  buildCallbackUrl,
  isSocialPlatform,
  OAUTH_CONFIGS,
  readPlatformCredentials,
  type SocialPlatform,
} from '@/lib/studio/oauth-config';

interface DecodedState {
  slug: string;
  ts: number;
  platform: string;
}

function decodeState(raw: string): DecodedState | null {
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf-8');
    const parsed = JSON.parse(json) as DecodedState;
    if (typeof parsed.slug !== 'string' || typeof parsed.ts !== 'number') return null;
    // State expira a los 10 min (consent screen normal toma <2 min).
    if (Date.now() - parsed.ts > 10 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  // X / Twitter usan camelCase en algunos campos:
  scopes?: string[];
}

async function exchangeCodeForToken(
  platform: SocialPlatform,
  code: string,
  callbackUrl: string,
  clientId: string,
  clientSecret: string,
): Promise<TokenResponse> {
  const cfg = OAUTH_CONFIGS[platform];
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: callbackUrl,
    grant_type: 'authorization_code',
  });

  // X y TikTok requieren Authorization header con Basic auth en lugar de body.
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
  };
  if (platform === 'x') {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    headers.Authorization = `Basic ${basic}`;
  }

  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers,
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${cfg.label} token exchange failed (${res.status}): ${text}`);
  }
  return (await res.json()) as TokenResponse;
}

function htmlError(title: string, detail: string): NextResponse {
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>${title}</title>
<style>body{font:14px/1.5 system-ui,sans-serif;padding:40px;max-width:560px;margin:auto;color:#27272a}h1{font-size:18px}code{background:#f4f4f5;padding:2px 6px;border-radius:4px}</style>
<h1>${title}</h1><p>${detail}</p><p><a href="/studio">← Back to Studio</a></p>`,
    {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    },
  );
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  if (!isSocialPlatform(platform)) {
    return htmlError('OAuth error', `Unknown platform "${platform}".`);
  }

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const stateRaw = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  if (oauthError) {
    return htmlError(
      `${OAUTH_CONFIGS[platform].label} denied access`,
      `Provider returned <code>${oauthError}</code>. Try again from the Social Wall editor.`,
    );
  }
  if (!code || !stateRaw) {
    return htmlError('OAuth error', 'Missing <code>code</code> or <code>state</code> param.');
  }

  const state = decodeState(stateRaw);
  if (!state || state.platform !== platform) {
    return htmlError(
      'OAuth error',
      'State validation failed — request expired or tampered. Start the flow again.',
    );
  }

  const creds = readPlatformCredentials(platform);
  if (!creds.ok) {
    return htmlError(
      `${OAUTH_CONFIGS[platform].label} OAuth is not configured`,
      `Missing envvars: <code>${creds.missing.join(', ')}</code>. See <code>.planning/2026-05-06-social-oauth-handoff.md</code>.`,
    );
  }

  const callbackUrl = buildCallbackUrl(platform, url.origin);

  let token: TokenResponse;
  try {
    token = await exchangeCodeForToken(
      platform,
      code,
      callbackUrl,
      creds.clientId,
      creds.clientSecret,
    );
  } catch (err) {
    return htmlError(
      'OAuth exchange failed',
      err instanceof Error ? err.message : 'Unknown error during token exchange.',
    );
  }

  // Persistir al config del kiosk
  type StudioCfg = Record<string, unknown>;
  const cfgKey = kvKeys.cfg(state.slug);
  const cfg = ((await kv.get<StudioCfg>(cfgKey)) ?? {}) as StudioCfg;
  const integrations = ((cfg.integrations as Record<string, unknown>) ?? {}) as Record<
    string,
    unknown
  >;
  const socialOauth = ((integrations.socialOauth as Record<string, unknown>) ?? {}) as Record<
    string,
    unknown
  >;

  socialOauth[platform] = {
    connected: true,
    accessToken: token.access_token ?? '',
    refreshToken: token.refresh_token ?? '',
    expiresAt: token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000).toISOString()
      : '',
    scopes: token.scope
      ? token.scope.split(/[,\s]+/).filter(Boolean)
      : (token.scopes ?? OAUTH_CONFIGS[platform].scopes),
    handle: '', // El operador puede editarlo después; algunas APIs requieren un fetch extra.
  };

  await kv.set(cfgKey, {
    ...cfg,
    integrations: {
      ...integrations,
      socialOauth,
    },
  });

  // Redirect de vuelta al editor con un flag para que el Studio muestre toast.
  const studioUrl = new URL(`/studio/${state.slug}`, url.origin);
  studioUrl.searchParams.set('oauth', `${platform}:connected`);
  return NextResponse.redirect(studioUrl);
}
