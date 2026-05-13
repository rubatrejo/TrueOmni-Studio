import 'server-only';

import { kv } from '@/lib/studio/kv';

import {
  kVideoWall,
  kVideoWallClient,
  kVideoWallClientList,
  kVideoWallEvents,
  kVideoWallI18n,
  kVideoWallNews,
  kVideoWallRaw,
  kVideoWallSnap,
  kVideoWallSnapList,
  kVideoWallSocial,
} from './kv-keys';
import {
  VideoWallClientFileSchema,
  VideoWallConfigSchema,
  VideoWallEventSchema,
  VideoWallNewsConfigSchema,
  VideoWallSocialDataSchema,
  type VideoWallClientFile,
  type VideoWallConfig,
  type VideoWallEvent,
  type VideoWallNewsConfig,
  type VideoWallSocialData,
} from './schema';

const SNAPSHOT_CAP = 10;

/**
 * Wrappers thin sobre `@/lib/studio/kv` para el namespace `videowall:*`.
 *
 * Patrón idéntico al `signage/kv-store.ts`. Snapshots se añaden en VW9
 * (publish + versions). Aquí solo lo necesario para bootstrap + CRUD.
 */

export const kvVideoWallClient = {
  async list(): Promise<string[]> {
    return kv.smembers(kVideoWallClientList);
  },
  async addToList(slug: string): Promise<void> {
    await kv.sadd(kVideoWallClientList, slug);
  },
  async removeFromList(slug: string): Promise<void> {
    await kv.srem(kVideoWallClientList, slug);
  },
  async get(slug: string): Promise<VideoWallClientFile | null> {
    const raw = await kv.get<unknown>(kVideoWallClient(slug));
    if (!raw) return null;
    const parsed = VideoWallClientFileSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  },
  async set(slug: string, data: VideoWallClientFile): Promise<void> {
    await kv.set(kVideoWallClient(slug), data);
  },
  async delete(slug: string): Promise<void> {
    await kv.del(kVideoWallClient(slug));
  },
};

export const kvVideoWall = {
  async get(client: string, wall: string): Promise<VideoWallConfig | null> {
    const raw = await kv.get<unknown>(kVideoWall(client, wall));
    if (!raw) return null;
    const parsed = VideoWallConfigSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  },
  async set(client: string, wall: string, data: VideoWallConfig): Promise<void> {
    await kv.set(kVideoWall(client, wall), data);
  },
  async delete(client: string, wall: string): Promise<void> {
    await kv.del(kVideoWall(client, wall));
  },

  /** Working copy / draft del editor — guardada sin validación estricta
   *  para permitir estados intermedios mientras el operador edita. */
  async getRaw(client: string, wall: string): Promise<unknown> {
    return kv.get<unknown>(kVideoWallRaw(client, wall));
  },
  async setRaw(client: string, wall: string, data: unknown): Promise<void> {
    await kv.set(kVideoWallRaw(client, wall), data);
  },
  async deleteRaw(client: string, wall: string): Promise<void> {
    await kv.del(kVideoWallRaw(client, wall));
  },
};

export const kvVideoWallEvents = {
  async get(client: string): Promise<VideoWallEvent[] | null> {
    const raw = await kv.get<unknown>(kVideoWallEvents(client));
    if (!raw) return null;
    const parsed = VideoWallEventSchema.array().safeParse(raw);
    return parsed.success ? parsed.data : null;
  },
  async set(client: string, data: VideoWallEvent[]): Promise<void> {
    await kv.set(kVideoWallEvents(client), data);
  },
};

export const kvVideoWallSocial = {
  async get(client: string): Promise<VideoWallSocialData | null> {
    const raw = await kv.get<unknown>(kVideoWallSocial(client));
    if (!raw) return null;
    const parsed = VideoWallSocialDataSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  },
  async set(client: string, data: VideoWallSocialData): Promise<void> {
    await kv.set(kVideoWallSocial(client), data);
  },
};

