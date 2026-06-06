'use client';

import type { ScavengerHunt, PwaScavengerHuntConfig } from '@/lib/config';

import { usePwaSection } from '../pwa-bridge-context';

import { HuntDetail } from './hunt-detail';

/**
 * Wrapper live del detalle de un hunt. Re-deriva el `hunt` desde el override del
 * slice `features.pwa.scavengerHunt` por su `slug`, así una edición del nombre /
 * tareas del hunt en el Studio se refleja en el preview. Cae al `hunt` y `config`
 * del server fuera del Studio. No toca `HuntDetail`.
 */
export function HuntDetailLive({
  slug,
  hunt,
  config,
  mapboxToken,
  clientName,
  clientCoords,
}: {
  slug: string;
  hunt: ScavengerHunt;
  config: PwaScavengerHuntConfig;
  mapboxToken: string;
  clientName: string;
  clientCoords: { lat: number; lng: number };
}) {
  const sh = usePwaSection('scavengerHunt', config) ?? config;
  const liveHunt = sh.hunts.find((h) => h.slug === slug) ?? hunt;
  return (
    <HuntDetail
      hunt={liveHunt}
      config={sh}
      mapboxToken={mapboxToken}
      clientName={clientName}
      clientCoords={clientCoords}
    />
  );
}
