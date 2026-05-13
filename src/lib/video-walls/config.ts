import 'server-only';

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { cache } from 'react';

import {
  kvSignageClient,
  kvSignageEvents,
  kvSignageNews,
  kvSignageSocial,
} from '@/lib/signage/kv-store';

import {
  kvVideoWall,
  kvVideoWallClient,
  kvVideoWallEvents,
  kvVideoWallNews,
  kvVideoWallSocial,
} from './kv-store';
import {
  VideoWallClientFileSchema,
  VideoWallClientResolvedSchema,
  VideoWallConfigSchema,
  VideoWallEventSchema,
  VideoWallNewsConfigSchema,
  VideoWallSocialDataSchema,
  type VideoWallClientResolved,
  type VideoWallConfig,
  type VideoWallEvent,
  type VideoWallSocialData,
} from './schema';

/**
 * Fallback social válido cuando ni KV ni fs tienen data. Necesario porque
 * `VideoWallClientResolvedSchema` exige `social.posts` array (no nullable):
 * pasarle `null` rompe el parse y el catch silencioso destruía el branding
 * KV recién activado (G2 audit 2026-05-12).
 */
const EMPTY_SOCIAL: VideoWallSocialData = { posts: [] };

/**
 * Loaders fs/KV híbridos del producto video-walls.
 *
 * Resolución del cliente:
 *   1. KV `videowall:client:{slug}` (working copy del editor).
 *   2. fs `clients-walls/<slug>/client.json` (publicado).
 *   3. Fallback "default" si el slug no existe.
 *
 * Events/social/news comparten KV con signage cuando el cliente tiene
 * ambos productos activos (lectura `videowall:*` primero, fallback
 * `signage:*` después, fallback fs último). Esto evita duplicar
 * data del cliente entre productos.
 */

const VIDEO_WALL_ROOT = (): string => path.join(process.cwd(), 'clients-walls');

async function readJson(absPath: string): Promise<unknown> {
  const raw = await readFile(absPath, 'utf-8');
  return JSON.parse(raw) as unknown;
}

async function fileExists(absPath: string): Promise<boolean> {
  try {
    await readFile(absPath, 'utf-8');
    return true;
  } catch {
    return false;
  }
}

async function readClientFiles(slug: string) {
  const root = VIDEO_WALL_ROOT();
  const clientJsonPath = path.join(root, slug, 'client.json');
  const eventsPath = path.join(root, slug, 'events.json');
  const socialPath = path.join(root, slug, 'social.json');
  const newsPath = path.join(root, slug, 'news.json');

  const [clientRaw, eventsRaw, socialRaw, newsRaw] = await Promise.all([
    readJson(clientJsonPath),
    readJson(eventsPath),
    readJson(socialPath),
    readJson(newsPath),
  ]);

  return {
    client: VideoWallClientFileSchema.parse(clientRaw),
    events: VideoWallEventSchema.array().parse(eventsRaw),
    social: VideoWallSocialDataSchema.parse(socialRaw),
    news: VideoWallNewsConfigSchema.parse(newsRaw),
  };
}

