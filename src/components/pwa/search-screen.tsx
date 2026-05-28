'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { resolveAssetUrl } from '@/lib/asset-url';
import { filterSearchIndex, type PwaSearchItem } from '@/lib/pwa-search';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;
const RECENTS_KEY = 'pwa_recent_searches';
const MAX_RECENTS = 6;

interface SearchTexts {
  placeholder: string;
  recentTitle: string;
  browseTitle: string;
  clearAll: string;
  noResults: string;
}

interface SearchScreenProps {
  texts: SearchTexts;
  index: PwaSearchItem[];
  /** Chips de categorías (labels de secciones del dashboard). */
  browse: string[];
}

function Glass({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={18}
      height={18}
      viewBox="0 0 512 512"
      fill="currentColor"
      aria-hidden
    >
      <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
    </svg>
  );
}

/**
 * Search (`/pwa/search`) — abierta desde la lupa del Dashboard. Diseño propio coherente
 * con la PWA: header brand con search-pill (autofocus), estado vacío (Recent + Browse) y
 * resultados en vivo. Búsqueda mock sobre el índice construido desde config (server-side).
 * Recents en sessionStorage; sin backend. Tap en resultado guarda en recents (no-op nav).
 */
export function SearchScreen({ texts, index, browse }: SearchScreenProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    try {
      const raw = sessionStorage.getItem(RECENTS_KEY);
      if (raw) setRecents(JSON.parse(raw) as string[]);
    } catch {
      /* sin recents */
    }
  }, []);

  const persist = (next: string[]) => {
    setRecents(next);
    try {
      sessionStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {
      /* no-op */
    }
  };
  const addRecent = (term: string) => {
    const t = term.trim();
    if (!t) return;
    persist(
      [t, ...recents.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENTS),
    );
  };
  const removeRecent = (term: string) => persist(recents.filter((r) => r !== term));

  const results = useMemo(() => filterSearchIndex(index, query), [index, query]);
  const hasQuery = query.trim().length > 0;

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header brand: back + search-pill */}
      <div className="flex shrink-0 items-center gap-2 bg-[hsl(var(--brand-primary))] px-3 pb-3 pt-11">
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.back()}
          className="flex h-10 w-8 items-center justify-center text-white"
        >
          <svg width={11} height={19} viewBox="0 0 11.87 20.36" fill="#fff" aria-hidden>
            <path d="M.292,10.946a.975.975,0,0,1,0-1.392L9.537.417a1.456,1.456,0,0,1,2.041,0,1.415,1.415,0,0,1,0,2.016L3.669,10.25l7.909,7.815a1.417,1.417,0,0,1,0,2.017,1.456,1.456,0,0,1-2.041,0Z" />
          </svg>
        </button>
        <div className="flex h-11 flex-1 items-center gap-2 rounded-full bg-white px-4 text-foreground/50">
          <Glass />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addRecent(query);
            }}
            placeholder={texts.placeholder}
            className="h-full flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-foreground/45"
            style={OPEN_SANS}
          />
          {hasQuery ? (
            <button
              type="button"
              aria-label="Clear"
              onClick={() => setQuery('')}
              className="text-xl leading-none text-foreground/40"
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div className="scrollbar-hide flex-1 overflow-y-auto">
        {!hasQuery ? (
          <div className="px-5 py-4" style={OPEN_SANS}>
            {recents.length > 0 ? (
              <section className="mb-6">
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="text-xs font-bold tracking-wider text-foreground/45">
                    {texts.recentTitle}
                  </h2>
                  <button
                    type="button"
                    onClick={() => persist([])}
                    className="text-[13px] font-semibold text-[hsl(var(--pwa-primary))]"
                  >
                    {texts.clearAll}
                  </button>
                </div>
                {recents.map((r) => (
                  <div
                    key={r}
                    className="flex items-center gap-3 border-b border-foreground/10 py-3"
                  >
                    <svg
                      width={16}
                      height={16}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      className="text-foreground/40"
                      aria-hidden
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <button
                      type="button"
                      onClick={() => setQuery(r)}
                      className="flex-1 text-left text-[15px] text-foreground"
                    >
                      {r}
                    </button>
                    <button
                      type="button"
                      aria-label="Remove"
                      onClick={() => removeRecent(r)}
                      className="text-lg leading-none text-foreground/30"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </section>
            ) : null}

            <section>
              <h2 className="mb-3 text-xs font-bold tracking-wider text-foreground/45">
                {texts.browseTitle}
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {browse.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setQuery(c)}
                    className="rounded-full border border-[hsl(var(--brand-primary)/0.3)] px-4 py-2 text-[13px] font-semibold text-[hsl(var(--brand-primary))]"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : results.length > 0 ? (
          <ul style={OPEN_SANS}>
            {results.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => addRecent(it.title)}
                  className="border-foreground/8 flex w-full items-center gap-3 border-b px-5 py-3 text-left"
                >
                  <span
                    className="h-[52px] w-[52px] shrink-0 rounded-[10px] bg-foreground/10 bg-cover bg-center"
                    style={
                      it.image
                        ? { backgroundImage: `url("${resolveAssetUrl(it.image)}")` }
                        : undefined
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-foreground">
                      {it.title}
                    </span>
                    <span className="block truncate text-[13px] text-foreground/50">
                      {it.subtitle}
                    </span>
                  </span>
                  <svg
                    width={16}
                    height={16}
                    viewBox="0 0 320 512"
                    fill="currentColor"
                    className="shrink-0 text-foreground/25"
                    aria-hidden
                  >
                    <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center px-8 pt-24 text-center" style={OPEN_SANS}>
            <span className="mb-3 text-foreground/25">
              <Glass className="h-9 w-9" />
            </span>
            <p className="text-[15px] text-foreground/55">
              {texts.noResults.replace('{query}', query.trim())}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
