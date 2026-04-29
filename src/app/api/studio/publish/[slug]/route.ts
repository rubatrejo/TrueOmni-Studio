import { promises as fs } from 'node:fs';
import path from 'node:path';

import { NextResponse } from 'next/server';

import { kv, kvKeys } from '@/lib/studio/kv';
import {
  I18nBundleSchema,
  LOCALES,
  type I18nBundle,
  type Locale,
} from '@/lib/studio/schema';

/**
 * `POST /api/studio/publish/[slug]?dryRun=1`
 *
 * Escribe (o computa diff sin escribir si `dryRun=1`) los archivos del
 * cliente desde el KV al filesystem `clients/<slug>/`.
 *
 * Por ahora SÓLO publica el bundle i18n (`clients/<slug>/i18n/<locale>.json`).
 * El config.json completo requiere reconciliación con campos legacy
 * (`features.advertisements.ads`, `features.integraciones`, etc.) y queda
 * para una iteración posterior (S7.1).
 *
 * Devuelve `{ files: [{ path, action: 'create'|'update'|'unchanged', sizeBefore?, sizeAfter }], dryRun, written }`.
 */

interface FileChange {
  path: string;
  action: 'create' | 'update' | 'unchanged';
  sizeBefore?: number;
  sizeAfter: number;
}

type RouteParams = { params: Promise<{ slug: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dryRun') === '1';

  if (!/^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]?$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  try {
    const bundle = await loadBundleFromKv(slug);
    if (!bundle) {
      return NextResponse.json(
        { error: `No i18n bundle in KV for slug "${slug}". Open it in the Studio first.` },
        { status: 404 },
      );
    }

    const clientsDir = path.join(process.cwd(), 'clients', slug);
    const i18nDir = path.join(clientsDir, 'i18n');

    // Verificar que la carpeta del cliente existe — evita crear clientes nuevos
    // accidentalmente desde el publish flow.
    try {
      await fs.access(clientsDir);
    } catch {
      return NextResponse.json(
        {
          error: `clients/${slug}/ does not exist. Create the client folder before publishing.`,
        },
        { status: 404 },
      );
    }

    const changes: FileChange[] = [];
    for (const locale of LOCALES) {
      const filePath = path.join(i18nDir, `${locale}.json`);
      const nextContent = formatJson(bundle[locale]);
      const change = await computeChange(filePath, nextContent);
      changes.push(change);
    }

    if (dryRun) {
      return NextResponse.json({ slug, dryRun: true, written: 0, files: changes });
    }

    // Asegura que la carpeta i18n existe antes de escribir
    await fs.mkdir(i18nDir, { recursive: true });

    let written = 0;
    for (const change of changes) {
      if (change.action === 'unchanged') continue;
      const nextContent = formatJson(bundle[localeFromPath(change.path)]);
      await fs.writeFile(change.path, nextContent, 'utf8');
      written++;
    }

    return NextResponse.json({ slug, dryRun: false, written, files: changes });
  } catch (error) {
    console.error('[api/studio/publish]', error);
    const message = error instanceof Error ? error.message : 'Publish failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function loadBundleFromKv(slug: string): Promise<I18nBundle | null> {
  const raw = await kv.get<I18nBundle>(kvKeys.i18n(slug));
  if (!raw) return null;
  const parsed = I18nBundleSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data;
}

async function computeChange(filePath: string, nextContent: string): Promise<FileChange> {
  const sizeAfter = Buffer.byteLength(nextContent, 'utf8');
  try {
    const current = await fs.readFile(filePath, 'utf8');
    const sizeBefore = Buffer.byteLength(current, 'utf8');
    if (current === nextContent) {
      return { path: filePath, action: 'unchanged', sizeBefore, sizeAfter };
    }
    return { path: filePath, action: 'update', sizeBefore, sizeAfter };
  } catch {
    return { path: filePath, action: 'create', sizeAfter };
  }
}

function formatJson(obj: unknown): string {
  // Mantenemos el orden de inserción del bundle (que viene del filesystem en el
  // bootstrap) — sortear alfabéticamente generaría ruido masivo en el git diff
  // contra los i18n existentes.
  return JSON.stringify(obj, null, 2) + '\n';
}

function localeFromPath(filePath: string): Locale {
  const base = path.basename(filePath, '.json');
  return base as Locale;
}
