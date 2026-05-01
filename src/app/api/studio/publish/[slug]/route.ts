import { promises as fs } from 'node:fs';
import path from 'node:path';

import { NextResponse } from 'next/server';

import { kv, kvKeys } from '@/lib/studio/kv';
import { buildFilesystemConfig, buildTokensCss } from '@/lib/studio/publish-merger';
import {
  I18nBundleSchema,
  KioskConfigSchema,
  LOCALES,
  type I18nBundle,
  type KioskConfig,
} from '@/lib/studio/schema';

/**
 * `POST /api/studio/publish/[slug]?dryRun=1`
 *
 * Escribe (o computa diff sin escribir si `dryRun=1`) los archivos del
 * cliente desde el KV al filesystem `clients/<slug>/`.
 *
 * Cubre:
 *  - `clients/<slug>/i18n/<locale>.json` × 6 (S7.0).
 *  - `clients/<slug>/config.json` (S7.1 wide — merge defensivo Studio↔legacy).
 *  - `clients/<slug>/tokens.css` (S7.1 wide — surgical edit de los 3 brand colors).
 *
 * Devuelve `{ files: [{ path, action, sizeBefore?, sizeAfter }], dryRun, written }`.
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
    const [bundle, studioConfig] = await Promise.all([
      loadBundleFromKv(slug),
      loadConfigFromKv(slug),
    ]);
    if (!bundle && !studioConfig) {
      return NextResponse.json(
        { error: `No data in KV for slug "${slug}". Open it in the Studio first.` },
        { status: 404 },
      );
    }

    const clientsDir = path.join(process.cwd(), 'clients', slug);
    try {
      await fs.access(clientsDir);
    } catch {
      return NextResponse.json(
        { error: `clients/${slug}/ does not exist. Create the client folder before publishing.` },
        { status: 404 },
      );
    }

    const i18nDir = path.join(clientsDir, 'i18n');
    const configPath = path.join(clientsDir, 'config.json');
    const tokensPath = path.join(clientsDir, 'tokens.css');

    const writes: { path: string; nextContent: string }[] = [];
    const changes: FileChange[] = [];

    // ── i18n ──
    if (bundle) {
      // Iterar sobre TODOS los locales del bundle (dinámico). Antes solo
      // los 6 hardcoded de LOCALES; ahora respeta locales custom añadidos
      // por el operador desde el AddLanguageModal.
      for (const locale of Object.keys(bundle)) {
        const filePath = path.join(i18nDir, `${locale}.json`);
        const nextContent = formatJson(bundle[locale]);
        const change = await computeChange(filePath, nextContent);
        changes.push(change);
        writes.push({ path: filePath, nextContent });
      }
    }

    // ── config.json ──
    if (studioConfig) {
      const currentFs = await readJsonFile(configPath);
      const merged = buildFilesystemConfig(studioConfig, currentFs);
      const nextContent = formatJson(merged);
      const change = await computeChange(configPath, nextContent);
      changes.push(change);
      writes.push({ path: configPath, nextContent });

      // ── tokens.css ──
      const currentCss = await readTextFile(tokensPath);
      if (currentCss !== null) {
        const nextCss = buildTokensCss(studioConfig, currentCss);
        const tokensChange = await computeChange(tokensPath, nextCss);
        changes.push(tokensChange);
        writes.push({ path: tokensPath, nextContent: nextCss });
      }
      // Si tokens.css no existe, NO se crea — el operador debe copiar el
      // template manualmente al crear el cliente. Defensivo: no inventamos
      // un CSS desde cero porque podríamos pisar customizaciones futuras.
    }

    if (dryRun) {
      return NextResponse.json({ slug, dryRun: true, written: 0, files: changes });
    }

    await fs.mkdir(i18nDir, { recursive: true });

    let written = 0;
    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      if (change.action === 'unchanged') continue;
      await fs.writeFile(writes[i].path, writes[i].nextContent, 'utf8');
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

async function loadConfigFromKv(slug: string): Promise<KioskConfig | null> {
  const raw = await kv.get(kvKeys.cfg(slug));
  if (!raw) return null;
  const parsed = KioskConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
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

async function readJsonFile(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    const text = await fs.readFile(filePath, 'utf8');
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function readTextFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

function formatJson(obj: unknown): string {
  // Mantenemos el orden de inserción del shape (i18n bundle viene del
  // filesystem en bootstrap; config.json viene del filesystem clonado +
  // overrides) — sortear alfabéticamente generaría ruido masivo en el
  // git diff contra los archivos existentes.
  return JSON.stringify(obj, null, 2) + '\n';
}
