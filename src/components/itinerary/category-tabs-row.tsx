'use client';

import type { ItineraryTab } from '@/lib/itinerary-tabs';

export interface CategoryTabsRowProps {
  tabs: ItineraryTab[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}

/** Icono filter (3 líneas decrecientes) usado a la izquierda del label de cada chip. */
function FilterIcon({ size = 16 }: { size?: number }) {
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
 * Fila de chips/tabs de categorías. Render en una fila horizontal con scroll
 * cuando los chips desbordan. El chip activo es azul filled, los inactivos
 * gris claro con el filter icon a la izquierda.
 *
 * Coords y estilos aproximados del SVG; pulido pixel-perfect en 3.17-13.
 */
export function CategoryTabsRow({ tabs, activeSlug, onSelect }: CategoryTabsRowProps) {
  if (tabs.length === 0) return null;

  return (
    <div
      className="absolute left-0 flex items-center gap-3 overflow-x-auto px-6"
      style={{ top: 248, width: 1080, height: 70 }}
    >
      {tabs.map((tab) => {
        const isActive = tab.slug === activeSlug;
        return (
          <button
            key={tab.slug}
            type="button"
            onClick={() => onSelect(tab.slug)}
            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-md px-5 text-[16px] font-semibold transition"
            style={{
              minWidth: 220,
              backgroundColor: isActive
                ? 'hsl(var(--itinerary-tab-active))'
                : 'hsl(var(--itinerary-tab-inactive))',
              color: isActive
                ? 'hsl(var(--itinerary-tab-text-active))'
                : 'hsl(var(--itinerary-tab-text-inactive))',
            }}
            aria-pressed={isActive}
          >
            <FilterIcon />
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
