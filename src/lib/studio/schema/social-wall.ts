import { z } from 'zod';

import { ShortIdSchema } from './primitives';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Social Wall                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

export const SOCIAL_SOURCES = [
  'x',
  'instagram',
  'pinterest',
  'youtube',
  'facebook',
  'tiktok',
] as const;
export type SocialSource = (typeof SOCIAL_SOURCES)[number];

export const SOCIAL_POST_TYPES = ['image', 'video', 'text', 'gallery'] as const;
export type SocialPostType = (typeof SOCIAL_POST_TYPES)[number];

export const SocialAuthorSchema = z.object({
  name: z.string().min(1).max(120),
  username: z.string().min(1).max(64),
  avatar: z.string().default(''),
});

export const SocialPostSchema = z.object({
  id: ShortIdSchema,
  source: z.enum(SOCIAL_SOURCES),
  type: z.enum(SOCIAL_POST_TYPES),
  author: SocialAuthorSchema,
  /** ISO date-time. */
  publishedAt: z.string().min(1).max(64),
  caption: z.string().max(2000).default(''),
  mediaUrl: z.string().optional(),
  videoPoster: z.string().optional(),
  galleryUrls: z.array(z.string()).max(20).optional(),
  aspectRatio: z.number().min(0.1).max(10).optional(),
  permalink: z.string().optional(),
});

export const SocialHighlightSchema = z.object({
  id: ShortIdSchema,
  image: z.string().min(1),
  label: z.string().max(64).optional(),
});

export const SocialHandlesSchema = z.object({
  x: z.string().max(64).optional(),
  instagram: z.string().max(64).optional(),
  pinterest: z.string().max(64).optional(),
  youtube: z.string().max(64).optional(),
  facebook: z.string().max(64).optional(),
  tiktok: z.string().max(64).optional(),
});

export const SocialWallSchema = z.object({
  label: z.string().min(1).max(64),
  heroImage: z.string().default(''),
  /** Hashtag sin '#'. */
  hashtag: z.string().max(64).default(''),
  handles: SocialHandlesSchema.optional(),
  highlights: z.array(SocialHighlightSchema).max(50),
  posts: z.array(SocialPostSchema).max(500),
});

export type SocialAuthor = z.infer<typeof SocialAuthorSchema>;
export type SocialPost = z.infer<typeof SocialPostSchema>;
export type SocialHighlight = z.infer<typeof SocialHighlightSchema>;
export type SocialHandles = z.infer<typeof SocialHandlesSchema>;
export type SocialWallConfig = z.infer<typeof SocialWallSchema>;

let _socialIdSeq = 0;
export function newSocialId(prefix = 'sw'): string {
  return `${prefix}-${Date.now().toString(36)}-${++_socialIdSeq}`;
}

export const DEFAULT_SOCIAL_WALL: SocialWallConfig = {
  label: 'Social Wall',
  heroImage: '',
  hashtag: '',
  handles: {},
  highlights: [],
  posts: [],
};

export function makeBlankSocialPost(source: SocialSource): SocialPost {
  return {
    id: newSocialId('post'),
    source,
    type: 'image',
    author: {
      name: 'New author',
      username: 'newuser',
      avatar: '',
    },
    publishedAt: new Date().toISOString(),
    caption: '',
    aspectRatio: 1,
  };
}
