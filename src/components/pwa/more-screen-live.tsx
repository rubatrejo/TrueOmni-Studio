'use client';

import type { PwaMoreConfig, SurveyConfig } from '@/lib/config';

import { MoreScreen } from './more-screen';
import { usePwaSection } from './pwa-bridge-context';

/**
 * Wrapper live del More Menu. Lee el override de `features.pwa.more` (preview en
 * vivo del Studio) y cae al valor del server fuera del Studio. El survey
 * (`features.home.survey`) y el slug siguen viniendo del server. No toca
 * `MoreScreen`.
 */
export function MoreScreenLive({
  more,
  survey,
  clientSlug,
}: {
  more: PwaMoreConfig;
  survey?: SurveyConfig;
  clientSlug?: string;
}) {
  const m = usePwaSection('more', more) ?? more;
  return (
    <MoreScreen
      searchPlaceholder={m.searchPlaceholder}
      weatherText={m.weatherText}
      items={m.items}
      survey={survey}
      clientSlug={clientSlug}
    />
  );
}
