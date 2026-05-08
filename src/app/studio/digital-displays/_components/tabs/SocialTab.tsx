'use client';

import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  SignageFeaturedTweet,
  SignageSocialData,
  SignageSocialPost,
} from '@/lib/signage/schema';

import { saveSignageSocial } from '../../_lib/save-content';
import { SignageMediaField } from '../display/modules/SignageMediaField';

/**
 * `<SocialTab>` — CRUD inline de social posts + featuredTweet.
 *
 * Social data vive a nivel cliente. Auto-save al KV con debounce 800ms.
 * Reload del iframe del preview es necesario para ver cambios (los posts
 * se renderizan en SSR, no via bridge).
 */
export interface SocialTabProps {
  clientSlug: string;
  initialSocial: SignageSocialData;
}

const NETWORKS_POST = [
  { value: '', label: '(any)' },
  { value: 'instagram', label: 'instagram' },
  { value: 'tiktok', label: 'tiktok' },
  { value: 'facebook', label: 'facebook' },
  { value: 'x', label: 'x' },
];

const NETWORKS_TWEET = [
  { value: 'x', label: 'x' },
  { value: 'instagram', label: 'instagram' },
  { value: 'facebook', label: 'facebook' },
  { value: 'tiktok', label: 'tiktok' },
];

