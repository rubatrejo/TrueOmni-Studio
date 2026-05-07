import { NextResponse, type NextRequest } from 'next/server';

import { loadSignageClient } from '@/lib/signage/config';
import { kvSignageClient } from '@/lib/signage/kv-store';
import {
  SignageClientFileSchema,
  type SignageClientFile,
} from '@/lib/signage/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/;
const TEMPLATE_SLUG = 'default';

/**
 * `GET /api/studio/signage/clients` — Lista signage themes (KV unión fs).
 */
export async function GET() {
  try {
    const slugs = await kvSignageClient.list();
    return NextResponse.json({ slugs });
  } catch (e) {
    return NextResponse.json(
      { error: `KV read failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }
}

/**
 * `POST /api/studio/signage/clients` body `{ slug, name }`.
 *
 * Crea un signage theme nuevo. Clona el client.json del template `default`
 * (KV-first, fs fallback), reemplaza slug + name + displays vacío, y
 * persiste al KV. Falla si el slug ya existe.
 *
 * El operador después puede entrar al editor y customizar branding/header.
 * Los displays se crean por separado desde el theme editor.
 */
export async function POST(req: NextRequest) {
  let body: { slug?: unknown; name?: unknown } | null = null;
  try {
    body = (await req.json()) as { slug?: unknown; name?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const slug = typeof body?.slug === 'string' ? body.slug.trim() : '';
  const name = typeof body?.name === 'string' ? body.name.trim() : '';

  if (!slug || !name) {
    return NextResponse.json(
      { error: 'slug and name are required' },
      { status: 400 },
    );
  }
  if (!SLUG_REGEX.test(slug)) {
    return NextResponse.json(
      {
        error:
          'Invalid slug. Use lowercase letters, digits and dashes (kebab-case).',
      },
      { status: 400 },
    );
  }
  if (slug === TEMPLATE_SLUG) {
    return NextResponse.json(
      { error: `"${TEMPLATE_SLUG}" is reserved for the system template.` },
      { status: 400 },
    );
  }

  // Conflict check.
  const existing = await kvSignageClient.get(slug).catch(() => null);
  if (existing) {
    return NextResponse.json(
      { error: `Theme "${slug}" already exists.` },
      { status: 409 },
    );
  }

  // Clone from default template (KV first, fs fallback).
  const template = await loadSignageClient(TEMPLATE_SLUG);
  if (!template) {
    return NextResponse.json(
      { error: `Default template "${TEMPLATE_SLUG}" not available.` },
      { status: 500 },
    );
  }

  const clone: SignageClientFile = {
    slug,
    name,
    locale: template.locale,
    timezone: template.timezone,
    location: { ...template.location },
    website: template.website,
    branding: structuredClone(template.branding),
    header: structuredClone(template.header),
    displays: [],
  };

  const parsed = SignageClientFileSchema.safeParse(clone);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Cloned theme failed validation', issues: parsed.error.issues },
      { status: 500 },
    );
  }

  try {
    await kvSignageClient.set(slug, parsed.data);
    await kvSignageClient.addToList(slug);
  } catch (e) {
    return NextResponse.json(
      { error: `KV write failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, slug, savedAt: Date.now() });
}
