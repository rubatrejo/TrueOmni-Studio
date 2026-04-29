'use client';

import { useEffect, useState } from 'react';

import { SurveyOverlay } from '@/components/survey/survey-overlay';
import type { SurveyConfig } from '@/lib/config';

/**
 * Host del SurveyOverlay a nivel del KioskCanvas (sibling de HomeShell y
 * AdsSlot) para que su z-index quede por encima de los ads popup/hero/bottom.
 * Escucha el evento `kiosk:survey-open` que dispara CategoryTile via HomeShell.
 *
 * Live preview del Studio: si llega `kiosk:survey-override` con detail nuevo,
 * sustituye el config. Cualquier edit en el SurveyEditor se ve sin recargar.
 */
export function SurveyHost({
  survey,
  client,
}: {
  survey?: SurveyConfig;
  client: { slug: string };
}) {
  const [open, setOpen] = useState(false);
  const [override, setOverride] = useState<SurveyConfig | null>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onOverride = (e: Event) => {
      const detail = (e as CustomEvent<SurveyConfig>).detail;
      if (detail && typeof detail === 'object') setOverride(detail);
    };
    window.addEventListener('kiosk:survey-open', onOpen);
    window.addEventListener('kiosk:survey-override', onOverride);
    return () => {
      window.removeEventListener('kiosk:survey-open', onOpen);
      window.removeEventListener('kiosk:survey-override', onOverride);
    };
  }, []);

  const effective = override ?? survey;
  if (!effective?.enabled || !open) return null;

  return (
    <SurveyOverlay
      config={effective}
      client={client}
      onClose={() => setOpen(false)}
      // Remontar el overlay cuando cambia el override para que el step counter
      // y el state interno reflejen el nuevo set de preguntas.
      key={`survey-${effective.questions.length}-${effective.contactCapture?.enabled ? 1 : 0}`}
    />
  );
}
