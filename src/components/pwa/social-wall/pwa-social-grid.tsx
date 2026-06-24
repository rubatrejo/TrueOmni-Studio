'use client';

import { SocialPostCard } from '@/components/social-wall/social-post-card';
import type { SocialPost } from '@/lib/config';

import { useDevice } from '../device-context';

/**
 * Muro masonry de 2 columnas (PWA). Réplica del grid del kiosk a 2-col vía CSS
 * `column-count`. Reutiliza `SocialPostCard` (ya dimensionada para móvil, con
 * `breakInside: avoid`). El tap en una card abre el lightbox por tipo.
 * Landscape (tablet): 3 columnas para aprovechar el ancho.
 */
export function PwaSocialGrid({
  posts,
  onOpen,
}: {
  posts: SocialPost[];
  onOpen: (post: SocialPost) => void;
}) {
  const { isLandscape } = useDevice();
  return (
    <div style={{ columnCount: isLandscape ? 3 : 2, columnGap: 12, padding: 12 }}>
      {posts.map((p, i) => (
        <SocialPostCard key={`${p.id}-${i}`} post={p} onOpen={onOpen} playButtonSize={42} />
      ))}
    </div>
  );
}
