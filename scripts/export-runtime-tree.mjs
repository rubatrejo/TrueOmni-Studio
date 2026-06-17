#!/usr/bin/env node
/**
 * Fase 3 del milestone "Publish → Kiosk Standalone": extrae del monorepo el
 * árbol de CÓDIGO de UN producto del runtime a un directorio destino, PODANDO el
 * Studio (editor), la auth, los productos fuera de alcance (Signage / Video
 * Walls) Y EL OTRO PRODUCTO del runtime. Cada producto se exporta individual:
 *   --product=kiosk → solo el Kiosk (1080×1920), SIN la PWA.
 *   --product=pwa   → solo la PWA companion, SIN el Kiosk.
 * Es seguro: el kiosk no importa nada de la PWA, y la PWA no importa rutas del
 * kiosk (solo componentes compartidos, que viajan en ambos). El árbol resultante
 * es un repo Next.js autónomo que corre con `KIOSK_CLIENT=<slug>`.
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
const PRODUCT = process.argv.find((a) => a.startsWith('--product='))?.split('=')[1] ?? 'kiosk';
if (PRODUCT !== 'kiosk' && PRODUCT !== 'pwa') {
  console.error(`--product debe ser 'kiosk' o 'pwa' (recibido: ${PRODUCT})`);
  process.exit(1);
}
// El OTRO producto se poda: sus rutas + sus componentes/libs exclusivos. Lo
// compartido (config, listings, events, map, social-wall, …) viaja en ambos.
const OTHER_PRODUCT = {
  kiosk: ['src/app/(pwa)', 'src/components/pwa'],
  pwa: ['src/app/(kiosk)', 'src/components/billboard'],
}[PRODUCT];

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
    // no-código (planeación, tests, fuentes de diseño, grafo, docs internos)
    'tests',
    '.planning',
    'designs',
    'graphify-out',
    'docs',
    'CLAUDE.md',
    // public: el kiosk standalone NO necesita los assets del Studio. Se conserva
    // public/pdfjs (lo usa el lector de brochures del kiosk) y public/brochures.
    'public/studio',
    'public/sign-in-bg.jpg',
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
    // Data de OTROS productos: cada Publish es independiente; un export de kiosk
    // NO debe arrastrar el contenido de signage ni de video-walls (#4 feedback).
    'clients-signage',
    'clients-walls',
    // el propio toolchain de export no viaja al repo del cliente
    'scripts/export-runtime-tree.mjs',
    'scripts/export-standalone.ts',
    // el OTRO producto del runtime (kiosk⇄pwa) se poda
    ...OTHER_PRODUCT,
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
  // kiosk-only: podar las libs PWA-exclusivas (src/lib/pwa-*.ts).
  if (
    PRODUCT === 'kiosk' &&
    parts[0] === 'src' &&
    parts[1] === 'lib' &&
    parts[2]?.startsWith('pwa-')
  ) {
    return true;
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
