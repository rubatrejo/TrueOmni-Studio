import { NextResponse } from 'next/server';

import { kvVideoWall, kvVideoWallClient } from '@/lib/video-walls/kv-store';
import { VideoWallConfigSchema } from '@/lib/video-walls/schema';

interface RouteParams {
  params: Promise<{ client: string; wall: string }>;
}

export const dynamic = 'force-dynamic';

/** GET — devuelve el wall config completo. */
export async function GET(_req: Request, { params }: RouteParams) {
  const { client, wall } = await params;
  const data = await kvVideoWall.get(client, wall);
  if (!data) return NextResponse.json({ error: 'wall not found' }, { status: 404 });
  return NextResponse.json({ wall: data });
}

/** PUT — guarda el wall config completo (autosave del editor). */
export async function PUT(req: Request, { params }: RouteParams) {
  const { client, wall } = await params;
  let body: { wall?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const parsed = VideoWallConfigSchema.safeParse(body.wall);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'wall validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  if (parsed.data.slug !== wall) {
    return NextResponse.json(
      { error: `slug mismatch: body=${parsed.data.slug}, url=${wall}` },
      { status: 400 },
    );
  }
  await kvVideoWall.set(client, wall, parsed.data);
  return NextResponse.json({ ok: true, wall: parsed.data });
}

/** DELETE — borra el wall y lo remueve del client.walls[]. */
export async function DELETE(_req: Request, { params }: RouteParams) {
  const { client, wall } = await params;
  const clientFile = await kvVideoWallClient.get(client);
  if (!clientFile) return NextResponse.json({ error: 'client not found' }, { status: 404 });
  await kvVideoWall.delete(client, wall);
  await kvVideoWallClient.set(client, {
    ...clientFile,
    walls: clientFile.walls.filter((s) => s !== wall),
  });
  return NextResponse.json({ ok: true });
}
