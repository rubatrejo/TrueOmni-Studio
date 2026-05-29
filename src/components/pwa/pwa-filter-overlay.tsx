'use client';

import { useEffect, useState } from 'react';

import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import { EMPTY_FILTER, type FilterState } from '@/lib/listings-filter';

const PRIMARY = 'hsl(var(--pwa-primary))';
const PRIMARY_TINT = 'hsl(var(--pwa-primary) / 0.10)';
const SHEET_BG = 'hsl(var(--pwa-sheet-bg))';
const SHEET_FG = 'hsl(var(--pwa-sheet-fg))';
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
 * Pantalla de filtros de la PWA — bottom sheet claro estilo iOS: hoja blanca
 * que sube desde abajo cubriendo el 90% del canvas (10% superior con scrim),
 * esquinas superiores redondeadas, títulos de sección oscuros a la izquierda y
 * pills tipo chip con tint del color de marca (activa = relleno sólido). Footer
 * con botón APPLY sólido + CLEAR ALL como texto-link. Tocar fuera o la X cierra.
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
    <div role="dialog" aria-modal="true" className="absolute inset-0 z-50">
      {/* Scrim — tap fuera cierra */}
      <button
        type="button"
        aria-label="Close filters"
        onClick={onCancel}
        className="pwa-sheet-backdrop-anim absolute inset-0 cursor-default"
        style={{ backgroundColor: 'rgba(18,18,18,0.45)' }}
      />

      {/* Hoja: 90% del alto, anclada abajo, sube desde abajo */}
      <div
        className="pwa-sheet-up-anim absolute inset-x-0 bottom-0 flex h-[90%] flex-col rounded-t-[22px]"
        style={{ backgroundColor: SHEET_BG }}
      >
        {/* Header */}
        <div className="relative flex shrink-0 items-center justify-center pb-3 pt-[18px]">
          <h2
            className="font-bold"
            style={{ fontSize: 17, color: SHEET_FG, fontFamily: OPEN_SANS }}
          >
            {texts.title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close filters"
            className="absolute flex items-center justify-center rounded-full"
            style={{
              top: 14,
              right: 18,
              width: 32,
              height: 32,
              backgroundColor: 'hsl(var(--pwa-sheet-fg) / 0.06)',
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke={SHEET_FG}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Secciones (scroll) */}
        <div className="scrollbar-hide flex-1 overflow-y-auto px-5 pb-2 pt-1">
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
              />
            ))}
          </Section>

          <Section title={texts.availability}>
            <Pill label={texts.openNow} active={draft.openNow} onClick={toggleOpenNow} />
          </Section>
        </div>

        {/* Footer */}
        <div
          className="flex shrink-0 items-center gap-4 px-5 pb-7 pt-3"
          style={{ borderTop: '1px solid hsl(var(--pwa-sheet-fg) / 0.08)' }}
        >
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="flex-1 rounded-full font-bold text-white"
            style={{
              height: 50,
              backgroundColor: PRIMARY,
              fontSize: 15,
              letterSpacing: '0.04em',
              fontFamily: OPEN_SANS,
            }}
          >
            {texts.apply}
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(EMPTY_FILTER);
              onApply(EMPTY_FILTER);
            }}
            className="shrink-0 font-bold"
            style={{
              color: PRIMARY,
              fontSize: 15,
              letterSpacing: '0.02em',
              fontFamily: OPEN_SANS,
            }}
          >
            {texts.clearAll}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col">
      <div
        className="mb-3 font-bold"
        style={{ fontSize: 16, color: SHEET_FG, fontFamily: OPEN_SANS }}
      >
        {title}
      </div>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-3">{children}</div>
    </div>
  );
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex items-center justify-center rounded-full transition-colors"
      style={{
        height: 38,
        padding: '0 18px',
        backgroundColor: active ? PRIMARY : PRIMARY_TINT,
        color: active ? '#fff' : PRIMARY,
        fontSize: 14,
        fontWeight: active ? 700 : 500,
        fontFamily: OPEN_SANS,
      }}
    >
      {label}
    </button>
  );
}