export const kvVideoWallNews = {
  async get(client: string): Promise<VideoWallNewsConfig | null> {
    const raw = await kv.get<unknown>(kVideoWallNews(client));
    if (!raw) return null;
    const parsed = VideoWallNewsConfigSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  },
  async set(client: string, data: VideoWallNewsConfig): Promise<void> {
    await kv.set(kVideoWallNews(client), data);
  },
};

export interface VideoWallSnapshotMeta {
  /** ms epoch como ID estable. */
  ts: number;
  /** Optional: email del operador con auth. */
  savedBy?: string;
  /** Optional: nota custom (e.g. "pre-restore-of-…"). */
  note?: string;
}

export interface VideoWallSnapshotEntry {
  id: string;
  meta: VideoWallSnapshotMeta;
  data: VideoWallConfig;
}

interface StoredSnapshot {
  meta: VideoWallSnapshotMeta;
  data: unknown;
}

/**
 * Snapshots por wall — paridad con `kvSignageSnapshot`. FIFO cap 10. UI los
 * lista en el tab Versions con timestamp + restore. Restore crea snapshot
 * del current pre-restore (patrón git-like).
 */
export const kvVideoWallSnapshot = {
  async listIds(client: string, wall: string): Promise<string[]> {
    const raw = await kv.get<string[]>(kVideoWallSnapList(client, wall));
    return Array.isArray(raw) ? raw : [];
  },

  async listMeta(
    client: string,
    wall: string,
  ): Promise<{ id: string; meta: VideoWallSnapshotMeta }[]> {
    const ids = await kvVideoWallSnapshot.listIds(client, wall);
    const out: { id: string; meta: VideoWallSnapshotMeta }[] = [];
    for (const id of ids) {
      const stored = await kv.get<StoredSnapshot>(kVideoWallSnap(client, wall, id));
      if (stored && stored.meta) out.push({ id, meta: stored.meta });
    }
    return out;
  },

  async get(client: string, wall: string, id: string): Promise<VideoWallSnapshotEntry | null> {
    const stored = await kv.get<StoredSnapshot>(kVideoWallSnap(client, wall, id));
    if (!stored) return null;
    const parsed = VideoWallConfigSchema.safeParse(stored.data);
    if (!parsed.success) return null;
    return { id, meta: stored.meta, data: parsed.data };
  },

  async create(
    client: string,
    wall: string,
    data: VideoWallConfig,
    meta: Partial<VideoWallSnapshotMeta> = {},
  ): Promise<string> {
    const ts = meta.ts ?? Date.now();
    const id = ts.toString();
    const stored: StoredSnapshot = {
      meta: { ts, savedBy: meta.savedBy, note: meta.note },
      data,
    };
    await kv.set(kVideoWallSnap(client, wall, id), stored);
    const ids = await kvVideoWallSnapshot.listIds(client, wall);
    const nextIds = [id, ...ids.filter((i) => i !== id)].slice(0, SNAPSHOT_CAP);
    const trimmed = ids.filter((i) => !nextIds.includes(i));
    await kv.set(kVideoWallSnapList(client, wall), nextIds);
    for (const trim of trimmed) {
      await kv.del(kVideoWallSnap(client, wall, trim));
    }
    return id;
  },

  async delete(client: string, wall: string, id: string): Promise<void> {
    await kv.del(kVideoWallSnap(client, wall, id));
    const ids = await kvVideoWallSnapshot.listIds(client, wall);
    const nextIds = ids.filter((i) => i !== id);
    await kv.set(kVideoWallSnapList(client, wall), nextIds);
  },
};

export const kvVideoWallI18n = {
  async get(client: string, locale: string): Promise<Record<string, string> | null> {
    return kv.get<Record<string, string>>(kVideoWallI18n(client, locale));
  },
  async set(client: string, locale: string, data: Record<string, string>): Promise<void> {
    await kv.set(kVideoWallI18n(client, locale), data);
  },
};
