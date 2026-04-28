#!/usr/bin/env node
// One-shot: extrae `textos` de cada client config a clients/{slug}/i18n/en.json
// y crea placeholders para los demás idiomas (copia de en.json como fallback inicial).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const CLIENTS = ['default', '_template', 'demo-cliente-a'];
const LOCALES = ['en', 'es', 'fr', 'de', 'pt', 'ja'];

for (const slug of CLIENTS) {
  const configPath = resolve(`clients/${slug}/config.json`);
  const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
  const textos = cfg.textos || {};
  const keys = Object.keys(textos);
  if (keys.length === 0) {
    console.log(`[skip] ${slug}: sin textos`);
    continue;
  }
  // Crear directorio i18n
  const i18nDir = resolve(`clients/${slug}/i18n`);
  if (!existsSync(i18nDir)) mkdirSync(i18nDir, { recursive: true });
  // Crear en.json (canónico)
  const enPath = resolve(`clients/${slug}/i18n/en.json`);
  writeFileSync(enPath, JSON.stringify(textos, null, 2) + '\n', 'utf8');
  console.log(`[ok] ${slug}/i18n/en.json: ${keys.length} keys`);
  // Crear placeholders para otros idiomas (copia inicial; el script translate los rellena)
  for (const locale of LOCALES) {
    if (locale === 'en') continue;
    const path = resolve(`clients/${slug}/i18n/${locale}.json`);
    if (existsSync(path)) {
      console.log(`[skip] ${slug}/i18n/${locale}.json: ya existe`);
      continue;
    }
    writeFileSync(path, JSON.stringify(textos, null, 2) + '\n', 'utf8');
    console.log(`[ok] ${slug}/i18n/${locale}.json: ${keys.length} keys (placeholder en inglés)`);
  }
}
