/**
 * Keys de Upstash KV para el namespace signage. Aisladas del kiosk.
 *
 * NO se usan en DS0 (loaders fs-only). Quedan listas para que el Studio (DSS0)
 * las cablee sin tener que diseñar el namespace después.
 */

export const kSignageClientList = 'signage:clientList';

export const kSignageClient = (slug: string): string => `signage:client:${slug}`;

export const kSignageDisplay = (client: string, display: string): string =>
  `signage:display:${client}:${display}`;

export const kSignageDisplayRaw = (client: string, display: string): string =>
  `signage:displayRaw:${client}:${display}`;

export const kSignageSnap = (client: string, display: string, id: string): string =>
  `signage:cfgSnap:${client}:${display}:${id}`;

export const kSignageSnapList = (client: string, display: string): string =>
  `signage:cfgSnapList:${client}:${display}`;

export const kSignageEvents = (client: string): string => `signage:events:${client}`;
export const kSignageSocial = (client: string): string => `signage:social:${client}`;
export const kSignageNews = (client: string): string => `signage:news:${client}`;

export const kSignageI18n = (client: string, locale: string): string =>
  `signage:i18n:${client}:${locale}`;
