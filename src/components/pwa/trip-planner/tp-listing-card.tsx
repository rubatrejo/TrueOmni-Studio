'use client';

import { resolveAssetUrl } from '@/lib/asset-url';

import { useDevice } from '../device-context';
import { PwaHeart } from '../pwa-heart';

import type { TpCard } from './types';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

/**
 * Card de la vista LIST: imagen full-width + gradiente + eyebrow/título/
 * distancia/horario en overlay + heart toggle (añade/quita del plan).
 */
export function TpListingCard({
  item,
  fav,
  onToggleFav,
  distanceTemplate,
}: {
  item: TpCard;
  fav: boolean;
  onToggleFav: () => void;
  /** `config.textos.itinerary_distance_away` = "{n} mi away". */
  distanceTemplate: string;
}) {
  const { isTablet } = useDevice();
  const distance = distanceTemplate.replace('{n}', item.distanceMi.toFixed(1));
  return (
    <div
      className="relative w-full shrink-0 overflow-hidden bg-cover bg-center"
      style={{
        height: isTablet ? 230 : 150,
        backgroundImage: `url("${resolveAssetUrl(item.image)}")`,
        ...OPEN_SANS,
      }}
    >
      <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />

      {/* Heart toggle */}
      <button
        type="button"
        aria-label="Add to plan"
        onClick={onToggleFav}
        className="absolute right-2.5 top-2.5 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/90"
      >
        <PwaHeart filled={fav} size={20} />
      </button>

      {/* Texto overlay */}
      <div className="absolute bottom-2.5 left-3.5 right-12">
        <p className="text-[10px] font-bold uppercase tracking-wide text-white/80">
          {item.subcategory}
        </p>
        <p className="truncate text-[17px] font-bold leading-tight text-white drop-shadow">
          {item.title}
        </p>
        <p className="text-[12px] text-white/90">{distance}</p>
        {item.openUntil ? (
          <p className="text-[12px] font-semibold" style={{ color: 'hsl(var(--brand-tertiary))' }}>
            {item.openUntil}
          </p>
        ) : null}
      </div>
    </div>
  );
}
