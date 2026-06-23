'use client';

import { resolveAssetUrl } from '@/lib/asset-url';

import { useDevice } from '../device-context';
import { PwaHeart } from '../pwa-heart';

import type { TpLocalListing } from './types';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

/** Card de itinerario pre-armado: collage de hasta 3 imágenes + overlay + heart. */
export function TpLocalListingCard({
  ll,
  inPlan,
  onToggle,
  distanceTemplate,
  eyebrow,
}: {
  ll: TpLocalListing;
  inPlan: boolean;
  onToggle: () => void;
  /** `config.textos.itinerary_distance_away` = "{n} mi away". */
  distanceTemplate: string;
  /** Eyebrow uppercase (ej. label de Local Listings). */
  eyebrow: string;
}) {
  const { isTablet } = useDevice();
  return (
    <div
      className="relative w-full shrink-0 overflow-hidden"
      style={{ height: isTablet ? 230 : 150, ...OPEN_SANS }}
    >
      {/* Collage */}
      <div className="absolute inset-0 flex">
        {ll.images.map((img, i) => (
          <span
            key={i}
            className="h-full flex-1 bg-cover bg-center"
            style={{ backgroundImage: `url("${resolveAssetUrl(img)}")` }}
          />
        ))}
      </div>
      <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />

      <button
        type="button"
        aria-label="Use itinerary"
        onClick={onToggle}
        className="absolute right-2.5 top-2.5 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/90"
      >
        <PwaHeart filled={inPlan} size={20} />
      </button>

      <div className="absolute bottom-2.5 left-3.5 right-12">
        <p className="text-[10px] font-bold uppercase tracking-wide text-white/80">{eyebrow}</p>
        <p className="truncate text-[17px] font-bold leading-tight text-white drop-shadow">
          {ll.title}
        </p>
        <p className="text-[12px] text-white/90">
          {distanceTemplate.replace('{n}', ll.distanceMi.toFixed(1))}
        </p>
        {ll.openUntil ? (
          <p className="text-[12px] font-semibold" style={{ color: 'hsl(var(--brand-tertiary))' }}>
            {ll.openUntil}
          </p>
        ) : null}
      </div>
    </div>
  );
}
