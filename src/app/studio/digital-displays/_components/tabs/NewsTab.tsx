'use client';

import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  SignageNewsConfig,
  SignageNewsItem,
  SignageNewsSource,
} from '@/lib/signage/schema';

import { saveSignageNews } from '../../_lib/save-content';

/**
 * `<NewsTab>` — config de news del theme.
 *
 * Sources:
 *   - manual: array de items editable inline
 *   - rss: URL + maxItems
 *   - api: URL + headers + maxItems
 *
 * Auto-save al KV con debounce 800ms.
 */
export interface NewsTabProps {
  clientSlug: string;
  initialNews: SignageNewsConfig;
}

const SOURCE_KINDS = [
  { value: 'manual', label: 'manual' },
  { value: 'rss', label: 'rss' },
  { value: 'api', label: 'api' },
];

function nextId(): string {
  return `news-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function NewsTab({ clientSlug, initialNews }: NewsTabProps) {
  const [news, setNews] = useState<SignageNewsConfig>(structuredClone(initialNews));
  const [expanded, setExpanded] = useState<string | null>(
    news.source.kind === 'manual' ? news.source.items[0]?.id ?? null : null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    async (next: SignageNewsConfig) => {
      setSaving(true);
      setError(null);
      const res = await saveSignageNews(clientSlug, next);
      if (res.ok) setSavedAt(res.savedAt);
      else setError(res.error);
      setSaving(false);
    },
    [clientSlug],
  );

  function scheduleSave(next: SignageNewsConfig) {
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

  function setData(updater: (prev: SignageNewsConfig) => SignageNewsConfig) {
    setNews((prev) => {
      const next = updater(prev);
      scheduleSave(next);
      return next;
    });
  }

  function changeSourceKind(kind: 'manual' | 'rss' | 'api') {
    setData((prev) => {
      let source: SignageNewsSource;
      if (kind === 'manual') {
        source = { kind: 'manual', items: [] };
      } else if (kind === 'rss') {
        source = { kind: 'rss', url: 'https://example.com/feed.xml' };
      } else {
        source = { kind: 'api', url: 'https://example.com/news' };
      }
      return { ...prev, source };
    });
  }

  function updateRotation(value: number) {
    setData((prev) => ({ ...prev, rotationIntervalSec: value }));
  }

  function updateRssOrApi(patch: Partial<{ url: string; maxItems: number | undefined }>) {
    setData((prev) => {
      if (prev.source.kind === 'manual') return prev;
      return { ...prev, source: { ...prev.source, ...patch } };
    });
  }

  function updateItem(id: string, patch: Partial<SignageNewsItem>) {
    setData((prev) => {
      if (prev.source.kind !== 'manual') return prev;
      const items = prev.source.items.map((i) =>
        i.id === id ? { ...i, ...patch } : i,
      );
      return { ...prev, source: { ...prev.source, items } };
    });
  }

  function removeItem(id: string) {
    setData((prev) => {
      if (prev.source.kind !== 'manual') return prev;
      return {
        ...prev,
        source: {
          ...prev.source,
          items: prev.source.items.filter((i) => i.id !== id),
        },
      };
    });
    if (expanded === id) setExpanded(null);
  }

  function addItem() {
    const id = nextId();
    const item: SignageNewsItem = {
      id,
      title: 'New headline',
      body: 'Body of the news item.',
    };
    setData((prev) => {
      if (prev.source.kind !== 'manual') return prev;
      return {
        ...prev,
        source: { ...prev.source, items: [item, ...prev.source.items] },
      };
    });
    setExpanded(id);
  }

  function moveItem(id: string, dir: -1 | 1) {
    setData((prev) => {
      if (prev.source.kind !== 'manual') return prev;
      const idx = prev.source.items.findIndex((i) => i.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.source.items.length) return prev;
      const arr = [...prev.source.items];
      const [moved] = arr.splice(idx, 1);
      arr.splice(target, 0, moved);
      return { ...prev, source: { ...prev.source, items: arr } };
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h3 className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
          News
        </h3>
        <p className="mt-0.5 text-[12px] text-zinc-500">
          Source feed for the news rotator slide.
        </p>
      </header>

      {/* Source kind selector */}
      <FieldSelect
        label="Source kind"
        value={news.source.kind}
        options={SOURCE_KINDS}
        onChange={(v) => changeSourceKind(v as 'manual' | 'rss' | 'api')}
      />

      <FieldNumber
        label="Rotation (s)"
        value={news.rotationIntervalSec}
        min={2}
        max={60}
        onChange={updateRotation}
      />

      {/* Source-specific config */}
      {news.source.kind === 'rss' ? (
        <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
          <FieldText
            label="RSS URL"
            value={news.source.url}
            onChange={(v) => updateRssOrApi({ url: v })}
          />
          <FieldNumberOptional
            label="Max items"
            value={news.source.maxItems}
            min={1}
            max={50}
            onChange={(v) => updateRssOrApi({ maxItems: v })}
          />
        </section>
      ) : null}

      {news.source.kind === 'api' ? (
        <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
          <FieldText
            label="API URL"
            value={news.source.url}
            onChange={(v) => updateRssOrApi({ url: v })}
          />
          <FieldNumberOptional
            label="Max items"
            value={news.source.maxItems}
            min={1}
            max={50}
            onChange={(v) => updateRssOrApi({ maxItems: v })}
          />
        </section>
      ) : null}

      {news.source.kind === 'manual' ? (
        <>
          <div className="flex items-center justify-between">
            <h4 className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
              Items ({news.source.items.length})
            </h4>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Add item
            </button>
          </div>
          {news.source.items.length === 0 ? (
            <button
              type="button"
              onClick={addItem}
              className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center transition hover:border-sky-400 hover:bg-sky-50/50 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
                No news items yet
              </p>
            </button>
          ) : (
            <ul className="flex flex-col gap-2">
              {news.source.items.map((item, idx) => {
                const isOpen = expanded === item.id;
                return (
                  <li
                    key={item.id}
                    className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex items-center gap-2 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : item.id)}
                        className="flex flex-1 items-center gap-2 text-left"
                      >
                        {isOpen ? (
                          <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                        )}
                        <span className="truncate text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                          {item.title || '(untitled)'}
                        </span>
                      </button>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          title="Move up"
                          disabled={idx === 0}
                          onClick={() => moveItem(item.id, -1)}
                          className="grid h-6 w-6 place-items-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Move down"
                          disabled={
                            news.source.kind === 'manual'
                              ? idx === news.source.items.length - 1
                              : true
                          }
                          onClick={() => moveItem(item.id, 1)}
                          className="grid h-6 w-6 place-items-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => removeItem(item.id)}
                          className="grid h-6 w-6 place-items-center rounded text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {isOpen ? (
                      <div className="flex flex-col gap-3 border-t border-zinc-100 px-3 py-3 dark:border-zinc-900">
                        <FieldText
                          label="Title"
                          value={item.title}
                          onChange={(v) => updateItem(item.id, { title: v })}
                        />
                        <FieldTextarea
                          label="Body"
                          value={item.body}
                          onChange={(v) => updateItem(item.id, { body: v })}
                        />
                        <FieldText
                          label="Source"
                          value={item.source ?? ''}
                          placeholder="(optional)"
                          onChange={(v) =>
                            updateItem(item.id, { source: v || undefined })
                          }
                        />
                        <FieldText
                          label="URL"
                          value={item.url ?? ''}
                          placeholder="https://..."
                          onChange={(v) =>
                            updateItem(item.id, { url: v || undefined })
                          }
                        />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : null}

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

// ---------------------------------------------------------------------------

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

function FieldNumber({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 font-mono text-[12.5px] text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
      />
    </label>
  );
}

function FieldNumberOptional({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number | undefined;
  min?: number;
  max?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <input
        type="number"
        value={value ?? ''}
        min={min}
        max={max}
        placeholder="(optional)"
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? undefined : Number(v));
        }}
        className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 font-mono text-[12.5px] text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
      />
    </label>
  );
}
