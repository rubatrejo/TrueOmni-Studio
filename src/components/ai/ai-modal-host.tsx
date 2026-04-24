'use client';

import { useEffect } from 'react';

import { AiModal } from '@/components/ai/ai-modal';
import type { AskAiSuggestedQuestion } from '@/lib/config';
import { useAiStore } from '@/stores/ai-store';

interface AiModalHostProps {
  heroVideoSrc: string;
  greeting: string;
  suggestedQuestions: AskAiSuggestedQuestion[];
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
 */
export function AiModalHost({
  heroVideoSrc,
  greeting,
  suggestedQuestions,
  textos,
}: AiModalHostProps) {
  const hydrate = useAiStore((s) => s.hydrate);

  useEffect(() => {
    hydrate({ greeting, suggestedQuestions });
  }, [hydrate, greeting, suggestedQuestions]);

  return <AiModal heroVideoSrc={heroVideoSrc} textos={textos} />;
}
