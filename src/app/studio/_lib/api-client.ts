'use client';

import type {
  AdsModule,
  AiAvatarConfig,
  BillboardConfig,
  Branding,
  BrochuresModuleConfig,
  ConfigMeta,
  DealsModuleConfig,
  GuestbookConfig,
  I18nBundle,
  IntegrationsConfig,
  KioskConfig,
  ModulesConfig,
  PhotoBoothConfig,
  SocialWallConfig,
  SurveyConfig,
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
    } catch {}
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

export async function getConfig(slug: string): Promise<{ config: KioskConfig; meta: ConfigMeta | null }> {
  return http<{ config: KioskConfig; meta: ConfigMeta | null }>(`/api/studio/configs/${slug}`);
}

export async function createConfig(input: {
  slug: string;
  nombre: string;
  orientation?: 'portrait' | 'landscape';
}): Promise<ConfigEntry> {
  const data = await http<{ slug: string; config: KioskConfig; meta: ConfigMeta }>(
    '/api/studio/configs',
    { method: 'POST', body: input },
  );
  return { ...data.config, meta: data.meta };
}

export async function patchBranding(slug: string, branding: Branding): Promise<KioskConfig> {
  const data = await http<{ config: KioskConfig }>(`/api/studio/configs/${slug}`, {
    method: 'PATCH',
    body: { branding },
  });
  return data.config;
}

export async function patchModules(
  slug: string,
  modules: ModulesConfig,
): Promise<KioskConfig> {
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
    ads?: AdsModule;
    integrations?: IntegrationsConfig;
  },
): Promise<KioskConfig> {
  const data = await http<{ config: KioskConfig }>(`/api/studio/configs/${slug}`, {
    method: 'PATCH',
    body: payload,
  });
  return data.config;
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

export async function seedDefault(): Promise<void> {
  await http<{ seeded: boolean }>('/api/studio/seed', { method: 'POST' });
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
}): Promise<{ translation: string; model: string }> {
  return http<{ translation: string; model: string }>('/api/studio/i18n/translate', {
    method: 'POST',
    body: input,
  });
}

export async function getTranslateStatus(): Promise<{ available: boolean }> {
  return http<{ available: boolean }>('/api/studio/i18n/translate');
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
}

export interface PublishResult {
  slug: string;
  dryRun: boolean;
  written: number;
  files: PublishFileChange[];
}

export async function publishToFilesystem(
  slug: string,
  options: { dryRun?: boolean } = {},
): Promise<PublishResult> {
  const qs = options.dryRun ? '?dryRun=1' : '';
  return http<PublishResult>(`/api/studio/publish/${slug}${qs}`, { method: 'POST' });
}
