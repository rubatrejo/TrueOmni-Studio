import { NextResponse, type NextRequest } from 'next/server';

import { buildSignageThemePublishFiles } from '@/lib/signage/publish-files';
import { getGitHubPublishConfig, publishToGitHub } from '@/lib/studio/github-publisher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ client: string }>;
}

/**
 * `POST .../clients/<client>/publish` — DSS7.5.
 *
 * Crea un PR contra `clients-signage/<client>/{client.json, i18n/*.json}` con
 * auto-merge habilitado. tokens.css y assets binarios quedan fuera (sub-fase
 * separada cuando aterrice editor de paleta + Vercel Blob).
 *
 * Reusa `github-publisher.ts` del kiosk. Requiere env:
 *   STUDIO_GITHUB_TOKEN, STUDIO_GITHUB_OWNER, STUDIO_GITHUB_REPO.
 */
export async function POST(_req: NextRequest, ctx: RouteContext) {
  const { client } = await ctx.params;

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

  let files;
  try {
    files = await buildSignageThemePublishFiles(client);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 404 },
    );
  }

  try {
    const result = await publishToGitHub(config, `signage-theme-${client}`, files, {
      commitMessage: `feat(signage): publish theme ${client}`,
      autoMerge: true,
    });
    return NextResponse.json({
      ok: true,
      filesPublished: files.length,
      ...result,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[signage:api] theme publish failed', e);
    return NextResponse.json(
      { error: `Publish failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }
}
