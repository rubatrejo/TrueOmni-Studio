import { AdsSlot } from '@/components/ads/ads-slot';
import { AskAiHost } from '@/components/ai/ask-ai-host';
import { HomeHeader } from '@/components/home/header';
import { HomeShell } from '@/components/home/home-shell';
import { SurveyHost } from '@/components/home/survey-host';
import { KioskCanvas } from '@/components/kiosk-canvas';
import { getAdsFromConfig } from '@/lib/ads';
import { resolveAiAssetPath } from '@/lib/ask-ai';
import { getConfig, type HomeTile } from '@/lib/config';

export default async function HomePage() {
  const config = await getConfig();
  const home = config.features?.home;
  if (!home) {
    return (
      <KioskCanvas>
        <div className="p-12 text-center text-xl font-semibold text-gray-700">
          El cliente activo no tiene configurado `features.home`.
        </div>
      </KioskCanvas>
    );
  }
  const ads = getAdsFromConfig(config);
  // Pasamos TODOS los tiles del cliente (incluyendo deshabilitados) + wayfinding
  // como un tile más al final. HomeShell filtra por `enabled` en cliente y
  // permite override desde el Studio (postMessage → kiosk:modules-override).
  const allTiles: HomeTile[] = [...home.tiles];
  if (home.wayfinding) {
    allTiles.push({
      key: 'wayfinding',
      label: home.wayfinding.label,
      enabled: home.wayfinding.enabled,
      image: home.wayfinding.image,
    });
  }
  const askAi = home.askAi?.enabled ? home.askAi : null;
  const interpolateClient = (raw: string) => raw.replaceAll('{client_name}', config.client.nombre);
  const askAiTextos = askAi
    ? {
        title: config.textos.ai_title ?? 'Ask AI',
        subtitle: interpolateClient(askAi.subtitle ?? config.textos.ai_subtitle ?? ''),
        inputPlaceholder: config.textos.ai_input_placeholder ?? 'Type your question...',
        ariaClose: config.textos.ai_aria_close ?? 'Close Ask AI',
        ariaMic: config.textos.ai_aria_mic ?? 'Toggle voice input',
      }
    : null;
  const askAiGreeting = askAi ? interpolateClient(askAi.greeting) : '';
  return (
    <KioskCanvas>
      <HomeShell
        header={<HomeHeader />}
        listings={home.listings}
        allTiles={allTiles}
        survey={home.survey}
      />
      <AdsSlot ads={ads} />
      <SurveyHost survey={home.survey} client={{ slug: config.client.slug }} />
      {askAi && askAiTextos && (
        <AskAiHost
          enabled
          ariaLabel={config.textos.ai_aria_open ?? 'Open Ask AI'}
          avatarSrc={resolveAiAssetPath(askAi.avatar)}
          heroVideoSrc={resolveAiAssetPath(askAi.heroVideo)}
          greeting={askAiGreeting}
          subtitle={askAiTextos.subtitle}
          suggestedQuestions={askAi.suggestedQuestions}
          clientName={config.client.nombre}
          textos={askAiTextos}
          position={{
            right: askAi.position?.right ?? 24,
            bottom: askAi.position?.bottom ?? 24,
            size: askAi.position?.size ?? 82,
            width: askAi.position?.width,
            height: askAi.position?.height,
          }}
        />
      )}
    </KioskCanvas>
  );
}
