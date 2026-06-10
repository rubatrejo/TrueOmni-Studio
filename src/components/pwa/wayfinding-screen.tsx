'use client';

import { useState } from 'react';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { PwaWayfindingModuleConfig } from '@/lib/config';

import { PwaBottomNav } from './bottom-nav';
import { S } from './mobile-layer';
import { PwaSubHeader } from './pwa-sub-header';
import { WayfindingAmenityCard } from './wayfinding-amenity-card';
import { WayfindingFloorTabs } from './wayfinding-floor-tabs';
import { WayfindingWelcomeModal } from './wayfinding-welcome-modal';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface WayfindingScreenProps {
  config: PwaWayfindingModuleConfig;
}

export function WayfindingScreen({ config }: WayfindingScreenProps) {
  const [activeFloorKey, setActiveFloorKey] = useState(config.floors[0]?.key ?? '');
  const activeFloor = config.floors.find((f) => f.key === activeFloorKey) ?? config.floors[0];

  if (!activeFloor) return null;

  const floorPlanSrc = resolveAssetUrl(activeFloor.floorPlanImage);

  return (
    <div className="relative flex h-full w-full flex-col bg-white">
      {/* Header brand (escalado) */}
      <div className="relative z-10 shrink-0" style={{ height: 90 * S }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: 375, height: 90, transform: `scale(${S})`, transformOrigin: 'top left' }}
        >
          <PwaSubHeader title={config.title} backHref="/pwa/dashboard" />
        </div>
      </div>

      {/* Contenido scrolleable */}
      <div className="scrollbar-hide flex-1 overflow-y-auto">
        {/* Hero: floor plan + tabs superpuestos */}
        <div className="relative w-full bg-[hsl(var(--pwa-floorplan-bg))]">
          {/* eslint-disable-next-line @next/next/no-img-element -- asset dinámico del cliente; next/image no aplica (src arbitrario en runtime) */}
          <img
            src={floorPlanSrc}
            alt={`${activeFloor.label} floor plan`}
            className="w-full object-cover"
            style={{ height: 200 }}
          />
          {/* Tabs superpuestos en la parte inferior del floor plan */}
          <div className="absolute bottom-0 left-0 right-0">
            <WayfindingFloorTabs
              floors={config.floors}
              activeKey={activeFloorKey}
              onSelect={setActiveFloorKey}
            />
          </div>
        </div>

        {/* Subtitle */}
        <p
          className="px-5 pb-2 pt-3 text-center text-[16px] font-bold"
          style={{ ...OPEN_SANS, color: 'hsl(var(--brand-primary))' }}
        >
          {config.subtitle}
        </p>

        {/* Lista de amenidades */}
        <div className="flex flex-col gap-4 px-4 pb-6 pt-1">
          {activeFloor.amenities.map((a) => (
            <WayfindingAmenityCard key={a.slug} slug={a.slug} name={a.name} image={a.image} />
          ))}
        </div>
      </div>

      {/* Welcome modal (primera visita) */}
      <WayfindingWelcomeModal
        title={config.welcome.title}
        description={config.welcome.description}
        tagline={config.welcome.tagline}
        button={config.welcome.button}
      />

      <PwaBottomNav />
    </div>
  );
}
