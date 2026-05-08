import 'server-only';

import { kSignageClient, kSignageClientList } from '@/lib/signage/kv-keys';
import { SignageClientFileSchema } from '@/lib/signage/schema';
import type { SignageClientFile } from '@/lib/signage/schema';

import { readClientFs } from './bootstrap-from-fs';
import {
  kioskToUnifiedBranding,
  saveUnifiedBrandingOnly,
  signageToUnifiedBranding,
  type UnifiedClientBranding,
} from './client-branding-sync';
import {
  CLIENT_LIST_KEY,
  clientKeys,
  loadClientManifest,
  makeBlankManifest,
  saveClientManifest,
  type ClientManifest,
} from './client-manifest';
import { kv, kvKeys } from './kv';
import type { KioskConfig } from './schema';

/**
 * Migración auto del modelo viejo (kiosks y signage como entidades top-level
 * con slugs paralelos) al modelo cliente-primero (un manifest por cliente +
 * unified branding como source of truth).
 *
 * Idempotente: si `client:{slug}:manifest` ya existe, no se hace nada para
 * ese slug. Se ejecuta lazy en `/studio/page.tsx` (Fase 3) para que la
 * primera carga del dashboard hidrate el estado sin requerir una migración
 * explícita por DevOps.
 *
 * Detección de productos:
 *  - `manifest.products.kiosks` = `kv.get('cfg:{slug}')` truthy o existe en
 *    `clients:list` o existe `clients/{slug}/config.json` en filesystem.
 *  - `manifest.products.digitalDisplays` = `kv.get('signage:client:{slug}')`
 *    truthy o existe en `signage:clientList` o existe `clients-signage/{slug}/`.
 *
 * Source de unified branding (preferencia, mayor a menor riqueza):
 *  1. KV kiosk (`cfg:{slug}.branding` + `cfg:{slug}` para nombre/clientInfo).
 *  2. KV signage (`signage:client:{slug}.branding`).
 *  3. FS kiosk (`clients/{slug}/config.json`).
 *  4. FS signage (`clients-signage/{slug}/client.json`).
 *
 * Plan completo: `~/.claude/plans/ok-listo-ahora-quiero-wondrous-sphinx.md`.
 */

export interface MigrationReport {
  scanned: number;
  migrated: number;
  alreadyMigrated: number;
  failed: number;
  details: Array<{
    slug: string;
    status: 'migrated' | 'already-migrated' | 'failed';
    products: string[];
    source: 'kv-kiosk' | 'kv-signage' | 'fs-kiosk' | 'fs-signage' | 'none';
    error?: string;
  }>;
}

/**
 * Hallazgo S-37: cache TTL para evitar re-escanear FS + KV cada GET de
 * /api/studio/clients (tipo 5–10× por minuto cuando el dashboard está
 * abierto). Memoizamos el último report durante 60s; el siguiente GET
 * recibe la copia cacheada en lugar de re-correr.
 *
 * Bypass disponible vía `autoMigrateClients({ force: true })` para flujos
 * que necesitan certeza (post-create, post-delete).
 */
const MIGRATION_CACHE_TTL_MS = 60_000;
let cachedReport: MigrationReport | null = null;
let cachedAt = 0;

