import { AdsSlot } from '@/components/ads/ads-slot';
import { AiModalHost } from '@/components/ai/ai-modal-host';
import { AskAiTrigger } from '@/components/ai/ask-ai-trigger';
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
  const tiles: HomeTile[] = home.tiles.filter((t) => t.enabled);
  if (home.wayfinding?.enabled) {
    tiles.push({
      key: 'wayfinding',
      label: home.wayfinding.label,
      enabled: true,
      image: home.wayfinding.image,
    });
  }
  const askAi = home.askAi?.enabled ? home.askAi : null;
  const askAiTextos = askAi
    ? {
        title: config.textos.ai_title ?? 'Ask AI',
        subtitle: askAi.subtitle ?? config.textos.ai_subtitle ?? '',
        inputPlaceholder: config.textos.ai_input_placeholder ?? 'Type your question...',
        ariaClose: config.textos.ai_aria_close ?? 'Close Ask AI',
        ariaMic: config.textos.ai_aria_mic ?? 'Toggle voice input',
      }
    : null;
  return (
    <KioskCanvas>
      <HomeShell
        header={<HomeHeader />}
        listings={home.listings}
        tiles={tiles}
        survey={home.survey}
      />
      <AdsSlot ads={ads} />
      <SurveyHost
        survey={home.survey}
        client={{ slug: config.client.slug }}
        textos={config.textos}
      />
      {askAi && askAiTextos && (
        <>
          <AskAiTrigger
            avatarSrc={resolveAiAssetPath(askAi.avatar)}
            ariaLabel={config.textos.ai_aria_open ?? 'Open Ask AI'}
            size={askAi.position?.size ?? 82}
            width={askAi.position?.width}
            height={askAi.position?.height}
            position={{
              right: askAi.position?.right ?? 24,
              bottom: askAi.position?.bottom ?? 24,
            }}
          />
          <AiModalHost
            heroVideoSrc={resolveAiAssetPath(askAi.heroVideo)}
            greeting={askAi.greeting}
            suggestedQuestions={askAi.suggestedQuestions}
            textos={askAiTextos}
          />
        </>
      )}
    </KioskCanvas>
  );
}
