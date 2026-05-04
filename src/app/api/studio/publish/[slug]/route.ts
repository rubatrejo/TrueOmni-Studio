import { promises as fs } from 'node:fs';
import path from 'node:path';

import { NextResponse } from 'next/server';

import {
  getGitHubPublishConfig,
  isReadOnlyRuntime,
  publishToGitHub,
} from '@/lib/studio/github-publisher';
import { kv, kvKeys } from '@/lib/studio/kv';
import { buildFilesystemConfig, buildTokensCss } from '@/lib/studio/publish-merger';
import {
  I18nBundleSchema,
  KioskConfigSchema,
  type I18nBundle,
  type KioskConfig,
} from '@/lib/studio/schema';

/**
 * `POST /api/studio/publish/[slug]?dryRun=1&mode=fs|pr`
 *
 * Escribe (o computa diff sin escribir si `dryRun=1`) los archivos del
 * cliente desde el KV. Dos modos:
 *
 *   - `mode=fs` (default en dev): escritura directa al filesystem
 *     `clients/<slug>/`. Solo viable cuando el filesystem es escribible
 *     (dev local). En serverless devuelve 503.
 *   - `mode=pr` (default en producción): abre un PR en GitHub con el diff,
 *     usando `STUDIO_GITHUB_TOKEN/OWNER/REPO`. El merge del PR dispara
 *     redeploy de Vercel.
 *
 * Si no se pasa `mode`, decidimos automáticamente:
 *   - Runtime read-only (Vercel) → `pr` si hay config, si no → 503.
 *   - Runtime escribible (dev) → `fs`.
 *
 * Cubre:
 *  - `clients/<slug>/i18n/<locale>.json` × N (S7.0, locales dinámicos).
 *  - `clients/<slug>/config.json` (S7.1 wide).
 *  - `clients/<slug>/tokens.css` (S7.1 wide).
 *
 * Devuelve `{ files: [...], dryRun, written, mode, pr? }`.
 */

interface FileChange {
  path: string;
  action: 'create' | 'update' | 'unchanged';
  sizeBefore?: number;
  sizeAfter: number;
}

type RouteParams = { params: Promise<{ slug: string }> };
type PublishMode = 'fs' | 'pr';

