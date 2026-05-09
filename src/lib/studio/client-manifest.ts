import 'server-only';

import { z } from 'zod';

import { kv } from './kv';
import { studioLog } from './logger';

/**
 * Manifest del cliente unificado — describe qué productos del Studio
 * (kiosks / digital-displays / mobile-pwa / video-walls / tablets) tiene
 * activados un cliente. Se persiste en KV bajo `client:{slug}:manifest`.
 *
 * Refactor 2026-05-08 (Fase 2): primer paso del modelo cliente-primero.
 * Ver plan en `~/.claude/plans/ok-listo-ahora-quiero-wondrous-sphinx.md`.
 */

export const PRODUCT_IDS = [
  'kiosks',
  'digitalDisplays',
  'mobilePwa',
  'videoWalls',
  'tablets',
] as const;
export type ProductId = (typeof PRODUCT_IDS)[number];

export const ClientProductsSchema = z.object({
  kiosks: z.boolean().default(false),
  digitalDisplays: z.boolean().default(false),
  mobilePwa: z.boolean().default(false),
  videoWalls: z.boolean().default(false),
  tablets: z.boolean().default(false),
});
export type ClientProducts = z.infer<typeof ClientProductsSchema>;

export const ClientManifestSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'slug must be kebab-case'),
  /** Nombre del cliente (display only — fuente de verdad sigue siendo el
   *  unified branding `client:{slug}:branding.name`). */
  name: z.string().min(1).max(120),
  products: ClientProductsSchema,
  createdAt: z.string(),
  lastEditor: z.string().email().optional(),
  lastEditedAt: z.string(),
  /** Operador marcó este cliente como prioritario. Pinned aparecen al
   *  inicio del dashboard, por encima de `default` y antes del orden
   *  alfabético/recencia. Hallazgo S-13 del audit panorámico v2. */
  pinned: z.boolean().optional().default(false),
});
export type ClientManifest = z.infer<typeof ClientManifestSchema>;

export const CLIENT_LIST_KEY = 'client:list';

export const clientKeys = {
  manifest: (slug: string) => `client:${slug}:manifest`,
  branding: (slug: string) => `client:${slug}:branding`,
  syncErrors: (slug: string) => `client:${slug}:sync-errors`,
  /** Lock optimista para evitar migraciones concurrentes. TTL 30s. */
  migrating: (slug: string) => `client:${slug}:migrating`,
} as const;

// ---------------------------------------------------------------------------
//  CRUD del client list
// ---------------------------------------------------------------------------

export async function listClientSlugs(): Promise<string[]> {
  const raw = await kv.get<string[]>(CLIENT_LIST_KEY);
  return Array.isArray(raw) ? raw : [];
}

/**
 * Hallazgo S-42: cada mutación de `client:list` se loguea estructurado
 * para que el drift entre KV y dashboard sea diagnosticable. Antes era
 * un set silencioso — debug del audit S-03 llevó horas porque no había
 * historial de quién añadió/quitó qué slug ni cuándo.
 */
export async function addClientToList(slug: string, by?: string): Promise<void> {
  const current = await listClientSlugs();
  if (current.includes(slug)) return;
  await kv.set(CLIENT_LIST_KEY, [...current, slug].sort());
  studioLog.info({
    event: 'client.added',
    slug,
    by,
    details: { listSizeBefore: current.length, listSizeAfter: current.length + 1 },
  });
}

export async function removeClientFromList(slug: string, by?: string): Promise<void> {
  const current = await listClientSlugs();
  const next = current.filter((s) => s !== slug);
  if (next.length === current.length) return;
  await kv.set(CLIENT_LIST_KEY, next);
  studioLog.info({
    event: 'client.removed',
    slug,
    by,
    details: { listSizeBefore: current.length, listSizeAfter: next.length },
  });
}

// ---------------------------------------------------------------------------
//  CRUD del manifest individual
// ---------------------------------------------------------------------------

export async function loadClientManifest(slug: string): Promise<ClientManifest | null> {
  const raw = await kv.get<unknown>(clientKeys.manifest(slug));
  if (!raw) return null;
  const parsed = ClientManifestSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function saveClientManifest(manifest: ClientManifest): Promise<void> {
  await kv.set(clientKeys.manifest(manifest.slug), manifest);
  await addClientToList(manifest.slug);
}

export function defaultClientProducts(): ClientProducts {
  return {
    kiosks: false,
    digitalDisplays: false,
    mobilePwa: false,
    videoWalls: false,
    tablets: false,
  };
}

export function makeBlankManifest(
  slug: string,
  name: string,
  products: Partial<ClientProducts> = {},
): ClientManifest {
  const now = new Date().toISOString();
  return {
    slug,
    name,
    products: { ...defaultClientProducts(), ...products },
    createdAt: now,
    lastEditedAt: now,
    pinned: false,
  };
}
