import { NextResponse } from 'next/server';

import { kvVideoWall, kvVideoWallClient } from '@/lib/video-walls/kv-store';

interface RouteParams {
  params: Promise<{ client: string; wall: string }>;
}

export const dynamic = 'force-dynamic';

/**
 * `POST /api/studio/video-walls/walls/[client]/[wall]/publish`
 *
 * Publica el wall config actual del KV como deployed. v1 minimal:
 * confirma que el KV tiene el wall + client y devuelve el snapshot
 * (la lectura runtime ya cae a KV primero, así que el KV es la fuente
 * de verdad inmediata).
 *
 * VW9.5 cableará el flow de GitHub PR siguiendo el patrón del signage
 * publish (`/api/studio/publish/[slug]`), que crea un branch
 * `studio/<client>/<timestamp>` con los .json del cliente + walls y
 * abre un PR contra main. Por ahora, "publish" = persistir en KV +
 * timestamp para auditoría.
 */
export async function POST(_req: Request, { params }: RouteParams) {
  const { client, wall } = await params;
  const [wallData, clientData] = await Promise.all([
    kvVideoWall.get(client, wall),
    kvVideoWallClient.get(client),
  ]);
  if (!wallData) return NextResponse.json({ error: 'wall not found in KV' }, { status: 404 });
  if (!clientData) return NextResponse.json({ error: 'client not found in KV' }, { status: 404 });

  const publishedAt = new Date().toISOString();
  // Re-persistir hace bump del "last edited at" implícito del KV y confirma
  // que el wall pasó validación. Si quisiéramos sello formal, escribimos
  // un campo `publishedAt` en el wall, pero el schema lo trata como
  // metadata fuera de scope hoy.
  await kvVideoWall.set(client, wall, wallData);

  return NextResponse.json({
    ok: true,
    publishedAt,
    runtimeUrl: `/video-walls/${client}/${wall}`,
    note: 'Wall published to KV. The runtime reads from KV first, so production picks up changes immediately. GitHub PR sync follows the signage publish pattern (sub-phase VW9.5).',
  });
}
