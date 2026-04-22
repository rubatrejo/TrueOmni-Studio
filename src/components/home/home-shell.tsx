'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import { SurveyOverlay } from '@/components/survey/survey-overlay';
import type { HomeListing, HomeTile, SurveyConfig } from '@/lib/config';

import { CategoryGrid } from './category-grid';
import { SearchBar } from './search-bar';
import { SearchOverlay } from './search-overlay';

/**
 * Shell client-side del Home. Manda el estado de los overlays (search + survey)
 * y renderiza el grid internamente para poder inyectar el callback del survey
 * sin pasar funciones desde el Server Component padre.
 */
export function HomeShell({
  header,
  listings,
  tiles,
  survey,
  client,
  textos,
}: {
  header: ReactNode;
  listings: readonly HomeListing[];
  tiles: readonly HomeTile[];
  survey?: SurveyConfig;
  client: { slug: string; logo?: string };
  textos: Record<string, string>;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);

  const openSurvey = survey?.enabled ? () => setSurveyOpen(true) : undefined;

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: '#f8f8f8' }}
    >
      {header}
      <SearchBar onOpen={() => setSearchOpen(true)} />
      <main
        className="scrollbar-hide flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ paddingTop: '40px', paddingBottom: '120px' }}
      >
        <CategoryGrid tiles={tiles} onSurveyTap={openSurvey} />
      </main>
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-20"
        style={{
          height: '180px',
          background:
            'linear-gradient(to top, #f8f8f8 0%, rgba(248,248,248,0.85) 30%, rgba(248,248,248,0) 100%)',
        }}
      />
      {searchOpen ? (
        <SearchOverlay listings={listings} onClose={() => setSearchOpen(false)} />
      ) : null}
      {surveyOpen && survey ? (
        <SurveyOverlay
          config={survey}
          client={client}
          textos={textos}
          onClose={() => setSurveyOpen(false)}
        />
      ) : null}
    </div>
  );
}
