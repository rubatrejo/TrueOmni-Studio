'use client';

import type { Branding, ConfigMeta, KioskConfig } from '@/lib/studio/schema';

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

export async function createConfig(input: { slug: string; nombre: string }): Promise<ConfigEntry> {
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
