'use client';

import { useMemo } from 'react';

import type { SocialPost } from '@/lib/config';

import { SocialPostCard } from './social-post-card';

/**
 * Mínimo de posts a renderizar en el grid para que el masonry no termine con
 * espacios vacíos al final del scroll. Si el cliente tiene menos, el array
 * se repite con ids sufijados para mantener keys únicos.
 */
const MIN_POSTS = 48;

/** Fisher-Yates con PRNG simple para orden determinista en cada repetición. */
function seededShuffle<T>(arr: readonly T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Grid masonry de 3 columnas usando CSS columns.
 *
 * `column-count: 3` + `break-inside: avoid` en cada card rellena las columnas
 * de forma natural, respetando el aspectRatio de cada media. Sin librerías.
 */
export function SocialWallGrid({
  posts,
  onOpen,
}: {
  posts: readonly SocialPost[];
  onOpen: (post: SocialPost) => void;
}) {
  const padded = useMemo<SocialPost[]>(() => {
    if (posts.length === 0) return [];
    const factor = Math.max(1, Math.ceil(MIN_POSTS / posts.length));
    const out: SocialPost[] = [];
    for (let i = 0; i < factor; i++) {
      const batch = i === 0 ? [...posts] : seededShuffle(posts, i * 31 + 7);
      batch.forEach((p, idx) => {
        out.push(i === 0 ? p : { ...p, id: `${p.id}-r${i}-${idx}` });
      });
    }
    return out;
  }, [posts]);

  if (posts.length === 0) {
    return (
      <div
        className="flex items-start justify-center"
        style={{ padding: '80px 40px', color: '#6e6e6e' }}
      >
        <span
          className="font-sans"
          style={{ fontSize: '20px', lineHeight: '26px', fontWeight: 500 }}
        >
          No posts to show yet.
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '16px 20px 40px 20px',
        columnCount: 3,
        columnGap: '16px',
      }}
    >
      {padded.map((post) => (
        <SocialPostCard key={post.id} post={post} onOpen={onOpen} />
      ))}
    </div>
  );
}
