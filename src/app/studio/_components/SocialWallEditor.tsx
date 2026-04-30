'use client';

import { Reorder, useDragControls } from 'framer-motion';
import {
  AtSign,
  ChevronDown,
  ChevronRight,
  Copy,
  GripVertical,
  Hash,
  ImagePlus,
  MessageCircle,
  Music,
  PlayCircle,
  Plus,
  Send,
  Star,
  Trash2,
  Type,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

import {
  makeBlankSocialPost,
  newSocialId,
  SOCIAL_POST_TYPES,
  SOCIAL_SOURCES,
  type SocialHandles,
  type SocialHighlight,
  type SocialPost,
  type SocialPostType,
  type SocialSource,
  type SocialWallConfig,
} from '@/lib/studio/schema';

import { ImageField } from './ImageField';

const SOURCE_ICON: Record<SocialSource, LucideIcon> = {
  x: Send,
  instagram: ImagePlus,
  pinterest: Star,
  youtube: PlayCircle,
  facebook: MessageCircle,
  tiktok: Music,
};

const SOURCE_LABEL: Record<SocialSource, string> = {
  x: 'X / Twitter',
  instagram: 'Instagram',
  pinterest: 'Pinterest',
  youtube: 'YouTube',
  facebook: 'Facebook',
  tiktok: 'TikTok',
};

const TYPE_ICON: Record<SocialPostType, LucideIcon> = {
  image: ImagePlus,
  video: Video,
  text: Type,
  gallery: ImagePlus,
};

export function SocialWallEditor({
  socialWall,
  onChange,
}: {
  socialWall: SocialWallConfig;
  onChange: (next: SocialWallConfig) => void;
}) {
  const setHandle = (k: SocialSource, v: string) => {
    const handles: SocialHandles = { ...(socialWall.handles ?? {}) };
    if (v) handles[k] = v;
    else delete handles[k];
    onChange({ ...socialWall, handles });
  };

  const setHighlights = (list: SocialHighlight[]) =>
    onChange({ ...socialWall, highlights: list });

  const updateHighlight = (id: string, patch: Partial<SocialHighlight>) =>
    setHighlights(
      socialWall.highlights.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    );

  const removeHighlight = (id: string) =>
    setHighlights(socialWall.highlights.filter((h) => h.id !== id));

  const addHighlight = () =>
    setHighlights([
      ...socialWall.highlights,
      { id: newSocialId('hl'), image: '', label: '' },
    ]);

  const setPosts = (list: SocialPost[]) => onChange({ ...socialWall, posts: list });

  const updatePost = (id: string, patch: Partial<SocialPost>) =>
    setPosts(socialWall.posts.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const removePost = (id: string) => setPosts(socialWall.posts.filter((p) => p.id !== id));

  const clonePost = (id: string) => {
    const idx = socialWall.posts.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const orig = socialWall.posts[idx];
    const copy: SocialPost = { ...orig, id: newSocialId('post') };
    setPosts([
      ...socialWall.posts.slice(0, idx + 1),
      copy,
      ...socialWall.posts.slice(idx + 1),
    ]);
  };

  const addPost = (source: SocialSource) =>
    setPosts([...socialWall.posts, makeBlankSocialPost(source)]);

  const enabledSources = SOCIAL_SOURCES.filter((s) => Boolean(socialWall.handles?.[s]));

  return (
    <div className="space-y-7">
      {/* Module */}
      <Group title="Module" hint="Hero, hashtag, and Preview button.">
        <Field label="Label">
          <input
            value={socialWall.label}
            onChange={(e) => onChange({ ...socialWall, label: e.target.value })}
            className={inputCls}
            maxLength={64}
          />
        </Field>
        <Field label="Hashtag (without #)">
          <div className="flex items-center gap-1.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <Hash className="h-4 w-4" />
            </span>
            <input
              value={socialWall.hashtag}
              onChange={(e) =>
                onChange({ ...socialWall, hashtag: e.target.value.replace(/^#/, '') })
              }
              placeholder="visitarizona"
              className={inputCls}
              maxLength={64}
            />
          </div>
        </Field>
        <ImageField
          layout="compact"
          label="Hero image"
          hint="Header background · 1080×~600 · JPG/PNG"
          value={socialWall.heroImage || undefined}
          onChange={(v) => onChange({ ...socialWall, heroImage: v ?? '' })}
          accept="image/jpeg,image/png,image/webp"
          maxBytes={1.5 * 1024 * 1024}
        />
      </Group>

      {/* Handles */}
      <Group
        title="Connected handles"
        hint="Adding a handle enables its tab. Empty = the tab disappears from the kiosk."
      >
        <div className="space-y-1.5">
          {SOCIAL_SOURCES.map((s) => {
            const Icon = SOURCE_ICON[s];
            const value = socialWall.handles?.[s] ?? '';
            return (
              <div
                key={s}
                className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900/40"
              >
                <span
                  className={
                    'grid h-9 w-9 shrink-0 place-items-center rounded-md ring-1 ' +
                    (value
                      ? 'bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:text-sky-300'
                      : 'bg-zinc-100 text-zinc-400 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-600 dark:ring-zinc-800')
                  }
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11.5px] font-medium text-zinc-700 dark:text-zinc-300">
                    {SOURCE_LABEL[s]}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[10.5px] text-zinc-500 dark:text-zinc-500">
                    <AtSign className="h-2.5 w-2.5" />
                    <input
                      value={value}
                      onChange={(e) => setHandle(s, e.target.value.replace(/^@/, ''))}
                      placeholder={`handle for ${SOURCE_LABEL[s]}`}
                      className="w-full bg-transparent outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                      maxLength={64}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Group>

      {/* Highlights */}
      <Group
        title="Highlights"
        hint="Round avatars in the banner above the wall (Instagram-style)."
      >
        {socialWall.highlights.length === 0 ? (
          <EmptyState text="No highlights yet." />
        ) : (
          <Reorder.Group
            axis="y"
            values={socialWall.highlights}
            onReorder={setHighlights}
            className="flex flex-col gap-1.5"
          >
            {socialWall.highlights.map((h) => (
              <HighlightRow
                key={h.id}
                highlight={h}
                onUpdate={(patch) => updateHighlight(h.id, patch)}
                onRemove={() => removeHighlight(h.id)}
              />
            ))}
          </Reorder.Group>
        )}
        {socialWall.highlights.length < 50 && (
          <AddButton label="Add highlight" onClick={addHighlight} />
        )}
      </Group>

      {/* Posts */}
      <section>
        <header className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Posts
            </h3>
            <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
              Drag to reorder · {socialWall.posts.length}/500 posts.
            </p>
          </div>
        </header>

        {socialWall.posts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-6 text-center text-[12px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/20">
            No posts yet. Connect a handle and add your first post.
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={socialWall.posts}
            onReorder={setPosts}
            className="flex flex-col gap-2"
          >
            {socialWall.posts.map((p) => (
              <PostRow
                key={p.id}
                post={p}
                onUpdate={(patch) => updatePost(p.id, patch)}
                onRemove={() => removePost(p.id)}
                onClone={() => clonePost(p.id)}
              />
            ))}
          </Reorder.Group>
        )}

        {/* Add post per source */}
        {enabledSources.length === 0 ? (
          <p className="mt-2 rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
            Connect at least one handle above to add posts.
          </p>
        ) : (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {enabledSources.map((s) => {
              const Icon = SOURCE_ICON[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => addPost(s)}
                  className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-zinc-300 bg-white px-2 py-2 text-[11.5px] font-medium text-zinc-600 transition hover:border-sky-500/40 hover:bg-sky-500/5 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-sky-500/5 dark:hover:text-sky-300"
                >
                  <Plus className="h-3 w-3" />
                  <Icon className="h-3.5 w-3.5" />
                  {SOURCE_LABEL[s]}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Highlight row                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

function HighlightRow({
  highlight,
  onUpdate,
  onRemove,
}: {
  highlight: SocialHighlight;
  onUpdate: (patch: Partial<SocialHighlight>) => void;
  onRemove: () => void;
}) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      value={highlight}
      dragListener={false}
      dragControls={dragControls}
      className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2 transition hover:border-zinc-300 dark:border-zinc-900 dark:bg-zinc-900/40"
    >
      <button
        type="button"
        onPointerDown={(e) => dragControls.start(e)}
        className="grid h-7 w-5 shrink-0 cursor-grab place-items-center text-zinc-400 transition hover:text-zinc-600 active:cursor-grabbing dark:text-zinc-600 dark:hover:text-zinc-300"
        aria-label="Drag highlight"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="grid h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        {highlight.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={highlight.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-zinc-400">
            <ImagePlus className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
      <div className="flex flex-1 gap-2">
        <ImageField
          layout="compact"
          label="Avatar"
          hint="Square · 1:1"
          value={highlight.image || undefined}
          onChange={(v) => onUpdate({ image: v ?? '' })}
          accept="image/jpeg,image/png,image/webp"
          maxBytes={300 * 1024}
        />
      </div>
      <input
        value={highlight.label ?? ''}
        onChange={(e) => onUpdate({ label: e.target.value || undefined })}
        placeholder="label"
        className={`${inputCls} max-w-[110px]`}
        maxLength={64}
      />
      <button
        type="button"
        onClick={onRemove}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500"
        aria-label="Remove highlight"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </Reorder.Item>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Post row                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function PostRow({
  post,
  onUpdate,
  onRemove,
  onClone,
}: {
  post: SocialPost;
  onUpdate: (patch: Partial<SocialPost>) => void;
  onRemove: () => void;
  onClone: () => void;
}) {
  const dragControls = useDragControls();
  const [expanded, setExpanded] = useState(false);
  const SrcIcon = SOURCE_ICON[post.source];
  const TypeIc = TYPE_ICON[post.type];

  const cover = post.mediaUrl || post.videoPoster || post.galleryUrls?.[0];

  return (
    <Reorder.Item
      value={post}
      dragListener={false}
      dragControls={dragControls}
      className="overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:border-zinc-300 dark:border-zinc-900 dark:bg-zinc-900/40"
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          className="grid h-7 w-5 shrink-0 cursor-grab place-items-center text-zinc-400 transition hover:text-zinc-600 active:cursor-grabbing dark:text-zinc-600 dark:hover:text-zinc-300"
          aria-label="Drag post"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="relative grid h-12 w-12 shrink-0 overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-zinc-400">
              <TypeIc className="h-3.5 w-3.5" />
            </div>
          )}
          <span className="absolute -bottom-px -right-px grid h-5 w-5 place-items-center rounded-tl-md bg-zinc-900/80 text-white">
            <SrcIcon className="h-3 w-3" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[12.5px] font-medium leading-tight text-zinc-800 dark:text-zinc-200">
            {post.author.name || <em className="text-zinc-400">No author</em>}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 truncate text-[10.5px] text-zinc-500 dark:text-zinc-500">
            <span>@{post.author.username || '?'}</span>
            <span>·</span>
            <span className="rounded bg-zinc-100 px-1 font-mono text-[9.5px] uppercase text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              {post.type}
            </span>
            <span>·</span>
            <span className="truncate">{post.caption || 'no caption'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onClone}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-sky-600 dark:hover:bg-zinc-800"
          aria-label="Duplicate"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500"
          aria-label="Remove post"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-900 dark:bg-zinc-900/30">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Source">
              <select
                value={post.source}
                onChange={(e) => onUpdate({ source: e.target.value as SocialSource })}
                className={inputCls}
              >
                {SOCIAL_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {SOURCE_LABEL[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Type">
              <select
                value={post.type}
                onChange={(e) => onUpdate({ type: e.target.value as SocialPostType })}
                className={inputCls}
              >
                {SOCIAL_POST_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Field label="Author name">
              <input
                value={post.author.name}
                onChange={(e) =>
                  onUpdate({ author: { ...post.author, name: e.target.value } })
                }
                className={inputCls}
                maxLength={120}
              />
            </Field>
            <Field label="Username">
              <input
                value={post.author.username}
                onChange={(e) =>
                  onUpdate({
                    author: { ...post.author, username: e.target.value.replace(/^@/, '') },
                  })
                }
                className={inputCls}
                maxLength={64}
              />
            </Field>
            <Field label="Published">
              <input
                value={post.publishedAt}
                onChange={(e) => onUpdate({ publishedAt: e.target.value })}
                className={inputCls}
                placeholder="2026-04-29T10:00:00Z"
                maxLength={64}
              />
            </Field>
          </div>

          <ImageField
            layout="compact"
            label="Author avatar"
            hint="Square · 1:1"
            value={post.author.avatar || undefined}
            onChange={(v) =>
              onUpdate({ author: { ...post.author, avatar: v ?? '' } })
            }
            accept="image/jpeg,image/png,image/webp"
            maxBytes={300 * 1024}
          />

          <Field label="Caption">
            <textarea
              value={post.caption}
              onChange={(e) => onUpdate({ caption: e.target.value })}
              rows={3}
              className={`${inputCls} resize-none`}
              maxLength={2000}
            />
          </Field>

          {(post.type === 'image' || post.type === 'video') && (
            <ImageField
              layout="compact"
              label={post.type === 'image' ? 'Image' : 'Video poster'}
              hint={post.type === 'image' ? 'JPG/PNG' : 'Cover for the video'}
              value={(post.type === 'image' ? post.mediaUrl : post.videoPoster) || undefined}
              onChange={(v) =>
                post.type === 'image'
                  ? onUpdate({ mediaUrl: v })
                  : onUpdate({ videoPoster: v })
              }
              accept="image/jpeg,image/png,image/webp"
              maxBytes={1.5 * 1024 * 1024}
            />
          )}

          {post.type === 'video' && (
            <Field label="Video URL">
              <input
                type="url"
                value={post.mediaUrl ?? ''}
                onChange={(e) => onUpdate({ mediaUrl: e.target.value || undefined })}
                placeholder="https://…/video.mp4"
                className={inputCls}
              />
            </Field>
          )}

          {post.type === 'gallery' && (
            <Field label="Gallery URLs (one per line)">
              <textarea
                value={(post.galleryUrls ?? []).join('\n')}
                onChange={(e) =>
                  onUpdate({
                    galleryUrls: e.target.value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter((s) => s.length > 0)
                      .slice(0, 20),
                  })
                }
                rows={4}
                className={`${inputCls} resize-none font-mono text-[11.5px]`}
                placeholder="https://…/img1.jpg&#10;https://…/img2.jpg"
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Field label="Aspect ratio (w/h)">
              <input
                type="number"
                step={0.01}
                min={0.1}
                max={10}
                value={post.aspectRatio ?? 1}
                onChange={(e) =>
                  onUpdate({
                    aspectRatio: Math.max(0.1, Math.min(10, Number(e.target.value) || 1)),
                  })
                }
                className={inputCls}
              />
            </Field>
            <Field label="Permalink (external)">
              <input
                type="url"
                value={post.permalink ?? ''}
                onChange={(e) => onUpdate({ permalink: e.target.value || undefined })}
                placeholder="https://instagram.com/p/…"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-200 pt-2 dark:border-zinc-800">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-600">
              id · {post.id}
            </span>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-medium text-red-500 transition hover:bg-red-500/10"
            >
              <Trash2 className="h-3 w-3" />
              Delete post
            </button>
          </div>
        </div>
      )}
    </Reorder.Item>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-2.5 text-[12px] font-medium text-zinc-600 transition hover:border-sky-500/40 hover:bg-sky-500/5 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-sky-500/5 dark:hover:text-sky-300"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-4 text-center text-[12px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/20">
      {text}
    </div>
  );
}

const inputCls =
  'w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[12.5px] text-zinc-800 outline-none transition focus:border-sky-500/40 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100';

function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-3">
        <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          {title}
        </h3>
        {hint && <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">{hint}</p>}
      </header>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}
