/**
 * Keys de Upstash KV para el namespace video-walls. Aisladas de kiosk y signage.
 *
 * Espejado del namespace `signage:` (ver `signage/kv-keys.ts`). Tipos
 * y estructura idénticos para reusar patterns de snapshots, drafts,
 * branding sync, publish.
 */

export const kVideoWallClientList = 'videowall:clientList';

export const kVideoWallClient = (slug: string): string => `videowall:client:${slug}`;

export const kVideoWall = (client: string, wall: string): string =>
  `videowall:wall:${client}:${wall}`;

export const kVideoWallRaw = (client: string, wall: string): string =>
  `videowall:wallRaw:${client}:${wall}`;

export const kVideoWallSnap = (client: string, wall: string, id: string): string =>
  `videowall:cfgSnap:${client}:${wall}:${id}`;

export const kVideoWallSnapList = (client: string, wall: string): string =>
  `videowall:cfgSnapList:${client}:${wall}`;

export const kVideoWallThemeSnap = (client: string, id: string): string =>
  `videowall:themeSnap:${client}:${id}`;

export const kVideoWallThemeSnapList = (client: string): string =>
  `videowall:themeSnapList:${client}`;

export const kVideoWallEvents = (client: string): string => `videowall:events:${client}`;
export const kVideoWallSocial = (client: string): string => `videowall:social:${client}`;
export const kVideoWallNews = (client: string): string => `videowall:news:${client}`;

export const kVideoWallI18n = (client: string, locale: string): string =>
  `videowall:i18n:${client}:${locale}`;