export async function autoMigrateClients(
  options: { force?: boolean } = {},
): Promise<MigrationReport> {
  const now = Date.now();
  if (
    !options.force &&
    cachedReport &&
    now - cachedAt < MIGRATION_CACHE_TTL_MS
  ) {
    return cachedReport;
  }

  const report: MigrationReport = {
    scanned: 0,
    migrated: 0,
    alreadyMigrated: 0,
    failed: 0,
    details: [],
  };

  const slugs = await collectAllSlugs();
  report.scanned = slugs.size;

  // Hallazgo S-34: paralelizar con concurrency limit. Antes el loop era
  // secuencial (await migrateOne uno por uno). Con N=20 clientes y un
  // round-trip de ~200ms cada uno → 4s de wait. Con concurrency 5 baja a
  // ~800ms. No usamos `Promise.all` directo porque queremos contención
  // razonable contra Upstash (rate limits).
  const slugList = [...slugs];
  const CONCURRENCY = 5;
  const results: Array<MigrationReport['details'][number]> = [];
  for (let i = 0; i < slugList.length; i += CONCURRENCY) {
    const batch = slugList.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map(async (slug) => {
        const existing = await loadClientManifest(slug);
        if (existing) {
          return {
            slug,
            status: 'already-migrated' as const,
            products: productNamesFromManifest(existing),
            source: 'none' as const,
          };
        }
        const migrated = await migrateOne(slug);
        return { slug, status: 'migrated' as const, ...migrated };
      }),
    );
    settled.forEach((s, idx) => {
      if (s.status === 'fulfilled') {
        results.push(s.value);
      } else {
        results.push({
          slug: batch[idx],
          status: 'failed' as const,
          products: [],
          source: 'none' as const,
          error: s.reason instanceof Error ? s.reason.message : String(s.reason),
        });
      }
    });
  }

  for (const r of results) {
    report.details.push(r);
    if (r.status === 'migrated') report.migrated += 1;
    else if (r.status === 'already-migrated') report.alreadyMigrated += 1;
    else report.failed += 1;
  }

  // Asegurar que `client:list` existe (set de top-level con todos los slugs
  // migrados). saveClientManifest ya añade pero por si quedaron orfanos:
  if (report.migrated > 0) {
    const list = await kv.get<string[]>(CLIENT_LIST_KEY);
    if (!Array.isArray(list)) {
      await kv.set(CLIENT_LIST_KEY, [...slugs].sort());
    }
  }

  cachedReport = report;
  cachedAt = now;

  return report;
}

/** Invalida la cache de auto-migrate. Llamar tras crear/borrar un cliente. */
export function invalidateAutoMigrateCache(): void {
  cachedReport = null;
  cachedAt = 0;
}

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------

async function collectAllSlugs(): Promise<Set<string>> {
  const all = new Set<string>();

  const [kioskList, signageList] = await Promise.all([
    kv.get<string[]>(kvKeys.clientsList).catch(() => null),
    kv.get<string[]>(kSignageClientList).catch(() => null),
  ]);
  if (Array.isArray(kioskList)) kioskList.forEach((s) => all.add(s));
  if (Array.isArray(signageList)) signageList.forEach((s) => all.add(s));

  // Añadir los slugs presentes en filesystem (incluso si KV no los lista —
  // útil en dev local con KV in-memory recién arrancado).
  const fsSlugs = await listFsSlugs();
  fsSlugs.forEach((s) => all.add(s));

  // Filtrar slugs reservados ('_template') que no son clientes reales.
  all.delete('_template');
  return all;
}

async function listFsSlugs(): Promise<string[]> {
  const { readdir } = await import('node:fs/promises');
  const path = await import('node:path');
  const out = new Set<string>();
  for (const root of ['clients', 'clients-signage']) {
    try {
      const entries = await readdir(path.join(process.cwd(), root), {
        withFileTypes: true,
      });
      for (const e of entries) {
        if (!e.isDirectory()) continue;
        if (e.name.startsWith('_')) continue;
        out.add(e.name);
      }
    } catch {
      // dir missing — ignore.
    }
  }
  return [...out];
}

async function migrateOne(slug: string): Promise<{
  products: string[];
  source: MigrationReport['details'][number]['source'];
}> {
  // 1. Detectar productos activos (KV + FS).
  const [kioskKv, signageKv] = await Promise.all([
    kv.get<KioskConfig>(kvKeys.cfg(slug)).catch(() => null),
    kv.get<unknown>(kSignageClient(slug)).catch(() => null),
  ]);

  let kioskFs: KioskConfig | null = null;
  let signageFs: SignageClientFile | null = null;
  if (!kioskKv || !signageKv) {
    const fsProbe = await readClientFs(slug);
    if (!kioskKv && fsProbe.config) kioskFs = fsProbe.config as unknown as KioskConfig;
    if (!signageKv) {
      signageFs = await loadSignageFromFs(slug);
    }
  }

  const hasKiosk = Boolean(kioskKv ?? kioskFs);
  const hasSignage = Boolean(signageKv ?? signageFs);

  // 2. Derivar unified branding desde la mejor fuente disponible.
  // Algunos clientes pre-S1 tienen shape legacy de branding (e.g.
  // `logo: { default, dark }` en vez de `primary/secondary/tertiary`).
  // Si la fuente preferida falla la validación, caemos a la siguiente.
  let unified: UnifiedClientBranding | null = null;
  let source: MigrationReport['details'][number]['source'] = 'none';

  unified = tryKioskToUnified(kioskKv, slug);
  if (unified) source = 'kv-kiosk';

  if (!unified && signageKv) {
    const parsed = SignageClientFileSchema.safeParse(signageKv);
    if (parsed.success) {
      unified = signageToUnifiedBranding(parsed.data);
      source = 'kv-signage';
    }
  }

  if (!unified) {
    unified = tryKioskToUnified(kioskFs, slug);
    if (unified) source = 'fs-kiosk';
  }

  if (!unified && signageFs) {
    unified = signageToUnifiedBranding(signageFs);
    source = 'fs-signage';
  }

  if (!unified) {
    // Fallback: cliente con shape legacy / corrupta. Generamos un unified
    // mínimo con defaults TrueOmni para que el manifest exista y el operador
    // pueda re-configurar el branding desde la Vista de Cliente.
    unified = makeFallbackUnified(slug, kioskKv ?? kioskFs);
    source = 'none';
  }

  // 3. Persistir manifest + unified branding.
  const products: ClientManifest['products'] = {
    kiosks: hasKiosk,
    digitalDisplays: hasSignage,
    mobilePwa: false,
    videoWalls: false,
    tablets: false,
  };
  const manifest = makeBlankManifest(slug, unified.name, products);
  await saveUnifiedBrandingOnly(slug, unified);
  await saveClientManifest(manifest);

  return {
    products: productNamesFromManifest(manifest),
    source,
  };
}

