import { ItineraryBuilderModule } from '@/components/itinerary/itinerary-builder-module';
import { KioskCanvas } from '@/components/kiosk-canvas';
import { getConfig } from '@/lib/config';
import { fetchWeather } from '@/lib/weather';

export default async function ItineraryBuilderPage() {
  const config = await getConfig();
  const itinerary = config.features?.home?.itinerary;

  if (!itinerary || !itinerary.enabled) {
    return (
      <KioskCanvas>
        <div className="absolute inset-0 flex items-center justify-center p-12 text-center text-xl font-semibold text-muted-foreground">
          {config.textos.itinerary_disabled ??
            'Itinerary Builder is not configured for the active client.'}
        </div>
      </KioskCanvas>
    );
  }

  const coords = config.client.coords;
  const weather = await fetchWeather(coords?.lat, coords?.lng);

  return (
    <KioskCanvas>
      <ItineraryBuilderModule
        config={itinerary}
        client={config.client}
        textos={config.textos}
        logoSrc={config.branding.logo.default}
        logoAlt={config.branding.logo.alt ?? config.client.nombre}
        weather={weather}
        mapboxToken={config.integraciones?.mapbox_token}
      />
    </KioskCanvas>
  );
}
