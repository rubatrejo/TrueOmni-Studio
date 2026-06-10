'use client';

import type { PwaConfig } from '@/lib/config';
import type { UnifiedClientBranding } from '@/lib/studio/client-branding-sync';
import type {
  AdsModule,
  AiAvatarConfig,
  BillboardConfig,
  Branding,
  BrochuresModuleConfig,
  ConfigMeta,
  DealsModuleConfig,
  EventsModule,
  GuestbookConfig,
  I18nBundle,
  IntegrationsConfig,
  ItineraryBuilderConfig,
  KioskConfig,
  ListingsModule,
  ModulesConfig,
  PassesModule,
  PhotoBoothConfig,
  SocialWallConfig,
  SurveyConfig,
  TicketsModule,
  TrailsModule,
} from '@/lib/studio/schema';

/**
 * Cliente HTTP del Studio frontend → API routes server-side.
 *
 * Concentra todas las llamadas a `/api/studio/*` en un solo lugar para
 * que los componentes solo se preocupen de UX/UI. Sin librerías de
 * fetching pesadas (SWR/react-query) — son fetch nativos con un poco
 * de manejo de error.
 */

export type ConfigEntry = KioskConfig & { meta?: ConfigMeta };

async function http<T>(
  url: string,
  init?: { method?: string; body?: unknown; headers?: HeadersInit },
): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? (init?.body ? 'POST' : 'GET'),
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    let detail = '';
    try {
      const err = (await res.json()) as { error?: string };
      detail = err?.error ?? JSON.stringify(err);
    } catch (e) {
      console.warn('[api-client] failed to parse error response', e);
    }
    throw new Error(`${res.status} ${res.statusText}${detail ? ` — ${detail}` : ''}`);
  }
  return (await res.json()) as T;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Configs API                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

export async function listConfigs(): Promise<ConfigEntry[]> {
  const data = await http<{ configs: ConfigEntry[] }>('/api/studio/configs');
  return data.configs;
}

