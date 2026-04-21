import type { SocialPost, SocialSource } from './config';

export interface SocialSourceMeta {
  value: SocialSource;
  label: string;
  /** Color oficial aproximado (no se usa por defecto en UI, útil si el cliente lo quiere). */
  brandColor: string;
}

/** Metadata por red social. Útil para los tabs y para los badges. */
export const SOCIAL_SOURCE_META: Record<SocialSource, SocialSourceMeta> = {
  x: { value: 'x', label: 'X', brandColor: '#000000' },
  instagram: { value: 'instagram', label: 'Instagram', brandColor: '#e1306c' },
  pinterest: { value: 'pinterest', label: 'Pinterest', brandColor: '#e60023' },
  youtube: { value: 'youtube', label: 'YouTube', brandColor: '#ff0000' },
  facebook: { value: 'facebook', label: 'Facebook', brandColor: '#1877f2' },
  tiktok: { value: 'tiktok', label: 'TikTok', brandColor: '#000000' },
};

/** Filtra posts por source. `'all'` = sin filtro. */
export function filterPosts(
  posts: readonly SocialPost[],
  source: SocialSource | 'all',
): SocialPost[] {
  if (source === 'all') return [...posts];
  return posts.filter((p) => p.source === source);
}
