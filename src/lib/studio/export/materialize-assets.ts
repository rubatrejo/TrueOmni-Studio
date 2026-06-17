import { createHash } from 'node:crypto';

import type { AssetTarget, CollectedImage } from './rewrite-config-assets';

/**
 * Materialización de assets a archivos locales para el export STANDALONE (Fase 2
 * del milestone "Publish → Kiosk Standalone"). Toma las refs que produce
 * `collectImageRefs` (Fase 1) y, para cada una, la convierte en un archivo local
 * bajo `assets/...`, devolviendo el mapa `source → pathLocal` que consume
 * `rewriteImageRefs` (Fase 1) para localizar el config.
 *
 * Tres clases de ref, todas convergen en un path `assets/...`:
 *   - http(s) (Blob propio o CDN externo de listings) → descarga → `assets/feed/<hash>.<ext>`.
 *   - relativa `assets/...` (template/placeholder) → copia del template (con
 *     fallback monorepo→default) → mismo path.
 *   - `data:` → decodifica → `assets/inline/<hash>.<ext>`.
 *
 * BEST-EFFORT (como `materialize-images`/`materialize-data-uris`): cualquier
 * fallo (404/403/timeout/escritura) NO aborta — la ref se omite del mapa (queda
 * la URL original en el config) y se registra en `report.failed`. Dedup por ref.
 *
 * Las dependencias (red/fs) se inyectan → testeable sin tocar red ni disco. La
 * implementación con Blob/fetch/fs vive en el caller (la GitHub Action de Fase 5).
 */

export interface AssetSource {
  buffer: Buffer;
  /** Extensión sin punto, derivada del content-type (jpg/png/svg/mp4/…). */
  ext: string;
}

export interface MaterializeAssetsDeps {
  /** Descarga una URL http(s); null si falla / no es un asset válido. */
  fetchUrl(url: string): Promise<AssetSource | null>;
  /** Lee un asset relativo del template (con fallback a default); null si no existe. */
  readTemplateAsset(relPath: string): Promise<AssetSource | null>;
  /** Decodifica un data: URI; null si es inválido. */
  decodeDataUri(uri: string): AssetSource | null;
  /** Escribe el asset al destino bajo `relPath` (relativo a la carpeta del cliente). */
  writeAsset(relPath: string, buffer: Buffer): Promise<void>;
  /** Descarga el archivo de una fuente (nombre Google Font o URL directa); null si falla.
   *  Opcional: si no se provee, las refs `kind:'font'` se omiten (best-effort). */
  fetchFont?(nameOrUrl: string): Promise<AssetSource | null>;
}

/** Rename de carpeta de primer nivel bajo `assets/` (folders amigables, #3). */
const RELATIVE_DIR_RENAME: Readonly<Record<string, string>> = {
  home: 'Home Dashboard',
};

/** Aplica el rename de carpeta a un path relativo `assets/<dir>/...`. */
function renameRelative(relPath: string): string {
  const parts = relPath.split('/');
  // parts[0] === 'assets'; parts[1] === <dir>
  if (parts.length >= 3 && parts[0] === 'assets' && RELATIVE_DIR_RENAME[parts[1]]) {
    parts[1] = RELATIVE_DIR_RENAME[parts[1]];
    return parts.join('/');
  }
  return relPath;
}

export interface MaterializeReport {
  /** URLs http(s) descargadas. */
  downloaded: number;
  /** Assets relativos copiados del template. */
  copied: number;
  /** data: URIs decodificados a archivo. */
  inlined: number;
  /** Refs que no aplicaban (ni http/data/relativa). */
  skipped: number;
  /** Refs que no se pudieron materializar (quedan como la URL original). */
  failed: string[];
}

export interface MaterializeAssetsResult {
  /** source ref → path local relativo (`assets/...`). */
  map: Map<string, string>;
  report: MaterializeReport;
}

/** Descargas/escrituras en paralelo. Acotado para no saturar el runner. */
const DEFAULT_CONCURRENCY = 12;

function shortHash(s: string): string {
  return createHash('sha1').update(s).digest('hex').slice(0, 16);
}

type RefKind = 'http' | 'data' | 'relative' | 'other';

