'use client';

import type { WayfindingAmenity, WayfindingFloor, PwaWayfindingModuleConfig } from '@/lib/config';

import { usePwaSection } from './pwa-bridge-context';
import { WayfindingDirections } from './wayfinding-directions';

/**
 * Wrapper live de las direcciones a una amenidad. Re-deriva floor + amenity
 * desde el override del slice `features.pwa.wayfinding` por el slug de la
 * amenidad, así una edición de los textos en el Studio se refleja en el preview.
 * Cae al floor/amenity/config del server fuera del Studio. No toca
 * `WayfindingDirections`.
 */
export function WayfindingDirectionsLive({
  amenitySlug,
  config,
  floor,
  amenity,
}: {
  amenitySlug: string;
  config: PwaWayfindingModuleConfig;
  floor: WayfindingFloor;
  amenity: WayfindingAmenity;
}) {
  const wf = usePwaSection('wayfinding', config) ?? config;
  const found = wf.floors
    .flatMap((f) => f.amenities.map((a) => ({ floor: f, amenity: a })))
    .find((x) => x.amenity.slug === amenitySlug);
  return (
    <WayfindingDirections
      config={wf}
      floor={found?.floor ?? floor}
      amenity={found?.amenity ?? amenity}
    />
  );
}
