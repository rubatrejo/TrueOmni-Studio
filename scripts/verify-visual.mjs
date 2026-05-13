#!/usr/bin/env node
/**
 * verify-visual.mjs — captura un screenshot del kiosk en una ruta dada y, si
 * existe un baseline PNG, calcula el diff visual.
 *
 * Reemplaza a Playwright. Es la versión scriptable de /verificar-visual,
 * pensada para correr fuera de Claude Code (CI, pre-push hook, contributor
 * sin Claude Code instalado).
 *
 * Uso:
 *   pnpm verify:visual --ruta /home
 *   pnpm verify:visual --ruta /home/passes --name 3-11-passes
 *   pnpm verify:visual --ruta / --baseline /tmp/thumbs/01-home.png
 *
 * Requisitos:
 *   - agent-browser instalado globalmente (`npm i -g agent-browser && agent-browser install`).
 *   - Dev server arriba en http://localhost:3000 (`pnpm kiosk:dev`).
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const USAGE = `Uso: pnpm verify:visual --ruta <ruta> [--name <slug>] [--baseline <path-png>] [--viewport WxH]

Argumentos:
  --ruta <ruta>          (obligatorio) ruta del kiosk (ej. /, /home, /home/passes).
  --name <slug>          slug para el archivo de salida (default: derivado de --ruta).
  --baseline <png>       PNG baseline para diff visual con agent-browser diff screenshot.
  --viewport WxH         viewport, default 1080x1920 (kiosk retrato).
  --base-url <url>       base URL del dev server, default http://localhost:3000.
  -h, --help             muestra esta ayuda.

Salida:
  Screenshot en .planning/verifications/<slug>-<YYYY-MM-DD>.png
  Si hay --baseline, además: reporte de diff en stdout.
`;

function parseArgs(argv) {
  const args = {
    ruta: null,
    name: null,
    baseline: null,
    viewport: '1080x1920',
    baseUrl: 'http://localhost:3000',
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') {
      console.log(USAGE);
      process.exit(0);
    } else if (a === '--ruta') args.ruta = argv[++i];
    else if (a === '--name') args.name = argv[++i];
    else if (a === '--baseline') args.baseline = argv[++i];
    else if (a === '--viewport') args.viewport = argv[++i];
    else if (a === '--base-url') args.baseUrl = argv[++i];
    else {
      console.error(`Argumento desconocido: ${a}`);
      console.error(USAGE);
      process.exit(1);
    }
  }
  return args;
}

function slugifyRoute(ruta) {
  return (
    ruta
      .replace(/^\//, '')
      .replace(/\//g, '-')
      .replace(/[^a-zA-Z0-9-]/g, '-') || 'root'
  );
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function run(cmd, argsList, options = {}) {
  const res = spawnSync(cmd, argsList, { stdio: 'inherit', ...options });
  if (res.status !== 0) {
    console.error(`✖ Falló: ${cmd} ${argsList.join(' ')}`);
    process.exit(res.status ?? 1);
  }
  return res;
}

function which(cmd) {
  const res = spawnSync('command', ['-v', cmd], { shell: '/bin/bash', stdio: 'pipe' });
  return res.status === 0;
}

function devServerUp(baseUrl) {
  const res = spawnSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', baseUrl], {
    stdio: 'pipe',
    encoding: 'utf-8',
  });
  return res.status === 0 && /^[23]\d\d$/.test((res.stdout ?? '').trim());
}

// ---- main ----
const args = parseArgs(process.argv.slice(2));

if (!args.ruta) {
  console.error('✖ Falta --ruta');
  console.error(USAGE);
  process.exit(1);
}
if (!args.ruta.startsWith('/')) args.ruta = `/${args.ruta}`;

if (!which('agent-browser')) {
  console.error('✖ agent-browser no está instalado. Instalalo con:');
  console.error('    npm i -g agent-browser && agent-browser install');
  process.exit(1);
}

if (!devServerUp(args.baseUrl)) {
  console.error(
    `✖ Dev server caído en ${args.baseUrl}. Arrancá con \`pnpm kiosk:dev\` y reintenta.`,
  );
  process.exit(1);
}

const [w, h] = args.viewport.split('x');
if (!w || !h) {
  console.error(`✖ Viewport inválido: ${args.viewport}. Esperado WxH (ej. 1080x1920).`);
  process.exit(1);
}

const slug = args.name ?? slugifyRoute(args.ruta);
const outDir = resolve(process.cwd(), '.planning/verifications');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, `${slug}-${today()}.png`);
const url = `${args.baseUrl}${args.ruta}`;

console.log(`▶ viewport ${w}×${h}`);
run('agent-browser', ['set', 'viewport', w, h]);

console.log(`▶ open ${url}`);
run('agent-browser', ['open', url]);

console.log('▶ wait --load networkidle');
run('agent-browser', ['wait', '--load', 'networkidle']);

console.log(`▶ screenshot ${outPath}`);
run('agent-browser', ['screenshot', outPath]);

if (args.baseline) {
  if (!existsSync(args.baseline)) {
    console.error(`✖ Baseline no existe: ${args.baseline}`);
    process.exit(1);
  }
  console.log(`▶ diff screenshot vs ${args.baseline}`);
  run('agent-browser', ['diff', 'screenshot', '--baseline', args.baseline]);
}

console.log(`\n✔ Listo. Screenshot en ${outPath}`);
