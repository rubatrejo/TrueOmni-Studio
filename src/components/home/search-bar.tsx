'use client';

import { useTextos } from '@/components/i18n-provider';

/**
 * Search tab verbatim del SVG Dashboard (y=620..726, 1080×106 hsl(var(--brand-primary))).
 *   - Input white 940×58 rx=8 @ (55, 24).
 *   - Botón SEARCH olive 181×54 rx=8 @ (812, 26).
 *   - Placeholder "What are you looking for?" 24px Helvetica #707070.
 *   - Label SEARCH 26px Helvetica-Bold white.
 * Al tocar input o botón se dispara `onOpen` para mostrar el overlay
 * de búsqueda encima del Home (modal dentro del frame del kiosk).
 *
 * Strings reactivos al idioma activo via `useTextos()`.
 */
export function SearchBar({ onOpen }: { onOpen: () => void }) {
  const t = useTextos();
  return (
    <div
      className="relative"
      style={{ height: '106px', backgroundColor: 'hsl(var(--brand-primary))', flexShrink: 0 }}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label="Buscar"
        className="absolute flex items-center bg-white text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
        style={{
          left: '55px',
          top: '24px',
          width: '940px',
          height: '58px',
          borderRadius: '8px',
          paddingLeft: '29px',
        }}
      >
        <span className="font-sans" style={{ fontSize: '24px', color: '#707070' }}>
          {t('home_search_placeholder')}
        </span>
      </button>
      <button
        type="button"
        onClick={onOpen}
        aria-label="Buscar"
        className="absolute flex items-center justify-center font-sans font-bold uppercase text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
        style={{
          left: '812px',
          top: '26px',
          width: '181px',
          height: '54px',
          backgroundColor: 'hsl(var(--brand-tertiary))',
          borderRadius: '8px',
          fontSize: '26px',
          letterSpacing: '0.02em',
        }}
      >
        {t('home_search_button')}
      </button>
    </div>
  );
}
