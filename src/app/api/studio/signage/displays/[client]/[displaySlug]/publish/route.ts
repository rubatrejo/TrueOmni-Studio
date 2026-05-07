import { NextResponse, type NextRequest } from 'next/server';

import { kvSignageDisplay } from '@/lib/signage/kv-store';
import { buildSignageDisplayPublishFiles } from '@/lib/signage/publish-files';
import { getGitHubPublishConfig, publishToGitHub } from '@/lib/studio/github-publisher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ client: string; displaySlug: string }>;
}

/**
 * `POST .../publish` — Crea un PR contra `clients-signage/<client>/displays/
 * <displaySlug>/display.json` con auto-merge habilitado.
 *
 * Reusa `github-publisher.ts` del kiosk. Requiere env:
 *   STUDIO_GITHUB_TOKEN, STUDIO_GITHUB_OWNER, STUDIO_GITHUB_REPO.
 *
 * Si falta config → 503 con mensaje claro.
 */
export async function POST(_req: NextRequest, ctx: RouteContext) {
  const { client, displaySlug } = await ctx.params;

  const config = getGitHubPublishConfig();
  if (!config) {
    return NextResponse.json(
      {
        error:
          'GitHub publish not configured. Set STUDIO_GITHUB_TOKEN / OWNER / REPO env.',
      },
      { status: 503 },
    );
  }

  const display = await kvSignageDisplay.get(client, displaySlug);
  if (!display) {
    return NextResponse.json(
      { error: 'Display not in KV. Save first, then publish.' },
      { status: 404 },
    );
  }

  const files = buildSignageDisplayPublishFiles(client, displaySlug, display);

  try {
    const result = await publishToGitHub(config, `signage-${client}-${displaySlug}`, files, {
      commitMessage: `feat(signage): publish ${client}/${displaySlug}`,
      autoMerge: true,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[signage:api] publish failed', e);
    return NextResponse.json(
      { error: `Publish failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }
}
