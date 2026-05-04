'use client';

import { useEffect, useState } from 'react';

import { useTextos } from '@/components/i18n-provider';
import type { HomeModule } from '@/lib/config';
import type { FilterState } from '@/lib/listings-filter';
import { EMPTY_FILTER } from '@/lib/listings-filter';

import { useEscapeToClose } from './use-escape-to-close';

/**
 * Overlay de filtros full-canvas.
 *
 * Cubre 1080×1920 con background `rgba(18,18,18,0.95)` y muestra 4 secciones:
 *   1. Features (multi-select pills, AND).
 *   2. Subcategory (multi-select pills, OR).
 *   3. Price Range ($/$$/$$$/$$$$ pills, OR).
 *   4. Open Now (toggle pill).
 * + X de cerrar arriba-der + CLEAR ALL (olive) + APPLY (blue) grandes al final.
 */
export function FilterOverlay({
  open,
  mod,
  initial,
  onCancel,
  onApply,
}: {
  open: boolean;
  mod: HomeModule;
  initial: FilterState;
  onCancel: () => void;
  onApply: (next: FilterState) => void;
}) {
  const [draft, setDraft] = useState<FilterState>(initial);

  useEffect(() => {
    if (open) setDraft(initial);
  }, [open, initial]);

  useEscapeToClose(open, onCancel);
  const t = useTextos();

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

  const priceLabel = (p: 1 | 2 | 3 | 4) => '$'.repeat(p);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="filters-title"
      className="absolute left-0 right-0"
      style={{
        top: '738px',
        bottom: 0,
        zIndex: 40,
        backgroundColor: 'rgba(18,18,18,0.96)',
      }}
    >
      {/* Close X */}
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
        style={{ paddingTop: '40px', paddingBottom: '40px' }}
      >
        <h2
          id="filters-title"
          className="font-sans text-white"
          style={{
            fontSize: '40px',
            lineHeight: '40px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            marginBottom: '36px',
            flexShrink: 0,
          }}
        >
          {t("filters_title")}
        </h2>

        <div
          className="scrollbar-hide flex flex-col items-center overflow-y-auto"
          style={{ width: '960px', rowGap: '28px', flexShrink: 0 }}
        >
          <Section title={t("filters_features")}>
            <div
              className="flex flex-wrap items-center justify-center"
              style={{ columnGap: '16px', rowGap: '16px' }}
            >
              {mod.features.map((f) => (
                <Pill
                  key={f}
                  label={f}
                  active={draft.features.includes(f)}
                  onClick={() => toggleFeature(f)}
                />
              ))}
            </div>
          </Section>

          {mod.subcategories.length > 0 ? (
            <Section title={t("filters_category")}>
              <div
                className="flex flex-wrap items-center justify-center"
                style={{ columnGap: '16px', rowGap: '16px' }}
              >
                {mod.subcategories.map((s) => (
                  <Pill
                    key={s}
                    label={s}
                    active={draft.subcategories.includes(s)}
                    onClick={() => toggleSub(s)}
                  />
                ))}
              </div>
            </Section>
          ) : null}

          <Section title={t("filters_price_range")}>
            <div className="flex items-center justify-center" style={{ columnGap: '16px' }}>
              {([1, 2, 3, 4] as const).map((p) => (
                <Pill
                  key={p}
                  label={priceLabel(p)}
                  active={draft.priceRanges.includes(p)}
                  onClick={() => togglePrice(p)}
                  minWidth="110px"
                />
              ))}
            </div>
          </Section>

          <Section title={t("filters_availability")}>
            <Pill
              label={t('filters_open_now')}
              active={draft.openNow}
              onClick={toggleOpenNow}
              minWidth="200px"
            />
          </Section>
        </div>

        {/* Botones */}
        <div
          className="flex items-center justify-center"
          style={{ columnGap: '32px', marginTop: '60px', flexShrink: 0 }}
        >
          <button
            type="button"
            onClick={() => {
              setDraft(EMPTY_FILTER);
              onApply(EMPTY_FILTER);
            }}
            className="font-sans text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
            style={{
              width: '260px',
              height: '72px',
              borderRadius: '8px',
              backgroundColor: 'hsl(var(--brand-tertiary))',
              fontSize: '24px',
              lineHeight: '24px',
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}
          >
            {t("filters_clear_all")}
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
            {t("filters_apply")}
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
          marginBottom: '22px',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Pill({
  label,
  active,
  onClick,
  minWidth = '181.588px',
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
        height: '52px',
        minWidth,
        padding: '0 28px',
        borderRadius: '8.446px',
        border: '1.689px solid #ffffff',
        backgroundColor: active ? '#ffffff' : 'transparent',
        color: active ? '#5e5e5e' : '#ffffff',
        fontSize: '18px',
        lineHeight: '18px',
        fontWeight: active ? 700 : 400,
      }}
    >
      {label}
    </button>
  );
}
