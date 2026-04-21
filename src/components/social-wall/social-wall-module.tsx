'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { FloatingHomeButton } from '@/components/listings/floating-home-button';
import type { HomeSocialWallModule, SocialPost, SocialSource } from '@/lib/config';
import { filterPosts } from '@/lib/social-sources';

import { SocialPostGalleryModal } from './social-post-gallery-modal';
import { SocialPostImageModal } from './social-post-image-modal';
import { SocialPostTextModal } from './social-post-text-modal';
import { SocialPostVideoModal } from './social-post-video-modal';
import { SocialWallBanner } from './social-wall-banner';
import { SocialWallGrid } from './social-wall-grid';
import { SocialWallTabs } from './social-wall-tabs';

/**
 * Orquestador del Social Wall.
 *
 * Layout:
 *   - `header` (HomeHeader server-rendered) + overlay `SocialWallBanner` al bottom.
 *   - `SocialWallTabs` (sticky arriba del grid).
 *   - Grid masonry scrollable.
 *   - `FloatingHomeButton`.
 *   - Modales: image / video / text / gallery.
 */
export function SocialWallModule({
  module: mod,
  header,
}: {
  moduleKey: string;
  module: HomeSocialWallModule;
  header: ReactNode;
}) {
  const [activeSource, setActiveSource] = useState<SocialSource | 'all'>('all');
  const [selected, setSelected] = useState<SocialPost | null>(null);

  // Sources disponibles: las keys de `handles` presentes.
  const sources = useMemo<SocialSource[]>(() => {
    const handles = mod.handles ?? {};
    const order: SocialSource[] = ['x', 'instagram', 'pinterest', 'youtube', 'facebook', 'tiktok'];
    return order.filter((s) => Boolean(handles[s]));
  }, [mod.handles]);

  const visiblePosts = useMemo(
    () => filterPosts(mod.posts, activeSource),
    [mod.posts, activeSource],
  );

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: '#f8f8f8' }}
    >
      {/* Hero + banner sobre el hero */}
      <div className="relative" style={{ flexShrink: 0 }}>
        {header}
        <SocialWallBanner highlights={mod.highlights} hashtag={mod.hashtag} />
      </div>

      {/* Tabs (sticky debajo del hero) */}
      <SocialWallTabs sources={sources} active={activeSource} onSelect={setActiveSource} />

      {/* Grid scrollable */}
      <main className="scrollbar-hide relative flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        <SocialWallGrid posts={visiblePosts} onOpen={(p) => setSelected(p)} />
      </main>

      {/* Scroll hint gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0"
        style={{
          height: '120px',
          background:
            'linear-gradient(180deg, rgba(248,248,248,0) 0%, rgba(248,248,248,0.9) 75%, rgba(248,248,248,1) 100%)',
        }}
      />

      <FloatingHomeButton />

      {/* Modales */}
      {selected ? <PostModal post={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

function PostModal({ post, onClose }: { post: SocialPost; onClose: () => void }) {
  switch (post.type) {
    case 'video':
      return <SocialPostVideoModal post={post} onClose={onClose} />;
    case 'text':
      return <SocialPostTextModal post={post} onClose={onClose} />;
    case 'gallery':
      return <SocialPostGalleryModal post={post} onClose={onClose} />;
    case 'image':
    default:
      return <SocialPostImageModal post={post} onClose={onClose} />;
  }
}
