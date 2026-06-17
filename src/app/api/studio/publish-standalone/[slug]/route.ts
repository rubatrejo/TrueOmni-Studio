import { promises as fs } from 'node:fs';
import path from 'node:path';

import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

import { SUPER_ADMIN_EMAIL } from '@/auth';
import {
  dispatchExporterWorkflow,
  exporterRunsUrl,
  getExporterDispatchConfig,
  getGitHubPublishConfig,
  getRepoFileContent,
} from '@/lib/studio/github-publisher';
import { kv, kvKeys } from '@/lib/studio/kv';
import { buildFilesystemConfig, buildTokensCss } from '@/lib/studio/publish-merger';
import {
  I18nBundleSchema,
  KioskConfigSchema,
  type I18nBundle,
  type KioskConfig,
} from '@/lib/studio/schema';
import { STUDIO_SLUG_REGEX } from '@/lib/studio/slug';

/**
 * `POST /api/studio/publish-standalone/[slug]?product=kiosk|pwa`
 *
 * Última milla del milestone "Publish → Kiosk Standalone". A diferencia del
 * publish PR (que escribe `clients/<slug>/` al monorepo), este endpoint dispara
 * la generación de un **repo standalone autocontenido** del cliente:
 *
 *   1. Arma el manifest (mismo merge que el publish: `config.json` desde el KV,
 *      `tokens.css` surgical-merge, `i18n/<locale>.json`).
 *   2. Lo sube a Vercel Blob (URL con random suffix → no adivinable; el dispatch
 *      ya va autenticado por token, así que la URL actúa como capability — sin
 *      HMAC en v1).
 *   3. Dispara la Action `export-standalone.yml` del builder `kiosk-exporter`
 *      vía `createWorkflowDispatch` con `{ slug, product, manifest_url }`. La
 *      Action clona el monorepo, corre `scripts/export-standalone.ts` con red
 *      real (baja todos los assets), arma el repo `kiosk-<slug>` + zip.
 *
 * El trabajo pesado (descargar ~600 imágenes + `pnpm build`) NO cabe en la
 * lambda de Vercel (60s/250MB) → por eso solo dispara y responde 202.
 *
 * Devuelve `{ dispatched, product, slug, manifestUrl, runsUrl }`.
 */

type RouteParams = { params: Promise<{ slug: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  const url = new URL(req.url);
  const product = (url.searchParams.get('product') ?? 'kiosk') as 'kiosk' | 'pwa';

  if (!STUDIO_SLUG_REGEX.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }
  if (product !== 'kiosk' && product !== 'pwa') {
    return NextResponse.json({ error: 'product must be "kiosk" or "pwa"' }, { status: 400 });
  }

  // Approval gate: idéntico al publish PR. La allowlist `STUDIO_ADMIN_EMAILS`
  // cae cerrado al super-admin si está vacía (F-CORE-3). En producción el
  // header `x-studio-admin-email` lo añade el middleware NextAuth.
  const adminEmails = parseEmailList(process.env.STUDIO_ADMIN_EMAILS);
  const effectiveAllowlist = adminEmails.length > 0 ? adminEmails : [SUPER_ADMIN_EMAIL];
  const actorEmail = req.headers.get('x-studio-admin-email')?.toLowerCase().trim();
  if (!actorEmail || !effectiveAllowlist.includes(actorEmail)) {
    return NextResponse.json(
      { error: 'Forbidden: caller is not in the Studio publish allowlist.' },
      { status: 403 },
    );
  }

  // Prerrequisitos de infra.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          'Vercel Blob no configurado. Conecta un Blob store al proyecto o establece BLOB_READ_WRITE_TOKEN.',
      },
      { status: 503 },
    );
  }
  const dispatchConfig = getExporterDispatchConfig();
  if (!dispatchConfig) {
    return NextResponse.json(
      {
        error:
          'Standalone export no configurado: falta `EXPORTER_GITHUB_TOKEN` en el entorno (Vercel → Settings → Environment Variables).',
      },
      { status: 503 },
    );
  }

  try {
    const [bundle, studioConfig] = await Promise.all([
      loadBundleFromKv(slug),
      loadConfigFromKv(slug),
    ]);
    if (!studioConfig) {
      return NextResponse.json(
        { error: `No config in KV for slug "${slug}". Open it in the Studio first.` },
        { status: 404 },
      );
    }

    // ── Manifest (mismo merge que el publish PR) ──
    const clientsDir = path.join(process.cwd(), 'clients', slug);
    const configPath = path.join(clientsDir, 'config.json');
    const tokensPath = path.join(clientsDir, 'tokens.css');

    const currentFs = await readJsonFile(configPath);
    const mergedConfig = buildFilesystemConfig(studioConfig, currentFs);

    // tokens.css base: filesystem (dev) o repo (prod) — surgical merge de los
    // 3 brand-* HSL. Si no hay base, no inventamos uno (el cliente debe existir
    // como en el publish PR).
    const ghConfig = getGitHubPublishConfig();
    let currentCss = await readTextFile(tokensPath);
    if (currentCss === null && ghConfig) {
      const tokensRepoPath = `clients/${slug}/tokens.css`;
      currentCss = await getRepoFileContent(ghConfig, tokensRepoPath, ghConfig.baseBranch);
    }
    const tokensCss = currentCss !== null ? buildTokensCss(studioConfig, currentCss) : null;

    const manifest = {
      slug,
      product,
      generatedBy: actorEmail,
      config: mergedConfig,
      tokensCss,
      i18n: bundle ?? null,
      // Config crudo del editor (el mismo JSON del botón Download del Studio).
      // El builder lo escribe en la raíz del repo como `<slug>-config.json` para
      // que el developer pueda re-importarlo al Studio (#5 feedback).
      studioConfig,
    };

    // ── Subir manifest a Blob (random suffix → URL no adivinable) ──
    const blob = await put(
      `standalone-manifests/${slug}-${product}.json`,
      JSON.stringify(manifest),
      { access: 'public', contentType: 'application/json', addRandomSuffix: true },
    );

    // ── Disparar la Action del builder ──
    await dispatchExporterWorkflow(dispatchConfig, { slug, product, manifestUrl: blob.url });

    return NextResponse.json(
      {
        dispatched: true,
        slug,
        product,
        manifestUrl: blob.url,
        runsUrl: exporterRunsUrl(dispatchConfig),
      },
      { status: 202 },
    );
  } catch (error) {
    console.error('[api/studio/publish-standalone]', error);
    const message = error instanceof Error ? error.message : 'Standalone export failed';
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
