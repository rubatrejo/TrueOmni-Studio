#!/usr/bin/env node
/**
 * clean-dev-screenshots.mjs — mueve los PNGs sueltos en la raíz del repo a
 * `.planning/verifications/_orphans-<fecha>/` para mantener el árbol limpio.
 *
 * Los PNGs en raíz están ignorados por git (`.gitignore: /*.png`), pero
 * acumulan disco local y ensucian `ls` para humanos y para Claude. Este
 * script los mueve por defecto (preserva histórico). Con `--purge` los borra.
 *
 * Uso:
 *   pnpm clean:screenshots              → mueve (default)
 *   pnpm clean:screenshots --purge      → borra
 *   pnpm clean:screenshots --dry-run    → solo lista, no modifica
 *
 * Salida: resumen con número de archivos y MB movidos/borrados.
 */

import { readdirSync, statSync, mkdirSync, renameSync, unlinkSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import process from 'node:process';

const USAGE = `Uso: pnpm clean:screenshots [--purge] [--dry-run] [--help]

Opciones:
  (default)     Mueve los PNGs de la raíz a .planning/verifications/_orphans-<YYYY-MM-DD>/.
  --purge       Los borra en vez de moverlos.
  --dry-run     Solo lista lo que haría, sin modificar nada.
  -h, --help    Esta ayuda.

Considera "PNG suelto" todo *.png en la raíz del repo. Carpetas anidadas
(clients/, src/, designs/, public/, .planning/verifications/, etc.) NO se tocan.
`;

function parseArgs(argv) {
  const args = { purge: false, dryRun: false };
  for (const a of argv) {
    if (a === '-h' || a === '--help') {
      console.log(USAGE);
      process.exit(0);
    } else if (a === '--purge') args.purge = true;
    else if (a === '--dry-run') args.dryRun = true;
    else {
      console.error(`Argumento desconocido: ${a}`);
      console.error(USAGE);
      process.exit(1);
    }
  }
  return args;
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatMB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const args = parseArgs(process.argv.slice(2));
const root = process.cwd();

const pngs = readdirSync(root)
  .filter((name) => name.toLowerCase().endsWith('.png'))
  .map((name) => ({ name, path: join(root, name), size: statSync(join(root, name)).size }));

if (pngs.length === 0) {
  console.log('✔ Nada que limpiar: cero PNGs en la raíz.');
  process.exit(0);
}

const totalBytes = pngs.reduce((acc, p) => acc + p.size, 0);

console.log(`▶ Encontrados ${pngs.length} PNGs en raíz (${formatMB(totalBytes)}).`);

if (args.dryRun) {
  console.log('\n(dry-run) Lista de archivos que se procesarían:');
  for (const p of pngs.slice(0, 20)) console.log(`  ${p.name} (${formatMB(p.size)})`);
  if (pngs.length > 20) console.log(`  ... y ${pngs.length - 20} más.`);
  process.exit(0);
}

if (args.purge) {
  console.log(`▶ Borrando ${pngs.length} archivos...`);
  for (const p of pngs) unlinkSync(p.path);
  console.log(`✔ Borrados ${pngs.length} PNGs (${formatMB(totalBytes)} liberados).`);
  process.exit(0);
}

// default: move
const destDir = resolve(root, '.planning', 'verifications', `_orphans-${today()}`);
if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });

console.log(`▶ Moviendo a ${destDir}...`);
let moved = 0;
let renamed = 0;
for (const p of pngs) {
  let dest = join(destDir, p.name);
  if (existsSync(dest)) {
    // colisión: añadir sufijo timestamp
    const stamp = String(Date.now());
    const base = p.name.replace(/\.png$/i, '');
    dest = join(destDir, `${base}-${stamp}.png`);
    renamed += 1;
  }
  renameSync(p.path, dest);
  moved += 1;
}

console.log(`✔ Movidos ${moved} PNGs (${formatMB(totalBytes)}) a ${destDir}.`);
if (renamed > 0) console.log(`  (${renamed} archivo(s) con sufijo añadido por colisión de nombre.)`);