export async function getConfig(
  slug: string,
): Promise<{ config: KioskConfig; meta: ConfigMeta | null }> {
  return http<{ config: KioskConfig; meta: ConfigMeta | null }>(`/api/studio/configs/${slug}`);
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Clients API (unified, Fase 4 cliente-primero)                            */
/* ────────────────────────────────────────────────────────────────────────── */

export interface ClientProductsInput {
  kiosks?: boolean;
  digitalDisplays?: boolean;
  mobilePwa?: boolean;
  videoWalls?: boolean;
  tablets?: boolean;
}

export interface CreateClientInput {
  slug: string;
  name: string;
  website?: string;
  /** Coords + ciudad estructurados. Si no hay coords, el server geocodea
   *  via Nominatim a partir de `locationFull`. */
  location?: { city?: string; lat?: number; lon?: number };
  /** "City, ST" sin parsear. Lo usa el backend para reescribir el contenido
   *  Phoenix/Arizona del template default → la ciudad del cliente nuevo. */
  locationFull?: string;
  /** Vacía colecciones de mock data (listings/events/passes/deals/trails/
   *  itinerary.localListings/socialWall.posts) tras clonar el template. */
  emptyMode?: boolean;
  /** Starter por vertical (F-HUB-1): aplica paleta/fonts/módulos/preguntas. */
  starterId?: string;
  products?: ClientProductsInput;
}

/**
 * Crea un cliente unificado vía `POST /api/studio/clients` (Fase 4).
 *
 * Recibe `products` para activar kiosks + digital-displays + más productos
 * en un solo round-trip. Devuelve el manifest unificado + unified branding
 * (no `KioskConfig`), porque el cliente puede no tener kiosk activo. Aplica
 * los rewrites del template Arizona/Phoenix internamente.
 */
export async function createClient(input: CreateClientInput): Promise<{
  slug: string;
  manifest: unknown;
  branding: unknown;
}> {
  return http<{ slug: string; manifest: unknown; branding: unknown }>('/api/studio/clients', {
    method: 'POST',
    body: input,
  });
}

export async function patchBranding(slug: string, branding: Branding): Promise<KioskConfig> {
  const data = await http<{ config: KioskConfig }>(`/api/studio/configs/${slug}`, {
    method: 'PATCH',
    body: { branding },
  });
  return data.config;
}

export async function patchModules(slug: string, modules: ModulesConfig): Promise<KioskConfig> {
  const data = await http<{ config: KioskConfig }>(`/api/studio/configs/${slug}`, {
    method: 'PATCH',
    body: { modules },
  });
  return data.config;
}

/** Combinar varias secciones en un solo PATCH. */
export async function patchConfig(
  slug: string,
  payload: {
    branding?: Branding;
    modules?: ModulesConfig;
    billboard?: BillboardConfig;
    aiAvatar?: AiAvatarConfig;
    survey?: SurveyConfig;
    deals?: DealsModuleConfig;
    photoBooth?: PhotoBoothConfig;
    brochures?: BrochuresModuleConfig;
    socialWall?: SocialWallConfig;
    guestbook?: GuestbookConfig;
    listings?: ListingsModule;
    events?: EventsModule;
    tickets?: TicketsModule;
    passes?: PassesModule;
    trails?: TrailsModule;
    itineraryBuilder?: ItineraryBuilderConfig;
    ads?: AdsModule;
    integrations?: IntegrationsConfig;
  },
): Promise<{ config: KioskConfig; syncWarning: string | null }> {
  const data = await http<{ config: KioskConfig; syncWarning?: string | null }>(
    `/api/studio/configs/${slug}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );
  return { config: data.config, syncWarning: data.syncWarning ?? null };
}

export async function cloneConfig(
  source: string,
  input: { newSlug: string; newNombre: string },
): Promise<ConfigEntry> {
  const data = await http<{ slug: string; config: KioskConfig; meta: ConfigMeta }>(
    `/api/studio/configs/${source}/clone`,
    { method: 'POST', body: input },
  );
  return { ...data.config, meta: data.meta };
}

export async function deleteConfig(slug: string): Promise<void> {
  await http<{ slug: string; deleted: true }>(`/api/studio/configs/${slug}`, {
    method: 'DELETE',
  });
}

/**
 * Borra el cliente unified entero (kiosk + signage + video walls + manifest +
 * unified branding + entries en todas las listas). Reemplaza al legacy
 * `deleteConfig` cuando el contexto es "Delete client" desde el dashboard
 * `/studio` — el endpoint legacy solo desactivaba el producto kiosk y dejaba
 * el manifest vivo si el cliente tenía otros productos activos, lo que dejaba
 * la card fantasma en el dashboard.
 */
export async function deleteClient(slug: string): Promise<void> {
  await http<{ slug: string; deleted: true }>(`/api/studio/clients/${slug}`, {
    method: 'DELETE',
  });
}

/**
 * Trigger del download del config completo como JSON. Hallazgo #25 del audit.
 * Usa el endpoint que devuelve `Content-Disposition: attachment` para que el
 * browser fuerce save-as.
 */
export function downloadConfigExport(slug: string): void {
  const url = `/api/studio/configs/${slug}/export`;
  const a = document.createElement('a');
  a.href = url;
  a.rel = 'noreferrer';
  a.click();
}

/**
 * Importa un config JSON al slug indicado. Hallazgo #25 del audit. El backend
 * sobreescribe el slug del JSON con el del path para evitar identity drift.
 */
export async function importConfig(slug: string, configJson: unknown): Promise<KioskConfig> {
  const data = await http<{ slug: string; config: KioskConfig }>(
    `/api/studio/configs/${slug}/import`,
    { method: 'POST', body: configJson },
  );
  return data.config;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Snapshots / Rollback (#9)                                                */
/* ────────────────────────────────────────────────────────────────────────── */

export interface SnapshotEntry {
  ts: string;
  reason: 'patch' | 'import' | 'revert';
  sizeBytes: number;
}

export async function listSnapshots(slug: string): Promise<SnapshotEntry[]> {
  const data = await http<{ slug: string; entries: SnapshotEntry[] }>(
    `/api/studio/configs/${slug}/snapshots`,
  );
  return data.entries;
}

export async function revertSnapshot(slug: string, ts: string): Promise<KioskConfig> {
  const data = await http<{ slug: string; revertedTo: string; config: KioskConfig }>(
    `/api/studio/configs/${slug}/snapshots`,
    { method: 'POST', body: { ts } },
  );
  return data.config;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  AI content suggestions (#26)                                             */
/* ────────────────────────────────────────────────────────────────────────── */

export interface AiSuggestedItem {
  slug: string;
  title: string;
  description: string;
  address: string;
  tags?: string[];
  _aiGenerated: true;
}

export type AiSuggestKind = 'restaurants' | 'things-to-do' | 'stay' | 'events' | 'deals';

export async function suggestContent(input: {
  kind: AiSuggestKind;
  count: number;
  city: string;
  state: string;
  exclude?: string[];
}): Promise<{ items: AiSuggestedItem[]; tokensUsed: number }> {
  return http<{ items: AiSuggestedItem[]; tokensUsed: number }>('/api/studio/ai/suggest', {
    method: 'POST',
    body: input,
  });
}

export async function seedDefault(): Promise<void> {
  await http<{ seeded: boolean }>('/api/studio/seed', { method: 'POST' });
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Mobile PWA slice (features.pwa)                                           */
/* ────────────────────────────────────────────────────────────────────────── */

export interface PwaSliceMetaDto {
  slug: string;
  createdAt: string;
  lastEditedAt: string;
  currentVersion: number;
}

export async function getPwaSlice(
  slug: string,
): Promise<{ pwa: PwaConfig; meta: PwaSliceMetaDto | null }> {
  const data = await http<{ slug: string; pwa: PwaConfig; meta: PwaSliceMetaDto | null }>(
    `/api/studio/pwa/${slug}`,
  );
  return { pwa: data.pwa, meta: data.meta };
}

export async function patchPwaSlice(slug: string, pwa: PwaConfig): Promise<PwaSliceMetaDto> {
  const data = await http<{ slug: string; ok: true; meta: PwaSliceMetaDto }>(
    `/api/studio/pwa/${slug}`,
    { method: 'PATCH', body: { pwa } },
  );
  return data.meta;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Unified client branding (compartido kiosk / signage / pwa)               */
/* ────────────────────────────────────────────────────────────────────────── */

export async function getClientBranding(slug: string): Promise<UnifiedClientBranding> {
  const data = await http<{ branding: UnifiedClientBranding }>(
    `/api/studio/clients/${slug}/branding`,
  );
  return data.branding;
}

/** Persiste el unified branding del cliente y propaga a kiosk + signage. */
export async function patchClientBranding(
  slug: string,
  branding: UnifiedClientBranding,
): Promise<void> {
  await http<{ ok: true; sync: unknown }>(`/api/studio/clients/${slug}/branding`, {
    method: 'PATCH',
    body: branding,
  });
}

export interface PwaPublishResult {
  slug: string;
  dryRun: boolean;
  mode: 'fs' | 'pr';
  written: number;
  files: Array<{ path: string; action: 'create' | 'update' | 'unchanged'; sizeAfter: number }>;
  pr?: { url: string; number: number; branch: string; commit: string } | null;
}

/** Publica solo `features.pwa` (fs en dev, PR en producción). */
export async function publishPwaSlice(
  slug: string,
  options: { dryRun?: boolean; mode?: 'fs' | 'pr' } = {},
): Promise<PwaPublishResult> {
  const params = new URLSearchParams();
  if (options.dryRun) params.set('dryRun', '1');
  if (options.mode) params.set('mode', options.mode);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return http<PwaPublishResult>(`/api/studio/publish/${slug}/pwa${qs}`, { method: 'POST' });
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  i18n API                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export async function getI18n(slug: string): Promise<I18nBundle> {
  const data = await http<{ bundle: I18nBundle }>(`/api/studio/i18n/${slug}`);
  return data.bundle;
}

export async function patchI18n(slug: string, bundle: I18nBundle): Promise<I18nBundle> {
  const data = await http<{ bundle: I18nBundle }>(`/api/studio/i18n/${slug}`, {
    method: 'PATCH',
    body: { bundle },
  });
  return data.bundle;
}

export async function translateI18nText(input: {
  text: string;
  fromLocale: string;
  toLocale: string;
  context?: string;
  key?: string;
}): Promise<{ translation: string; model: string; provider?: string }> {
  return http<{ translation: string; model: string; provider?: string }>(
    '/api/studio/i18n/translate',
    {
      method: 'POST',
      body: input,
    },
  );
}

export interface BulkTranslateItem {
  key: string;
  text: string;
  context?: string;
}

export interface BulkTranslateResult {
  key: string;
  translation?: string;
  error?: string;
}

export async function translateI18nBulk(input: {
  fromLocale: string;
  toLocale: string;
  items: BulkTranslateItem[];
}): Promise<{ translations: BulkTranslateResult[]; provider: string }> {
  return http<{ translations: BulkTranslateResult[]; provider: string }>(
    '/api/studio/i18n/translate-bulk',
    {
      method: 'POST',
      body: input,
    },
  );
}

export async function getTranslateStatus(): Promise<{
  available: boolean;
  provider: 'deepl' | 'anthropic' | null;
}> {
  return http<{ available: boolean; provider: 'deepl' | 'anthropic' | null }>(
    '/api/studio/i18n/translate',
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Integrations health check                                                */
/* ────────────────────────────────────────────────────────────────────────── */

export type IntegrationCheckInput =
  | { kind: 'mapbox'; token: string }
  | { kind: 'api'; baseUrl: string }
  | { kind: 'analytics'; gaId: string }
  | {
      kind: 'openweather';
      apiKey: string;
      city: string;
      units: 'metric' | 'imperial';
    }
  | { kind: 'satisfi'; apiKey: string; hubId: string }
  | { kind: 'tavus'; apiKey: string; replicaId: string }
  | { kind: 'bandwango'; apiKey: string; partnerId: string }
  | { kind: 'crowdriff'; apiKey: string; galleryId: string }
  | { kind: 'viator'; apiKey: string; partnerId: string };

export async function checkIntegration(
  input: IntegrationCheckInput,
): Promise<{ ok: boolean; message: string }> {
  return http<{ ok: boolean; message: string }>('/api/studio/integrations/check', {
    method: 'POST',
    body: input,
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Publish (KV → filesystem)                                                */
/* ────────────────────────────────────────────────────────────────────────── */

export interface PublishFileChange {
  path: string;
  action: 'create' | 'update' | 'unchanged';
  sizeBefore?: number;
  sizeAfter: number;
  /** Paths del JSON que cambiaron (#8 audit). Solo en dryRun + JSON files
   *  &lt;300KB. Cap a 50 entradas. */
  changedKeys?: string[];
}

export interface PublishPrInfo {
  url: string;
  number: number;
  branch: string;
  commit: string;
}

export interface PublishResult {
  slug: string;
  dryRun: boolean;
  /** 'fs' = escritura directa, 'pr' = abre PR en GitHub (Vercel/serverless). */
  mode: 'fs' | 'pr';
  written: number;
  files: PublishFileChange[];
  pr?: PublishPrInfo | null;
}

export async function publishToFilesystem(
  slug: string,
  options: { dryRun?: boolean; mode?: 'fs' | 'pr' } = {},
): Promise<PublishResult> {
  const params = new URLSearchParams();
  if (options.dryRun) params.set('dryRun', '1');
  if (options.mode) params.set('mode', options.mode);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return http<PublishResult>(`/api/studio/publish/${slug}${qs}`, { method: 'POST' });
}
