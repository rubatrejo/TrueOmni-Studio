'use client';

import Image from 'next/image';

import { useSubcategoryLabel } from '@/components/i18n-provider';
import type { LocalListingItinerary } from '@/lib/config';
import type { ItineraryCatalogItem } from '@/lib/itinerary-catalog';

function SubcategoryText({ subcategory }: { subcategory: string }) {
  const label = useSubcategoryLabel(subcategory);
  return <>{label}</>;
}

export interface LocalListingPreviewProps {
  itinerary: LocalListingItinerary;
  /** Resolver el item completo de cada stop (para thumbnails y títulos). */
  resolveItem: (slug: string, kind: 'listing' | 'event' | 'trail') => ItineraryCatalogItem | null;
  useCtaLabel: string;
  /** Plantilla "{n} stops". */
  stopsCountTemplate: string;
  closeAriaLabel?: string;
  onUse: () => void;
  onClose: () => void;
}

/** Modal full-screen con preview de un itinerario pre-armado. */
export function LocalListingPreview(props: LocalListingPreviewProps) {
  const { itinerary, resolveItem, useCtaLabel, onUse, onClose } = props;

  return (
    <div className="absolute inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/55" onPointerDown={onClose} aria-hidden="true" />
      <div
        className="relative z-10 flex w-full flex-col rounded-t-[28px] bg-white shadow-2xl"
        style={{ height: 1500 }}
      >
        <div className="relative w-full overflow-hidden rounded-t-[28px]" style={{ height: 380 }}>
          {itinerary.image ? (
            <Image
              src={itinerary.image}
              alt={itinerary.title}
              fill
              sizes="1080px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-zinc-300" />
          )}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{
              height: 200,
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.78) 100%)',
            }}
          />
          <div className="absolute inset-x-8 bottom-6 text-white">
            <p className="text-[14px] uppercase tracking-wider opacity-90">
              {props.stopsCountTemplate.replace('{n}', String(itinerary.stops.length))}
            </p>
            <h2 className="mt-1 text-[40px] font-bold leading-tight drop-shadow">
              {itinerary.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={props.closeAriaLabel ?? 'Close'}
            className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full bg-foreground/85 text-white"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <p className="text-[16px] leading-relaxed text-zinc-700">{itinerary.description}</p>

          <ul className="mt-6 space-y-3">
            {itinerary.stops.map((stop, i) => {
              const item = resolveItem(stop.slug, stop.kind);
              return (
                <li
                  key={`${stop.kind}:${stop.slug}`}
                  className="relative flex items-center gap-4 overflow-hidden rounded-md bg-zinc-50 p-3"
                >
                  <div
                    className="relative flex-shrink-0 overflow-hidden rounded-md bg-zinc-300"
                    style={{ width: 90, height: 90 }}
                  >
                    {item?.image ? (
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="90px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : null}
                    <span
                      className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white"
                    >
                      {i + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[16px] font-semibold text-foreground">
                      {item?.title ?? stop.slug}
                    </p>
                    {item ? (
                      <p className="text-[12px] uppercase tracking-wider text-muted-foreground">
                        <SubcategoryText subcategory={item.subcategory} />
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-zinc-200 px-8 py-5">
          <button
            type="button"
            onClick={onUse}
            className="flex h-[64px] w-full items-center justify-center rounded-full bg-primary text-[20px] font-semibold text-white shadow-md transition hover:opacity-95"
          >
            {useCtaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
