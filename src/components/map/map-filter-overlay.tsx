'use client';

import { useEffect, useState } from 'react';

import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import type { MapFilterState } from '@/lib/map-filter';

/**
 * Overlay de filtros del módulo Map — adopta la misma estructura y estilo
 * que `FilterOverlay` del módulo Listings:
 *   - Fondo `rgba(18,18,18,0.96)` full-canvas.
 *   - Título FILTERS 40px bold white.
 *   - Secciones con encabezado uppercase + pills blancos.
 *   - X de cerrar arriba-der circular outline.
 *   - CLEAR ALL (olive) + APPLY (azul) abajo.
 *
 * Secciones expuestas: Features (AND) + Category (OR) — las pills se llenan
 * dinámicamente del pool combinado de Listings + Events visibles en el Map.
 */
interface MapFilterOverlayProps {
  open: boolean;
  featuresPool: readonly string[];
  subcategoriesPool: readonly string[];
  initial: MapFilterState;
  labels: {
    title: string;
    clearAll: string;
    apply: string;
    featuresLabel?: string;
    subcategoriesLabel?: string;
  };
  onApply: (next: MapFilterState) => void;
  onCancel: () => void;
}

export function MapFilterOverlay({
  open,
  featuresPool,
  subcategoriesPool,
  initial,
  labels,
  onApply,
  onCancel,
}: MapFilterOverlayProps) {
  const [features, setFeatures] = useState<Set<string>>(new Set(initial.features));
  const [subcategories, setSubcategories] = useState<Set<string>>(new Set(initial.subcategories));

  useEffect(() => {
    if (open) {
      setFeatures(new Set(initial.features));
      setSubcategories(new Set(initial.subcategories));
    }
  }, [open, initial]);

  useEscapeToClose(open, onCancel);

  if (!open) return null;

  const toggleFeature = (f: string) => {
    setFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };
  const toggleSub = (s: string) => {
    setSubcategories((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };
  const clearAll = () => {
    const cleared: MapFilterState = {
      activeChips: initial.activeChips,
      features: new Set<string>(),
      subcategories: new Set<string>(),
    };
    onApply(cleared);
  };
  const apply = () => {
    onApply({ activeChips: initial.activeChips, features, subcategories });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-filters-title"
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
          id="map-filters-title"
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
          {labels.title}
        </h2>

        <div
          className="scrollbar-hide flex flex-col items-center overflow-y-auto"
          style={{ width: '960px', rowGap: '28px', flexShrink: 0 }}
        >
          {featuresPool.length > 0 ? (
            <Section title={labels.featuresLabel ?? 'Features'}>
              <div
                className="flex flex-wrap items-center justify-center"
                style={{ columnGap: '16px', rowGap: '16px' }}
              >
                {featuresPool.map((f) => (
                  <Pill
                    key={f}
                    label={f}
                    active={features.has(f)}
                    onClick={() => toggleFeature(f)}
                  />
                ))}
              </div>
            </Section>
          ) : null}

          {subcategoriesPool.length > 0 ? (
            <Section title={labels.subcategoriesLabel ?? 'Category'}>
              <div
                className="flex flex-wrap items-center justify-center"
                style={{ columnGap: '16px', rowGap: '16px' }}
              >
                {subcategoriesPool.map((s) => (
                  <Pill
                    key={s}
                    label={s}
                    active={subcategories.has(s)}
                    onClick={() => toggleSub(s)}
                  />
                ))}
              </div>
            </Section>
          ) : null}
        </div>

        <div
          className="flex items-center justify-center"
          style={{ columnGap: '32px', marginTop: '60px', flexShrink: 0 }}
        >
          <button
            type="button"
            onClick={clearAll}
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
            {labels.clearAll}
          </button>
          <button
            type="button"
            onClick={apply}
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
            {labels.apply}
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