export async function POST(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dryRun') === '1';
  const requestedMode = url.searchParams.get('mode') as PublishMode | null;

  if (!/^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]?$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  // Resolver modo: explícito → dryRun-safe; auto → fs en dev, pr en prod.
  const ghConfig = getGitHubPublishConfig();
  const readOnly = isReadOnlyRuntime();
  let mode: PublishMode;
  if (requestedMode === 'pr') {
    if (!ghConfig) {
      return NextResponse.json(
        {
          error:
            'GitHub publish requested but `STUDIO_GITHUB_TOKEN/OWNER/REPO` env vars are not set.',
        },
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
            'Runtime is read-only and GitHub publish is not configured. Set `STUDIO_GITHUB_TOKEN/OWNER/REPO` in env.',
        },
        { status: 503 },
      );
    }
  }

  // Approval gate: si el caller manda `X-Studio-Admin-Email`, debe estar en
  // `STUDIO_ADMIN_EMAILS`. En producción Studio (S7.3) este header lo añade
  // un middleware NextAuth con la session.email del usuario logueado.
  const adminEmails = parseEmailList(process.env.STUDIO_ADMIN_EMAILS);
  const actorEmail = req.headers.get('x-studio-admin-email')?.toLowerCase().trim();
  if (mode === 'pr' && adminEmails.length > 0) {
    if (!actorEmail || !adminEmails.includes(actorEmail)) {
      return NextResponse.json(
        { error: 'Forbidden: caller is not in STUDIO_ADMIN_EMAILS allowlist.' },
        { status: 403 },
      );
    }
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
    if (mode === 'fs') {
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
    }
    // En `mode=pr` no podemos chequear filesystem (read-only). Confiamos en
    // que el merger generó algo coherente; si el path no existe en el repo,
    // GitHub aceptará el commit creando los archivos nuevos.

    const i18nDir = path.join(clientsDir, 'i18n');
    const configPath = path.join(clientsDir, 'config.json');
    const tokensPath = path.join(clientsDir, 'tokens.css');

    /** Ruta relativa al repo root (para GitHub PR). */
    const repoRelative = (absPath: string) =>
      path.relative(process.cwd(), absPath).replaceAll(path.sep, '/');

    const writes: { path: string; repoPath: string; nextContent: string }[] = [];
    const changes: FileChange[] = [];

    // ── i18n ──
    if (bundle) {
      // Iterar sobre TODOS los locales del bundle (dinámico). Antes solo
      // los 6 hardcoded de LOCALES; ahora respeta locales custom añadidos
      // por el operador desde el AddLanguageModal.
      for (const locale of Object.keys(bundle)) {
        const filePath = path.join(i18nDir, `${locale}.json`);
        const nextContent = formatJson(bundle[locale]);
        const change = await computeChange(filePath, nextContent, mode);
        changes.push(change);
        writes.push({ path: filePath, repoPath: repoRelative(filePath), nextContent });
      }
    }

    // ── config.json ──
    if (studioConfig) {
      const currentFs = mode === 'fs' ? await readJsonFile(configPath) : null;
      const merged = buildFilesystemConfig(studioConfig, currentFs);
      const nextContent = formatJson(merged);
      const change = await computeChange(configPath, nextContent, mode);
      changes.push(change);
      writes.push({ path: configPath, repoPath: repoRelative(configPath), nextContent });

      // ── tokens.css ──
      const currentCss = mode === 'fs' ? await readTextFile(tokensPath) : null;
      if (mode === 'fs' && currentCss !== null) {
        const nextCss = buildTokensCss(studioConfig, currentCss);
        const tokensChange = await computeChange(tokensPath, nextCss, mode);
        changes.push(tokensChange);
        writes.push({ path: tokensPath, repoPath: repoRelative(tokensPath), nextContent: nextCss });
      }
      // En mode=pr no leemos `tokens.css` (read-only fs). El surgical edit
      // de tokens.css requiere el contenido actual del repo — para v1 del
      // PR-publish lo dejamos fuera; el operador edita tokens.css por
      // commit manual. TODO follow-up: leer tokens.css via octokit
      // contents.get y aplicar surgical edit en mode=pr.
    }

    if (dryRun) {
      return NextResponse.json({ slug, dryRun: true, written: 0, mode, files: changes });
    }

    if (mode === 'fs') {
      await fs.mkdir(i18nDir, { recursive: true });

      let written = 0;
      for (let i = 0; i < changes.length; i++) {
        const change = changes[i];
        if (change.action === 'unchanged') continue;
        await fs.writeFile(writes[i].path, writes[i].nextContent, 'utf8');
        written++;
      }

      return NextResponse.json({ slug, dryRun: false, mode, written, files: changes });
    }

    // mode === 'pr' (ghConfig garantizado por el branching arriba).
    const filesToCommit = writes
      .filter((_, i) => changes[i].action !== 'unchanged')
      .map((w) => ({ path: w.repoPath, content: w.nextContent }));

    if (filesToCommit.length === 0) {
      return NextResponse.json({
        slug,
        dryRun: false,
        mode,
        written: 0,
        files: changes,
        pr: null,
      });
    }

    const pr = await publishToGitHub(ghConfig!, slug, filesToCommit, {
      actorEmail: actorEmail ?? undefined,
    });

    return NextResponse.json({
      slug,
      dryRun: false,
      mode,
      written: pr.filesChanged,
      files: changes,
      pr: {
        url: pr.prUrl,
        number: pr.prNumber,
        branch: pr.branch,
        commit: pr.commitSha,
      },
    });
  } catch (error) {
    console.error('[api/studio/publish]', error);
    const message = error instanceof Error ? error.message : 'Publish failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseEmailList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
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

async function computeChange(
  filePath: string,
  nextContent: string,
  mode: PublishMode,
): Promise<FileChange> {
  const sizeAfter = Buffer.byteLength(nextContent, 'utf8');
  // En mode=pr el filesystem es read-only: no podemos comparar contra el
  // archivo actual del repo, así que reportamos siempre como `update` para
  // que el caller no asuma "unchanged" sin verificar. La detección real de
  // diff la hace GitHub al crear el PR.
  if (mode === 'pr') {
    return { path: filePath, action: 'update', sizeAfter };
  }
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
