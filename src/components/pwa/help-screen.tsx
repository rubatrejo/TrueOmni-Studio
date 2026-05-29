'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import type { PwaHelpArticle } from '@/lib/config';

import { PwaBottomNav } from './bottom-nav';
import { SearchIcon } from './dashboard-icons';
import { S } from './mobile-layer';
import { PwaSubHeader } from './pwa-sub-header';

const PWA = 'hsl(var(--pwa-primary))';
const OPEN_SANS = 'var(--font-open-sans)';
const CHEVRON = 'M0,1.421,1.458,0l6.25,6.088-6.25,6.088L0,10.756,4.792,6.088Z';

/** Sobre del header (mismo glyph stroke que Login/Forgot, blanco). */
function EnvelopeIcon() {
  return (
    <svg
      className="h-[22px] w-[22px] text-white"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

/**
 * Centro de ayuda (`/pwa/help`) — landing full-screen. Header brand (back + título +
 * sobre→contacto), barra de búsqueda que filtra en vivo, FAQs agrupadas por categoría
 * (filas con chevron → detalle) y tarjeta "Need more help?" con Contact Support.
 * White-label: textos/artículos desde `config.features.pwa.help`.
 */
export function HelpScreen({
  title,
  searchPlaceholder,
  noResults,
  needMoreTitle,
  needMoreBody,
  contactCta,
  articles,
}: {
  title: string;
  searchPlaceholder: string;
  noResults: string;
  needMoreTitle: string;
  needMoreBody: string;
  contactCta: string;
  articles: PwaHelpArticle[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  // Agrupado por categoría (orden de primera aparición).
  const groups = useMemo(() => {
    const map = new Map<string, PwaHelpArticle[]>();
    for (const a of articles) {
      const list = map.get(a.category) ?? [];
      list.push(a);
      map.set(a.category, list);
    }
    return Array.from(map.entries());
  }, [articles]);

  // Filtrado en vivo (question/answer/category).
  const filtered = useMemo(
    () =>
      q
        ? articles.filter(
            (a) =>
              a.question.toLowerCase().includes(q) ||
              a.answer.toLowerCase().includes(q) ||
              a.category.toLowerCase().includes(q),
          )
        : [],
    [articles, q],
  );

  const Row = ({ a }: { a: PwaHelpArticle }) => (
    <button
      type="button"
      onClick={() => router.push(`/pwa/help/${a.slug}`)}
      className="flex w-full items-center justify-between border-b px-5 py-4 text-left"
      style={{ borderColor: 'hsl(var(--foreground) / 0.1)' }}
    >
      <span
        className="min-w-0 flex-1 pr-3 text-foreground"
        style={{ fontSize: 15, fontFamily: OPEN_SANS }}
      >
        {a.question}
      </span>
      <svg width={8} height={13} viewBox="0 0 8.95 13.6" aria-hidden>
        <path d={CHEVRON} transform="translate(0.5 0.5)" fill="hsl(var(--foreground) / 0.3)" />
      </svg>
    </button>
  );

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* Header brand (escalado) */}
      <div className="relative z-10 shrink-0" style={{ height: 90 * S }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: 375, height: 90, transform: `scale(${S})`, transformOrigin: 'top left' }}
        >
          <PwaSubHeader
            title={title}
            backHref="/pwa/more"
            right={
              <button
                type="button"
                aria-label="Contact Support"
                onClick={() => router.push('/pwa/help/contact')}
              >
                <EnvelopeIcon />
              </button>
            }
          />
        </div>
      </div>

      {/* Cuerpo scroll (390-space) */}
      <div className="scrollbar-hide flex-1 overflow-y-auto bg-background">
        {/* Search pill */}
        <div className="px-5 pb-1 pt-4">
          <div
            className="flex items-center gap-2 rounded-full px-4"
            style={{ height: 40, backgroundColor: 'hsl(var(--foreground) / 0.05)' }}
          >
            <SearchIcon size={15} className="shrink-0 text-foreground/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-foreground placeholder:text-foreground/40 focus:outline-none"
              style={{ fontSize: 15, fontFamily: OPEN_SANS }}
            />
          </div>
        </div>

        {q ? (
          /* Resultados de búsqueda (lista plana) */
          filtered.length > 0 ? (
            <div className="pt-2">
              {filtered.map((a) => (
                <Row key={a.slug} a={a} />
              ))}
            </div>
          ) : (
            <div
              className="px-5 pt-10 text-center text-foreground/50"
              style={{ fontSize: 15, fontFamily: OPEN_SANS }}
            >
              {noResults.replace('{query}', query.trim())}
            </div>
          )
        ) : (
          <>
            {/* FAQs por categoría */}
            <div className="pt-2">
              {groups.map(([category, list]) => (
                <div key={category}>
                  <div
                    className="px-5 pb-1 pt-5 font-semibold uppercase text-foreground/45"
                    style={{ fontSize: 12, letterSpacing: 0.6, fontFamily: OPEN_SANS }}
                  >
                    {category}
                  </div>
                  {list.map((a) => (
                    <Row key={a.slug} a={a} />
                  ))}
                </div>
              ))}
            </div>

            {/* Tarjeta "Need more help?" */}
            <div className="px-5 pb-6 pt-7">
              <div
                className="rounded-[12px] p-5 text-center"
                style={{ backgroundColor: 'hsl(var(--foreground) / 0.05)' }}
              >
                <div
                  className="font-bold text-foreground"
                  style={{ fontSize: 16, fontFamily: OPEN_SANS }}
                >
                  {needMoreTitle}
                </div>
                <p
                  className="mx-auto mb-4 mt-2 text-foreground/60"
                  style={{ fontSize: 13.5, lineHeight: 1.5, fontFamily: OPEN_SANS }}
                >
                  {needMoreBody}
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/pwa/help/contact')}
                  className="w-full rounded-full font-bold text-white"
                  style={{
                    height: 48,
                    backgroundColor: PWA,
                    fontSize: 15,
                    letterSpacing: '0.03em',
                    fontFamily: OPEN_SANS,
                  }}
                >
                  {contactCta}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <PwaBottomNav active="more" />
    </div>
  );
}
