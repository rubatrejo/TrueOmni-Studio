'use client';

import { useEffect, useState } from 'react';

import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import type { TrailDifficulty, TrailType } from '@/lib/config';
import { EMPTY_TRAILS_FILTER, type TrailFilterState } from '@/lib/trails';

/**
 * Overlay de filtros del módulo Trails. 3 secciones:
 *   - Features (AND).
 *   - Difficulty (OR, entre las disponibles del módulo).
 *   - Trail Type (OR).
 * Estilo consistente con `tickets-filter-overlay` (pills outline + fill,
 * CLEAR ALL olive + APPLY blue, backdrop dark sobre el grid).
 */
export function TrailsFilterOverlay({
  open,
  featureCatalog,
  difficulties,
  trailTypes,
  initial,
  title,
  featuresLabel,
  difficultyLabel,
  typeLabel,
  clearAllLabel,
  applyLabel,
  onCancel,
  onApply,
}: {
  open: boolean;
  featureCatalog: readonly string[];
  difficulties: readonly TrailDifficulty[];
  trailTypes: readonly TrailType[];
  initial: TrailFilterState;
  title: string;
  featuresLabel: string;
  difficultyLabel: string;
  typeLabel: string;
  clearAllLabel: string;
  applyLabel: string;
  onCancel: () => void;
  onApply: (next: TrailFilterState) => void;
}) {
  const [draft, setDraft] = useState<TrailFilterState>(initial);

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
  const toggleDifficulty = (v: TrailDifficulty) =>
    setDraft((d) => ({
      ...d,
      difficulties: d.difficulties.includes(v)
        ? d.difficulties.filter((x) => x !== v)
        : [...d.difficulties, v],
    }));
  const toggleType = (v: TrailType) =>
    setDraft((d) => ({
      ...d,
      trailTypes: d.trailTypes.includes(v)
        ? d.trailTypes.filter((x) => x !== v)
        : [...d.trailTypes, v],
    }));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trails-filters-title"
      className="absolute left-0 right-0"
      style={{
        top: '738px',
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
          id="trails-filters-title"
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
          {title}
        </h2>

        <div
          className="scrollbar-hide flex flex-col items-center overflow-y-auto"
          style={{ width: '960px', rowGap: '24px', flexShrink: 0 }}
        >
          <Section title={featuresLabel}>
            <PillRow>
              {featureCatalog.map((f) => (
                <Pill
                  key={f}
                  label={f}
                  active={draft.features.includes(f)}
                  onClick={() => toggleFeature(f)}
                />
              ))}
            </PillRow>
          </Section>

          <Section title={difficultyLabel}>
            <PillRow>
              {difficulties.map((d) => (
                <Pill
                  key={d}
                  label={d}
                  active={draft.difficulties.includes(d)}
                  onClick={() => toggleDifficulty(d)}
                />
              ))}
            </PillRow>
          </Section>

          <Section title={typeLabel}>
            <PillRow>
              {trailTypes.map((t) => (
                <Pill
                  key={t}
                  label={t}
                  active={draft.trailTypes.includes(t)}
                  onClick={() => toggleType(t)}
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
              setDraft(EMPTY_TRAILS_FILTER);
              onApply(EMPTY_TRAILS_FILTER);
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
            {clearAllLabel}
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="font-sans text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
            style={{
              width: '260px',
              height: '72px',
              borderRadius: '8px',
              backgroundColor: 'hsl(var(--brand-secondary))',
              fontSize: '24px',
              lineHeight: '24px',
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}
          >
            {applyLabel}
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

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="relative flex items-center justify-center font-sans focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
      style={{
        height: '48px',
        minWidth: '150px',
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