function classify(ref: string): RefKind {
  if (/^https?:\/\//i.test(ref)) return 'http';
  if (ref.startsWith('data:')) return 'data';
  if (ref.startsWith('assets/') || ref.startsWith('/assets/')) return 'relative';
  return 'other';
}

type OneResult =
  | { kind: 'downloaded' | 'copied' | 'inlined'; local: string }
  | { kind: 'skipped' }
  | { kind: 'failed' };

/** Reservador de paths: garantiza unicidad sufijando `-2/-3` ante colisión. */
type Reserve = (dir: string, base: string, ext: string) => string;

function makeReserve(): Reserve {
  const used = new Set<string>();
  return (dir, base, ext) => {
    let candidate = `${dir}/${base}.${ext}`;
    let n = 2;
    while (used.has(candidate)) candidate = `${dir}/${base}-${n++}.${ext}`;
    used.add(candidate);
    return candidate;
  };
}

/** Path local para una ref http/data: usa el target semántico si existe, si no, hash. */
function localPath(
  ref: string,
  ext: string,
  target: AssetTarget | undefined,
  fallbackDir: string,
  reserve: Reserve,
): string {
  if (target) return reserve(target.dir, target.base, ext);
  return `${fallbackDir}/${shortHash(ref)}.${ext}`;
}

async function materializeOne(
  img: CollectedImage,
  deps: MaterializeAssetsDeps,
  reserve: Reserve,
): Promise<OneResult> {
  const { ref, target, kind } = img;

  // Fuente del branding (#7): descarga el TTF/woff2 a assets/branding/fonts.
  if (kind === 'font') {
    if (!deps.fetchFont) return { kind: 'skipped' };
    const src = await deps.fetchFont(ref);
    if (!src) return { kind: 'failed' };
    const local = localPath(ref, src.ext, target, 'assets/branding/fonts', reserve);
    await deps.writeAsset(local, src.buffer);
    return { kind: 'downloaded', local };
  }

  switch (classify(ref)) {
    case 'http': {
      const src = await deps.fetchUrl(ref);
      if (!src) return { kind: 'failed' };
      const local = localPath(ref, src.ext, target, 'assets/feed/_misc', reserve);
      await deps.writeAsset(local, src.buffer);
      return { kind: 'downloaded', local };
    }
    case 'data': {
      const src = deps.decodeDataUri(ref);
      if (!src) return { kind: 'failed' };
      const local = localPath(ref, src.ext, target, 'assets/inline', reserve);
      await deps.writeAsset(local, src.buffer);
      return { kind: 'inlined', local };
    }
    case 'relative': {
      // Los relativos conservan su path del template, con rename de carpeta
      // amigable (home → Home Dashboard, #3). Se lee del path ORIGINAL y se
      // escribe al renombrado.
      const norm = ref.startsWith('/') ? ref.slice(1) : ref;
      const src = await deps.readTemplateAsset(norm);
      if (!src) return { kind: 'failed' };
      const dest = renameRelative(norm);
      await deps.writeAsset(dest, src.buffer);
      return { kind: 'copied', local: dest };
    }
    default:
      return { kind: 'skipped' };
  }
}

/** Aplica un mapper async sobre un array con concurrencia acotada. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

/**
 * Materializa las refs a archivos locales. Devuelve el mapa source→pathLocal
 * (para `rewriteImageRefs`) y un reporte. Dedup por ref; best-effort.
 */
export async function materializeAssets(
  refs: ReadonlyArray<string | CollectedImage>,
  deps: MaterializeAssetsDeps,
  opts: { concurrency?: number } = {},
): Promise<MaterializeAssetsResult> {
  // Acepta strings (naming legacy hash) o CollectedImage (target semántico).
  // Dedup por ref conservando el primer item (su target).
  const seen = new Set<string>();
  const unique: CollectedImage[] = [];
  for (const r of refs) {
    const img = typeof r === 'string' ? { ref: r } : r;
    if (seen.has(img.ref)) continue;
    seen.add(img.ref);
    unique.push(img);
  }
  const reserve = makeReserve();
  const results = await mapWithConcurrency(unique, opts.concurrency ?? DEFAULT_CONCURRENCY, (img) =>
    materializeOne(img, deps, reserve).catch((): OneResult => ({ kind: 'failed' })),
  );

  const map = new Map<string, string>();
  const report: MaterializeReport = {
    downloaded: 0,
    copied: 0,
    inlined: 0,
    skipped: 0,
    failed: [],
  };
  unique.forEach((img, i) => {
    const ref = img.ref;
    const r = results[i];
    if (r.kind === 'failed') {
      report.failed.push(ref);
    } else if (r.kind === 'skipped') {
      report.skipped++;
    } else {
      map.set(ref, r.local);
      if (r.kind === 'downloaded') report.downloaded++;
      else if (r.kind === 'copied') report.copied++;
      else report.inlined++;
    }
  });
  return { map, report };
}
