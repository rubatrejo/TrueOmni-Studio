'use client';

import type { ItineraryTab } from '@/lib/itinerary-tabs';

export interface CategoryTabsRowProps {
  tabs: ItineraryTab[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}

/** Icono filter (3 líneas decrecientes) usado a la izquierda del label de cada chip. */
function FilterIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 6h18M6 12h12M10 18h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Fila de chips/tabs estilo SVG aprobado:
 * - Active: azul oscuro #004f8b (token --itinerary-tab-active), texto blanco.
 * - Inactive: gris medio #aaa (token --itinerary-tab-inactive), texto blanco.
 * - Icono filter (3 líneas) al inicio del label.
 * - Tabs anchos que llenan el canvas con flex-1, height 50px, esquinas 6px.
 */
export function CategoryTabsRow({ tabs, activeSlug, onSelect }: CategoryTabsRowProps) {
  if (tabs.length === 0) return null;

  return (
    <div
      className="absolute left-0 flex items-center gap-2 overflow-x-auto px-5"
      style={{ top: 250, width: 1080, height: 60 }}
    >
      {tabs.map((tab) => {
        const isActive = tab.slug === activeSlug;
        return (
          <button
            key={tab.slug}
            type="button"
            onClick={() => onSelect(tab.slug)}
            aria-pressed={isActive}
            className="flex items-center justify-start gap-3 px-5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{
              flex: '1 1 0',
              minWidth: 0,
              height: 50,
              borderRadius: 6,
              backgroundColor: isActive
                ? 'hsl(var(--itinerary-tab-active))'
                : 'hsl(var(--itinerary-tab-inactive))',
              color: isActive
                ? 'hsl(var(--itinerary-tab-text-active))'
                : 'hsl(var(--itinerary-tab-text-inactive))',
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            <FilterIcon size={18} />
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
