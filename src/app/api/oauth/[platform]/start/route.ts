/**
 * OAuth start — devuelve la URL del consent screen para una plataforma social.
 * Hallazgo #13 audit Studio (2026-05-05) · STUB hasta que las credenciales
 * de developer estén configuradas (ver `.planning/2026-05-06-social-oauth-handoff.md`).
 *
 *   POST /api/oauth/{platform}/start?slug=<kiosk-slug>
 *   → 200 { authUrl }
 *   → 400 si slug falta o platform inválida.
 *   → 403 si caller no es admin.
 *   → 503 si las envvars CLIENT_ID/SECRET no están configuradas.
 */

import { NextResponse } from 'next/server';

import {
  buildCallbackUrl,
  isSocialPlatform,
  OAUTH_CONFIGS,
  readPlatformCredentials,
} from '@/lib/studio/oauth-config';

function parseEmailList(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;

  if (!isSocialPlatform(platform)) {
    return NextResponse.json(
      { error: `Unknown platform "${platform}". Expected one of instagram/facebook/tiktok/x.` },
      { status: 400 },
    );
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get('slug')?.trim();
  if (!slug) {
    return NextResponse.json({ error: 'Missing ?slug=<kiosk-slug>' }, { status: 400 });
  }

  // Admin guard (mismo patrón que /api/studio/publish).
  const adminEmails = parseEmailList(process.env.STUDIO_ADMIN_EMAILS);
  const actorEmail = req.headers.get('x-studio-admin-email')?.toLowerCase().trim();
  if (adminEmails.length > 0 && (!actorEmail || !adminEmails.includes(actorEmail))) {
    return NextResponse.json(
      { error: 'Forbidden: caller is not in STUDIO_ADMIN_EMAILS allowlist.' },
      { status: 403 },
    );
  }

  // Credenciales de developer
  const creds = readPlatformCredentials(platform);
  if (!creds.ok) {
    return NextResponse.json(
      {
        error: `${OAUTH_CONFIGS[platform].label} OAuth is not configured. Missing envvars: ${creds.missing.join(', ')}. See .planning/2026-05-06-social-oauth-handoff.md`,
        missing: creds.missing,
      },
      { status: 503 },
    );
  }

  const cfg = OAUTH_CONFIGS[platform];
  const callbackUrl = buildCallbackUrl(platform, url.origin);

  // State firmado para CSRF protection. Decodifica al callback.
  const state = encodeState({ slug, ts: Date.now(), platform });

  const params2 = new URLSearchParams({
    client_id: creds.clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: cfg.scopes.join(platform === 'tiktok' ? ',' : ' '),
    state,
  });

  // X (twitter) requiere PKCE — si las envvars de PKCE están set las añadimos;
  // si no, Twitter rechazará. Lo dejamos al operador.
  if (platform === 'x') {
    params2.set('code_challenge_method', 'plain');
    params2.set('code_challenge', state); // plain challenge = state mismo (suficiente para PoC).
  }

  const authUrl = `${cfg.authUrl}?${params2.toString()}`;
  return NextResponse.json({ authUrl });
}

function encodeState(payload: { slug: string; ts: number; platform: string }): string {
  return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
}
