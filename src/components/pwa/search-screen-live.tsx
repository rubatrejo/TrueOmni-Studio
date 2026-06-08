'use client';

import type { ComponentProps } from 'react';

import type { PwaSearchConfig } from '@/lib/config';

import { usePwaSection } from './pwa-bridge-context';
import { SearchScreen } from './search-screen';

/**
 * Wrapper live de Search. Si hay override de `features.pwa.search` reconstruye los
 * textos; si no, usa los del server. El índice buscable y el browse vienen del
 * server. No toca `SearchScreen`.
 */
export function SearchScreenLive({
  config,
  ...data
}: ComponentProps<typeof SearchScreen> & {
  config?: PwaSearchConfig;
}) {
  const cfg = usePwaSection('search', config);
  return (
    <SearchScreen
      {...data}
      texts={
        cfg
          ? {
              placeholder: cfg.placeholder,
              recentTitle: cfg.recentTitle,
              browseTitle: cfg.browseTitle,
              clearAll: cfg.clearAll,
              noResults: cfg.noResults,
            }
          : data.texts
      }
    />
  );
}
