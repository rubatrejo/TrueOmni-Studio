'use client';

import type { ItineraryConfig, KioskConfig } from '@/lib/config';
import { useItineraryRail } from '@/lib/itinerary-favorites';
import type { WeatherData } from '@/lib/weather';

export interface ItineraryBuilderModuleProps {
  config: ItineraryConfig;
  client: KioskConfig['client'];
  textos: Record<string, string>;
  logoSrc: string;
  logoAlt: string;
  weather: WeatherData | null;
}

export function ItineraryBuilderModule(props: ItineraryBuilderModuleProps) {
  const { textos } = props;
  const rail = useItineraryRail();

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="mb-4 text-5xl font-semibold">{textos.itinerary_title}</h1>
        <p className="mb-6 text-xl text-muted-foreground">Phase 3.17 in progress…</p>
        <p className="text-base text-muted-foreground/70">Stops in rail: {rail.count}</p>
      </div>
    </div>
  );
}
