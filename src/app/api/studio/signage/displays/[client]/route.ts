import { NextResponse, type NextRequest } from 'next/server';

import { loadSignageClient, loadSignageDisplay } from '@/lib/signage/config';
import { kvSignageClient, kvSignageDisplay } from '@/lib/signage/kv-store';
import {
  SIGNAGE_ORIENTATIONS,
  SignageClientFileSchema,
  SignageDisplayConfigSchema,
  type SignageClientFile,
  type SignageDisplayConfig,
  type SignageOrientation,
} from '@/lib/signage/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/;
const TEMPLATE_CLIENT = 'default';
const TEMPLATE_DISPLAY = 'lobby-tv';

interface RouteContext {
  params: Promise<{ client: string }>;
}

/**
 * `POST /api/studio/signage/displays/[client]` body
 * `{ slug, name, sourceDisplaySlug? }`.
 *
 * Crea un display nuevo dentro del theme `client`. Clona la estructura
 * (settings + playlist) desde `sourceDisplaySlug` (mismo client) o, como
 * fallback, desde `default → lobby-tv`. Si tampoco existe, falla.
 *
 * - Persiste el display al KV con el slug nuevo.
 * - Añade el slug al array `client.displays` del client.json (KV) y
 *   crea snapshot del client previo.
 * - El array `client.displays` se mantiene unique.
 *
 * No toca filesystem (`clients-signage/<slug>/displays/`); ese paso vive
 * en `publish` (PR a git).
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const { client } = await ctx.params;

  type BodyShape = {
    slug?: unknown;
    name?: unknown;
    sourceDisplaySlug?: unknown;
    /** Nuevo nombre canónico. */
    defaultOrientation?: unknown;
    /** Legacy: NewDisplayCard antiguo enviaba `orientation`. Aceptamos
     *  ambos para no romper deployments en transición. */
    orientation?: unknown;
  };
  let body: BodyShape | null = null;
  try {
    body = (await req.json()) as BodyShape;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const slug = typeof body?.slug === 'string' ? body.slug.trim() : '';
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const sourceDisplaySlug =
    typeof body?.sourceDisplaySlug === 'string' ? body.sourceDisplaySlug.trim() : '';
  const rawOrientation =
    typeof body?.defaultOrientation === 'string'
      ? body.defaultOrientation
      : typeof body?.orientation === 'string'
        ? body.orientation
        : null;
  const defaultOrientation: SignageOrientation =
    rawOrientation && (SIGNAGE_ORIENTATIONS as readonly string[]).includes(rawOrientation)
      ? (rawOrientation as SignageOrientation)
      : 'landscape';

  if (!slug || !name) {
    return NextResponse.json({ error: 'slug and name are required' }, { status: 400 });
  }
  if (!SLUG_REGEX.test(slug)) {
    return NextResponse.json(
      {
        error: 'Invalid slug. Use lowercase letters, digits and dashes (kebab-case).',
      },
      { status: 400 },
    );
  }

  const clientFile = await loadSignageClient(client).catch(() => null);
  if (!clientFile) {
    return NextResponse.json({ error: `Theme "${client}" not found.` }, { status: 404 });
  }

  if ((clientFile.displays ?? []).includes(slug)) {
    return NextResponse.json(
      { error: `Display "${slug}" already exists in theme "${client}".` },
      { status: 409 },
    );
  }

  // Source resolution: priority caller-provided > template default → lobby-tv.
  const candidates: Array<{ client: string; display: string }> = [];
  if (sourceDisplaySlug) {
    candidates.push({ client, display: sourceDisplaySlug });
  }
  candidates.push({ client: TEMPLATE_CLIENT, display: TEMPLATE_DISPLAY });

  let template: SignageDisplayConfig | null = null;
  for (const c of candidates) {
    const found = await loadSignageDisplay(c.client, c.display).catch(() => null);
    if (found) {
      template = found;
      break;
    }
  }
  if (!template) {
    return NextResponse.json(
      { error: 'No source display available to clone from.' },
      { status: 500 },
    );
  }

  const cloned = structuredClone(template);
  const seed: SignageDisplayConfig = {
    ...cloned,
    slug,
    name,
    settings: { ...cloned.settings, defaultOrientation },
  };
  // Si el operador eligió portrait, el playlist del template default está
  // armado contra templates landscape. Como los template-ids landscape
  // tienen fallback registry → landscape, el display renderizará sin crash;
  // el operador re-asigna template-ids portrait desde el editor.
  const parsedDisplay = SignageDisplayConfigSchema.safeParse(seed);
  if (!parsedDisplay.success) {
    return NextResponse.json(
      {
        error: 'Cloned display failed validation',
        issues: parsedDisplay.error.issues,
      },
      { status: 500 },
    );
  }

  // Persist display + actualiza client.displays.
  try {
    await kvSignageDisplay.set(client, slug, parsedDisplay.data);

    const nextClient: SignageClientFile = {
      slug: clientFile.slug,
      name: clientFile.name,
      locale: clientFile.locale,
      timezone: clientFile.timezone,
      location: clientFile.location,
      website: clientFile.website,
      branding: clientFile.branding,
      header: clientFile.header,
      displays: Array.from(new Set([...(clientFile.displays ?? []), slug])),
    };
    const parsedClient = SignageClientFileSchema.safeParse(nextClient);
    if (!parsedClient.success) {
      return NextResponse.json(
        {
          error: 'Updated client failed validation',
          issues: parsedClient.error.issues,
        },
        { status: 500 },
      );
    }
    await kvSignageClient.set(client, parsedClient.data);
    await kvSignageClient.addToList(client);
  } catch (e) {
    return NextResponse.json(
      { error: `KV write failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    slug,
    sourceClient: candidates[0]?.client === client ? client : TEMPLATE_CLIENT,
    sourceDisplay:
      sourceDisplaySlug && candidates[0]?.client === client ? sourceDisplaySlug : TEMPLATE_DISPLAY,
    savedAt: Date.now(),
  });
}

/**
 * `GET /api/studio/signage/displays/[client]` — Lista displays del theme.
 *
 * Devuelve los slugs declarados en `client.displays` del KV. El editor
 * usualmente no necesita esto (el client.json ya viene resuelto por SSR),
 * pero es útil para diagnostics y para revalidar después de un POST/DELETE.
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { client } = await ctx.params;
  const data = await loadSignageClient(client);
  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ displays: data.displays ?? [] });
}
