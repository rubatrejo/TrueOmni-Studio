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
 * Fila de chips/tabs de categorías estilo SVG aprobado:
 * - Active: azul primary filled, texto blanco.
 * - Inactive: gris claro filled, texto oscuro.
 * - Icono filter (3 líneas) al inicio del label.
 * - Height 46px, borderRadius 6px, fontSize 14px tracking 0.06em.
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
            className="flex items-center justify-start gap-2 px-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{
              flex: '1 0 auto',
              minWidth: 200,
              height: 46,
              borderRadius: 6,
              backgroundColor: isActive
                ? 'hsl(var(--itinerary-tab-active))'
                : 'hsl(var(--itinerary-tab-inactive))',
              color: isActive
                ? 'hsl(var(--itinerary-tab-text-active))'
                : 'hsl(var(--itinerary-tab-text-inactive))',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            <FilterIcon />
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
