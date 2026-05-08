import 'server-only';

import { kv } from '@/lib/studio/kv';

import {
  kSignageClient,
  kSignageClientList,
  kSignageDisplay,
  kSignageDisplayRaw,
  kSignageEvents,
  kSignageI18n,
  kSignageNews,
  kSignageSnap,
  kSignageSnapList,
  kSignageSocial,
  kSignageThemeSnap,
  kSignageThemeSnapList,
} from './kv-keys';
import {
  SignageClientFileSchema,
  SignageDisplayConfigSchema,
  SignageEventSchema,
  SignageNewsConfigSchema,
  SignageSocialDataSchema,
  type SignageClientFile,
  type SignageDisplayConfig,
  type SignageEvent,
  type SignageNewsConfig,
  type SignageSocialData,
} from './schema';

const SNAPSHOT_CAP = 10;

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

export interface SignageSnapshotMeta {
  /** ms epoch como ID estable. */
  ts: number;
  /** Optional: email del operador en DSS7+ con auth. */
  savedBy?: string;
  /** Optional: nota custom — DSS6.5. */
  note?: string;
}

export interface SignageSnapshotEntry {
  id: string;
  meta: SignageSnapshotMeta;
  data: SignageDisplayConfig;
}

interface StoredSnapshot {
  meta: SignageSnapshotMeta;
  data: unknown;
}

export const kvSignageSnapshot = {
  /** Lista IDs de snapshots de un display, más reciente primero. */
  async listIds(client: string, display: string): Promise<string[]> {
    const raw = await kv.get<string[]>(kSignageSnapList(client, display));
    return Array.isArray(raw) ? raw : [];
  },

  /** Lista snapshot entries (id + meta) sin la data completa. Para UI list. */
  async listMeta(
    client: string,
    display: string,
  ): Promise<{ id: string; meta: SignageSnapshotMeta }[]> {
    const ids = await kvSignageSnapshot.listIds(client, display);
    const out: { id: string; meta: SignageSnapshotMeta }[] = [];
    for (const id of ids) {
      const stored = await kv.get<StoredSnapshot>(kSignageSnap(client, display, id));
      if (stored && stored.meta) out.push({ id, meta: stored.meta });
    }
    return out;
  },

  /** Lee un snapshot completo (data + meta). */
  async get(
    client: string,
    display: string,
    id: string,
  ): Promise<SignageSnapshotEntry | null> {
    const stored = await kv.get<StoredSnapshot>(kSignageSnap(client, display, id));
    if (!stored) return null;
    const parsed = SignageDisplayConfigSchema.safeParse(stored.data);
    if (!parsed.success) return null;
    return { id, meta: stored.meta, data: parsed.data };
  },

  /** Crea un snapshot. Devuelve el ID generado. Aplica FIFO cap. */
  async create(
    client: string,
    display: string,
    data: SignageDisplayConfig,
    meta: Partial<SignageSnapshotMeta> = {},
  ): Promise<string> {
    const ts = meta.ts ?? Date.now();
    const id = ts.toString();
    const stored: StoredSnapshot = {
      meta: { ts, savedBy: meta.savedBy, note: meta.note },
      data,
    };
    await kv.set(kSignageSnap(client, display, id), stored);
    const ids = await kvSignageSnapshot.listIds(client, display);
    const nextIds = [id, ...ids.filter((i) => i !== id)].slice(0, SNAPSHOT_CAP);
    // IDs that were trimmed off the cap: delete them from KV.
    const trimmed = ids.filter((i) => !nextIds.includes(i));
    await kv.set(kSignageSnapList(client, display), nextIds);
    for (const trim of trimmed) {
      await kv.del(kSignageSnap(client, display, trim));
    }
    return id;
  },

  async delete(client: string, display: string, id: string): Promise<void> {
    await kv.del(kSignageSnap(client, display, id));
    const ids = await kvSignageSnapshot.listIds(client, display);
    const nextIds = ids.filter((i) => i !== id);
    await kv.set(kSignageSnapList(client, display), nextIds);
  },
};

/**
 * `kvSignageThemeSnapshot` — snapshots theme-level (DSS-fix Versions).
 *
 * Cada PUT del client.json crea snapshot del previo. FIFO cap 10. UI lo
 * lista en el tab Versions con timestamp + restore. Restore crea snapshot
 * del current pre-restore (patrón git-like, mismo que display snapshots).
 */
