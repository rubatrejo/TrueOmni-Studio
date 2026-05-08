import { promises as fs } from 'node:fs';
import path from 'node:path';

import { NextResponse, type NextRequest } from 'next/server';

import { buildSignageThemePublishFiles } from '@/lib/signage/publish-files';
import { loadClientManifest } from '@/lib/studio/client-manifest';
import { isReadOnlyRuntime } from '@/lib/studio/github-publisher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * `GET /api/studio/clients/[slug]/pending` — diff pre-publish unificado.
 *
 * Hallazgo S-11 del audit panorámico v2: la Vista de Cliente no consolidaba
 * los cambios pendientes de los productos del cliente; el operador tenía
 * que abrir cada editor por separado y mirar el publish tab. Este endpoint
 * recorre los productos activos del manifest y devuelve un summary con
 * cuántos archivos cambian al publicar.
 *
 *   - **Kiosk**: invoca el endpoint existente `POST /api/studio/publish/[slug]?
 *     dryRun=1&mode=fs` por loopback (reusa toda la lógica de merger + diff).
 *   - **Digital Displays**: comparación lightweight inline — `buildSignage
 *     ThemePublishFiles` contra el filesystem de `clients-signage/<slug>/`.
 *
 * En serverless el filesystem es read-only y la comparación cae a
 * `unsupported` (devolvemos un flag en lugar de fallar). El operador en
 * producción usará el botón "Publish" de cada editor para ver el diff real
 * contra GitHub.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { slug } = await params;

  const manifest = await loadClientManifest(slug);
  if (!manifest) {
    return NextResponse.json({ error: `client "${slug}" not found` }, { status: 404 });
  }

  const readOnly = isReadOnlyRuntime();
  const summary: PendingSummary = {
    slug,
    fsAvailable: !readOnly,
    products: {},
    totalChanged: 0,
  };

  if (manifest.products.kiosks) {
    summary.products.kiosks = readOnly
      ? { unsupported: true }
      : await diffKiosk(slug, req);
    if (summary.products.kiosks.changed) {
      summary.totalChanged += summary.products.kiosks.changed;
    }
  }

  if (manifest.products.digitalDisplays) {
    summary.products.digitalDisplays = readOnly
      ? { unsupported: true }
      : await diffSignage(slug);
    if (summary.products.digitalDisplays.changed) {
      summary.totalChanged += summary.products.digitalDisplays.changed;
    }
  }

  return NextResponse.json(summary);
}

interface PendingProductOk {
  changed: number;
  files: ReadonlyArray<{ path: string; action: 'create' | 'update' | 'unchanged' }>;
  unsupported?: false;
  error?: undefined;
}

interface PendingProductUnsupported {
  unsupported: true;
  changed?: undefined;
  files?: undefined;
  error?: undefined;
}

interface PendingProductError {
  error: string;
  changed?: undefined;
  files?: undefined;
  unsupported?: undefined;
}

type PendingProductResult =
  | PendingProductOk
  | PendingProductUnsupported
  | PendingProductError;

export interface PendingSummary {
  slug: string;
  fsAvailable: boolean;
  products: {
    kiosks?: PendingProductResult;
    digitalDisplays?: PendingProductResult;
  };
  totalChanged: number;
}

interface KioskDryRunFile {
  path: string;
  action: 'create' | 'update' | 'unchanged';
  sizeBefore?: number;
  sizeAfter?: number;
  changedKeys?: string[];
}

async function diffKiosk(
  slug: string,
  req: NextRequest,
): Promise<PendingProductResult> {
  // Loopback al endpoint existente. Reusa todo el merger + computeChange.
  const origin = new URL(req.url).origin;
  const url = `${origin}/api/studio/publish/${encodeURIComponent(slug)}?dryRun=1&mode=fs`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
      // Forzar same-origin desde el server.
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: `kiosk dry-run ${res.status}: ${text.slice(0, 200)}` };
    }
    const data = (await res.json()) as { files: KioskDryRunFile[] };
    const files = (data.files ?? []).map((f) => ({
      path: relPath(f.path),
      action: f.action,
    }));
    const changed = files.filter((f) => f.action !== 'unchanged').length;
    return { changed, files };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

async function diffSignage(slug: string): Promise<PendingProductResult> {
  let nextFiles;
  try {
    nextFiles = await buildSignageThemePublishFiles(slug);
  } catch (e) {
    return { error: (e as Error).message };
  }
  const root = process.cwd();
  const out: Array<{ path: string; action: 'create' | 'update' | 'unchanged' }> = [];
  for (const f of nextFiles) {
    const abs = path.join(root, f.path);
    let current: string | null = null;
    try {
      current = await fs.readFile(abs, 'utf8');
    } catch {
      current = null;
    }
    if (current === null) {
      out.push({ path: f.path, action: 'create' });
    } else if (current === f.content) {
      out.push({ path: f.path, action: 'unchanged' });
    } else {
      out.push({ path: f.path, action: 'update' });
    }
  }
  const changed = out.filter((f) => f.action !== 'unchanged').length;
  return { changed, files: out };
}

/** Path relativo al repo root para mostrar al operador. */
function relPath(absPath: string): string {
  return path.relative(process.cwd(), absPath).replaceAll(path.sep, '/');
}
