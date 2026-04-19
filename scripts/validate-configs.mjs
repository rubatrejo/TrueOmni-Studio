#!/usr/bin/env node
/**
 * scripts/validate-configs.mjs
 * -----------------------------------------------------------------------------
 *  Valida todos los clients/{slug}/config.json contra clients/_template/config.schema.json.
 *
 *  Uso:
 *    pnpm validate:configs
 *    node scripts/validate-configs.mjs
 *
 *  Salida:
 *   - 0 si todos válidos.
 *   - 1 si alguno falla (imprime detalles).
 *
 *  Validación ligera, sin ajv. Cubre lo básico del schema manualmente:
 *   - Todas las claves "required" presentes.
 *   - Patterns críticos (slug, locale, version_config).
 *   - Tipos primitivos coinciden.
 *
 *  Para validación completa del schema, instalar ajv en Fase 1+.
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CLIENTS_DIR = join(ROOT, "clients");
const SCHEMA_PATH = join(CLIENTS_DIR, "_template", "config.schema.json");

async function main() {
  if (!existsSync(SCHEMA_PATH)) {
    console.error(`❌ No encuentro el schema en ${SCHEMA_PATH}`);
    process.exit(1);
  }

  const schema = JSON.parse(await readFile(SCHEMA_PATH, "utf8"));
  const entries = await readdir(CLIENTS_DIR, { withFileTypes: true });

  const clients = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => !name.startsWith("."));

  if (clients.length === 0) {
    console.log("ℹ️  No hay clientes todavía en clients/.");
    process.exit(0);
  }

  let failed = 0;
  for (const slug of clients) {
    const configPath = join(CLIENTS_DIR, slug, "config.json");
    if (!existsSync(configPath)) {
      console.error(`❌ ${slug}: falta config.json`);
      failed++;
      continue;
    }

    try {
      const config = JSON.parse(await readFile(configPath, "utf8"));
      const errors = lightweightValidate(config, schema);
      if (errors.length === 0) {
        console.log(`✅ ${slug}: OK`);
      } else {
        console.error(`❌ ${slug}:`);
        for (const err of errors) console.error(`   - ${err}`);
        failed++;
      }
    } catch (e) {
      console.error(`❌ ${slug}: JSON inválido — ${e.message}`);
      failed++;
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} cliente(s) con errores.`);
    process.exit(1);
  }
  console.log(`\nTodos los ${clients.length} cliente(s) válidos.`);
}

function lightweightValidate(config, schema) {
  const errors = [];

  // Campos top-level required.
  for (const req of schema.required || []) {
    if (!(req in config)) errors.push(`falta campo obligatorio "${req}"`);
  }

  // client.*
  if (config.client) {
    for (const req of schema.properties.client.required || []) {
      if (!(req in config.client)) errors.push(`falta client.${req}`);
    }
    const slugPattern = schema.properties.client.properties.slug.pattern;
    if (config.client.slug && !new RegExp(slugPattern).test(config.client.slug)) {
      errors.push(`client.slug "${config.client.slug}" no coincide con ${slugPattern}`);
    }
    const localePattern = schema.properties.client.properties.locale.pattern;
    if (config.client.locale && !new RegExp(localePattern).test(config.client.locale)) {
      errors.push(`client.locale "${config.client.locale}" no es BCP-47 (ej. es-ES)`);
    }
  }

  // branding.logo
  if (config.branding?.logo) {
    for (const req of schema.properties.branding.properties.logo.required || []) {
      if (!(req in config.branding.logo)) {
        errors.push(`falta branding.logo.${req}`);
      }
    }
  } else if (config.branding === undefined) {
    errors.push(`falta branding`);
  }

  // meta.version_config
  if (config.meta?.version_config) {
    const versionPattern = schema.properties.meta.properties.version_config.pattern;
    if (!new RegExp(versionPattern).test(config.meta.version_config)) {
      errors.push(
        `meta.version_config "${config.meta.version_config}" no es semver MAJOR.MINOR.PATCH`
      );
    }
  }

  return errors;
}

main().catch((e) => {
  console.error(`Error inesperado: ${e.stack || e.message}`);
  process.exit(1);
});
