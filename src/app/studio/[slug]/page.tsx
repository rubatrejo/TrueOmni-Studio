import { notFound } from 'next/navigation';

import { bootstrapStudioFromFs, readClientFs } from '@/lib/studio/bootstrap-from-fs';
import { kv, kvKeys } from '@/lib/studio/kv';
import {
  DEFAULT_AI_AVATAR,
  DEFAULT_BILLBOARD,
  DEFAULT_BROCHURES,
  DEFAULT_DEALS,
  DEFAULT_GUESTBOOK,
  DEFAULT_PHOTO_BOOTH,
  DEFAULT_SOCIAL_WALL,
  DEFAULT_SURVEY,
  DEFAULT_SYSTEM_MODULES,
  defaultAds,
  defaultEvents,
  defaultIntegrations,
  defaultListings,
  defaultModules,
  defaultPasses,
  defaultTickets,
  defaultTrails,
  makeBlankConfig,
  migrateListings,
  type ConfigMeta,
  type KioskConfig,
} from '@/lib/studio/schema';

import { Shell } from '../_components/Shell';

export default async function StudioEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let raw = await kv.get<KioskConfig>(kvKeys.cfg(slug));

  // KV miss en serverless con `Degraded · in-memory KV` (Upstash no
  // configurado): cada lambda es proceso nuevo y la memoria está vacía.
  // Fallback: si `clients/<slug>/config.json` existe en filesystem
  // (commiteado al repo), seed el editor con un blank config + el
  // bootstrap-from-fs. El KV se rellena al primer save del operador.
  if (!raw) {
    const fsProbe = await readClientFs(slug);
    if (!fsProbe.config) notFound();
    raw = makeBlankConfig(slug, fsProbe.config.client?.nombre ?? slug);
  }

  // Backfill defensivo: clientes pre-S2 pueden no tener modules / billboard /
  // aiAvatar, o tener `systemModules` con shape antiguo de solo 3 campos.
  const baseModules = raw.modules ?? defaultModules();
  const filled: KioskConfig = {
    ...raw,
    modules: {
      ...baseModules,
      systemModules: { ...DEFAULT_SYSTEM_MODULES, ...(baseModules.systemModules ?? {}) },
    },
    billboard: raw.billboard ?? { ...DEFAULT_BILLBOARD },
    aiAvatar: raw.aiAvatar ?? { ...DEFAULT_AI_AVATAR },
    survey: raw.survey ?? structuredClone(DEFAULT_SURVEY),
    deals: raw.deals ?? structuredClone(DEFAULT_DEALS),
    photoBooth: raw.photoBooth ?? structuredClone(DEFAULT_PHOTO_BOOTH),
    brochures: raw.brochures ?? structuredClone(DEFAULT_BROCHURES),
    socialWall: raw.socialWall ?? structuredClone(DEFAULT_SOCIAL_WALL),
    guestbook: raw.guestbook ?? structuredClone(DEFAULT_GUESTBOOK),
    listings: migrateListings(raw.listings ?? defaultListings()),
    events: raw.events ?? defaultEvents(),
    tickets: raw.tickets ?? defaultTickets(),
    passes: raw.passes ?? defaultPasses(),
    trails: raw.trails ?? defaultTrails(),
    ads: raw.ads ?? defaultAds(),
    // Merge profundo de integrations: clientes pre-S6.X pueden tener `api`,
    // `mapbox`, `analytics`, `weather` pero faltarles `satisfi`/`tavus`/
    // `bandwango`. Llenamos los huecos con los defaults para que el editor
    // no explote al leer `value.satisfi.apiKey`.
    integrations: {
      ...defaultIntegrations(),
      ...(raw.integrations ?? {}),
    },
  };
  // Hidrata desde filesystem (clients/<slug>/) todo lo que sigue siendo
  // factory default — mismo flujo que la API GET para evitar drift entre
  // SSR y el fetch en el cliente.
  const { config: fsConfig, tokensCss } = await readClientFs(slug);
  const config = bootstrapStudioFromFs(filled, fsConfig, tokensCss);
  const meta = await kv.get<ConfigMeta>(kvKeys.cfgMeta(slug));

  return <Shell initialConfig={config} initialMeta={meta} />;
}

export const dynamic = 'force-dynamic';
