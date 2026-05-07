import { notFound } from 'next/navigation';

import { SignageBridge } from '@/components/signage/runtime/SignageBridge';
import { SignageBridgeStyleApplier } from '@/components/signage/runtime/SignageBridgeStyleApplier';
import { SignageRuntime } from '@/components/signage/runtime/SignageRuntime';
import { SignageStage } from '@/components/signage/stage/SignageStage';
import { loadSignageClient, loadSignageDisplay } from '@/lib/signage/config';
import { loadSignageI18n } from '@/lib/signage/i18n';
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

  // i18n bag + weather en paralelo (server-side, cached).
  const [i18nBag, weatherData] = await Promise.all([
    loadSignageI18n(clientCfg.slug, clientCfg.locale),
    fetchWeather(clientCfg.location.lat, clientCfg.location.lon).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.warn(`[signage] weather fetch falló para ${clientSlug}:`, (err as Error).message);
      return null;
    }),
  ]);

  const weather = mapWeatherToHeader(
    weatherData,
    clientCfg.locale,
    clientCfg.timezone,
    clientCfg.header.forecastDays,
  );

  return (
    <SignageStage debug={debug}>
      <SignageBridge clientSlug={clientCfg.slug} displaySlug={displayCfg.slug} />
      <SignageBridgeStyleApplier />
      <SignageRuntime
        client={clientCfg}
        display={displayCfg}
        weather={weather}
        i18nBag={i18nBag}
      />
    </SignageStage>
  );
}
