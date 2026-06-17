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
import {
  materializeAssets,
  type MaterializeAssetsDeps,
} from '../src/lib/studio/export/materialize-assets';
import { createFsDeps } from '../src/lib/studio/export/materialize-assets-fs';
import type { CollectedImage } from '../src/lib/studio/export/rewrite-config-assets';

const slug = process.argv[2];
const product = process.argv.find((a) => a.startsWith('--product='))?.split('=')[1] ?? 'kiosk';
const dest =
  process.argv[3] && !process.argv[3].startsWith('--')
    ? process.argv[3]
    : `/tmp/${product}-${slug}`;
const dry = process.argv.includes('--dry');

if (!slug || (product !== 'kiosk' && product !== 'pwa')) {
  console.error(
    'uso: npx tsx scripts/export-standalone.ts <slug> [destDir] --product=kiosk|pwa [--dry]',
  );
  process.exit(1);
}

const root = process.cwd();

async function main() {
  // 1. Copiar el árbol del runtime de ESTE producto (sin el otro, sin Studio/Signage/Walls).
  execFileSync(
    'node',
    [join(root, 'scripts/export-runtime-tree.mjs'), dest, slug, `--product=${product}`],
    { stdio: 'inherit' },
  );

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

  const clientName: string = config?.client?.nombre || config?.client?.name || slug;
  const { config: localized, report } = await localizeConfig(config, deps, {
    concurrency: 16,
    clientName,
  });

  // 3. Escribir el config localizado (mismo formato que el publish: 2 espacios + \n).
  await writeFile(join(dest, configPath), JSON.stringify(localized, null, 2) + '\n', 'utf8');

  // 3b. Branding-extras (#7): fonts + brand backgrounds (homeHero/brandVideo/
  //     idleBackground) viven en el studioConfig (NO en el FS config, que solo
  //     trae logos), que apply-standalone-manifest deja en
  //     $RUNNER_TEMP/studio-config.json. Best-effort: descarga a assets/branding/
  //     (+ /fonts). No se reescribe el config (no se referencian por path local).
  let brandingExtras = 0;
  if (!dry && process.env.RUNNER_TEMP) {
    try {
      const studio = JSON.parse(
        await readFile(join(process.env.RUNNER_TEMP, 'studio-config.json'), 'utf8'),
      );
      const branding = studio?.branding ?? {};
      const sanitize = (s: string) => s.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
      const extras: CollectedImage[] = [];

      // Fonts → assets/branding/fonts/
      for (const v of Object.values(branding.fonts ?? {})) {
        let ref: string | null = null;
        let name = 'font';
        if (typeof v === 'string' && v.trim()) {
          ref = v;
          name = v;
        } else if (v && typeof v === 'object') {
          const obj = v as { name?: string; dataUrl?: string };
          if (typeof obj.dataUrl === 'string' && obj.dataUrl) {
            ref = obj.dataUrl;
            name = obj.name || 'custom';
          }
        }
        if (ref) {
          extras.push({
            ref,
            kind: 'font',
            target: { dir: 'assets/branding/fonts', base: sanitize(name) || 'font' },
          });
        }
      }

      // Brand backgrounds/media {kind, src} → assets/branding/
      for (const key of ['homeHero', 'brandVideo', 'idleBackground']) {
        const media = branding[key] as { src?: string } | undefined;
        const src = media?.src;
        if (typeof src === 'string' && /^https?:\/\//i.test(src)) {
          extras.push({ ref: src, target: { dir: 'assets/branding', base: sanitize(key) } });
        }
      }

      if (extras.length) {
        const { report: er } = await materializeAssets(extras, deps, { concurrency: 8 });
        brandingExtras = er.downloaded;
      }
    } catch {
      // sin studio-config → se omite.
    }
  }

  console.log('\n── export-standalone report ──');
  if (brandingExtras) console.log(`branding:    ${brandingExtras} (fonts + backgrounds)`);
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
