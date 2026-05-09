'use client';

import { useEffect, useMemo, useState } from 'react';

import { AiModal } from '@/components/ai/ai-modal';
import { useTextos } from '@/components/i18n-provider';
import { KIOSK_CLIENT_NAME_OVERRIDE_EVENT, getCachedClientName } from '@/components/studio-bridge';
import type { AskAiSuggestedQuestion } from '@/lib/config';
import { useAiStore } from '@/stores/ai-store';
import { useLocaleStore } from '@/stores/locale-store';

interface AiModalHostProps {
  heroVideoSrc: string;
  /** Greeting del config (con `{client_name}` sin interpolar). Fallback si la
   *  key `ai_greeting` no existe en el i18n del cliente activo. */
  greeting: string;
  suggestedQuestions: AskAiSuggestedQuestion[];
  /** Nombre del cliente para interpolar `{client_name}` en greeting/subtitle. */
  clientName: string;
  /** Contexto adicional del kiosk (ciudad, módulos activos) — enviado al
   *  endpoint `/api/ai` como parte del system prompt. Construye el server. */
  kioskContext?: string;
  textos: {
    title: string;
    subtitle: string;
    inputPlaceholder: string;
    ariaClose: string;
    ariaMic: string;
  };
}

/**
 * Hidrata el `useAiStore` con la data del cliente activo y monta el AiModal
 * a nivel del KioskCanvas. Sigue el mismo patrón que `SurveyHost` (sibling
 * de HomeShell + AdsSlot) para que su z-index quede por encima.
 *
 * Greeting y suggestedQuestions se traducen del i18n del cliente cuando
 * existen las keys (`ai_greeting`, `ai_suggested_q_<id>_text|response`);
 * si no, fallback al config. El hydrate se re-dispara al cambiar locale
 * para que el cambio sea inmediato.
 */
export function AiModalHost({
  heroVideoSrc,
  greeting,
  suggestedQuestions,
  clientName,
  kioskContext = '',
  textos,
}: AiModalHostProps) {
  const t = useTextos();
  const hydrate = useAiStore((s) => s.hydrate);
  const currentLocale = useLocaleStore((s) => s.currentLocale);

  // Reactive client name: cuando el bridge del Studio dispatcha
  // `kiosk:client-name-override`, actualizamos el state local para que
  // el preview refleje el nombre del kiosk en edición sin esperar a
  // publish. En kiosk runtime normal (sin Studio) nunca llega y queda
  // con `clientName` del prop (= server-rendered).
  const [reactiveClientName, setReactiveClientName] = useState(
    () => getCachedClientName() ?? clientName,
  );
  useEffect(() => {
    const onOverride = (event: Event) => {
      const detail = (event as CustomEvent<{ clientName?: string }>).detail;
      if (detail?.clientName) setReactiveClientName(detail.clientName);
    };
    window.addEventListener(KIOSK_CLIENT_NAME_OVERRIDE_EVENT, onOverride);
    return () => window.removeEventListener(KIOSK_CLIENT_NAME_OVERRIDE_EVENT, onOverride);
  }, []);

  // Greeting reactivo al locale (con interpolación cliente del client_name).
  const localizedGreeting = useMemo(() => {
    const raw = t('ai_greeting');
    const base = raw === 'ai_greeting' ? greeting : raw;
    return base.replaceAll('{client_name}', reactiveClientName);
  }, [greeting, reactiveClientName, t]);

  // Suggested questions con override por id si existe la key i18n.
  const localizedQuestions = useMemo<AskAiSuggestedQuestion[]>(() => {
    return suggestedQuestions.map((q) => {
      const textKey = `ai_suggested_q_${q.id}_text`;
      const respKey = `ai_suggested_q_${q.id}_response`;
      const localizedText = t(textKey);
      const localizedResp = t(respKey);
      return {
        ...q,
        text: localizedText === textKey ? q.text : localizedText,
        response: localizedResp === respKey ? q.response : localizedResp,
      };
    });
  }, [suggestedQuestions, t]);

  // Fallback response cuando ninguna suggested question matchea — tokenizado
  // a `ai_fallback_response`. Si la key no existe, fallback al literal en
  // inglés (manteniendo retrocompat con clientes que aún no la definen).
  const localizedFallback = useMemo(() => {
    const raw = t('ai_fallback_response');
    return raw === 'ai_fallback_response'
      ? 'I can help with that! Let me look into it for you.'
      : raw;
  }, [t]);

  useEffect(() => {
    hydrate({
      greeting: localizedGreeting,
      suggestedQuestions: localizedQuestions,
      fallbackResponse: localizedFallback,
      clientName: reactiveClientName,
      locale: currentLocale,
      kioskContext,
    });
  }, [
    hydrate,
    localizedGreeting,
    localizedQuestions,
    localizedFallback,
    reactiveClientName,
    currentLocale,
    kioskContext,
  ]);

  return <AiModal heroVideoSrc={heroVideoSrc} textos={textos} clientName={reactiveClientName} />;
}
