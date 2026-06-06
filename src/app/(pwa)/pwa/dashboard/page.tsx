import { PwaAskAiHost } from '@/components/pwa/ask-ai/pwa-ask-ai-host';
import { DashboardLive } from '@/components/pwa/dashboard-live';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Home/Dashboard de la PWA (`/pwa/dashboard`). Destino del Login/Skip.
 * El contenido (hero, quick-access, tiles) viene de `config.features.pwa.dashboard`.
 */
export default async function PwaDashboardPage() {
  const config = await getConfig();
  const d = config.features?.pwa?.dashboard;
  // Ask AI mobile (D2): reutiliza la config del kiosk (`home.askAi`); cero duplicación.
  const askAi = config.features?.home?.askAi?.enabled ? config.features.home.askAi : null;
  const t = config.textos;

  if (!d) {
    return (
      <MobileCanvas>
        <div className="flex h-full w-full items-center justify-center text-foreground">
          {config.client.nombre}
        </div>
      </MobileCanvas>
    );
  }

  return (
    <MobileCanvas>
      <DashboardLive
        logoAlt={config.branding.logo.alt}
        dashboard={d}
        notifications={config.features?.pwa?.notifications?.seed ?? []}
      />
      {askAi ? (
        <PwaAskAiHost
          greeting={askAi.greeting}
          subtitle={askAi.subtitle ?? t.ai_subtitle ?? ''}
          avatar={askAi.avatar}
          suggestedQuestions={askAi.suggestedQuestions}
          fallbackResponse={t.ai_fallback_response ?? 'I can help with that — let me look into it.'}
          clientName={config.client.nombre}
          texts={{
            title: t.ai_title ?? 'Ask AI',
            inputPlaceholder: t.ai_input_placeholder ?? 'Type your question...',
            ariaOpen: t.ai_aria_open ?? 'Open Ask AI',
            ariaClose: t.ai_aria_close ?? 'Close Ask AI',
            ariaSend: t.ai_aria_send ?? 'Send',
          }}
        />
      ) : null}
    </MobileCanvas>
  );
}
