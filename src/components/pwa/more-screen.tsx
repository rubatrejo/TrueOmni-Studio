'use client';

import { useRouter } from 'next/navigation';

import type { PwaMoreItem } from '@/lib/config';

import { PwaBottomNav } from './bottom-nav';
import { InboxIcon, SearchIcon } from './dashboard-icons';
import { Layer } from './mobile-layer';

const BRAND = 'hsl(var(--brand-primary))';
const OLIVE = 'hsl(var(--brand-tertiary))';
const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

/**
 * Destino de cada item del More. Solo se cablean los que ya tienen pantalla;
 * el resto queda sin navegación hasta que exista su módulo.
 */
const ITEM_HREF: Record<string, string> = {
  'connect-with-us': '/pwa/connect-with-us',
  'my-profile': '/pwa/profile',
};

interface MoreScreenProps {
  searchPlaceholder: string;
  weatherText: string;
  items: PwaMoreItem[];
}

/**
 * More Menu de la PWA (`/pwa/more`) — pantalla 04. Último icono del bottom nav.
 *
 * Verbatim del XD (375×812): header (search bar 285×32 blanco 25% + inbox) +
 * banda olive (`--brand-tertiary`) con ubicación/clima + lista de accesos
 * centrados (16px) + bottom nav con "more" activo. White-label: textos e items
 * desde `config.features.pwa.more`; colores por token.
 */
export function MoreScreen({ searchPlaceholder, weatherText, items }: MoreScreenProps) {
  const router = useRouter();
  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header: search bar + inbox */}
      <Layer h={110} className="relative z-10 shrink-0" style={{ backgroundColor: BRAND }}>
        <div
          className="absolute flex items-center gap-[9px] rounded-[2px] px-[10px]"
          style={{
            left: 20,
            top: 56,
            width: 285,
            height: 32,
            backgroundColor: 'hsl(0 0% 100% / 0.25)',
          }}
        >
          <SearchIcon size={14} className="shrink-0 text-white" />
          <span className="truncate text-white" style={{ fontSize: 16, ...OPEN_SANS }}>
            {searchPlaceholder}
          </span>
        </div>
        <div className="absolute text-white" style={{ left: 334, top: 61 }}>
          <InboxIcon size={24} />
        </div>
      </Layer>

      {/* Banda olive: ubicación + clima */}
      <Layer h={43} className="shrink-0" style={{ backgroundColor: OLIVE }}>
        <div
          className="absolute inset-0 flex items-center justify-center text-white"
          style={{ fontSize: 14, ...OPEN_SANS }}
        >
          {weatherText}
        </div>
      </Layer>

      {/* Lista de accesos (centrados, spacing 52 del XD) */}
      <div className="scrollbar-hide flex-1 overflow-y-auto bg-background">
        {items.map((it) => {
          const href = ITEM_HREF[it.key];
          return (
            <button
              key={it.key}
              type="button"
              onClick={() => href && router.push(href)}
              className="flex h-[54px] w-full items-center justify-center text-foreground"
              style={{ fontSize: 16, ...OPEN_SANS }}
            >
              {it.label}
            </button>
          );
        })}
      </div>

      {/* Bottom nav fijo, "more" activo */}
      <PwaBottomNav active="more" />
    </div>
  );
}
