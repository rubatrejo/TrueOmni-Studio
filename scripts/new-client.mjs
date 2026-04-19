#!/usr/bin/env node
/**
 * scripts/new-client.mjs
 * -----------------------------------------------------------------------------
 *  Crea un cliente nuevo a partir de clients/_template.
 *
 *  Uso:
 *    pnpm kiosk:new-client <slug>
 *    node scripts/new-client.mjs <slug>
 *
 *  Valida:
 *   - slug con formato admitido por el schema.
 *   - carpeta destino no existe todavía.
 *   - plantilla existe.
 *   - config.json resultante valida contra config.schema.json.
 */

import { cp, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const TEMPLATE_DIR = join(ROOT, "clients/_template");
const CLIENTS_DIR = join(ROOT, "clients");

const SLUG_REGEX = /^(_[a-z][a-z0-9-]*|[a-z0-9][a-z0-9-]*)$/;

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}

function info(msg) {
  console.log(`ℹ️  ${msg}`);
}

async function main() {
  const slug = process.argv[2];

  if (!slug) {
    fail("Falta el slug. Uso: pnpm kiosk:new-client <slug>");
  }

  if (!SLUG_REGEX.test(slug)) {
    fail(
      `Slug inválido: "${slug}". Debe ser minúsculas, dígitos y guiones. ` +
        `Los que empiezan por "_" están reservados para plantillas.`
    );
  }

  if (slug.startsWith("_")) {
    fail(`Slugs con "_" inicial se reservan para plantillas internas.`);
  }

  const destDir = join(CLIENTS_DIR, slug);

  if (existsSync(destDir)) {
    fail(`Ya existe clients/${slug}/. Aborto para no sobreescribir.`);
  }

  try {
    await stat(TEMPLATE_DIR);
  } catch {
    fail(`No encuentro la plantilla en clients/_template/.`);
  }

  info(`Copiando clients/_template/ → clients/${slug}/`);
  await cp(TEMPLATE_DIR, destDir, { recursive: true });

  // Reemplazar valores placeholder en config.json
  const configPath = join(destDir, "config.json");
  const raw = await readFile(configPath, "utf8");
  const config = JSON.parse(raw);

  config.client.slug = slug;
  config.client.nombre = `Cliente ${slug}`;
  config.meta.creado_en = new Date().toISOString().slice(0, 10);

  await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  ok(`config.json actualizado (slug, nombre, creado_en).`);

  // Validación ligera: el schema está junto al template.
  const schemaPath = join(TEMPLATE_DIR, "config.schema.json");
  try {
    const schema = JSON.parse(await readFile(schemaPath, "utf8"));
    // Validación mínima manual (sin depender de ajv aún):
    const slugOk = schema.properties.client.properties.slug.pattern;
    if (!new RegExp(slugOk).test(config.client.slug)) {
      fail(`El slug resultante no valida contra el schema.`);
    }
    ok(`Schema verificado (validación ligera).`);
  } catch (e) {
    info(`No pude cargar el schema: ${e.message}. Sáltate esta validación.`);
  }

  console.log("");
  ok(`Cliente "${slug}" creado en clients/${slug}/`);
  console.log("");
  info("Siguientes pasos:");
  console.log(`  1. Editar clients/${slug}/tokens.css con los colores del cliente.`);
  console.log(`  2. Rellenar clients/${slug}/config.json con textos reales.`);
  console.log(`  3. Añadir assets en clients/${slug}/assets/.`);
  console.log(`  4. Probar con:  KIOSK_CLIENT=${slug} pnpm dev`);
}

main().catch((e) => fail(`Error inesperado: ${e.stack || e.message}`));
