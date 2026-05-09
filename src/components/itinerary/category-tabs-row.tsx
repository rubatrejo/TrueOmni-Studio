'use client';

import type { ItineraryTab } from '@/lib/itinerary-tabs';

export interface CategoryTabsRowProps {
  tabs: ItineraryTab[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}

/**
 * Icono filter (embudo) verbatim del SVG `Tabs-Categories-Example-.svg`
 * (`fic_filter_default`). Tamaño base 24×25 dentro del rect 357×60 del SVG.
 */
function FilterFunnelIcon() {
  return (
    <svg width="24" height="25" viewBox="0 0 24 25" aria-hidden="true" fill="currentColor">
      <path d="M14.71,25h-.074a.339.339,0,0,1-.234-.051L9.26,21.688a.576.576,0,0,1-.271-.493V12.99h6.229V24.457a.575.575,0,0,1-.271.492A.438.438,0,0,1,14.71,25Zm-.036-13.043H9.239a.582.582,0,0,1-.374-.17L.17,2.547A.487.487,0,0,1,0,2.174V.544A.515.515,0,0,1,.544,0H23.37a.515.515,0,0,1,.544.544v1.63a.487.487,0,0,1-.17.374l-8.7,9.239A.489.489,0,0,1,14.674,11.957Z" />
    </svg>
  );
}

/**
 * Fila de tabs verbatim del SVG `Tabs-Categories-Example-.svg`:
 *   - rect 357.27 × 59.765, rx 8, fill hsl(var(--brand-secondary)) (active) / gris (inactive).
 *   - filter funnel icon @ left:12.6 top:18.4 (fill blanco).
 *   - divider vertical blanco @ x:50, height 40, top:9.7.
 *   - text OpenSans 25px white @ x:66.5 y:39.9.
 *
 * Cuando hay más de 3 tabs, scroll horizontal porque el ancho 357 fijo no
 * cabe en 1080 sin scroll a partir del 4to tab.
 */
export function CategoryTabsRow({ tabs, activeSlug, onSelect }: CategoryTabsRowProps) {
  if (tabs.length === 0) return null;

  return (
    <div
      className="absolute left-0 flex items-center overflow-x-auto [&::-webkit-scrollbar]:hidden"
      style={{
        top: 250,
        width: 1080,
        height: 80,
        paddingLeft: 20,
        paddingRight: 20,
        gap: 20,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.slug === activeSlug;
        return (
          <button
            key={tab.slug}
            type="button"
            onClick={() => onSelect(tab.slug)}
            aria-pressed={isActive}
            className="relative flex flex-shrink-0 items-center text-left text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{
              width: 357,
              height: 60,
              borderRadius: 8,
              backgroundColor: isActive
                ? 'hsl(var(--itinerary-tab-active))'
                : 'hsl(var(--itinerary-tab-inactive))',
              fontFamily: 'OpenSans, "Open Sans", system-ui, sans-serif',
              fontSize: 25,
              fontWeight: 400,
            }}
          >
            <span
              className="flex items-center justify-center"
              style={{ width: 50, height: 60 }}
              aria-hidden="true"
            >
              <FilterFunnelIcon />
            </span>
            {/* Divider vertical blanco entre icono y texto */}
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 50,
                top: 9.75,
                width: 1,
                height: 40,
                backgroundColor: '#ffffff',
                opacity: 0.85,
              }}
            />
            <span
              className="truncate"
              style={{ paddingLeft: 16, paddingRight: 16, lineHeight: '60px' }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
