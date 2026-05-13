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
} from './schema';

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
          events: kvEvents ?? kvSigEvents ?? fsFiles?.events ?? [],
          social: kvSocial ?? kvSigSocial ?? fsFiles?.social ?? { posts: [] },
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
        events: kvEvents ?? kvSigEvents ?? files.events,
        social: kvSocial ?? kvSigSocial ?? files.social,
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

    // 2. Cuando el fs tiene una playlist más completa que el KV (eg. fs
    //    publicó nuevos slides y el operador no ha sincronizado), preferimos
    //    fs. Esto evita que ediciones al template de fs queden invisibles
    //    en producción hasta que alguien abra el editor.
    if (kvWall) {
      const fsWall = await loadVideoWallFromFs(clientSlug, wallSlug);
      if (fsWall && fsWall.playlist.length > kvWall.playlist.length) {
        return fsWall;
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
