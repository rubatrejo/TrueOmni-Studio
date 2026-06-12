#!/usr/bin/env node
/**
 * scripts/seed-listings.mjs
 * -----------------------------------------------------------------------------
 *  Rellena cada sub-categoría de los módulos de listings de un cliente hasta un
 *  mínimo de N listings (default 15), para que el kiosk/PWA se vean poblados.
 *
 *  Uso:
 *    pnpm seed:listings            # cliente "default", mínimo 15
 *    node scripts/seed-listings.mjs <slug> <min>
 *
 *  Estrategia (robusta y determinista):
 *   - NO borra ni toca los listings existentes.
 *   - Por cada sub-categoría con menos de `min`, genera los faltantes CLONANDO un
 *     listing existente de esa misma sub-categoría (o, si no hay, cualquiera del
 *     módulo) y mutando solo los campos variables: slug, title, image, coords
 *     (jitter), popularity, phone y el número de la dirección. Así el shape queda
 *     siempre válido para el módulo (openHours, features, directions, etc. se
 *     heredan del template) sin adivinar campos.
 *   - Determinista (sin Date.now / Math.random) → diffs reproducibles.
 *
 *  Módulos cubiertos: restaurants, things-to-do, stay (los 3 de listings).
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SLUG = process.argv[2] || 'default';
const MIN = Number(process.argv[3] || 15);
const MODULE_KEYS = ['restaurants', 'things-to-do', 'stay'];

/** Adjetivos genéricos (sin geografía real, regla white-label §9). */
const ADJECTIVES = [
  'Golden',
  'Silver',
  'Grand',
  'Royal',
  'Rustic',
  'Urban',
  'Coastal',
  'Hillside',
  'Garden',
  'Vintage',
  'Modern',
  'Cozy',
  'Maple',
  'Amber',
  'Crimson',
];

/** Sustantivo por módulo para componer nombres plausibles. */
const NOUNS = {
  restaurants: ['Bistro', 'Grill', 'Kitchen', 'Cantina', 'Tavern', 'Eatery', 'Diner', 'Brasserie'],
  'things-to-do': ['Center', 'Gallery', 'Pavilion', 'Grounds', 'Studio', 'Hall', 'Garden', 'Arena'],
  stay: ['Inn', 'Hotel', 'Lodge', 'Suites', 'Retreat', 'House', 'Residences', 'Quarters'],
};

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Jitter determinista de coords alrededor de una base (±~0.045°). */
function jitterCoords(base, seed) {
  const dLat = (((seed * 37) % 91) - 45) / 1000;
  const dLng = (((seed * 53) % 91) - 45) / 1000;
  return { lat: round6(base.lat + dLat), lng: round6(base.lng + dLng) };
}
const round6 = (n) => Math.round(n * 1e6) / 1e6;

/** Reemplaza el número inicial de una dirección ("1000 Main St…" → "1042 Main St…"). */
function bumpAddress(address, seed) {
  const n = 100 + ((seed * 17) % 8900);
  return /^\d+/.test(address) ? address.replace(/^\d+/, String(n)) : `${n} ${address}`;
}

/** Varía los últimos 4 dígitos de un teléfono manteniendo el formato. */
function bumpPhone(phone, seed) {
  let i = 0;
  return phone.replace(/\d/g, (d) => {
    i += 1;
    // Solo toca los últimos dígitos para no romper el código de área visible.
    return i > 6 ? String((Number(d) + seed + i) % 10) : d;
  });
}

function deepClone(o) {
  return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
}

async function main() {
  const configPath = join(ROOT, 'clients', SLUG, 'config.json');
  if (!existsSync(configPath)) {
    console.error(`❌ No encuentro ${configPath}`);
    process.exit(1);
  }
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const baseCoords = config.client?.coords ?? { lat: 0, lng: 0 };
  const modules = config.features?.home?.modules ?? {};

  let totalAdded = 0;
  for (const key of MODULE_KEYS) {
    const mod = modules[key];
    if (!mod || !Array.isArray(mod.listings) || !Array.isArray(mod.subcategories)) continue;

    // Pool de imágenes del módulo (image + gallery de los listings actuales),
    // para que los nuevos listings tengan fotos variadas y temáticas.
    const imagePool = uniq(
      mod.listings.flatMap((l) => [l.image, ...(Array.isArray(l.gallery) ? l.gallery : [])]),
    ).filter(Boolean);

    const existingSlugs = new Set(mod.listings.map((l) => l.slug));
    const nouns = NOUNS[key] ?? NOUNS.restaurants;
    let moduleSeed = 0; // contador global del módulo (variedad + unicidad)

    for (const sub of mod.subcategories) {
      const inSub = mod.listings.filter((l) => l.subcategory === sub);
      const templates = inSub.length > 0 ? inSub : mod.listings;
      if (templates.length === 0) continue;
      const need = MIN - inSub.length;
      for (let i = 0; i < need; i += 1) {
        moduleSeed += 1;
        const seed = moduleSeed;
        const tmpl = deepClone(templates[i % templates.length]);
        const adj = ADJECTIVES[(seed * 3) % ADJECTIVES.length];
        const noun = nouns[(seed * 5) % nouns.length];
        const title = `${adj} ${noun}`;

        // slug único dentro del módulo.
        let slug = `${slugify(title)}-${slugify(sub)}`;
        let n = 2;
        let candidate = slug;
        while (existingSlugs.has(candidate)) candidate = `${slug}-${n++}`;
        slug = candidate;
        existingSlugs.add(slug);

        tmpl.slug = slug;
        tmpl.title = title;
        tmpl.subcategory = sub;
        if (imagePool.length > 0) tmpl.image = imagePool[seed % imagePool.length];
        tmpl.coords = jitterCoords(tmpl.coords ?? baseCoords, seed);
        tmpl.popularity = 40 + ((seed * 7) % 56); // 40..95
        if (typeof tmpl.phone === 'string') tmpl.phone = bumpPhone(tmpl.phone, seed);
        if (typeof tmpl.address === 'string') tmpl.address = bumpAddress(tmpl.address, seed);
        // Limpia URLs/recursos ligados al template original que ya no aplican.
        delete tmpl.website;
        delete tmpl.reserveUrl;
        delete tmpl.diningGuideUrl;

        mod.listings.push(tmpl);
        totalAdded += 1;
      }
      const finalCount = mod.listings.filter((l) => l.subcategory === sub).length;
      console.log(`  ${key} · ${sub}: ${inSub.length} → ${finalCount}`);
    }
  }

  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  console.log(`\n✅ ${SLUG}: +${totalAdded} listings (mínimo ${MIN}/sub-categoría).`);
}

const uniq = (arr) => [...new Set(arr)];

main().catch((e) => {
  console.error(`Error inesperado: ${e.stack || e.message}`);
  process.exit(1);
});
