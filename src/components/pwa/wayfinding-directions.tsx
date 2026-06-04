'use client';

import { useRouter } from 'next/navigation';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { WayfindingAmenity, WayfindingFloor, PwaWayfindingModuleConfig } from '@/lib/config';

import { PwaBottomNav } from './bottom-nav';
import { S } from './mobile-layer';
import { PwaSubHeader } from './pwa-sub-header';
import { WayfindingRouteOverlay } from './wayfinding-route-overlay';
import { WayfindingStepList } from './wayfinding-step-list';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface WayfindingDirectionsProps {
  config: PwaWayfindingModuleConfig;
  floor: WayfindingFloor;
  amenity: WayfindingAmenity;
}

export function WayfindingDirections({ config, floor, amenity }: WayfindingDirectionsProps) {
  const router = useRouter();
  const floorPlanSrc = resolveAssetUrl(floor.floorPlanImage);

  return (
    <div className="relative flex h-full w-full flex-col bg-white">
      {/* Header brand (escalado) */}
      <div className="relative z-10 shrink-0" style={{ height: 90 * S }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: 375, height: 90, transform: `scale(${S})`, transformOrigin: 'top left' }}
        >
          <PwaSubHeader title={config.title} backHref="/pwa/wayfinding" />
        </div>
      </div>

      {/* Contenido scrolleable */}
      <div className="scrollbar-hide flex-1 overflow-y-auto">
        {/* Floor plan con ruta overlay */}
        <div className="relative w-full bg-[hsl(var(--pwa-floorplan-bg))]">
          <img
            src={floorPlanSrc}
            alt={`${floor.label} floor plan`}
            className="w-full object-cover"
            style={{ height: 200 }}
          />
          <WayfindingRouteOverlay
            routePoints={amenity.routePoints}
            origin={floor.origin}
            destination={amenity.destination}
            destinationName={amenity.name}
            youAreHereLabel={config.youAreHereLabel}
          />
        </div>

        {/* Banner del destino */}
        <div
          className="flex items-center justify-center py-[10px]"
          style={{ backgroundColor: 'hsl(var(--brand-primary))' }}
        >
          <span className="text-[16px] font-semibold text-white" style={OPEN_SANS}>
            {amenity.name}
          </span>
        </div>

        {/* Lista de pasos */}
        <WayfindingStepList steps={amenity.steps} />

        {/* Botones GO BACK / THANKS */}
        <div className="flex items-center justify-center gap-5 px-8 pb-6 pt-4">
          <button
            type="button"
            onClick={() => router.push('/pwa/wayfinding')}
            className="flex-1 rounded-[4px] border-[1.5px] py-[10px] text-center text-[12px] font-bold uppercase tracking-wider"
            style={{
              ...OPEN_SANS,
              borderColor: 'hsl(var(--brand-primary))',
              color: 'hsl(var(--brand-primary))',
            }}
          >
            {config.directions.goBack}
          </button>
          <button
            type="button"
            onClick={() => router.push('/pwa/dashboard')}
            className="flex-1 rounded-[4px] py-[10px] text-center text-[12px] font-bold uppercase tracking-wider text-white"
            style={{
              ...OPEN_SANS,
              backgroundColor: 'hsl(var(--brand-primary))',
            }}
          >
            {config.directions.thanks}
          </button>
        </div>
      </div>

      <PwaBottomNav />
    </div>
  );
}