export const loadVideoWallClient = cache(
  async (slug: string): Promise<VideoWallClientResolved | null> => {
    // Cliente signage del KV — fuente de verdad para branding/header
    // (los tabs BrandingTab/HeaderTab guardan ahí vía `saveTheme`). El
    // runtime VW lo prefiere para que los cambios del editor se reflejen
    // en el iframe del preview sin lag.
    const kvSigClient = await kvSignageClient.get(slug).catch(() => null);

    // 1. KV first.
    try {
      const kvClient = await kvVideoWallClient.get(slug);
      if (kvClient) {
        const fsFiles = await readClientFiles(slug).catch(() => null);
        const [kvEvents, kvSocial, kvNews, kvSigEvents, kvSigSocial, kvSigNews] = await Promise.all(
          [
            kvVideoWallEvents.get(slug).catch(() => null),
            kvVideoWallSocial.get(slug).catch(() => null),
            kvVideoWallNews.get(slug).catch(() => null),
            kvSignageEvents.get(slug).catch(() => null),
            kvSignageSocial.get(slug).catch(() => null),
            kvSignageNews.get(slug).catch(() => null),
          ],
        );
        return VideoWallClientResolvedSchema.parse({
          ...kvClient,
          // Branding/header del signage KV ganan (fuente de verdad).
          branding: kvSigClient?.branding ?? kvClient.branding,
          header: kvSigClient?.header ?? kvClient.header,
          name: kvSigClient?.name ?? kvClient.name,
          locale: kvSigClient?.locale ?? kvClient.locale,
          timezone: kvSigClient?.timezone ?? kvClient.timezone,
          location: kvSigClient?.location ?? kvClient.location,
          website: kvSigClient?.website ?? kvClient.website,
          // Events/social/news: si el fs tiene más items que el KV, preferir
          // fs (asume seeds nuevos no sincronizados). El operador puede
          // sobrescribir desde el editor — el KV gana si tiene >= items.
          events: pickRicherEvents(kvEvents, kvSigEvents, fsFiles?.events),
          social: pickRicherSocial(kvSocial, kvSigSocial, fsFiles?.social),
          news: kvNews ??
            kvSigNews ??
            fsFiles?.news ?? {
              source: { kind: 'manual', items: [] },
              rotationIntervalSec: 8,
            },
        });
      }
    } catch {
      // KV unreachable: continúa a fs.
    }

    // 2. fs fallback (con events/social/news KV-first signage compartido).
    try {
      const files = await readClientFiles(slug);
      const [kvEvents, kvSocial, kvNews, kvSigEvents, kvSigSocial, kvSigNews] = await Promise.all([
        kvVideoWallEvents.get(slug).catch(() => null),
        kvVideoWallSocial.get(slug).catch(() => null),
        kvVideoWallNews.get(slug).catch(() => null),
        kvSignageEvents.get(slug).catch(() => null),
        kvSignageSocial.get(slug).catch(() => null),
        kvSignageNews.get(slug).catch(() => null),
      ]);
      return VideoWallClientResolvedSchema.parse({
        ...files.client,
        // Branding/header del signage KV ganan sobre fs (fuente de verdad).
        branding: kvSigClient?.branding ?? files.client.branding,
        header: kvSigClient?.header ?? files.client.header,
        name: kvSigClient?.name ?? files.client.name,
        locale: kvSigClient?.locale ?? files.client.locale,
        timezone: kvSigClient?.timezone ?? files.client.timezone,
        location: kvSigClient?.location ?? files.client.location,
        website: kvSigClient?.website ?? files.client.website,
        events: pickRicherEvents(kvEvents, kvSigEvents, files.events),
        social: pickRicherSocial(kvSocial, kvSigSocial, files.social),
        news: kvNews ?? kvSigNews ?? files.news,
      });
    } catch (err) {
      if (slug !== 'default') {
        // eslint-disable-next-line no-console
        console.warn(
          `[video-walls] cliente "${slug}" no encontrado o inválido, usando "default". (${(err as Error).message})`,
        );
        try {
          const files = await readClientFiles('default');
          return VideoWallClientResolvedSchema.parse({
            ...files.client,
            events: files.events,
            social: files.social,
            news: files.news,
            slug,
          });
        } catch {
          return null;
        }
      }
      return null;
    }
  },
);

/** Devuelve el array de events con más items entre KV-vw, KV-signage y fs.
 *  Permite que seeds nuevos del fs (eg. nuevos events publicados via git)
 *  se vean en producción sin tener que abrir el editor a re-guardar.
 *  Garantiza `VideoWallEvent[]` (nunca null/undefined) — el schema lo exige. */
function pickRicherEvents(
  kvVw: VideoWallEvent[] | null | undefined,
  kvSig: VideoWallEvent[] | null | undefined,
  fs: VideoWallEvent[] | null | undefined,
): VideoWallEvent[] {
  const candidates = [kvVw, kvSig, fs].filter((x): x is VideoWallEvent[] => Array.isArray(x));
  if (candidates.length === 0) return [];
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0];
}

/** Devuelve el SignageSocialData con más posts. Igual lógica que events.
 *  Garantiza `VideoWallSocialData` válido (posts: []) si todos son null. */
function pickRicherSocial(
  kvVw: VideoWallSocialData | null | undefined,
  kvSig: VideoWallSocialData | null | undefined,
  fs: VideoWallSocialData | null | undefined,
): VideoWallSocialData {
  const candidates = [kvVw, kvSig, fs].filter(
    (x): x is VideoWallSocialData => x !== null && x !== undefined,
  );
  if (candidates.length === 0) return EMPTY_SOCIAL;
  candidates.sort((a, b) => (b.posts?.length ?? 0) - (a.posts?.length ?? 0));
  return candidates[0];
}

async function loadVideoWallFromFs(
  clientSlug: string,
  wallSlug: string,
): Promise<VideoWallConfig | null> {
  const root = VIDEO_WALL_ROOT();
  const wallPath = path.join(root, clientSlug, 'walls', wallSlug, 'wall.json');
  if (await fileExists(wallPath)) {
    const raw = await readJson(wallPath);
    return VideoWallConfigSchema.parse(raw);
  }
  if (clientSlug !== 'default') {
    const fallbackPath = path.join(root, 'default', 'walls', wallSlug, 'wall.json');
    if (await fileExists(fallbackPath)) {
      const raw = await readJson(fallbackPath);
      return VideoWallConfigSchema.parse(raw);
    }
  }
  return null;
}

