'use client';

import { useEffect, useState } from 'react';

import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import { EMPTY_FILTER, type FilterState } from '@/lib/listings-filter';

const OLIVE = 'hsl(var(--brand-tertiary))';
const SECONDARY = 'hsl(var(--brand-secondary))';
const OPEN_SANS = 'var(--font-open-sans)';

export interface FilterTexts {
  title: string;
  features: string;
  category: string;
  priceRange: string;
  availability: string;
  openNow: string;
  clearAll: string;
  apply: string;
}

/**
 * Pantalla de filtros de la PWA — mismo UI que el overlay del kiosk
 * (`listings/filter-overlay.tsx`) adaptado a mobile: fondo oscuro, título,
 * secciones de pills (Features / Category / Price Range / Availability) y
 * botones CLEAR ALL (olive) + APPLY (azul). Cubre todo el canvas.
 */
export function PwaFilterOverlay({
  open,
  features,
  subcategories,
  initial,
  texts,
  onCancel,
  onApply,
}: {
  open: boolean;
  features: string[];
  subcategories: string[];
  initial: FilterState;
  texts: FilterTexts;
  onCancel: () => void;
  onApply: (next: FilterState) => void;
}) {
  const [draft, setDraft] = useState<FilterState>(initial);

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
  const toggleSub = (s: string) =>
    setDraft((d) => ({
      ...d,
      subcategories: d.subcategories.includes(s)
        ? d.subcategories.filter((x) => x !== s)
        : [...d.subcategories, s],
    }));
  const togglePrice = (p: 1 | 2 | 3 | 4) =>
    setDraft((d) => ({
      ...d,
      priceRanges: d.priceRanges.includes(p)
        ? d.priceRanges.filter((x) => x !== p)
        : [...d.priceRanges, p],
    }));
  const toggleOpenNow = () => setDraft((d) => ({ ...d, openNow: !d.openNow }));

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="absolute inset-0 z-50 flex flex-col"
      style={{ backgroundColor: 'rgba(18,18,18,0.97)' }}
    >
      {/* Close X */}
      <button
        type="button"
        onClick={onCancel}
        aria-label="Close filters"
        className="absolute flex items-center justify-center rounded-full"
        style={{ top: 18, right: 18, width: 38, height: 38, border: '1.5px solid #fff' }}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>

      <h2
        className="shrink-0 pt-[22px] text-center font-bold text-white"
        style={{ fontSize: 21, letterSpacing: '0.04em', fontFamily: OPEN_SANS }}
      >
        {texts.title}
      </h2>

      {/* Secciones (scroll) */}
      <div className="scrollbar-hide flex-1 overflow-y-auto px-5 pb-2 pt-5">
        <Section title={texts.features}>
          {features.map((f) => (
            <Pill
              key={f}
              label={f}
              active={draft.features.includes(f)}
              onClick={() => toggleFeature(f)}
            />
          ))}
        </Section>

        {subcategories.length > 0 && (
          <Section title={texts.category}>
            {subcategories.map((s) => (
              <Pill
                key={s}
                label={s}
                active={draft.subcategories.includes(s)}
                onClick={() => toggleSub(s)}
              />
            ))}
          </Section>
        )}

        <Section title={texts.priceRange}>
          {([1, 2, 3, 4] as const).map((p) => (
            <Pill
              key={p}
              label={'$'.repeat(p)}
              active={draft.priceRanges.includes(p)}
              onClick={() => togglePrice(p)}
              minWidth={64}
            />
          ))}
        </Section>

        <Section title={texts.availability}>
          <Pill
            label={texts.openNow}
            active={draft.openNow}
            onClick={toggleOpenNow}
            minWidth={140}
          />
        </Section>
      </div>

      {/* Botones */}
      <div className="flex shrink-0 items-center gap-2.5 px-5 pb-6 pt-2">
        <button
          type="button"
          onClick={() => {
            setDraft(EMPTY_FILTER);
            onApply(EMPTY_FILTER);
          }}
          className="flex-1 rounded-[7px] font-bold text-white"
          style={{
            height: 42,
            backgroundColor: OLIVE,
            fontSize: 13,
            letterSpacing: '0.06em',
            fontFamily: OPEN_SANS,
          }}
        >
          {texts.clearAll}
        </button>
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="flex-1 rounded-[7px] font-bold text-white"
          style={{
            height: 42,
            backgroundColor: SECONDARY,
            fontSize: 13,
            letterSpacing: '0.06em',
            fontFamily: OPEN_SANS,
          }}
        >
          {texts.apply}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col items-center">
      <div
        className="mb-2.5 uppercase text-white/65"
        style={{ fontSize: 11, letterSpacing: '0.16em', fontWeight: 700, fontFamily: OPEN_SANS }}
      >
        {title}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">{children}</div>
    </div>
  );
}

function Pill({
  label,
  active,
  onClick,
  minWidth = 96,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  minWidth?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex items-center justify-center rounded-[7px]"
      style={{
        height: 33,
        minWidth,
        padding: '0 14px',
        border: '1.4px solid #fff',
        backgroundColor: active ? '#fff' : 'transparent',
        color: active ? '#5e5e5e' : '#fff',
        fontSize: 13,
        fontWeight: active ? 700 : 400,
        fontFamily: OPEN_SANS,
      }}
    >
      {label}
    </button>
  );
}
