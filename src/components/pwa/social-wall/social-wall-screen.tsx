'use client';

import { useEffect, useMemo, useState } from 'react';

import type {
  HomeSocialWallModule,
  PwaSocialWallModuleConfig,
  SocialPost,
  SocialSource,
} from '@/lib/config';
import { filterPosts } from '@/lib/social-sources';

import { PwaBottomNav } from '../bottom-nav';
import { S } from '../mobile-layer';
import { PwaSubHeader } from '../pwa-sub-header';

import { PwaSocialGrid } from './pwa-social-grid';
import { PwaSocialHighlights } from './pwa-social-highlights';
import { PwaSocialPostModal } from './pwa-social-post-modal';
import { PwaSocialTabs } from './pwa-social-tabs';

const SOURCE_ORDER: SocialSource[] = [
  'x',
  'instagram',
  'pinterest',
  'youtube',
  'facebook',
  'tiktok',
];

/**
 * Social Wall (`/pwa/social-wall`) — réplica mobile del muro del kiosk. Sub-header
 * + fila de Highlights + #hashtag + tabs por red (derivadas de `handles`) +
 * masonry 2-col (`SocialPostCard` reusado) + lightbox por tipo + bottom nav.
 *
 * White-label: textos desde `config.features.pwa.socialWall`; la data del muro se
 * reutiliza del kiosk (`home.modules['social-wall']`). Misma lógica de filtrado.
 */
export function SocialWallScreen({
  texts,
  mod,
}: {
  texts: PwaSocialWallModuleConfig;
  mod: HomeSocialWallModule;
}) {
  const [activeSource, setActiveSource] = useState<SocialSource | 'all'>('all');
  const [selected, setSelected] = useState<SocialPost | null>(null);

  const sources = useMemo<SocialSource[]>(() => {
    const handles = mod.handles ?? {};
    return SOURCE_ORDER.filter((s) => Boolean(handles[s]));
  }, [mod.handles]);

  useEffect(() => {
    if (activeSource !== 'all' && !sources.includes(activeSource)) setActiveSource('all');
  }, [sources, activeSource]);

  const visible = useMemo(() => filterPosts(mod.posts, activeSource), [mod.posts, activeSource]);

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* Sub-header (375-space escalado) */}
      <div className="relative z-10 shrink-0" style={{ height: 90 * S }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: 375, height: 90, transform: `scale(${S})`, transformOrigin: 'top left' }}
        >
          <PwaSubHeader title={texts.title} />
        </div>
      </div>

      <PwaSocialHighlights
        highlights={mod.highlights}
        hashtag={mod.hashtag}
        highlightsLabel={texts.highlightsLabel}
      />

      <PwaSocialTabs
        sources={sources}
        active={activeSource}
        allLabel={texts.allLabel}
        onSelect={setActiveSource}
      />

      <main className="scrollbar-hide flex-1 overflow-y-auto overflow-x-hidden bg-background">
        <PwaSocialGrid posts={visible} onOpen={setSelected} />
      </main>

      <PwaBottomNav />

      {selected ? <PwaSocialPostModal post={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
