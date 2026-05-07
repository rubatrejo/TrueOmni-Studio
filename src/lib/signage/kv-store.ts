import 'server-only';

import { kv } from '@/lib/studio/kv';

import {
  kSignageClient,
  kSignageClientList,
  kSignageDisplay,
  kSignageDisplayRaw,
} from './kv-keys';
import {
  SignageClientFileSchema,
  SignageDisplayConfigSchema,
  type SignageClientFile,
  type SignageDisplayConfig,
} from './schema';

/**
 * Wrappers thin sobre `@/lib/studio/kv` para el namespace `signage:*`.
 *
 * **DSS0:** este archivo se exporta pero NO se cablea al runtime todavía.
 * El runtime `/signage/<client>/<display>` sigue siendo fs-only via
 * `loadSignageClient` / `loadSignageDisplay`. DSS3 introduce el bridge
 * editor↔preview que activará la lectura híbrida KV→fs.
 *
 * Sin pre-cableo el namespace queda diseñado y disponible para los siguientes
 * pasos del milestone Studio sin tener que rediseñar las claves después.
 */

export const kvSignageClient = {
  async list(): Promise<string[]> {
    return kv.smembers(kSignageClientList);
  },
  async addToList(slug: string): Promise<void> {
    await kv.sadd(kSignageClientList, slug);
  },
  async removeFromList(slug: string): Promise<void> {
    await kv.srem(kSignageClientList, slug);
  },
  async get(slug: string): Promise<SignageClientFile | null> {
    const raw = await kv.get<unknown>(kSignageClient(slug));
    if (!raw) return null;
    const parsed = SignageClientFileSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  },
  async set(slug: string, data: SignageClientFile): Promise<void> {
    await kv.set(kSignageClient(slug), data);
  },
  async delete(slug: string): Promise<void> {
    await kv.del(kSignageClient(slug));
  },
};

export const kvSignageDisplay = {
  async get(client: string, display: string): Promise<SignageDisplayConfig | null> {
    const raw = await kv.get<unknown>(kSignageDisplay(client, display));
    if (!raw) return null;
    const parsed = SignageDisplayConfigSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  },
  async set(client: string, display: string, data: SignageDisplayConfig): Promise<void> {
    await kv.set(kSignageDisplay(client, display), data);
  },
  async setRaw(client: string, display: string, raw: unknown): Promise<void> {
    // Working-copy raw (sin validación schema) para drafts en el editor.
    await kv.set(kSignageDisplayRaw(client, display), raw);
  },
  async getRaw(client: string, display: string): Promise<unknown | null> {
    return kv.get<unknown>(kSignageDisplayRaw(client, display));
  },
  async delete(client: string, display: string): Promise<void> {
    await kv.del(kSignageDisplay(client, display));
    await kv.del(kSignageDisplayRaw(client, display));
  },
};
