'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { MapCanvas } from '@/components/map/map-canvas';
import { resolveAssetUrl } from '@/lib/asset-url';
import type { ScavengerTask } from '@/lib/config';
import type { MapSource } from '@/lib/config';
import type { MapItem } from '@/lib/map-item';

import { TaskTypeIcon } from './task-type-icon';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

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
    <div className="flex h-full flex-col">
      {/* Mapa */}
      <div className="relative flex-1" style={{ minHeight: 350 }}>
        <MapCanvas
          token={token}
          items={mapItems}
          center={center}
          zoom={13}
          selectedSlug={selectedSlug}
          onSelect={setSelectedSlug}
          cluster={false}
          pinScale={0.8}
          className="h-full w-full"
        />
      </div>

      {/* Carrusel de tasks */}
      <div className="scrollbar-hide flex gap-3 overflow-x-auto bg-white px-3 py-3">
        {remaining.map((t) => (
          <button
            key={t.slug}
            type="button"
            onClick={() => {
              setSelectedSlug(t.slug);
              router.push(`/pwa/scavenger-hunt/${huntSlug}/${t.slug}`);
            }}
            className="flex shrink-0 items-center gap-2 rounded-[10px] bg-white p-2 shadow-md"
            style={{ width: 180 }}
          >
            <div
              className="h-[50px] w-[50px] shrink-0 rounded-[8px] bg-cover bg-center"
              style={{ backgroundImage: `url(${resolveAssetUrl(t.image)})` }}
            />
            <div className="flex-1 text-left" style={OPEN_SANS}>
              <p className="line-clamp-1 text-[11px] font-bold text-gray-800">{t.name}</p>
              <div className="mt-1 flex items-center gap-1">
                <TaskTypeIcon type={t.type} size={14} />
                <span className="text-[9px] text-gray-400">
                  {t.type === 'photo' ? 'Photo' : t.type === 'checkin' ? 'Check-in' : 'Trivia'}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
