'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { DraggableKeyboard } from '@/components/keyboard/draggable-keyboard';
import type { HomeListing } from '@/lib/config';
import { filterListings } from '@/lib/listings';

import { OnScreenKeyboard, type KeyboardKey } from './on-screen-keyboard';

/**
 * Overlay modal de búsqueda verbatim del SVG designs/Home/Search.svg.
 * Se renderiza con `fixed inset-0` DENTRO del canvas (KioskCanvas tiene
 * transform:scale, lo cual hace que fixed sea relativo al canvas → el
 * modal queda contenido en el frame del kiosk, no cubre todo el viewport).
 *
 * Layout:
 *   - Opacity overlay negro 75% sobre el Home visible debajo.
 *   - Search tab en y=620: mismo azul + input + botón SEARCH.
 *   - Search_Result card blanco en (48, 726): 988 wide.
 *   - Keyboard anclado al bottom: 1080×486 blanco con teclas azules + fila de números.
 */
export function SearchOverlay({
  listings,
  onClose,
}: {
  listings: readonly HomeListing[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => filterListings(listings, query), [listings, query]);

  const handleKey = (k: KeyboardKey) => {
    if (k === 'BACKSPACE') {
      setQuery((q) => q.slice(0, -1));
      return;
    }
    if (k === 'ENTER') return;
    if (k === 'SPACE') {
      setQuery((q) => q + ' ');
      return;
    }
    if (typeof k === 'string') {
      setQuery((q) => q + k);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay negro 75% (clic cierra) */}
      <button
        type="button"
        aria-label="Cerrar búsqueda"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default focus:outline-none"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      />

      {/* Search tab @ y=620 */}
      <div
        className="absolute left-0 right-0"
        style={{ top: '620px', height: '106px', backgroundColor: 'hsl(var(--brand-primary))' }}
      >
        <div
          className="absolute flex items-center bg-white"
          style={{
            left: '55px',
            top: '24px',
            width: '940px',
            height: '58px',
            borderRadius: '8px',
            paddingLeft: '29px',
          }}
        >
          <span
            className="font-sans"
            style={{ fontSize: '24px', color: query ? '#000' : '#707070' }}
          >
            {query || 'What are you looking for?'}
          </span>
        </div>
        <button
          type="button"
          className="absolute flex items-center justify-center font-sans font-bold uppercase text-white focus:outline-none"
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
          Search
        </button>
      </div>

      {/* Search_Result card @ (48, 726) — solo si hay query */}
      {query ? (
        <div
          className="absolute bg-white"
          style={{
            left: '48px',
            top: '726px',
            width: '988px',
            maxHeight: `${1521 - 726 - 20}px`,
            overflowY: 'auto',
          }}
        >
          <div style={{ paddingLeft: '90px', paddingTop: '20px', paddingBottom: '14px' }}>
            <span
              className="font-sans"
              style={{ fontSize: '20px', fontStyle: 'italic', color: '#9a9a9a' }}
            >
              Search for <span style={{ fontStyle: 'normal', color: '#9a9a9a' }}>“</span>
              <span style={{ fontStyle: 'normal', color: '#000' }}>{query}</span>
              <span style={{ fontStyle: 'normal', color: '#9a9a9a' }}>”</span>
            </span>
          </div>
          {results.map((r) => (
            <Link
              key={r.slug}
              href={`/home/${r.category}/${r.slug}`}
              onClick={onClose}
              className="relative block focus:outline-none"
              style={{
                paddingLeft: '92px',
                height: '94px',
                borderTop: '1px solid #e0e0e0',
              }}
            >
              <div className="relative flex h-full items-center">
                <div
                  className="overflow-hidden rounded-full bg-gray-300"
                  style={{ width: '44px', height: '44px' }}
                  aria-hidden
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.image} alt="" className="h-full w-full object-cover" />
                </div>
                <span
                  className="font-sans"
                  style={{ fontSize: '24px', marginLeft: '28px', color: '#000' }}
                >
                  {r.title}
                </span>
              </div>
            </Link>
          ))}
          {results.length === 0 ? (
            <div
              className="py-8 text-center font-sans"
              style={{ fontSize: '22px', color: '#9a9a9a' }}
            >
              No results.
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Keyboard draggable, anclado por defecto al bottom */}
      <DraggableKeyboard storageKey="kiosk_keyboard_pos:search">
        <OnScreenKeyboard onKey={handleKey} />
      </DraggableKeyboard>
    </div>
  );
}
