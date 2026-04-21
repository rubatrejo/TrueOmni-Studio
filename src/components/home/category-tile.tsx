import Link from 'next/link';

import type { HomeTile } from '@/lib/config';

/**
 * Tile 460×460 rx=9 verbatim del SVG Dashboard. Foto + overlay #11100d al
 * 35.2% + label centrado (x=230 relativo al tile, y=249 baseline) fontSize 50
 * Montserrat-Bold white. Click navega a /home/{key}.
 */
export function CategoryTile({ tile }: { tile: HomeTile }) {
  return (
    <Link
      href={`/home/${tile.key}`}
      className="relative block overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white"
      style={{ width: '460px', height: '460px', borderRadius: '9px' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={tile.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(17,16,13,0.352)' }} />
      {/* Label centrado: SVG tiene x=230 (centro del tile) con tspan x negativo
          para right-align de cada word. Reproducimos con flex-center + textAlign. */}
      <span
        className="absolute flex items-center justify-center text-center font-display font-bold uppercase leading-[1.22] text-white"
        style={{
          left: '0',
          right: '0',
          top: '0',
          bottom: '0',
          fontSize: '50px',
          letterSpacing: '0.02em',
          whiteSpace: 'pre-line',
        }}
      >
        {tile.label.toUpperCase()}
      </span>
    </Link>
  );
}
