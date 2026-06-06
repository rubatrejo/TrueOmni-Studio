'use client';

import { useEffect } from 'react';

import { useCurrentLocale } from '@/components/i18n-provider';
import { prewarmAiAvatar } from '@/hooks/use-tavus-conversation';
import type { AskAiSuggestedQuestion } from '@/lib/config';
import { useAiStore } from '@/stores/ai-store';

import { PwaAskAiModal } from './pwa-ask-ai-modal';
import { PwaAskAiTrigger } from './pwa-ask-ai-trigger';

interface PwaAskAiHostProps {
  greeting: string;
  subtitle: string;
  suggestedQuestions: AskAiSuggestedQuestion[];
  fallbackResponse: string;
  clientName: string;
  texts: {
    title: string;
    inputPlaceholder: string;
    ariaOpen: string;
    ariaClose: string;
    ariaSend: string;
    /** Label del botón de micrófono (push-to-talk). Opcional: default en español. */
    ariaMic?: string;
  };
}

/**
 * Punto de entrada del Ask AI mobile (D2). Reutiliza el `useAiStore` agnóstico y el
 * endpoint `/api/ai` (sin Tavus). Hidrata el store con la config del kiosk
 * (`home.askAi`) interpolando `{client_name}`, y vincula el `locale` activo
 * (`useCurrentLocale`) → el backend responde en el idioma seleccionado y el greeting
 * se re-alinea al cambiar de idioma. Monta el trigger flotante + el modal.
 */
export function PwaAskAiHost({
  greeting,
  subtitle,
  suggestedQuestions,
  fallbackResponse,
  clientName,
  texts,
}: PwaAskAiHostProps) {
  const locale = useCurrentLocale();
  const hydrate = useAiStore((s) => s.hydrate);

  const fill = (t: string) => t.replaceAll('{client_name}', clientName);

  useEffect(() => {
    hydrate({
      greeting: fill(greeting),
      suggestedQuestions: suggestedQuestions.map((q) => ({
        ...q,
        text: fill(q.text),
        response: fill(q.response),
      })),
      fallbackResponse: fill(fallbackResponse),
      clientName,
      locale,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrate, greeting, fallbackResponse, clientName, locale]);

  // Pre-warm la conversación Tavus en background poco después de montar, igual
  // que el `ask-ai-host` del kiosk — así el primer open abre casi instantáneo.
  useEffect(() => {
    const t = setTimeout(() => prewarmAiAvatar(clientName), 1500);
    return () => clearTimeout(t);
  }, [clientName]);

  return (
    <>
      <PwaAskAiTrigger ariaLabel={texts.ariaOpen} clientName={clientName} />
      <PwaAskAiModal
        clientName={clientName}
        texts={{
          title: texts.title,
          subtitle: fill(subtitle),
          inputPlaceholder: texts.inputPlaceholder,
          ariaClose: texts.ariaClose,
          ariaSend: texts.ariaSend,
          ariaMic: texts.ariaMic ?? 'Hablar con el asistente',
        }}
      />
    </>
  );
}
