import { notFound } from 'next/navigation';

import { SignageBridge } from '@/components/signage/runtime/SignageBridge';
import { SignageBridgeStyleApplier } from '@/components/signage/runtime/SignageBridgeStyleApplier';
import { SignageRuntime } from '@/components/signage/runtime/SignageRuntime';
import { SignageStage } from '@/components/signage/stage/SignageStage';
import { loadSignageClient, loadSignageDisplay } from '@/lib/signage/config';
import { loadSignageI18n } from '@/lib/signage/i18n';
import { SIGNAGE_ORIENTATIONS, type SignageOrientation } from '@/lib/signage/schema';
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

  // Orientation efectiva: query param > defaultOrientation del display. El
  // query permite que el operador físico instale la URL `?orientation=portrait`
  // en un TV portrait y la URL plain en un TV landscape, ambas pintando el
  // mismo display config con sus templates pixel-perfect respectivos. El
  // bridge del editor overridea desde el cliente vía `displayPatch` y se
  // resuelve dentro del Stage (server-side aquí sólo seteamos el valor
  // inicial). Valores inválidos caen al default sin warning.
  const queryOrientationRaw = Array.isArray(search?.orientation)
    ? search.orientation[0]
    : search?.orientation;
  const queryOrientation: SignageOrientation | null =
    typeof queryOrientationRaw === 'string' &&
    (SIGNAGE_ORIENTATIONS as readonly string[]).includes(queryOrientationRaw)
      ? (queryOrientationRaw as SignageOrientation)
      : null;
  const initialOrientation: SignageOrientation =
    queryOrientation ?? displayCfg.settings.defaultOrientation ?? 'landscape';

  // i18n bag + weather en paralelo (server-side, cached).
  const [i18nBag, weatherData] = await Promise.all([
    loadSignageI18n(clientCfg.slug, clientCfg.locale),
    fetchWeather(clientCfg.location.lat, clientCfg.location.lon).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.warn(`[signage] weather fetch falló para ${clientSlug}:`, (err as Error).message);
      return null;
    }),
  ]);

  // Siempre pedimos 5 forecast cards al adapter para que el editor pueda
  // alternar entre 1/3/5 días en vivo sin re-fetch. El header slicea según
  // el patch del bridge.
  const weather = mapWeatherToHeader(weatherData, clientCfg.locale, clientCfg.timezone, 5);

  return (
    <SignageStage orientation={initialOrientation} debug={debug}>
      <SignageBridge clientSlug={clientCfg.slug} displaySlug={displayCfg.slug} />
      <SignageBridgeStyleApplier />
      <SignageRuntime
        client={clientCfg}
        display={displayCfg}
        weather={weather}
        i18nBag={i18nBag}
        orientation={initialOrientation}
      />
    </SignageStage>
  );
}
