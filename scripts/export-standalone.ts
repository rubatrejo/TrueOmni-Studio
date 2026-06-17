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
import { cp, mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import {
  CANONICAL_MAP_SOURCES,
  clusterSvgWithColor,
  pinColorForExport,
  pinSvgWithColor,
} from '../src/components/map/map-pin-icons';
import { trueOmniWordmarkSvg } from '../src/components/brand/true-omni-logo';
import { localizeConfig } from '../src/lib/studio/export/export-config';
import {
  canonicalAssetPath,
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

/** Token de nombre de cliente para filenames: símbolos/espacios → `_`, conserva caja. */
function sanitizeName(s: string): string {
  return (s || 'Client').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'Client';
}

/**
 * Tokeniza una etiqueta a un filename seguro y legible (#1): `&` → `and`, el
 * resto de símbolos/espacios → `-`, sin guiones dobles ni al inicio/fin.
 * Ej: "Eat & Drink" → "Eat-and-Drink", "Things to Do" → "Things-to-Do".
 */
function tokenizeLabel(s: string): string {
  return (s || '')
    .replace(/&/g, ' and ')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Nombre de la carpeta top-level de assets del cliente (#3): Title-Case con
 * guiones + sufijo `-Assets` (mismo naming que el repo). Ej: "Hello Harford"
 * → "Hello-Harford-Assets".
 */
function clientFolderName(name: string): string {
  const titled = (name || 'Client')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('-');
  return `${titled || 'Client'}-Assets`;
}

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

  // studioConfig crudo (branding extras + master switches). Se carga UNA vez y
  // se reutiliza en 3b/3c. `systemModules` gatea módulos system-wide (ads, AI)
  // que NO son tiles del grid.
  let studioConfig: {
    branding?: Record<string, unknown>;
    modules?: { systemModules?: Record<string, boolean> };
  } | null = null;
  if (process.env.RUNNER_TEMP) {
    try {
      studioConfig = JSON.parse(
        await readFile(join(process.env.RUNNER_TEMP, 'studio-config.json'), 'utf8'),
      );
    } catch {
      /* sin studio-config → sin gating system-wide */
    }
  }
  const systemModules = (studioConfig?.modules?.systemModules ?? {}) as Record<string, boolean>;
  const sysOn = (k: string) => systemModules[k] !== false;

  // Purga de módulos system-wide APAGADOS antes de materializar (#2): sus
  // assets son config-driven (referenciados en el config) y el gate del grep
  // de código no los alcanza. Si el operador apagó Ads o el AI avatar, su
  // contenido NO debe viajar al export.
  if (!sysOn('ads')) {
    delete (config as { advertisements?: unknown }).advertisements;
    const feats = (config as { features?: Record<string, unknown> }).features;
    if (feats) delete feats.advertisements;
  }
  if (!sysOn('aiAvatar')) {
    const askAi = (config as { features?: { home?: { askAi?: Record<string, unknown> } } })
      ?.features?.home?.askAi;
    if (askAi && typeof askAi === 'object') {
      delete askAi.avatar;
      delete askAi.heroVideo;
    }
  }

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
  if (!dry && studioConfig) {
    try {
      const branding = studioConfig.branding ?? {};
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

      // Brand backgrounds/media {kind, src}. El HERO del home (#4) va a la
      // carpeta de tiles con naming de cliente; el resto (brandVideo,
      // idleBackground) quedan en Branding/.
      const clientToken = sanitize(clientName) || 'Client';
      for (const key of ['homeHero', 'brandVideo', 'idleBackground']) {
        const media = branding[key] as { src?: string } | undefined;
        const src = media?.src;
        if (typeof src === 'string' && /^https?:\/\//i.test(src)) {
          const target =
            key === 'homeHero'
              ? { dir: 'assets/Home Dashboard/tiles', base: `${clientToken}-hero` }
              : { dir: 'assets/Branding', base: `${clientToken}-${sanitize(key)}` };
          extras.push({ ref: src, target });
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

  // 3c. Assets referenciados por el CÓDIGO: el runtime los pide por path fijo
  //     (assets/home/header-bg.jpg, assets/ai/trigger.svg, billboard, botones,
  //     favicon, logos…) y NO están en el config. Se descubren grepeando el src/
  //     exportado y se copian GATEADOS (#1/#2/#4): SOLO la variante de billboard
  //     activa (y solo del cliente, sin fallback al theme), systemModules para
  //     ai/ads, producto para pwa, y tiles de módulos inactivos. El destino va
  //     capitalizado (#7); los src refs se reescriben en 3f para que el runtime
  //     siga encontrándolos.
  const active = activeModules(localized);

  // `systemModules`/`sysOn` ya se cargaron arriba (gatean ai/ads).
  const billboardVariant = Number(
    (localized as { features?: { billboard_variant?: unknown } })?.features?.billboard_variant ?? 0,
  );
  const clientToken = sanitizeName(clientName);

  // top-folder de un tile → su key para gatear por `active`.
  const TILE_GATE: Record<string, string> = {
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

      // PWA chrome solo en el export pwa.
      if (topFolder === 'pwa' && product !== 'pwa') continue;
      // Billboard: SOLO la variante activa (#1).
      const bm = /^billboard-(\d+)$/.exec(topFolder);
      if (bm && Number(bm[1]) !== billboardVariant) continue;
      // Tiles de módulos inactivos.
      const tileGate = TILE_GATE[topFolder];
      if (tileGate && active && !active.has(tileGate)) continue;
      // Master switches del operador: AI avatar / Ads.
      if (topFolder === 'ai' && !sysOn('aiAvatar')) continue;
      if (topFolder === 'ads' && !sysOn('ads')) continue;

      // Fuente: cliente→default para TODO, INCLUIDO el billboard (#2): el idle
      // screen siempre muestra algo, así que la variante activa cae al default
      // si el cliente no trae assets propios (antes el billboard era cliente-only
      // sin fallback; se cambió para que el idle nunca quede vacío).
      const baseDirs = [join(root, `clients/${slug}/assets`), join(root, 'clients/default/assets')];
      let srcPath: string | null = null;
      for (const baseDir of baseDirs) {
        const candidate = join(baseDir, rel);
        try {
          await readFile(candidate);
          srcPath = candidate;
          break;
        } catch {
          /* siguiente */
        }
      }
      if (!srcPath) continue; // no existe ni en cliente ni en default → se omite

      // Destino capitalizado (#7). El billboard va a `Billboard/Idle/` (#2):
      // los assets de la variante activa del idle screen viven todos juntos
      // ahí (la variante concreta ya está gateada arriba por `billboardVariant`).
      const outRel = bm
        ? `Billboard/Idle/${rel.split('/').slice(1).join('/')}`
        : canonicalAssetPath(`assets/${rel}`).replace(/^assets\//, '');
      const destPath = join(dest, `clients/${slug}/assets`, outRel);
      await mkdir(dirname(destPath), { recursive: true });
      await cp(srcPath, destPath);
      codeAssets++;

      // Logos SVG de marca (#6): además del path raíz que pide el runtime, se
      // copian a Branding/ con naming de cliente para tenerlos junto al resto.
      if (/^(logo|logo-dark)\.svg$/.test(rel)) {
        const brandBase =
          rel === 'logo-dark.svg' ? `${clientToken}-logo-dark` : `${clientToken}-logo`;
        const brandDest = join(dest, `clients/${slug}/assets/Branding`, `${brandBase}.svg`);
        await mkdir(dirname(brandDest), { recursive: true });
        await cp(srcPath, brandDest);
        codeAssets++;
      }
    }
  } catch {
    // grep sin matches o sin src → se omite.
  }

  // 3f. Reescritura de refs en el src/ exportado (#7): las carpetas code-driven
  //     se capitalizaron en 3c, así que el código que las pide por path fijo
  //     (assets/home/…, assets/ai/…, billboard-N, photo-booth, guestbook, pwa,
  //     ads) debe apuntar al nombre nuevo o el runtime las 404ea. Se reescribe
  //     in-place en cada archivo de src/.
  const CODE_REF_RENAMES: Array<[RegExp, string]> = [
    [/assets\/home\//g, 'assets/Home Dashboard/'],
    [/assets\/ai\//g, 'assets/AI/'],
    [/assets\/photo-booth\//g, 'assets/Photo Booth/'],
    [/assets\/guestbook\//g, 'assets/Guestbook/'],
    [/assets\/pwa\//g, 'assets/PWA/'],
    [/assets\/ads\//g, 'assets/Ads/'],
    [/assets\/billboard-\d+\//g, 'assets/Billboard/Idle/'],
  ];
  let codeRefsRewritten = 0;
  try {
    const listed = execFileSync(
      'grep',
      [
        '-rlE',
        '--include=*.ts',
        '--include=*.tsx',
        'assets/(home|ai|photo-booth|guestbook|pwa|ads|billboard-[0-9])/',
        join(dest, 'src'),
      ],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    )
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const file of listed) {
      const before = await readFile(file, 'utf8');
      let after = before;
      for (const [re, to] of CODE_REF_RENAMES) after = after.replace(re, to);
      if (after !== before) {
        await writeFile(file, after, 'utf8');
        codeRefsRewritten++;
      }
    }
  } catch {
    // grep sin matches → nada que reescribir.
  }

  // 3g. Map + Trip Planner (#8/#9): los pins son SVG inline en el código; aquí
  //     se materializan como ARCHIVOS .svg por categoría (color resuelto del
  //     tokens.css del cliente) + un placeholder de mapa. El mismo set de pins
  //     viaja en Map/Pins y Trip Planner/Pins.
  let mapAssets = 0;
  if (active?.has('map') || active?.has('itinerary-builder')) {
    try {
      // brand-* HSL del tokens.css del cliente (para el color de los pins).
      const brandVars: Record<string, string> = {};
      try {
        const css = await readFile(join(dest, `clients/${slug}/tokens.css`), 'utf8');
        for (const m of css.matchAll(/(--brand-[a-z]+)\s*:\s*([^;]+);/g)) {
          brandVars[m[1].trim()] = m[2].trim();
        }
      } catch {
        /* sin tokens.css → colores literales/fallback */
      }
      const mapPlaceholder =
        '<svg xmlns="http://www.w3.org/2000/svg" width="780" height="1200" viewBox="0 0 780 1200">' +
        '<rect width="780" height="1200" fill="#e8eaed"/>' +
        '<g stroke="#cfd4da" stroke-width="2">' +
        '<path d="M0 300H780M0 600H780M0 900H780M260 0V1200M520 0V1200"/></g>' +
        '<text x="390" y="610" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" ' +
        'font-size="28" fill="#9aa0a6">Map placeholder</text></svg>';
      // Etiquetas reales de las categorías del cliente para nombrar cada pin
      // (#1): restaurants → "Eat & Drink" → "Eat-and-Drink.svg". Si no hay
      // label, cae al source key capitalizado.
      const moduleLabels = (
        localized as { features?: { home?: { modules?: Record<string, { label?: string }> } } }
      )?.features?.home?.modules;
      const pinFilename = (source: string): string => {
        const label = moduleLabels?.[source]?.label;
        const token = label ? tokenizeLabel(label) : '';
        return token || sanitizeName(source.charAt(0).toUpperCase() + source.slice(1));
      };
      // Color del cluster: --brand-primary del cliente (resuelto a hsl(...)),
      // fallback al azul kiosk. count de muestra para el pin de ejemplo.
      const primaryRaw = (brandVars['--brand-primary'] ?? '').trim();
      const clusterColor = primaryRaw ? `hsl(${primaryRaw.split(/\s+/).join(', ')})` : '#0066cc';
      const pinDirs = [
        ...(active?.has('map') ? [`clients/${slug}/assets/Map`] : []),
        ...(active?.has('itinerary-builder') ? [`clients/${slug}/assets/Trip Planner`] : []),
      ];
      for (const baseRel of pinDirs) {
        const pinsDir = join(dest, baseRel, 'Pins');
        await mkdir(pinsDir, { recursive: true });
        for (const source of CANONICAL_MAP_SOURCES) {
          const color = pinColorForExport(source, brandVars);
          await writeFile(
            join(pinsDir, `${pinFilename(source)}.svg`),
            pinSvgWithColor(source, color),
            'utf8',
          );
          mapAssets++;
        }
        // Pin de cluster (#1): un solo SVG por carpeta, color = brand-primary.
        await writeFile(join(pinsDir, 'Cluster.svg'), clusterSvgWithColor(5, clusterColor), 'utf8');
        mapAssets++;
      }
      if (active?.has('map')) {
        await writeFile(
          join(dest, `clients/${slug}/assets/Map/placeholder.svg`),
          mapPlaceholder,
          'utf8',
        );
        mapAssets++;
      }
    } catch {
      // sin pins → se omite (best-effort).
    }
  }

  // 3h-bg. Idle background del OPERADOR (no el del theme): el fondo del Billboard
  //     idle que el operador subió vive en `studioConfig.billboard.background`
  //     (gana sobre el theme y sobre `branding.idleBackground` — ver
  //     use-billboard-override.ts). Vive en el KV, NO en el FS config, por eso el
  //     code-grep caía al theme `billboard-<N>/hero.jpg`. Si hay imagen subida
  //     (URL http), se descarga y (a) se guarda con nombre claro y (b) reemplaza
  //     el hero del theme que el runtime de la variante activa pide
  //     (VARIANT_DEFAULT_BACKGROUND), para que el idle standalone muestre la
  //     imagen del cliente. Si el operador no subió (src relativo) queda la del
  //     theme/default que el code-grep ya copió.
  let idleBgAssets = 0;
  if (!dry) {
    try {
      const bb = (studioConfig as { billboard?: Record<string, unknown> } | null)?.billboard ?? {};
      const shared = bb.background as { type?: string; src?: string } | undefined;
      const perVariant = (
        bb[`b${billboardVariant}`] as { background?: { type?: string; src?: string } } | undefined
      )?.background;
      const media = shared?.src ? shared : perVariant;
      const src = media?.src;
      if (typeof src === 'string' && /^https?:\/\//i.test(src) && media?.type !== 'video') {
        const asset = await deps.fetchUrl(src);
        if (asset) {
          const idleDir = join(dest, `clients/${slug}/assets/Billboard/Idle`);
          await mkdir(idleDir, { recursive: true });
          // Nombre claro para el deliverable.
          await writeFile(
            join(idleDir, `${clientToken}-idle-background.${asset.ext}`),
            asset.buffer,
          );
          // Reemplaza el hero del theme que pide el runtime de la variante activa.
          const heroFile = billboardVariant === 2 ? 'hero.png' : 'hero.jpg';
          await writeFile(join(idleDir, heroFile), asset.buffer);
          idleBgAssets += 1;
        }
      }
    } catch {
      // best-effort: sin idle bg subido → queda el del theme.
    }
  }

  // 3h. Logo "Powered by TrueOmni" del footer del idle screen (#4): el footer
  //     del Billboard idle lo renderiza inline (SVG en `true-omni-logo.tsx`).
  //     Se materializa como ARCHIVO `.svg` autónomo (blanco, como en el footer)
  //     junto al resto del idle en `Billboard/Idle/` para que el Dev lo tenga.
  let brandLogos = 0;
  try {
    const idleDir = join(dest, `clients/${slug}/assets/Billboard/Idle`);
    await mkdir(idleDir, { recursive: true });
    await writeFile(
      join(idleDir, 'Powered-by-TrueOmni.svg'),
      trueOmniWordmarkSvg('#ffffff'),
      'utf8',
    );
    brandLogos++;
  } catch {
    // best-effort.
  }

  // 3d. Carpeta de integraciones (#E): el Dev necesita saber qué cablear
  //     (mapbox token, APIs…). Se escribe el bloque `integraciones` + un README.
  const integr = (localized as { integraciones?: unknown }).integraciones ?? {};
  const integrDir = join(dest, `clients/${slug}/assets/Integrations`);
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

  // 3i. Rename de la carpeta top-level `clients/` → `<ClientName>-Assets/` (#3):
  //     la carpeta de DATA del cliente queda con el naming del repo
  //     (`Hello-Harford-Assets/hello-harford/...`) en vez de `clients/...`. Se
  //     renombra SOLO el parent (`clients` → `<ClientName>-Assets`); el `<slug>/`
  //     interno (config.json + assets/ + i18n/ + tokens.css) se conserva. Luego
  //     se reescriben TODAS las refs del runtime exportado que apuntan a
  //     `clients/` (el loader `path.join(process.cwd(), 'clients', slug, ...)`,
  //     el asset route handler, tokens, i18n…) para que apunten al dir nuevo.
  const assetsFolder = clientFolderName(clientName);
  let dataRefsRewritten = 0;
  try {
    // 1) Renombrar el dir destino `clients/` → `<ClientName>-Assets/`.
    await rename(join(dest, 'clients'), join(dest, assetsFolder));

    // 2) Reescribir las refs en el src/ exportado. El runtime referencia la
    //    carpeta de dos formas: como ARG de `path.join(..., 'clients', ...)`
    //    (string literal `'clients'`) y como segmento de paths literales
    //    `clients/<algo>` en docs/strings. Se reescriben ambas. NO se tocan
    //    `clients-signage`/`clients-walls` (otros productos) — el regex exige
    //    que tras `clients` venga `'`, `/` o fin, nunca `-`.
    const reArg = /(['"])clients\1/g; // 'clients' como arg de path.join
    const rePath = /\bclients\//g; // segmento "clients/" en paths/strings
    const listedData = execFileSync(
      'grep',
      [
        '-rlE',
        '--include=*.ts',
        '--include=*.tsx',
        '([\'"]clients[\'"]|\\bclients/)',
        join(dest, 'src'),
      ],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    )
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const file of listedData) {
      const before = await readFile(file, 'utf8');
      // Cuidado con `clients-signage`/`clients-walls`: el split por `clients/`
      // no los toca (van seguidos de `-`), y `'clients'` exacto tampoco.
      const after = before
        .replace(reArg, `$1${assetsFolder}$1`)
        .replace(rePath, `${assetsFolder}/`);
      if (after !== before) {
        await writeFile(file, after, 'utf8');
        dataRefsRewritten++;
      }
    }
  } catch (e) {
    console.error('[export] rename clients/ → <ClientName>-Assets/ falló:', e);
  }

  console.log('\n── export-standalone report ──');
  if (brandLogos) console.log(`brand logos: ${brandLogos} (Powered-by-TrueOmni)`);
  if (idleBgAssets) console.log(`idle bg:     ${idleBgAssets} (operator upload → Billboard/Idle)`);
  if (dataRefsRewritten)
    console.log(`data refs:   ${dataRefsRewritten} files rewritten (${assetsFolder})`);
  if (brandingExtras) console.log(`branding:    ${brandingExtras} (fonts + backgrounds)`);
  if (codeAssets) console.log(`code assets: ${codeAssets}`);
  if (codeRefsRewritten) console.log(`code refs:   ${codeRefsRewritten} files rewritten (caps)`);
  if (mapAssets) console.log(`map assets:  ${mapAssets} (pins + placeholder)`);
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
