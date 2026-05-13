import { NextResponse } from 'next/server';

import { getGitHubPublishConfig, publishToGitHub } from '@/lib/studio/github-publisher';
import { kvVideoWall, kvVideoWallClient } from '@/lib/video-walls/kv-store';
import { assertVwSlug, VwSlugError } from '@/lib/video-walls/slug-validation';

interface RouteParams {
  params: Promise<{ client: string; wall: string }>;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * `POST /api/studio/video-walls/walls/[client]/[wall]/publish`
 *
 * Crea un PR contra `clients-walls/<client>/walls/<wall>/wall.json` con
 * auto-merge habilitado, siguiendo el patrón del signage publish (reusa
 * `github-publisher.ts` del kiosk).
 *
 * Requiere env:
 *   STUDIO_GITHUB_TOKEN, STUDIO_GITHUB_OWNER, STUDIO_GITHUB_REPO.
 *
 * Fallback: si falta config GitHub, persiste en KV (que ya es source-of-truth
 * para el runtime) y devuelve `runtimeUrl` para el deploy local. La UI muestra
 * el aviso para que el operador sepa que el repo no se actualizó.
 */
export async function POST(_req: Request, { params }: RouteParams) {
  const { client, wall } = await params;
  try {
    assertVwSlug(client, 'client');
    assertVwSlug(wall, 'wall');
  } catch (e) {
    if (e instanceof VwSlugError) {
      return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
    }
    throw e;
  }

  const [wallData, clientData] = await Promise.all([
    kvVideoWall.get(client, wall),
    kvVideoWallClient.get(client),
  ]);
  if (!wallData) return NextResponse.json({ error: 'wall not found in KV' }, { status: 404 });
  if (!clientData) return NextResponse.json({ error: 'client not found in KV' }, { status: 404 });

  const publishedAt = new Date().toISOString();
  // Re-persistir hace bump del "last edited at" implícito del KV y confirma
  // que el wall pasó validación.
  await kvVideoWall.set(client, wall, wallData);

  const config = getGitHubPublishConfig();
  if (!config) {
    return NextResponse.json({
      ok: true,
      publishedAt,
      runtimeUrl: `/video-walls/${client}/${wall}`,
      mode: 'kv-only',
      note: 'GitHub publish not configured (STUDIO_GITHUB_TOKEN / OWNER / REPO). Wall persisted in KV only — the runtime reads KV first so production picks up changes immediately.',
    });
  }

  const filePath = `clients-walls/${client}/walls/${wall}/wall.json`;
  const files = [
    {
      path: filePath,
      content: `${JSON.stringify(wallData, null, 2)}\n`,
    },
  ];

  try {
    const result = await publishToGitHub(config, `videowall-${client}-${wall}`, files, {
      commitMessage: `feat(video-walls): publish ${client}/${wall}`,
      autoMerge: true,
    });
    return NextResponse.json({
      ok: true,
      publishedAt,
      runtimeUrl: `/video-walls/${client}/${wall}`,
      mode: 'pr',
      ...result,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[videowall:api] publish failed', e);
    return NextResponse.json({ error: `Publish failed: ${(e as Error).message}` }, { status: 500 });
  }
}
