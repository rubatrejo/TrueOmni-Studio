'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import type { HomeListing } from '@/lib/config';

import { SearchBar } from './search-bar';
import { SearchOverlay } from './search-overlay';

/**
 * Shell client-side del Home. Manda el estado del modal de búsqueda para que
 * el SearchBar abra un overlay DENTRO del frame del kiosk (no una nueva ruta).
 * El header se recibe como prop (render server-side desde el layout).
 */
export function HomeShell({
  header,
  listings,
  children,
}: {
  header: ReactNode;
  listings: readonly HomeListing[];
  children: ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: '#f8f8f8' }}
    >
      {header}
      <SearchBar onOpen={() => setSearchOpen(true)} />
      <main
        className="scrollbar-hide flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ paddingTop: '40px', paddingBottom: '120px' }}
      >
        {children}
      </main>
      {/* Scroll-hint gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-20"
        style={{
          height: '180px',
          background:
            'linear-gradient(to top, #f8f8f8 0%, rgba(248,248,248,0.85) 30%, rgba(248,248,248,0) 100%)',
        }}
      />
      {/* Search modal overlay — fixed inset-0 se contiene al canvas (tiene
          transform:scale → fixed es relativo al canvas), cubre SOLO el frame. */}
      {searchOpen ? (
        <SearchOverlay listings={listings} onClose={() => setSearchOpen(false)} />
      ) : null}
    </div>
  );
}
