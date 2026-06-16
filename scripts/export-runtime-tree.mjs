#!/usr/bin/env node
/**
 * Fase 3 del milestone "Publish → Kiosk Standalone": extrae del monorepo el
 * árbol de CÓDIGO del runtime (Kiosk 1080×1920 + PWA companion) a un directorio
 * destino, PODANDO el Studio (editor), la auth, y los productos fuera de alcance
 * (Signage / Video Walls). El árbol resultante es un repo Next.js autónomo que
 * corre el kiosk de un cliente con `KIOSK_CLIENT=<slug>`.
 *
 * Acoplamiento verificado (2026-06-16): el runtime solo usa de `lib/studio` el
 * `schema` (tipos), `kv`, `youtube` y `brand-video` — todos autocontenidos. NO
 * importa de los editores (`app/studio`, `api/studio`), ni de signage/walls. Por
 * eso la poda por carpetas es consistente (ningún archivo conservado importa de
 * uno borrado — verificación cruzada con grep dio 0).
 *
 * De `src/lib/studio` SOLO viajan las 4 utilidades que el runtime usa (`schema`,
 * `kv`, `youtube`, `brand-video`); el resto (publish, github-publisher,
 * frame-generate, export, los _backend de los editores) se poda → el repo del
 * cliente NO contiene la lógica interna del Studio.
 *
 * Uso:  node scripts/export-runtime-tree.mjs <destDir> [slug] [--with-assets]
 */
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { relative, sep } from 'node:path';

const SRC = process.cwd();
const DEST = process.argv[2] ?? '/tmp/kiosk-standalone';
const SLUG = process.argv[3] ?? 'default';
const WITH_ASSETS = process.argv.includes('--with-assets');

/** Rutas (relativas a la raíz) que NO viajan al árbol standalone. */
const EXCLUDE = new Set(
  [
    // build / vcs / efímeros
    'node_modules',
    '.next',
    '.git',
    'out',
    'coverage',
    '.turbo',
    '.vercel',
    // no-código (planeación, tests, fuentes de diseño, grafo)
    'tests',
    '.planning',
    'designs',
    'graphify-out',
    // Studio: editor UI + backend + auth (el standalone es público, sin editor)
    'src/app/studio',
    'src/app/api/studio',
    'src/app/api/auth',
    'src/app/api/oauth',
    'src/middleware.ts',
    'src/auth.ts',
    // Signage / Video Walls: productos fuera de alcance del kiosk+PWA
    'src/app/(signage)',
    'src/app/(video-walls)',
    'src/app/signage-assets',
    'src/app/video-wall-assets',
    'src/lib/signage',
    'src/lib/video-walls',
    'src/lib/ingest',
    'src/components/signage',
    'src/components/video-walls',
    // el propio toolchain de export no viaja al repo del cliente
    'scripts/export-runtime-tree.mjs',
  ].map((p) => p.split('/').join(sep)),
);

/** De `src/lib/studio` solo viajan estas utilidades (el resto es studio-only). */
const STUDIO_RUNTIME_KEEP = new Set([
  'schema', // dir schema/ (dominios)
  'schema.ts', // barrel @/lib/studio/schema
  'pwa-schema.ts', // schema de la PWA (lo usa kiosk-config)
  'kv.ts',
  'youtube.ts',
  'brand-video.ts',
]);

function isExcluded(absPath) {
  const rel = relative(SRC, absPath);
  if (rel === '') return false;
  if (EXCLUDE.has(rel)) return true;
  const parts = rel.split(sep);
  // src/lib/studio/<x>: conservar solo las utilidades runtime; podar el resto.
  if (parts[0] === 'src' && parts[1] === 'lib' && parts[2] === 'studio' && parts.length >= 4) {
    if (!STUDIO_RUNTIME_KEEP.has(parts[3])) return true;
  }
  // clients/<x>: solo viaja el cliente target (+ default como fallback + _template).
  if (parts[0] === 'clients' && parts.length >= 2) {
    const slug = parts[1];
    if (slug !== SLUG && slug !== 'default' && slug !== '_template') return true;
    // assets pesados: por defecto NO se copian (los materializa la Fase 2 al
    // export real). Con --with-assets se incluyen tal cual.
    if (!WITH_ASSETS && parts[2] === 'assets') return true;
  }
  return false;
}

rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });
cpSync(SRC, DEST, { recursive: true, filter: (src) => !isExcluded(src) });
// eslint-disable-next-line no-console
console.log(`✓ runtime tree exported to ${DEST} (slug=${SLUG}, assets=${WITH_ASSETS})`);
