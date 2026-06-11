import { promises as fs } from 'node:fs';
import path from 'node:path';

import { NextResponse } from 'next/server';

import { SUPER_ADMIN_EMAIL } from '@/auth';
import {
  getGitHubPublishConfig,
  getRepoFileContent,
  isReadOnlyRuntime,
  publishToGitHub,
} from '@/lib/studio/github-publisher';
import { kv, kvKeys } from '@/lib/studio/kv';
import { buildFilesystemConfig } from '@/lib/studio/publish-merger';
import { loadPwaSlice } from '@/lib/studio/pwa-config';
import { KioskConfigSchema, type KioskConfig } from '@/lib/studio/schema';
import { STUDIO_SLUG_REGEX } from '@/lib/studio/slug';

/**
 * `POST /api/studio/publish/[slug]/pwa?dryRun=1&mode=fs|pr`
 *
 * Publica SOLO la sección `features.pwa` del cliente. Lee el slice de la
 * working copy (`pwa:<slug>` en KV), lo mergea sobre el `config.json` actual
 * (preservando todo lo demás del kiosk) y escribe ese único archivo.
 *
 *  - `mode=fs` (dev): escritura directa a `clients/<slug>/config.json`.
 *  - `mode=pr` (prod): abre un PR en GitHub con solo ese archivo; el merge
 *    dispara el redeploy de Vercel. Producto independiente a nivel de publish.
 *
 * El branding compartido NO se publica aquí — se publica desde su propio flujo
 * (Vista de Cliente / kiosk), porque es transversal a todos los productos.
 */

interface RawConfig {
  features?: Record<string, unknown>;
  [k: string]: unknown;
}

type RouteParams = { params: Promise<{ slug: string }> };
type PublishMode = 'fs' | 'pr';

function formatJson(obj: unknown): string {
  return JSON.stringify(obj, null, 2) + '\n';
}

function parseEmailList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dryRun') === '1';
  const requestedMode = url.searchParams.get('mode') as PublishMode | null;

  if (!STUDIO_SLUG_REGEX.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const ghConfig = getGitHubPublishConfig();
  const readOnly = isReadOnlyRuntime();
  let mode: PublishMode;
  if (requestedMode === 'pr') {
    if (!ghConfig) {
      return NextResponse.json(
        { error: 'GitHub publish requested but `STUDIO_GITHUB_TOKEN/OWNER/REPO` are not set.' },
        { status: 503 },
      );
    }
    mode = 'pr';
  } else if (requestedMode === 'fs') {
    if (readOnly) {
      return NextResponse.json(
        { error: 'Filesystem publish requested but the runtime is read-only.' },
        { status: 503 },
      );
    }
    mode = 'fs';
  } else {
    mode = readOnly ? 'pr' : 'fs';
    if (mode === 'pr' && !ghConfig) {
      return NextResponse.json(
        {
          error:
            'Runtime is read-only and GitHub publish is not configured. Set `STUDIO_GITHUB_TOKEN/OWNER/REPO`.',
        },
        { status: 503 },
      );
    }
  }

  // Approval gate (mismo que el publish del kiosk). F-CORE-3: sin
  // `STUDIO_ADMIN_EMAILS` la allowlist efectiva cae al super-admin (falla
  // cerrado), no a "cualquier sesión".
  const adminEmails = parseEmailList(process.env.STUDIO_ADMIN_EMAILS);
  const effectiveAllowlist = adminEmails.length > 0 ? adminEmails : [SUPER_ADMIN_EMAIL];
  const actorEmail = req.headers.get('x-studio-admin-email')?.toLowerCase().trim();
  if (mode === 'pr') {
    if (!actorEmail || !effectiveAllowlist.includes(actorEmail)) {
      return NextResponse.json(
        { error: 'Forbidden: caller is not in the Studio publish allowlist.' },
        { status: 403 },
      );
    }
  }

  try {
    const slice = await loadPwaSlice(slug);

    const configPath = path.join(process.cwd(), 'clients', slug, 'config.json');
    const repoPath = path.relative(process.cwd(), configPath).replaceAll(path.sep, '/');

    // Cargar el config.json actual (fs en dev, repo en pr).
    let currentRaw: string | null = null;
    if (mode === 'fs') {
      currentRaw = await fs.readFile(configPath, 'utf8').catch(() => null);
    } else if (ghConfig) {
      currentRaw = await getRepoFileContent(ghConfig, repoPath, ghConfig.baseBranch);
    }

    let current: RawConfig;
    // Si todavía no hay `config.json` publicado (cliente creado en el Studio y
    // nunca publicado), lo bootstrapeamos desde la working copy del KV en vez
    // de fallar con 404. Así el publish de la PWA funciona "todo de una": crea
    // el config.json completo del kiosk (desde el KV) + el slice de la PWA,
    // sin obligar a publicar el kiosk primero.
    const bootstrapped = currentRaw === null;
    if (bootstrapped) {
      const studioConfig = await loadConfigFromKv(slug);
      if (!studioConfig) {
        return NextResponse.json(
          { error: `No data in KV for "${slug}". Open the client in the Studio first.` },
          { status: 404 },
        );
      }
      current = buildFilesystemConfig(studioConfig, null) as RawConfig;
    } else {
      try {
        current = JSON.parse(currentRaw as string) as RawConfig;
      } catch {
        return NextResponse.json(
          { error: `clients/${slug}/config.json is not valid JSON.` },
          { status: 500 },
        );
      }
    }

    const merged: RawConfig = {
      ...current,
      features: { ...(current.features ?? {}), pwa: slice },
    };
    const nextContent = formatJson(merged);
    // Cuando bootstrapeamos el config.json (no existía), es un create y siempre
    // hay cambio; si ya existía, comparamos contra el contenido actual.
    const changed = bootstrapped || nextContent !== currentRaw;

    const files = [
      {
        path: repoPath,
        action: bootstrapped
          ? ('create' as const)
          : changed
            ? ('update' as const)
            : ('unchanged' as const),
        sizeAfter: Buffer.byteLength(nextContent, 'utf8'),
      },
    ];

    if (dryRun) {
      return NextResponse.json({ slug, dryRun: true, written: 0, mode, files });
    }

    if (!changed) {
      return NextResponse.json({ slug, dryRun: false, mode, written: 0, files, pr: null });
    }

    if (mode === 'fs') {
      // El cliente puede no tener carpeta todavía (bootstrap) — la creamos.
      await fs.mkdir(path.dirname(configPath), { recursive: true });
      await fs.writeFile(configPath, nextContent, 'utf8');
      return NextResponse.json({ slug, dryRun: false, mode, written: 1, files });
    }

    // mode === 'pr'
    const pr = await publishToGitHub(ghConfig!, slug, [{ path: repoPath, content: nextContent }], {
      actorEmail: actorEmail ?? undefined,
    });
    return NextResponse.json({
      slug,
      dryRun: false,
      mode,
      written: pr.filesChanged,
      files,
      pr: { url: pr.prUrl, number: pr.prNumber, branch: pr.branch, commit: pr.commitSha },
    });
  } catch (error) {
    console.error('[api/studio/publish/pwa]', error);
    const message = error instanceof Error ? error.message : 'Publish failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Carga el config del kiosk desde el KV (working copy) para el bootstrap. */
async function loadConfigFromKv(slug: string): Promise<KioskConfig | null> {
  const raw = await kv.get(kvKeys.cfg(slug));
  if (!raw) return null;
  const parsed = KioskConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
