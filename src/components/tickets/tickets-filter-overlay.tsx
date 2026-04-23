'use client';

import { useEffect, useState } from 'react';

import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import { EMPTY_EVENTS_FILTER, type EventsFilterState } from '@/lib/events-filter';

interface FilterCatalogue {
  categories: string[];
  venues: string[];
  features: string[];
}

/**
 * Overlay de filtros de Tickets. 4 secciones (Features AND + Category OR +
 * Venue OR + Price OR). Idéntico al EventsFilterOverlay excepto que el
 * catálogo viene derivado del pool visible (prop `catalogue`) en vez de
 * leer `HomeEventsModule.{categories,venues,features}`.
 */
export function TicketsFilterOverlay({
  open,
  catalogue,
  initial,
  onCancel,
  onApply,
}: {
  open: boolean;
  catalogue: FilterCatalogue;
  initial: EventsFilterState;
  onCancel: () => void;
  onApply: (next: EventsFilterState) => void;
}) {
  const [draft, setDraft] = useState<EventsFilterState>(initial);

  useEffect(() => {
    if (open) setDraft(initial);
  }, [open, initial]);

  useEscapeToClose(open, onCancel);
  if (!open) return null;

  const toggleFeature = (f: string) =>
    setDraft((d) => ({
      ...d,
      features: d.features.includes(f) ? d.features.filter((x) => x !== f) : [...d.features, f],
    }));
  const toggleCategory = (c: string) =>
    setDraft((d) => ({
      ...d,
      categories: d.categories.includes(c)
        ? d.categories.filter((x) => x !== c)
        : [...d.categories, c],
    }));
  const toggleVenue = (v: string) =>
    setDraft((d) => ({
      ...d,
      venues: d.venues.includes(v) ? d.venues.filter((x) => x !== v) : [...d.venues, v],
    }));
  const togglePrice = (p: 'free' | 1 | 2 | 3 | 4) =>
    setDraft((d) => ({
      ...d,
      prices: d.prices.includes(p) ? d.prices.filter((x) => x !== p) : [...d.prices, p],
    }));

  const priceLabel = (p: 'free' | 1 | 2 | 3 | 4) => (p === 'free' ? 'Free' : '$'.repeat(p));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tickets-filters-title"
      className="absolute left-0 right-0"
      style={{
        top: '918px',
        bottom: 0,
        zIndex: 40,
        backgroundColor: 'rgba(18,18,18,0.96)',
      }}
    >
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cerrar filtros"
        className="absolute flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
        style={{
          top: '24px',
          right: '24px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          border: '1.5px solid #ffffff',
          backgroundColor: 'transparent',
          color: '#ffffff',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
          <path
            d="M6 6l12 12M18 6l-12 12"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div
        className="flex h-full w-full flex-col items-center justify-center"
        style={{ paddingTop: '30px', paddingBottom: '30px' }}
      >
        <h2
          id="tickets-filters-title"
          className="font-sans text-white"
          style={{
            fontSize: '40px',
            lineHeight: '40px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            marginBottom: '28px',
            flexShrink: 0,
          }}
        >
          FILTERS
        </h2>

        <div
          className="scrollbar-hide flex flex-col items-center overflow-y-auto"
          style={{ width: '960px', rowGap: '24px', flexShrink: 0 }}
        >
          <Section title="Features">
            <PillRow>
              {catalogue.features.map((f) => (
                <Pill
                  key={f}
                  label={f}
                  active={draft.features.includes(f)}
                  onClick={() => toggleFeature(f)}
                />
              ))}
            </PillRow>
          </Section>

          <Section title="Category">
            <PillRow>
              {catalogue.categories.map((c) => (
                <Pill
                  key={c}
                  label={c}
                  active={draft.categories.includes(c)}
                  onClick={() => toggleCategory(c)}
                />
              ))}
            </PillRow>
          </Section>

          <Section title="Venue">
            <PillRow>
              {catalogue.venues.map((v) => (
                <Pill
                  key={v}
                  label={v}
                  active={draft.venues.includes(v)}
                  onClick={() => toggleVenue(v)}
                />
              ))}
            </PillRow>
          </Section>

          <Section title="Price">
            <PillRow>
              {(['free', 1, 2, 3, 4] as const).map((p) => (
                <Pill
                  key={p}
                  label={priceLabel(p)}
                  active={draft.prices.includes(p)}
                  onClick={() => togglePrice(p)}
                  minWidth={p === 'free' ? '120px' : '110px'}
                />
              ))}
            </PillRow>
          </Section>
        </div>

        <div
          className="flex items-center justify-center"
          style={{ columnGap: '32px', marginTop: '44px', flexShrink: 0 }}
        >
          <button
            type="button"
            onClick={() => {
              setDraft(EMPTY_EVENTS_FILTER);
              onApply(EMPTY_EVENTS_FILTER);
            }}
            className="font-sans text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
            style={{
              width: '260px',
              height: '72px',
              borderRadius: '8px',
              backgroundColor: '#b9bd39',
              fontSize: '24px',
              lineHeight: '24px',
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}
          >
            CLEAR ALL
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="font-sans text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
            style={{
              width: '260px',
              height: '72px',
              borderRadius: '8px',
              backgroundColor: '#1796d6',
              fontSize: '24px',
              lineHeight: '24px',
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}
          >
            APPLY
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col items-center">
      <div
        className="font-sans text-white"
        style={{
          fontSize: '22px',
          lineHeight: '22px',
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          opacity: 0.65,
          marginBottom: '18px',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function PillRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-wrap items-center justify-center"
      style={{ columnGap: '14px', rowGap: '14px' }}
    >
      {children}
    </div>
  );
}

function Pill({
  label,
  active,
  onClick,
  minWidth = '150px',
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  minWidth?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="relative flex items-center justify-center font-sans focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
      style={{
        height: '48px',
        minWidth,
        padding: '0 24px',
        borderRadius: '8.446px',
        border: '1.689px solid #ffffff',
        backgroundColor: active ? '#ffffff' : 'transparent',
        color: active ? '#5e5e5e' : '#ffffff',
        fontSize: '17px',
        lineHeight: '17px',
        fontWeight: active ? 700 : 400,
      }}
    >
      {label}
    </button>
  );
}
