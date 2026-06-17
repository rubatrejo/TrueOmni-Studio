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
import { join } from 'node:path';

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
const { slug, config, tokensCss, i18n } = manifest;
if (!slug || !config) {
  console.error('Manifest inválido: falta `slug` o `config`.');
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

console.log(
  `✓ manifest aplicado a clients/${slug}/ (config${tokensCss ? ' + tokens' : ''} + ${locales} locales)`,
);
