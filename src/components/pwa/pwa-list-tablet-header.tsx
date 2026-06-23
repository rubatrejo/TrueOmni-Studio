'use client';

import type { ReactNode } from 'react';

const BRAND = 'hsl(var(--brand-primary))';
const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

/**
 * Header full-width del producto **Tablet** para las pantallas de listas con
 * chrome compuesto (listings/Map, Maps agregado, Digital Brochures). Reemplaza el
 * patrón phone (header 375-space escalado + `PwaSubHeader` que en tablet salta al
 * portal y deja el filtro/tabs flotando pequeños). Fila 1 = back + título centrado
 * + filtro opcional, a tamaño dashboard (64px); fila 2 = el control (segmented,
 * search, …) a todo el ancho. Fuente única para que las 3 pantallas no driften.
 */
export function PwaListTabletHeader({
  title,
  onBack,
  onSort,
  onFilter,
  filterActive,
  children,
}: {
  title: string;
  onBack: () => void;
  /** Si se pasa, pinta el icono de orden (Sort) a la izquierda del filtro. */
  onSort?: () => void;
  /** Si se pasa, pinta el icono de filtros (con badge si `filterActive`). */
  onFilter?: () => void;
  filterActive?: boolean;
  /** Control inferior full-width (segmented Listings/Map, search bar, …). */
  children?: ReactNode;
}) {
  return (
    <div className="relative z-10 shrink-0" style={{ backgroundColor: BRAND }}>
      {/* Fila 1: back + título + filtro */}
      <div className="relative flex items-center px-8" style={{ height: 64 }}>
        <button type="button" aria-label="Back" onClick={onBack} className="text-white">
          <svg width={14} height={24} viewBox="0 0 11.87 20.36" fill="#fff" aria-hidden>
            <path d="M.292,10.946a.975.975,0,0,1,0-1.392L9.537.417a1.456,1.456,0,0,1,2.041,0,1.415,1.415,0,0,1,0,2.016L3.669,10.25l7.909,7.815a1.417,1.417,0,0,1,0,2.017,1.456,1.456,0,0,1-2.041,0Z" />
          </svg>
        </button>
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-center font-bold text-white"
          style={{ fontSize: 22, letterSpacing: '-0.024em', ...OPEN_SANS }}
        >
          {title}
        </div>
        {onSort ? (
          <button
            type="button"
            aria-label="Sort"
            onClick={onSort}
            className={`text-white ${onFilter ? 'ml-auto mr-6' : 'ml-auto'}`}
          >
            <svg width={24} height={22} viewBox="0 0 576 512" fill="currentColor" aria-hidden>
              <path d="M151.6 469.6C145.5 476.2 137 480 128 480s-17.5-3.8-23.6-10.4l-88-96c-11.9-13-11.1-33.3 2-45.2s33.3-11.1 45.2 2L96 365.7V96c0-17.7 14.3-32 32-32s32 14.3 32 32V365.7l32.4-35.4c11.9-13 32.2-13.9 45.2-2s13.9 32.2 2 45.2l-88 96zM320 480c-17.7 0-32-14.3-32-32s14.3-32 32-32h32c17.7 0 32 14.3 32 32s-14.3 32-32 32H320zm0-128c-17.7 0-32-14.3-32-32s14.3-32 32-32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H320zm0-128c-17.7 0-32-14.3-32-32s14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H320zm0-128c-17.7 0-32-14.3-32-32s14.3-32 32-32H544c17.7 0 32 14.3 32 32s-14.3 32-32 32H320z" />
            </svg>
          </button>
        ) : null}
        {onFilter ? (
          <button
            type="button"
            aria-label="Filter"
            onClick={onFilter}
            className={`relative text-white ${onSort ? '' : 'ml-auto'}`}
          >
            {filterActive ? (
              <span
                className="absolute rounded-full"
                style={{
                  right: -3,
                  top: -3,
                  width: 11,
                  height: 11,
                  backgroundColor: 'hsl(var(--pwa-favorite))',
                }}
              />
            ) : null}
            <svg width={28} height={24} viewBox="0 0 28 24" fill="currentColor" aria-hidden>
              <g transform="translate(-2 -4)">
                <path d="M2,7A1,1,0,0,1,3,6H20.184a2.982,2.982,0,0,1,5.632,0H29a1,1,0,0,1,0,2H25.816a2.982,2.982,0,0,1-5.632,0H3A1,1,0,0,1,2,7Zm27,8H14.816a2.982,2.982,0,0,0-5.632,0H3a1,1,0,0,0,0,2H9.184a2.982,2.982,0,0,0,5.632,0H29a1,1,0,0,0,0-2Zm0,9H25.816a2.982,2.982,0,0,0-5.632,0H3a1,1,0,0,0,0,2H20.184a2.982,2.982,0,0,0,5.632,0H29a1,1,0,0,0,0-2Z" />
              </g>
            </svg>
          </button>
        ) : null}
      </div>
      {/* Fila 2: control full-width */}
      {children ? <div className="px-8 pb-4">{children}</div> : null}
    </div>
  );
}

/** Segmented control Listings/Map full-width para tablet (usado por listings/Map). */
export function PwaTabletSegmented({
  tabs,
  tab,
  onChange,
}: {
  tabs: { listings: string; map: string };
  tab: 'listings' | 'map';
  onChange: (t: 'listings' | 'map') => void;
}) {
  return (
    <div
      className="flex overflow-hidden rounded-[8px]"
      style={{ height: 44, border: '1px solid hsl(0 0% 100% / 0.5)' }}
    >
      {(['listings', 'map'] as const).map((t) => {
        const isActive = tab === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className="flex flex-1 items-center justify-center font-semibold"
            style={{
              fontSize: 17,
              ...OPEN_SANS,
              backgroundColor: isActive ? '#fff' : 'transparent',
              color: isActive ? BRAND : '#fff',
            }}
          >
            {t === 'listings' ? tabs.listings : tabs.map}
          </button>
        );
      })}
    </div>
  );
}
