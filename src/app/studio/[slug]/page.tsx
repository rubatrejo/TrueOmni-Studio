import { notFound } from 'next/navigation';

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
  defaultEvents,
  defaultListings,
  defaultModules,
  defaultPasses,
  defaultTickets,
  defaultTrails,
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
  const raw = await kv.get<KioskConfig>(kvKeys.cfg(slug));
  if (!raw) notFound();
  // Backfill defensivo: clientes pre-S2 pueden no tener modules / billboard /
  // aiAvatar, o tener `systemModules` con shape antiguo de solo 3 campos.
  const baseModules = raw.modules ?? defaultModules();
  const config: KioskConfig = {
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
  };
  const meta = await kv.get<ConfigMeta>(kvKeys.cfgMeta(slug));

  return <Shell initialConfig={config} initialMeta={meta} />;
}

export const dynamic = 'force-dynamic';
