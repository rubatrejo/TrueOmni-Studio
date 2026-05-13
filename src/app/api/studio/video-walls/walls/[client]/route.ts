import { NextResponse } from 'next/server';

import { GRID_CONFIG_IDS, type GridConfig } from '@/lib/video-walls/dimensions';
import { kvVideoWall, kvVideoWallClient } from '@/lib/video-walls/kv-store';
import { VideoWallConfigSchema, type VideoWallConfig } from '@/lib/video-walls/schema';
import { assertVwSlug, VwSlugError } from '@/lib/video-walls/slug-validation';

interface RouteParams {
  params: Promise<{ client: string }>;
}

export const dynamic = 'force-dynamic';

function badSlug(): NextResponse {
  return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
}

/**
 * `GET /api/studio/video-walls/walls/[client]` — lista slugs de walls
 * del cliente. Solo lee el client.json en KV.
 */
export async function GET(_req: Request, { params }: RouteParams) {
  const { client } = await params;
  try {
    assertVwSlug(client, 'client');
  } catch (e) {
    if (e instanceof VwSlugError) return badSlug();
    throw e;
  }
  const clientFile = await kvVideoWallClient.get(client);
  if (!clientFile) {
    return NextResponse.json({ error: `client "${client}" not found` }, { status: 404 });
  }
  return NextResponse.json({ walls: clientFile.walls });
}

/**
 * `POST /api/studio/video-walls/walls/[client]` — crea un wall nuevo en
 * el cliente. Body: `{ slug, name, grid }`. Genera un VideoWallConfig
 * con playlist vacía + settings defaults y agrega el slug al
 * `client.walls[]`.
 */
export async function POST(req: Request, { params }: RouteParams) {
  const { client } = await params;
  try {
    assertVwSlug(client, 'client');
  } catch (e) {
    if (e instanceof VwSlugError) return badSlug();
    throw e;
  }
  const clientFile = await kvVideoWallClient.get(client);
  if (!clientFile) {
    return NextResponse.json({ error: `client "${client}" not found` }, { status: 404 });
  }

  let body: { slug?: unknown; name?: unknown; grid?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const gridRaw = typeof body.grid === 'string' ? body.grid : '';
  if (!slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 });
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
  if (!(GRID_CONFIG_IDS as readonly string[]).includes(gridRaw)) {
    return NextResponse.json(
      { error: `grid must be one of: ${GRID_CONFIG_IDS.join(', ')}` },
      { status: 400 },
    );
  }
  const grid = gridRaw as GridConfig;

  if (!/^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/.test(slug)) {
    return NextResponse.json(
      { error: 'slug must be lowercase letters, digits, and dashes' },
      { status: 400 },
    );
  }
  if (clientFile.walls.includes(slug)) {
    return NextResponse.json(
      { error: `a wall "${slug}" already exists in this client` },
      { status: 409 },
    );
  }

  const wall: VideoWallConfig = {
    slug,
    name,
    grid,
    settings: {
      targetResolution: '1080p',
      audio: false,
      defaultDurationMs: 7000,
      defaultTransition: 'cut',
      sleepSchedule: {
        enabled: false,
        startTime: '23:00',
        endTime: '06:00',
      },
    },
    playlist: [],
  };
  const validated = VideoWallConfigSchema.safeParse(wall);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'wall validation failed', issues: validated.error.issues },
      { status: 500 },
    );
  }

  await kvVideoWall.set(client, slug, validated.data);
  await kvVideoWallClient.set(client, {
    ...clientFile,
    walls: [...clientFile.walls, slug],
  });

  return NextResponse.json({ ok: true, wall: validated.data });
}