export const loadVideoWall = cache(
  async (
    clientSlug: string,
    wallSlug: string,
    options?: { preferFs?: boolean },
  ): Promise<VideoWallConfig | null> => {
    // Modo override: forzar fs siempre. Útil para validación pixel-perfect
    // o cuando se necesita ignorar el KV (vía `?source=fs`).
    if (options?.preferFs) {
      const fsWall = await loadVideoWallFromFs(clientSlug, wallSlug);
      if (fsWall) return fsWall;
    }

    // 1. KV first.
    let kvWall: VideoWallConfig | null = null;
    try {
      kvWall = await kvVideoWall.get(clientSlug, wallSlug);
    } catch {
      // KV unreachable.
    }

    // 2. Cuando el fs tiene templates que el KV no tiene (mismatch de
    //    templateIds o playlist más larga), preferimos fs — el seed git
    //    es ground truth si el operador no editó el wall en KV con esos
    //    mismos templates. Si los templateIds COINCIDEN exactamente
    //    (mismo set), KV gana (mantiene customizaciones del operador
    //    sobre assets/schedule/duration).
    if (kvWall) {
      const fsWall = await loadVideoWallFromFs(clientSlug, wallSlug);
      if (fsWall) {
        if (fsWall.playlist.length > kvWall.playlist.length) {
          return fsWall;
        }
        // Comparar templateIds como sets — si fs tiene IDs que KV no
        // tiene, fs publicó nuevos seeds → prefer fs.
        const kvIds = new Set(kvWall.playlist.map((s) => s.templateId));
        const fsIds = new Set(fsWall.playlist.map((s) => s.templateId));
        const fsHasIdsKvLacks = [...fsIds].some((id) => !kvIds.has(id));
        if (fsHasIdsKvLacks) {
          return fsWall;
        }
      }
      return kvWall;
    }

    // 3. fs fallback (sin KV).
    return loadVideoWallFromFs(clientSlug, wallSlug);
  },
);

export interface VideoWallClientListEntry {
  slug: string;
  name: string;
  wallsCount: number;
}

export interface VideoWallListEntry {
  slug: string;
  name: string;
  grid: VideoWallConfig['grid'];
  slidesCount: number;
}

export const listVideoWallClients = cache(async (): Promise<VideoWallClientListEntry[]> => {
  const root = VIDEO_WALL_ROOT();
  let entries: string[];
  try {
    entries = await readdir(root);
  } catch {
    return [];
  }
  const slugs = entries.filter((e) => !e.startsWith('_') && !e.startsWith('.'));
  const out: VideoWallClientListEntry[] = [];
  for (const slug of slugs) {
    try {
      const clientJsonPath = path.join(root, slug, 'client.json');
      const raw = await readJson(clientJsonPath);
      const parsed = VideoWallClientFileSchema.parse(raw);
      out.push({
        slug: parsed.slug,
        name: parsed.name,
        wallsCount: parsed.walls.length,
      });
    } catch {
      // Skip inválidos.
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
});

export const listVideoWalls = cache(async (clientSlug: string): Promise<VideoWallListEntry[]> => {
  const client = await loadVideoWallClient(clientSlug).catch(() => null);
  const declared = client?.walls ?? [];

  let slugs: string[] = declared;
  if (slugs.length === 0) {
    const root = VIDEO_WALL_ROOT();
    const wallsDir = path.join(root, clientSlug, 'walls');
    try {
      const entries = await readdir(wallsDir);
      slugs = entries.filter((e) => !e.startsWith('_') && !e.startsWith('.'));
    } catch {
      return [];
    }
  }

  const out: VideoWallListEntry[] = [];
  for (const slug of slugs) {
    try {
      const wall = await loadVideoWall(clientSlug, slug);
      if (!wall) continue;
      out.push({
        slug: wall.slug,
        name: wall.name,
        grid: wall.grid,
        slidesCount: wall.playlist.length,
      });
    } catch {
      // Skip walls inválidos.
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
});

export const loadVideoWallTokensCss = cache(async (slug: string): Promise<string> => {
  const root = VIDEO_WALL_ROOT();
  const ownPath = path.join(root, slug, 'tokens.css');
  if (await fileExists(ownPath)) {
    return readFile(ownPath, 'utf-8');
  }
  const defaultPath = path.join(root, 'default', 'tokens.css');
  if (await fileExists(defaultPath)) {
    return readFile(defaultPath, 'utf-8');
  }
  return '';
});
