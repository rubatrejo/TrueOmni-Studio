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
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { localizeConfig } from '../src/lib/studio/export/export-config';
import {
  materializeAssets,
  type MaterializeAssetsDeps,
} from '../src/lib/studio/export/materialize-assets';
import { createFsDeps } from '../src/lib/studio/export/materialize-assets-fs';
import { activeModules, type CollectedImage } from '../src/lib/studio/export/rewrite-config-assets';

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

/** Cuenta archivos (recursivo) bajo un dir, para el catálogo ASSETS.md. */
async function countFiles(dir: string): Promise<number> {
  let n = 0;
  try {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      if (e.isDirectory()) n += await countFiles(join(dir, e.name));
      else n++;
    }
  } catch {
    /* dir inexistente */
  }
  return n;
}

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

  // 3c. Assets referenciados por el CÓDIGO (#C): el runtime los pide por path
  //     fijo (assets/home/header-bg.jpg, assets/ai/trigger.svg, billboard, botones,
  //     favicon, logos…) y NO están en el config → hay que copiarlos a su path
  //     original o el kiosk los 404ea. Se descubren grepeando el src/ exportado.
  const active = activeModules(localized);
  // top-folder → tile.key para gatear assets de módulos inactivos.
  const FOLDER_GATE: Record<string, string> = {
    guestbook: 'guestbook',
    'photo-booth': 'photo-booth',
  };
  let codeAssets = 0;
  try {
    const raw = execFileSync(
      'grep',
      [
        '-rhoE',
        '--include=*.ts',
        '--include=*.tsx',
        'assets/[A-Za-z0-9][A-Za-z0-9/_.-]+\\.(svg|png|jpg|jpeg|webp|avif|gif|mp4|webm)',
        join(dest, 'src'),
      ],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    );
    const rels = [
      ...new Set(
        raw
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ]
      .map((p) => p.replace(/^\/?assets\//, ''))
      .filter((rel) => !rel.includes('..'));
    for (const rel of rels) {
      const topFolder = rel.split('/')[0];
      const gate = FOLDER_GATE[topFolder];
      if (gate && active && !active.has(gate)) continue; // módulo inactivo
      // resolver: cliente primero, default como fallback.
      let srcPath: string | null = null;
      for (const baseDir of [
        join(root, `clients/${slug}/assets`),
        join(root, 'clients/default/assets'),
      ]) {
        const candidate = join(baseDir, rel);
        try {
          await readFile(candidate);
          srcPath = candidate;
          break;
        } catch {
          /* siguiente */
        }
      }
      if (!srcPath) continue; // no existe en cliente ni default → se omite
      const destPath = join(dest, `clients/${slug}/assets`, rel);
      await mkdir(dirname(destPath), { recursive: true });
      await cp(srcPath, destPath);
      codeAssets++;
    }
  } catch {
    // grep sin matches o sin src → se omite.
  }

  // 3d. Carpeta de integraciones (#E): el Dev necesita saber qué cablear
  //     (mapbox token, APIs…). Se escribe el bloque `integraciones` + un README.
  const integr = (localized as { integraciones?: unknown }).integraciones ?? {};
  const integrDir = join(dest, `clients/${slug}/assets/integrations`);
  await mkdir(integrDir, { recursive: true });
  await writeFile(
    join(integrDir, 'integrations.json'),
    JSON.stringify(integr, null, 2) + '\n',
    'utf8',
  );
  await writeFile(
    join(integrDir, 'README.md'),
    [
      '# Integrations / Connections',
      '',
      'Claves y conexiones de terceros que este kiosk usa. Configúralas en tu entorno',
      '(env vars o el config) al instalar el kiosk.',
      '',
      '- **mapbox_token**: token público de Mapbox para el módulo Map.',
      '- Otras integraciones (clima, analytics, Viator, Bandwango, etc.) si están presentes en `integrations.json`.',
      '',
      'Ver `integrations.json` para los valores actuales del cliente.',
    ].join('\n') + '\n',
    'utf8',
  );

  // 3e. ASSETS.md (#F): catálogo de la carpeta de assets para el Dev.
  const assetsRoot = join(dest, `clients/${slug}/assets`);
  let tree = '';
  try {
    const top = (await readdir(assetsRoot, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    for (const folder of top) {
      const count = await countFiles(join(assetsRoot, folder));
      tree += `- \`assets/${folder}/\` — ${count} archivo(s)\n`;
    }
  } catch {
    /* sin assets */
  }
  await writeFile(
    join(dest, 'ASSETS.md'),
    [
      `# Assets — ${clientName} (${product})`,
      '',
      'Todos los assets de los módulos ACTIVOS de este kiosk. Dos tipos:',
      '',
      '- **Config-driven** (feed, branding, Home Dashboard/tiles…): rutas reescritas en `config.json`.',
      '  - `feed/<Categoría>/<Subcategoría>/` — imágenes de listings/eventos por categoría real del cliente.',
      '  - `branding/` — logos, backgrounds (homeHero/idle), `fonts/`.',
      '  - `Home Dashboard/tiles/` — imágenes de los tiles activos del home.',
      '  - `integrations/` — claves de terceros (mapbox, etc.) que el Dev debe cablear.',
      '- **Code-driven** (paths fijos que el runtime exige): `home/header-bg.jpg` (hero), `ai/` (avatar + botón AI),',
      '  `billboard-*` (idle), `ads/`, `favicon.svg`, `button-*.svg`, logos. Los pins del Map son SVG inline en',
      '  `src/lib/map-pin-icons.ts` (viajan en el código, no son archivos).',
      '',
      '## Carpetas presentes',
      '',
      tree || '(sin assets)',
    ].join('\n') + '\n',
    'utf8',
  );

  console.log('\n── export-standalone report ──');
  if (brandingExtras) console.log(`branding:    ${brandingExtras} (fonts + backgrounds)`);
  if (codeAssets) console.log(`code assets: ${codeAssets}`);
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
