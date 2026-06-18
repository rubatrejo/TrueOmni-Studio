#!/usr/bin/env node
/**
 * Fase 6 del milestone "Publish → Kiosk Standalone": aplica un manifest (subido
 * a Blob por `POST /api/studio/publish-standalone/[slug]`) sobre el checkout del
 * monorepo, ANTES de correr `scripts/export-standalone.ts`. Sobrescribe el
 * estado en filesystem de `clients/<slug>/` con el estado del KV (igual que
 * haría el publish PR), de modo que el export materializa la versión editada en
 * el Studio, no la del repo.
 *
 * Escribe:
 *   clients/<slug>/config.json        (config merged del KV — buildFilesystemConfig)
 *   clients/<slug>/tokens.css         (si el manifest trae tokensCss)
 *   clients/<slug>/i18n/<locale>.json (cada locale del bundle i18n)
 *
 * Uso:  MANIFEST_URL=<blob-url> node scripts/apply-standalone-manifest.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const manifestUrl = process.env.MANIFEST_URL;
if (!manifestUrl) {
  console.error('MANIFEST_URL es requerido (URL pública del manifest en Blob).');
  process.exit(1);
}

const res = await fetch(manifestUrl);
if (!res.ok) {
  console.error(`No se pudo descargar el manifest: HTTP ${res.status}`);
  process.exit(1);
}
const manifest = await res.json();
const { slug, product, config, tokensCss, i18n, studioConfig, files, clientName } = manifest;
if (!slug) {
  console.error('Manifest inválido: falta `slug`.');
  process.exit(1);
}

const tmp = process.env.RUNNER_TEMP || '/tmp';
let summary = '';
let repoClientName = clientName || slug;

if (Array.isArray(files)) {
  // ── Manifest de archivos (signage): se escriben tal cual sobre el checkout.
  //    Cada `file.path` ya viene en formato `clients-signage/<slug>/...`. ──
  if (files.length === 0) {
    console.error('Manifest inválido: `files` está vacío.');
    process.exit(1);
  }
  for (const file of files) {
    if (!file?.path || typeof file.content !== 'string') continue;
    const abs = join(process.cwd(), file.path);
    await mkdir(dirname(abs), { recursive: true });
    await writeFile(abs, file.content, 'utf8');
  }
  summary = `${files.length} archivos escritos`;
} else {
  // ── Manifest kiosk/pwa (config merged + tokens + i18n + studioConfig). ──
  if (!config) {
    console.error('Manifest inválido: falta `config`.');
    process.exit(1);
  }
  const clientDir = join(process.cwd(), 'clients', slug);
  await mkdir(join(clientDir, 'i18n'), { recursive: true });

  await writeFile(join(clientDir, 'config.json'), JSON.stringify(config, null, 2) + '\n', 'utf8');

  if (tokensCss) {
    await writeFile(join(clientDir, 'tokens.css'), tokensCss, 'utf8');
  }

  let locales = 0;
  if (i18n && typeof i18n === 'object') {
    for (const [locale, data] of Object.entries(i18n)) {
      await writeFile(
        join(clientDir, 'i18n', `${locale}.json`),
        JSON.stringify(data, null, 2) + '\n',
        'utf8',
      );
      locales++;
    }
  }

  // El config crudo del editor (botón Download) se guarda en un temp; el workflow
  // lo coloca en la RAÍZ del repo standalone como `<slug>-config.json` (#5).
  let studioConfigSaved = false;
  if (studioConfig) {
    await writeFile(
      join(tmp, 'studio-config.json'),
      JSON.stringify(studioConfig, null, 2) + '\n',
      'utf8',
    );
    studioConfigSaved = true;
  }
  if (studioConfig && studioConfig.nombre) repoClientName = studioConfig.nombre;
  summary = `clients/${slug}/ (config${tokensCss ? ' + tokens' : ''} + ${locales} locales${studioConfigSaved ? ' + studio-config' : ''})`;
}

// Naming personalizado del repo/zip/artifact (#9): TrueOmni-<Cliente>-<Producto>-MM-DD-YYYY
// (Title Case, partes unidas con guion). Lo computa aquí (Node, no en bash) y lo
// deja en repo-name.txt para que el workflow lo use consistente en repo+zip+artifact.
function titleCaseHyphen(s) {
  return String(s || '')
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('-');
}
const prod = product || 'kiosk';
const now = new Date();
const mm = String(now.getMonth() + 1).padStart(2, '0');
const dd = String(now.getDate()).padStart(2, '0');
const repoName = `TrueOmni-${titleCaseHyphen(repoClientName)}-${titleCaseHyphen(prod)}-${mm}-${dd}-${now.getFullYear()}`;
await writeFile(join(tmp, 'repo-name.txt'), repoName, 'utf8');

console.log(`✓ manifest aplicado a ${summary} → repo: ${repoName}`);
