'use client';

import Image from 'next/image';

import type { LocalListingItinerary } from '@/lib/config';

export interface LocalListingsColumnProps {
  items: LocalListingItinerary[];
  onSelect: (slug: string) => void;
  emptyLabel: string;
  /** Plantilla "{n} stops". */
  stopsCountTemplate: string;
}

/**
 * Lista vertical de cards de itinerarios pre-armados (tab "Local Listings").
 * Cada card muestra cover + título + count de stops. Tap → preview.
 */
export function LocalListingsColumn(props: LocalListingsColumnProps) {
  return (
    <div
      className="absolute z-20"
      style={{ left: 30, top: 340, width: 400, bottom: 380 }}
    >
      <div className="flex h-full flex-col gap-3 overflow-y-auto pr-1">
        {props.items.length === 0 ? (
          <div className="mt-8 text-center text-[15px] text-muted-foreground">
            {props.emptyLabel}
          </div>
        ) : (
          props.items.map((it) => (
            <button
              key={it.slug}
              type="button"
              onClick={() => props.onSelect(it.slug)}
              className="relative flex-shrink-0 overflow-hidden rounded-[10px] bg-zinc-900 text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ width: 360, height: 200 }}
            >
              {it.image ? (
                <Image
                  src={it.image}
                  alt={it.title}
                  fill
                  sizes="360px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 bg-zinc-700" />
              )}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0"
                style={{
                  height: 110,
                  background:
                    'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 100%)',
                }}
              />
              <div className="absolute inset-x-4 bottom-3 text-white">
                <p className="text-[20px] font-bold leading-tight drop-shadow">{it.title}</p>
                <p className="mt-1 text-[13px] uppercase tracking-wider opacity-90">
                  {props.stopsCountTemplate.replace('{n}', String(it.stops.length))}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
