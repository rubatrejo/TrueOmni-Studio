'use client';

import Link from 'next/link';

import { useTextos } from '@/components/i18n-provider';
import type { HomeTile } from '@/lib/config';

/** Tamaño por defecto del título del tile (px). Verbatim del SVG Dashboard. */
export const DEFAULT_TILE_TITLE_FONT_SIZE = 50;

interface Props {
  tile: HomeTile;
  /** Si se provee, el tile dispara el callback en lugar de navegar. */
  onClick?: () => void;
  /** Tamaño de la tipografía del título (px). Global a todos los tiles del
   *  dashboard — editable desde el Studio (Home Dashboard → Home tiles). */
  titleFontSize?: number;
}

/**
 * Tile 460×460 rx=9 verbatim del SVG Dashboard. Foto + overlay #11100d al
 * 35.2% + label centrado. Click navega a /home/{key} por default, o dispara
 * onClick si se provee (patrón para overlays como Survey).
 *
 * El label viene del idioma activo via la key i18n `tile_label_${key}`
 * (con `-` reemplazado por `_`); si no existe, fallback al `tile.label`
 * literal del config.
 */
export function CategoryTile({
  tile,
  onClick,
  titleFontSize = DEFAULT_TILE_TITLE_FONT_SIZE,
}: Props) {
  const t = useTextos();
  const i18nKey = `tile_label_${tile.key.replace(/-/g, '_')}`;
  const resolved = t(i18nKey);
  const label = resolved === i18nKey ? tile.label : resolved;
  const content = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={tile.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(17,16,13,0.352)' }} />
      <span
        className="absolute flex items-center justify-center text-center font-display font-bold leading-[1.22] text-white"
        style={{
          left: '0',
          right: '0',
          top: '0',
          bottom: '0',
          fontSize: `${titleFontSize}px`,
          letterSpacing: '0.02em',
          whiteSpace: 'pre-line',
        }}
      >
        {label}
      </span>
    </>
  );

  // Tile ancho: ocupa las 2 columnas del grid (460+30+460 = 950px), misma altura.
  const sharedClassName = `relative block overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white${
    tile.wide ? ' col-span-2' : ''
  }`;
  const sharedStyle = {
    width: tile.wide ? '950px' : '460px',
    height: '460px',
    borderRadius: '9px',
  };

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={sharedClassName} style={sharedStyle}>
        {content}
      </button>
    );
  }

  return (
    <Link href={`/home/${tile.key}`} className={sharedClassName} style={sharedStyle}>
      {content}
    </Link>
  );
}
