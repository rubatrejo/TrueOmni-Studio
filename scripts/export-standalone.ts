#!/usr/bin/env -S npx tsx
/**
 * Fase 5 (orquestador) del milestone "Publish → Kiosk Standalone": ensambla en
 * disco un kiosk standalone autocontenido de un cliente, uniendo las piezas ya
 * probadas:
 *   1. `export-runtime-tree.mjs` → copia el código del runtime (kiosk+PWA, sin Studio).
 *   2. `localizeConfig` (+ `createFsDeps`) → baja/copia TODOS los assets del config
 *      a `clients/<slug>/assets/...` locales y reescribe el config a paths locales.
 *   3. Escribe el `config.json` localizado + reporte de materialización.
 *
 * Corre con tsx (Node) — en la GitHub Action (Fase 6) y localmente para verificar.
 *
 * Uso:  npx tsx scripts/export-standalone.ts <slug> [destDir] [--dry]
 *   --dry: no descarga las URLs externas (las deja como están) — verifica el
 *          flujo (copia de assets relativos + data: + reescritura) sin red.
 */
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { localizeConfig } from '../src/lib/studio/export/export-config';
import type { MaterializeAssetsDeps } from '../src/lib/studio/export/materialize-assets';
import { createFsDeps } from '../src/lib/studio/export/materialize-assets-fs';

const slug = process.argv[2];
const dest =
  process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : `/tmp/kiosk-${slug}`;
const dry = process.argv.includes('--dry');

if (!slug) {
  console.error('uso: npx tsx scripts/export-standalone.ts <slug> [destDir] [--dry]');
  process.exit(1);
}

const root = process.cwd();

async function main() {
  // 1. Copiar el árbol del runtime (kiosk+PWA, sin Studio/Signage/Walls).
  execFileSync('node', [join(root, 'scripts/export-runtime-tree.mjs'), dest, slug], {
    stdio: 'inherit',
  });

  // 2. Materializar los assets del config a paths locales.
  const configPath = `clients/${slug}/config.json`;
  const config = JSON.parse(await readFile(join(root, configPath), 'utf8'));

  let deps: MaterializeAssetsDeps = createFsDeps({
    clientAssetsDir: join(root, `clients/${slug}/assets`),
    defaultAssetsDir: join(root, 'clients/default/assets'),
    destClientDir: join(dest, `clients/${slug}`),
  });
  if (dry) {
    // En seco no tocamos la red: las URLs externas quedan como están.
    deps = { ...deps, fetchUrl: async () => null };
  }

  const { config: localized, report } = await localizeConfig(config, deps, { concurrency: 16 });

  // 3. Escribir el config localizado (mismo formato que el publish: 2 espacios + \n).
  await writeFile(join(dest, configPath), JSON.stringify(localized, null, 2) + '\n', 'utf8');

  console.log('\n── export-standalone report ──');
  console.log(`slug:        ${slug}`);
  console.log(`dest:        ${dest}`);
  console.log(`downloaded:  ${report.downloaded}`);
  console.log(`copied:      ${report.copied}`);
  console.log(`inlined:     ${report.inlined}`);
  console.log(
    `failed:      ${report.failed.length}${dry ? ' (dry: URLs externas no descargadas)' : ''}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