export interface SignageThemeSnapshotEntry {
  id: string;
  meta: SignageSnapshotMeta;
  data: SignageClientFile;
}

interface StoredThemeSnapshot {
  meta: SignageSnapshotMeta;
  data: unknown;
}

export const kvSignageThemeSnapshot = {
  async listIds(client: string): Promise<string[]> {
    const raw = await kv.get<string[]>(kSignageThemeSnapList(client));
    return Array.isArray(raw) ? raw : [];
  },

  async listMeta(
    client: string,
  ): Promise<{ id: string; meta: SignageSnapshotMeta }[]> {
    const ids = await kvSignageThemeSnapshot.listIds(client);
    const out: { id: string; meta: SignageSnapshotMeta }[] = [];
    for (const id of ids) {
      const stored = await kv.get<StoredThemeSnapshot>(
        kSignageThemeSnap(client, id),
      );
      if (stored && stored.meta) out.push({ id, meta: stored.meta });
    }
    return out;
  },

  async get(client: string, id: string): Promise<SignageThemeSnapshotEntry | null> {
    const stored = await kv.get<StoredThemeSnapshot>(kSignageThemeSnap(client, id));
    if (!stored) return null;
    const parsed = SignageClientFileSchema.safeParse(stored.data);
    if (!parsed.success) return null;
    return { id, meta: stored.meta, data: parsed.data };
  },

  async create(
    client: string,
    data: SignageClientFile,
    meta: Partial<SignageSnapshotMeta> = {},
  ): Promise<string> {
    const ts = meta.ts ?? Date.now();
    const id = ts.toString();
    const stored: StoredThemeSnapshot = {
      meta: { ts, savedBy: meta.savedBy, note: meta.note },
      data,
    };
    await kv.set(kSignageThemeSnap(client, id), stored);
    const ids = await kvSignageThemeSnapshot.listIds(client);
    const nextIds = [id, ...ids.filter((i) => i !== id)].slice(0, SNAPSHOT_CAP);
    const trimmed = ids.filter((i) => !nextIds.includes(i));
    await kv.set(kSignageThemeSnapList(client), nextIds);
    for (const trim of trimmed) {
      await kv.del(kSignageThemeSnap(client, trim));
    }
    return id;
  },

  async delete(client: string, id: string): Promise<void> {
    await kv.del(kSignageThemeSnap(client, id));
    const ids = await kvSignageThemeSnapshot.listIds(client);
    const nextIds = ids.filter((i) => i !== id);
    await kv.set(kSignageThemeSnapList(client), nextIds);
  },
};

export const kvSignageI18n = {
  async get(client: string, locale: string): Promise<Record<string, string> | null> {
    const raw = await kv.get<unknown>(kSignageI18n(client, locale));
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    return raw as Record<string, string>;
  },
  async set(
    client: string,
    locale: string,
    bag: Record<string, string>,
  ): Promise<void> {
    await kv.set(kSignageI18n(client, locale), bag);
  },
  async delete(client: string, locale: string): Promise<void> {
    await kv.del(kSignageI18n(client, locale));
  },
};

export const kvSignageEvents = {
  async get(client: string): Promise<SignageEvent[] | null> {
    const raw = await kv.get<unknown>(kSignageEvents(client));
    if (!raw) return null;
    const parsed = SignageEventSchema.array().safeParse(raw);
    return parsed.success ? parsed.data : null;
  },
  async set(client: string, data: SignageEvent[]): Promise<void> {
    await kv.set(kSignageEvents(client), data);
  },
  async delete(client: string): Promise<void> {
    await kv.del(kSignageEvents(client));
  },
};

export const kvSignageSocial = {
  async get(client: string): Promise<SignageSocialData | null> {
    const raw = await kv.get<unknown>(kSignageSocial(client));
    if (!raw) return null;
    const parsed = SignageSocialDataSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  },
  async set(client: string, data: SignageSocialData): Promise<void> {
    await kv.set(kSignageSocial(client), data);
  },
  async delete(client: string): Promise<void> {
    await kv.del(kSignageSocial(client));
  },
};

export const kvSignageNews = {
  async get(client: string): Promise<SignageNewsConfig | null> {
    const raw = await kv.get<unknown>(kSignageNews(client));
    if (!raw) return null;
    const parsed = SignageNewsConfigSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  },
  async set(client: string, data: SignageNewsConfig): Promise<void> {
    await kv.set(kSignageNews(client), data);
  },
  async delete(client: string): Promise<void> {
    await kv.del(kSignageNews(client));
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