/**
 * Genera un unified branding mínimo con defaults TrueOmni cuando ninguna
 * fuente válida está disponible (cliente con shape legacy / corrupta).
 */
function makeFallbackUnified(
  slug: string,
  cfg: KioskConfig | null | undefined,
): UnifiedClientBranding {
  return {
    name: cfg?.nombre ?? slug,
    website: cfg?.clientInfo?.website ?? '',
    location: { city: cfg?.clientInfo?.location ?? '' },
    brand: {
      primary: '211 100% 25%',
      secondary: '200 100% 50%',
      accent: '62 53% 48%',
      neutral: '0 0% 7%',
    },
    logos: { default: '', dark: '', idle: '', footer: '' },
    fonts: { display: 'Montserrat', body: 'Open Sans' },
    favicon: '',
  };
}

/**
 * Intenta derivar unified branding desde un kiosk config. Si falta alguno
 * de los campos requeridos (clientes pre-S1 con shape legacy), devuelve
 * `null` para que el caller caiga a la siguiente fuente.
 */
function tryKioskToUnified(
  cfg: KioskConfig | null | undefined,
  slug: string,
): UnifiedClientBranding | null {
  if (!cfg) return null;
  const b = cfg.branding;
  if (
    !b ||
    typeof b.primary !== 'string' ||
    typeof b.secondary !== 'string' ||
    typeof b.tertiary !== 'string'
  ) {
    return null;
  }
  try {
    return kioskToUnifiedBranding(b, {
      nombre: cfg.nombre ?? slug,
      website: cfg.clientInfo?.website,
      location: cfg.clientInfo?.location,
      coords: cfg.clientInfo?.coords,
    });
  } catch {
    return null;
  }
}

async function loadSignageFromFs(slug: string): Promise<SignageClientFile | null> {
  const { readFile } = await import('node:fs/promises');
  const path = await import('node:path');
  try {
    const buf = await readFile(
      path.join(process.cwd(), 'clients-signage', slug, 'client.json'),
      'utf-8',
    );
    const json = JSON.parse(buf);
    const parsed = SignageClientFileSchema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function productNamesFromManifest(m: ClientManifest): string[] {
  const out: string[] = [];
  if (m.products.kiosks) out.push('kiosks');
  if (m.products.digitalDisplays) out.push('digital-displays');
  if (m.products.mobilePwa) out.push('mobile-pwa');
  if (m.products.videoWalls) out.push('video-walls');
  if (m.products.tablets) out.push('tablets');
  return out;
}

/**
 * Variante manual idempotente: re-procesa un slug específico aunque ya tenga
 * manifest. Útil para diagnósticos cuando el manifest quedó stale después de
 * un edit fuera de banda.
 */
export async function reMigrateClient(slug: string): Promise<void> {
  // Borra el manifest + unified para forzar re-derivación.
  await kv.del(clientKeys.manifest(slug));
  await kv.del(clientKeys.branding(slug));
  await migrateOne(slug);
}
