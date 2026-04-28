import { kv as vercelKv } from '@vercel/kv';

import 'server-only';

/**
 * Cliente KV del Studio.
 *
 * Wrapper sobre `@vercel/kv` (Upstash Redis) que auto-detecta las
 * credenciales `KV_REST_API_URL` y `KV_REST_API_TOKEN` desde
 * `.env.local` o desde el entorno de Vercel cuando se haga deploy.
 *
 * Si las credenciales NO están presentes (CI sin secrets, dev local
 * sin .env.local), cae a un fallback in-memory que persiste durante
 * la vida del proceso. Esto permite que `pnpm dev` arranque sin KV
 * configurado, pero hace flush al reiniciar.
 *
 * Schema de claves (alineado con el plan en wild-weaving-key.md):
 *
 *   cfg:<slug>           → working copy del KioskConfig (objeto JSON).
 *   cfg:<slug>:meta      → { owner, createdAt, currentVersion, ... }.
 *   cfg:<slug>:v<n>      → snapshot inmutable de la versión n.
 *   clients:list         → SET de slugs activos.
 *   pub:<slug>:<reqId>   → request de publish pendiente.
 *   pub:queue            → SET ordenado de reqIds pending.
 *   changelog:<slug>     → array de entries del changelog.
 */

type KvLike = {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
  smembers: (key: string) => Promise<string[]>;
  sadd: (key: string, ...members: string[]) => Promise<unknown>;
  srem: (key: string, ...members: string[]) => Promise<unknown>;
  exists: (...keys: string[]) => Promise<number>;
  keys: (pattern: string) => Promise<string[]>;
};

function createInMemoryKv(): KvLike {
  const store = new Map<string, unknown>();
  const sets = new Map<string, Set<string>>();

  return {
    async get<T>(key: string): Promise<T | null> {
      return (store.get(key) as T | undefined) ?? null;
    },
    async set(key, value) {
      store.set(key, value);
      return 'OK';
    },
    async del(key) {
      const had = store.delete(key);
      sets.delete(key);
      return had ? 1 : 0;
    },
    async smembers(key) {
      const set = sets.get(key);
      return set ? [...set] : [];
    },
    async sadd(key, ...members) {
      let s = sets.get(key);
      if (!s) {
        s = new Set();
        sets.set(key, s);
      }
      let added = 0;
      for (const m of members) {
        if (!s.has(m)) {
          s.add(m);
          added += 1;
        }
      }
      return added;
    },
    async srem(key, ...members) {
      const s = sets.get(key);
      if (!s) return 0;
      let removed = 0;
      for (const m of members) {
        if (s.delete(m)) removed += 1;
      }
      return removed;
    },
    async exists(...keys) {
      return keys.filter((k) => store.has(k)).length;
    },
    async keys(pattern) {
      // Soporte mínimo: solo prefijos con `*` al final (ej. "cfg:*").
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        return [...store.keys()].filter((k) => k.startsWith(prefix));
      }
      return store.has(pattern) ? [pattern] : [];
    },
  };
}

const hasCloudKv =
  Boolean(process.env.KV_REST_API_URL) && Boolean(process.env.KV_REST_API_TOKEN);

export const kv: KvLike = hasCloudKv ? (vercelKv as unknown as KvLike) : createInMemoryKv();

/** Devuelve true si estamos hablando con Vercel KV real. */
export function isCloudKv(): boolean {
  return hasCloudKv;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Helpers de claves                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

export const kvKeys = {
  cfg: (slug: string) => `cfg:${slug}`,
  cfgMeta: (slug: string) => `cfg:${slug}:meta`,
  cfgVersion: (slug: string, version: number) => `cfg:${slug}:v${version}`,
  clientsList: 'clients:list',
  pubRequest: (slug: string, reqId: string) => `pub:${slug}:${reqId}`,
  pubQueue: 'pub:queue',
  changelog: (slug: string) => `changelog:${slug}`,
} as const;
