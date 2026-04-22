'use client';

import { useEffect, useState } from 'react';

import { SurveyOverlay } from '@/components/survey/survey-overlay';
import type { SurveyConfig } from '@/lib/config';

/**
 * Host del SurveyOverlay a nivel del KioskCanvas (sibling de HomeShell y
 * AdsSlot) para que su z-index quede por encima de los ads popup/hero/bottom.
 * Escucha el evento `kiosk:survey-open` que dispara CategoryTile via HomeShell.
 */
export function SurveyHost({
  survey,
  client,
  textos,
}: {
  survey?: SurveyConfig;
  client: { slug: string };
  textos: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('kiosk:survey-open', onOpen);
    return () => window.removeEventListener('kiosk:survey-open', onOpen);
  }, []);

  if (!survey?.enabled || !open) return null;

  return (
    <SurveyOverlay config={survey} client={client} textos={textos} onClose={() => setOpen(false)} />
  );
}
