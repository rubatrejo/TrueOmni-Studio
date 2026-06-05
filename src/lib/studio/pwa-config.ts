import { promises as fs } from 'node:fs';
import path from 'node:path';

import 'server-only';

import type { PwaConfig } from '@/lib/config';

import { kv, kvKeys } from './kv';

/**
 * Modelo de datos del editor PWA del Studio.
 *
 * A diferencia de signage/video-walls (productos con archivo y namespace KV
 * propios), la PWA vive dentro del MISMO `config.json` del cliente, en
 * `features.pwa`, y hereda la data del kiosk (`home.modules.*`). El editor PWA
 * trata `features.pwa` como un slice aislado:
 *
 *  - Working copy editable: KV `pwa:<slug>` (no toca el `cfg:<slug>` del kiosk
 *    ni el `KioskConfigSchema`).
 *  - Lectura inicial: KV → config.json del cliente (FS) → template `default`.
 *  - El runtime PWA (`/pwa`) sigue leyendo `features.pwa` del config.json
 *    publicado; el publish del editor escribe de vuelta a esa sección.
 *
 * Cero riesgo de regresión del kiosk: ningún flujo del kiosk importa este
 * módulo.
 */

const TEMPLATE_SLUG = 'default';

/** Metadata del slice PWA, paralela a `ConfigMeta` del kiosk. */
export interface PwaSliceMeta {
  slug: string;
  createdAt: string;
  lastEditedAt: string;
  currentVersion: number;
}

/** Shape mínimo del config.json que nos interesa (solo `features.pwa`). */
interface RawClientConfig {
  features?: { pwa?: PwaConfig };
}

async function readRawClientConfig(slug: string): Promise<RawClientConfig | null> {
  const p = path.join(process.cwd(), 'clients', slug, 'config.json');
  try {
    return JSON.parse(await fs.readFile(p, 'utf8')) as RawClientConfig;
  } catch {
    return null;
  }
}

/**
 * Lee `features.pwa` del config.json de un cliente en el filesystem. Devuelve
 * `null` si el cliente no existe o no tiene bloque PWA.
 */
export async function readPwaSliceFromFs(slug: string): Promise<PwaConfig | null> {
  const cfg = await readRawClientConfig(slug);
  return cfg?.features?.pwa ?? null;
}

/**
 * Slice PWA por defecto: el `features.pwa` del template `default`. Es la base
 * que hereda un cliente nuevo al activar el producto. Si el template no tuviera
 * bloque PWA (edge case), devuelve un objeto vacío editable.
 */
export async function makeDefaultPwaSlice(): Promise<PwaConfig> {
  const fromTemplate = await readPwaSliceFromFs(TEMPLATE_SLUG);
  return fromTemplate ?? {};
}

/**
 * Carga la working copy del editor PWA con fallback en cascada:
 *   1. KV `pwa:<slug>` (lo que el operador está editando).
 *   2. config.json del propio cliente (FS) — estado publicado.
 *   3. template `default` (FS) — cliente recién activado sin publish previo.
 *
 * Análogo al drift-recovery del editor del kiosk (`kiosk/page.tsx`).
 */
export async function loadPwaSlice(slug: string): Promise<PwaConfig> {
  const fromKv = await kv.get<PwaConfig>(kvKeys.pwa(slug));
  if (fromKv) return fromKv;

  const fromClientFs = await readPwaSliceFromFs(slug);
  if (fromClientFs) return fromClientFs;

  return makeDefaultPwaSlice();
}

/** Carga la metadata del slice PWA, o `null` si nunca se guardó. */
export async function loadPwaMeta(slug: string): Promise<PwaSliceMeta | null> {
  return kv.get<PwaSliceMeta>(kvKeys.pwaMeta(slug));
}

/**
 * Inicializa el slice PWA en KV si aún no existe (idempotente). Se llama al
 * activar el producto `mobilePwa` para un cliente. Siembra desde el config.json
 * del propio cliente si está publicado, o desde el template `default`.
 */
export async function ensurePwaSlice(slug: string): Promise<PwaSliceMeta> {
  const existingMeta = await loadPwaMeta(slug);
  if (existingMeta) return existingMeta;

  const seed = (await readPwaSliceFromFs(slug)) ?? (await makeDefaultPwaSlice());
  const now = new Date().toISOString();
  const meta: PwaSliceMeta = {
    slug,
    createdAt: now,
    lastEditedAt: now,
    currentVersion: 0,
  };
  await kv.set(kvKeys.pwa(slug), seed);
  await kv.set(kvKeys.pwaMeta(slug), meta);
  return meta;
}

/** Persiste la working copy del slice PWA y actualiza la metadata. */
export async function savePwaSlice(slug: string, slice: PwaConfig): Promise<PwaSliceMeta> {
  const prev = await loadPwaMeta(slug);
  const now = new Date().toISOString();
  const meta: PwaSliceMeta = {
    slug,
    createdAt: prev?.createdAt ?? now,
    lastEditedAt: now,
    currentVersion: (prev?.currentVersion ?? 0) + 1,
  };
  await kv.set(kvKeys.pwa(slug), slice);
  await kv.set(kvKeys.pwaMeta(slug), meta);
  return meta;
}
