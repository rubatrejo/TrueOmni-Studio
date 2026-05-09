#!/usr/bin/env node
/**
 * Traduce `clients/{slug}/i18n/en.json` a los locales objetivo usando Claude API.
 *
 * Uso:
 *   ANTHROPIC_API_KEY=sk-... node scripts/translate-i18n.mjs default es,fr,de,pt,ja
 *   ANTHROPIC_API_KEY=sk-... node scripts/translate-i18n.mjs default ja
 *   ANTHROPIC_API_KEY=sk-... node scripts/translate-i18n.mjs all
 *
 * - Idempotente: si una key ya existe en el target con valor distinto al inglés,
 *   no la sobreescribe (permite overrides manuales).
 * - Conserva placeholders `{client_name}`, `\n`, etc.
 * - Procesa en batches de 50 keys para evitar timeouts.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const LOCALE_LANG = {
  es: 'Spanish (es-ES)',
  fr: 'French (fr-FR)',
  de: 'German (de-DE)',
  pt: 'Portuguese (pt-BR)',
  ja: 'Japanese (ja-JP)',
};

const ALL_CLIENTS = ['default', '_template', 'demo-cliente-a'];
const BATCH_SIZE = 50;
const MODEL = 'claude-sonnet-4-6';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('Error: ANTHROPIC_API_KEY env var requerida.');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/translate-i18n.mjs <slug|all> [es,fr,de,pt,ja]');
  process.exit(1);
}

const targetSlug = args[0];
const clients = targetSlug === 'all' ? ALL_CLIENTS : [targetSlug];
const localesArg = args[1];
const locales = localesArg ? localesArg.split(',') : Object.keys(LOCALE_LANG);

for (const slug of clients) {
  const enPath = resolve(`clients/${slug}/i18n/en.json`);
  if (!existsSync(enPath)) {
    console.log(`[skip] ${slug}: sin i18n/en.json`);
    continue;
  }
  const en = JSON.parse(readFileSync(enPath, 'utf8'));

  for (const locale of locales) {
    if (!LOCALE_LANG[locale]) {
      console.log(`[skip] locale "${locale}" no soportado`);
      continue;
    }
    const targetPath = resolve(`clients/${slug}/i18n/${locale}.json`);
    const existing = existsSync(targetPath) ? JSON.parse(readFileSync(targetPath, 'utf8')) : {};

    // Solo traducir keys donde target == en (placeholder) o falta.
    const toTranslate = {};
    for (const [k, v] of Object.entries(en)) {
      if (existing[k] == null || existing[k] === v) toTranslate[k] = v;
    }
    const keys = Object.keys(toTranslate);
    if (keys.length === 0) {
      console.log(`[skip] ${slug}/${locale}: nada que traducir`);
      continue;
    }

    console.log(`[translate] ${slug}/${locale}: ${keys.length} keys via Claude...`);
    const out = { ...existing };

    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batchKeys = keys.slice(i, i + BATCH_SIZE);
      const batch = Object.fromEntries(batchKeys.map((k) => [k, toTranslate[k]]));
      const translated = await translateBatch(batch, locale);
      Object.assign(out, translated);
      console.log(`  batch ${i / BATCH_SIZE + 1}: ${batchKeys.length} keys ok`);
    }

    writeFileSync(targetPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
    console.log(`[ok] ${slug}/${locale}: escrito (${Object.keys(out).length} keys totales)`);
  }
}

async function translateBatch(batch, locale) {
  const prompt = `You are translating UI strings for a tourism kiosk app.
Translate the following English strings to ${LOCALE_LANG[locale]}.

Rules:
- Preserve placeholders like {client_name} verbatim.
- Preserve line breaks (\\n) verbatim.
- Keep ALL CAPS strings in caps in the target language when natural.
- Do NOT translate brand names (TrueOmni, NEXI), proper nouns, or place names.
- Keep button labels short (no longer than original).
- Return ONLY a JSON object with the same keys, values translated. No prose.

Input:
${JSON.stringify(batch, null, 2)}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API ${response.status}: ${err}`);
  }
  const data = await response.json();
  const text = data.content[0].text.trim();
  // Quitar bloques markdown si los hay
  const json = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/, '')
    .trim();
  return JSON.parse(json);
}