function nextId(): string {
  return `post-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function SocialTab({ clientSlug, initialSocial }: SocialTabProps) {
  const [social, setSocial] = useState<SignageSocialData>({
    ...initialSocial,
    posts: [...(initialSocial.posts ?? [])],
  });
  const [expanded, setExpanded] = useState<string | null>(
    social.posts[0]?.id ?? null,
  );
  const [showFeaturedForm, setShowFeaturedForm] = useState(
    Boolean(social.featuredTweet),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    async (next: SignageSocialData) => {
      setSaving(true);
      setError(null);
      const res = await saveSignageSocial(clientSlug, next);
      if (res.ok) setSavedAt(res.savedAt);
      else setError(res.error);
      setSaving(false);
    },
    [clientSlug],
  );

  function scheduleSave(next: SignageSocialData) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persist(next);
    }, 800);
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function setData(updater: (prev: SignageSocialData) => SignageSocialData) {
    setSocial((prev) => {
      const next = updater(prev);
      scheduleSave(next);
      return next;
    });
  }

  function updatePost(id: string, patch: Partial<SignageSocialPost>) {
    setData((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }

  function removePost(id: string) {
    setData((prev) => ({
      ...prev,
      posts: prev.posts.filter((p) => p.id !== id),
    }));
    if (expanded === id) setExpanded(null);
  }

  function addPost() {
    const id = nextId();
    const post: SignageSocialPost = {
      id,
      author: 'New author',
    };
    setData((prev) => ({
      ...prev,
      posts: [post, ...prev.posts],
    }));
    setExpanded(id);
  }

  function movePost(id: string, dir: -1 | 1) {
    setData((prev) => {
      const idx = prev.posts.findIndex((p) => p.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.posts.length) return prev;
      const arr = [...prev.posts];
      const [moved] = arr.splice(idx, 1);
      arr.splice(target, 0, moved);
      return { ...prev, posts: arr };
    });
  }

  function updateFeatured(patch: Partial<SignageFeaturedTweet>) {
    setData((prev) => {
      const current: SignageFeaturedTweet =
        prev.featuredTweet ?? {
          id: 'featured-tweet',
          author: '',
          body: '',
          network: 'x',
        };
      return { ...prev, featuredTweet: { ...current, ...patch } };
    });
  }

  function removeFeatured() {
    setData((prev) => {
      const next = { ...prev };
      delete next.featuredTweet;
      return next;
    });
    setShowFeaturedForm(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
            Social
          </h3>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            {social.posts.length} post{social.posts.length === 1 ? '' : 's'} · shared across every display
          </p>
        </div>
        <button
          type="button"
          onClick={addPost}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Add post
        </button>
      </header>

      {social.posts.length === 0 ? (
        <button
          type="button"
          onClick={addPost}
          className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center transition hover:border-sky-400 hover:bg-sky-50/50 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
            No posts yet
          </p>
        </button>
      ) : (
        <ul className="flex flex-col gap-2">
          {social.posts.map((p, idx) => {
            const isOpen = expanded === p.id;
            return (
              <li
                key={p.id}
                className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : p.id)}
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    {isOpen ? (
                      <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                    )}
                    <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                      {p.author || '(no author)'}
                    </span>
                    {p.network ? (
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:bg-zinc-900">
                        {p.network}
                      </span>
                    ) : null}
                  </button>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      title="Move up"
                      disabled={idx === 0}
                      onClick={() => movePost(p.id, -1)}
                      className="grid h-6 w-6 place-items-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Move down"
                      disabled={idx === social.posts.length - 1}
                      onClick={() => movePost(p.id, 1)}
                      className="grid h-6 w-6 place-items-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete post"
                      onClick={() => removePost(p.id)}
                      className="grid h-6 w-6 place-items-center rounded text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {isOpen ? (
                  <div className="flex flex-col gap-3 border-t border-zinc-100 px-3 py-3 dark:border-zinc-900">
                    <FieldText
                      label="Author"
                      value={p.author}
                      onChange={(v) => updatePost(p.id, { author: v })}
                    />
                    <FieldSelect
                      label="Network"
                      value={p.network ?? ''}
                      options={NETWORKS_POST}
                      onChange={(v) =>
                        updatePost(p.id, {
                          network: (v || undefined) as SignageSocialPost['network'],
                        })
                      }
                    />
                    <FieldTextarea
                      label="Caption"
                      value={p.caption ?? ''}
                      onChange={(v) =>
                        updatePost(p.id, { caption: v || undefined })
                      }
                    />
                    <SignageMediaField
                      label="Image"
                      hint="Imagen del post (path o URL)."
                      aspect="1/1"
                      kind="image"
                      value={p.image ?? ''}
                      onChange={(next) =>
                        updatePost(p.id, { image: next?.src || undefined })
                      }
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {/* Featured Tweet */}
      <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <header className="flex items-center justify-between gap-2 px-3 py-2">
          <div>
            <h4 className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
              Featured tweet
            </h4>
            <p className="text-[11px] text-zinc-500">
              Highlighted single quote shown on social slides.
            </p>
          </div>
          {social.featuredTweet ? (
            <button
              type="button"
              onClick={removeFeatured}
              className="text-[11.5px] text-red-600 hover:underline dark:text-red-400"
            >
              Remove
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowFeaturedForm(true);
                updateFeatured({ author: 'Author' });
              }}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          )}
        </header>
        {showFeaturedForm && social.featuredTweet ? (
          <div className="flex flex-col gap-3 border-t border-zinc-100 px-3 py-3 dark:border-zinc-900">
            <FieldText
              label="Author"
              value={social.featuredTweet.author}
              onChange={(v) => updateFeatured({ author: v })}
            />
            <FieldText
              label="Handle"
              value={social.featuredTweet.handle ?? ''}
              placeholder="@example"
              onChange={(v) => updateFeatured({ handle: v || undefined })}
            />
            <FieldSelect
              label="Network"
              value={social.featuredTweet.network}
              options={NETWORKS_TWEET}
              onChange={(v) =>
                updateFeatured({
                  network: v as SignageFeaturedTweet['network'],
                })
              }
            />
            <FieldTextarea
              label="Body"
              value={social.featuredTweet.body}
              onChange={(v) => updateFeatured({ body: v })}
            />
            <FieldText
              label="Hashtag"
              value={social.featuredTweet.hashtag ?? ''}
              placeholder="#optional"
              onChange={(v) =>
                updateFeatured({ hashtag: v || undefined })
              }
            />
            <SignageMediaField
              label="Avatar"
              hint="Avatar circular del autor (path o URL)."
              aspect="1/1"
              kind="image"
              value={social.featuredTweet.avatar ?? ''}
              onChange={(next) =>
                updateFeatured({ avatar: next?.src || undefined })
              }
            />
          </div>
        ) : null}
      </section>

      <footer className="flex items-center gap-3 text-[11.5px] text-zinc-500">
        {saving ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving…
          </span>
        ) : error ? (
          <span className="text-red-600 dark:text-red-400">⚠ {error}</span>
        ) : savedAt ? (
          <span>Saved {new Date(savedAt).toLocaleTimeString()}</span>
        ) : (
          <span>Idle · auto-saves 800ms after last edit</span>
        )}
      </footer>
    </div>
  );
}

function FieldText({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[12.5px] text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
      />
    </label>
  );
}

function FieldTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <textarea
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[12.5px] text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
      />
    </label>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[12.5px] text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
