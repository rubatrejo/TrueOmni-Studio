import { notFound } from 'next/navigation';

import { SignagePlaceholder } from '@/components/signage/runtime/SignagePlaceholder';
import { SignageStage } from '@/components/signage/stage/SignageStage';
import { loadSignageClient, loadSignageDisplay } from '@/lib/signage/config';
import { mapWeatherToHeader } from '@/lib/signage/weather-adapter';
import { fetchWeather } from '@/lib/weather';

interface PageProps {
  params: Promise<{ client: string; display: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = 'force-dynamic';

export default async function SignageDisplayPage({ params, searchParams }: PageProps) {
  const { client: clientSlug, display: displaySlug } = await params;
  const search = await searchParams;
  const debug = search?.debug === '1';

  const [clientCfg, displayCfg] = await Promise.all([
    loadSignageClient(clientSlug),
    loadSignageDisplay(clientSlug, displaySlug),
  ]);

  if (!clientCfg || !displayCfg) {
    notFound();
  }

  // Weather server-side (cacheado 10min via Next revalidate). Si falla, header
  // muestra "--°" placeholders sin tirar la página.
  let weatherData = null;
  try {
    weatherData = await fetchWeather(clientCfg.location.lat, clientCfg.location.lon);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[signage] weather fetch falló para ${clientSlug}:`, (err as Error).message);
  }

  const weather = mapWeatherToHeader(
    weatherData,
    clientCfg.locale,
    clientCfg.timezone,
    clientCfg.header.forecastDays,
  );

  return (
    <SignageStage debug={debug}>
      <SignagePlaceholder client={clientCfg} display={displayCfg} weather={weather} />
    </SignageStage>
  );
}
