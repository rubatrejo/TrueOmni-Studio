'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { MapCanvas } from '@/components/map/map-canvas';
import { resolveAssetUrl } from '@/lib/asset-url';
import type { ScavengerTask } from '@/lib/config';
import type { MapSource } from '@/lib/config';
import type { MapItem } from '@/lib/map-item';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

const TYPE_COLOR: Record<ScavengerTask['type'], string> = {
  photo: 'hsl(var(--brand-primary))',
  checkin: 'hsl(var(--brand-secondary))',
  question: 'hsl(var(--brand-tertiary))',
};

/** Badge circular blanco con glifo del tipo de task (verbatim #3). */
function CardBadge({ type }: { type: ScavengerTask['type'] }) {
  const color = TYPE_COLOR[type];
  return (
    <div className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-white shadow">
      {type === 'photo' && (
        <svg width={17} height={17} viewBox="0 0 24 24" fill={color}>
          <path d="M9 4l-1.2 2H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-3.8L15 4H9zm3 13a4.5 4.5 0 110-9 4.5 4.5 0 010 9z" />
        </svg>
      )}
      {type === 'checkin' && (
        <svg width={17} height={17} viewBox="0 0 24 24" fill={color}>
          <path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
        </svg>
      )}
      {type === 'question' && (
        <svg width={17} height={17} viewBox="0 0 24 24" fill="none">
          <text x="12" y="18" textAnchor="middle" fontSize="18" fontWeight="bold" fill={color}>
            ?
          </text>
        </svg>
      )}
    </div>
  );
}

interface HuntTaskMapProps {
  huntSlug: string;
  tasks: ScavengerTask[];
  token: string;
  isTaskCompleted: (slug: string) => boolean;
}

/**
 * Tab Map del hunt detail: mapa Mapbox con pins de tasks + carrusel
 * de task cards en la parte inferior.
 */
export function HuntTaskMap({ huntSlug, tasks, token, isTaskCompleted }: HuntTaskMapProps) {
  const router = useRouter();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const remaining = tasks.filter((t) => !isTaskCompleted(t.slug));

  // Center on first task
  const center = useMemo(() => {
    const first = remaining[0] ?? tasks[0];
    return first
      ? { lat: first.coords.lat, lng: first.coords.lng }
      : { lat: 40.646, lng: -111.498 };
  }, [remaining, tasks]);

  // Convert tasks to MapItems
  const mapItems: MapItem[] = useMemo(
    () =>
      remaining.map((t) => ({
        slug: t.slug,
        source: 'things-to-do' as MapSource,
        moduleSlug: 'scavenger-hunt',
        title: t.name,
        subcategory: t.type,
        image: t.image,
        coords: { lat: t.coords.lat, lng: t.coords.lng },
        address: t.address ?? '',
        features: [],
        popularity: 0,
      })),
    [remaining],
  );

  return (
    <div className="relative mt-2 w-full flex-1 overflow-hidden">
      {/* Mapa full-bleed (verbatim #3) */}
      <MapCanvas
        token={token}
        items={mapItems}
        center={center}
        zoom={13}
        selectedSlug={selectedSlug}
        onSelect={setSelectedSlug}
        cluster={false}
        pinScale={0.5}
        className="h-full w-full"
      />

      {/* Carrusel de cards flotando sobre el mapa */}
      <div className="scrollbar-hide absolute inset-x-0 bottom-0 flex gap-3 overflow-x-auto px-4 pb-4">
        {remaining.map((t) => (
          <button
            key={t.slug}
            type="button"
            onClick={() => {
              setSelectedSlug(t.slug);
              router.push(`/pwa/scavenger-hunt/${huntSlug}/${t.slug}`);
            }}
            className="relative h-[130px] shrink-0 overflow-hidden rounded-[14px] bg-cover bg-center shadow-lg"
            style={{ width: 250, backgroundImage: `url(${resolveAssetUrl(t.image)})` }}
          >
            <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
            <span
              className="absolute bottom-3 left-3 right-12 text-left text-[14px] font-bold leading-tight text-white drop-shadow"
              style={OPEN_SANS}
            >
              {t.name}
            </span>
            <div className="absolute bottom-3 right-3">
              <CardBadge type={t.type} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
