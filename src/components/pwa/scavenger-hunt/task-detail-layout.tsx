'use client';

import { useMemo } from 'react';

import { MapCanvas } from '@/components/map/map-canvas';
import { resolveAssetUrl } from '@/lib/asset-url';
import type { ScavengerTask, PwaScavengerHuntConfig } from '@/lib/config';
import type { MapItem } from '@/lib/map-item';

import { PwaBottomNav } from '../bottom-nav';
import { S } from '../mobile-layer';
import { PwaSubHeader } from '../pwa-sub-header';

import { TaskTypeIcon } from './task-type-icon';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface TaskDetailLayoutProps {
  huntSlug: string;
  huntName: string;
  task: ScavengerTask;
  config: PwaScavengerHuntConfig;
  actionLabel: string;
  onAction: () => void;
  loading?: boolean;
  mapboxToken?: string;
}

/**
 * Layout compartido para Photo Task y Check-in Task: hero image + botón de
 * acción + mini mapa Mapbox + dirección + descripción.
 */
export function TaskDetailLayout({
  huntSlug,
  huntName,
  task,
  config,
  actionLabel,
  onAction,
  loading,
  mapboxToken,
}: TaskDetailLayoutProps) {
  const heroSrc = resolveAssetUrl(task.image);
  const token = mapboxToken ?? '';

  const mapItems: MapItem[] = useMemo(
    () => [
      {
        slug: task.slug,
        source: 'things-to-do' as MapItem['source'],
        moduleSlug: 'scavenger-hunt',
        title: task.name,
        subcategory: task.type,
        image: task.image,
        coords: { lat: task.coords.lat, lng: task.coords.lng },
        address: task.address ?? '',
        features: [],
        popularity: 0,
      },
    ],
    [task],
  );

  return (
    <div className="relative flex h-full w-full flex-col bg-white">
      {/* Header */}
      <div className="relative z-10 shrink-0" style={{ height: 90 * S }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: 375, height: 90, transform: `scale(${S})`, transformOrigin: 'top left' }}
        >
          <PwaSubHeader title={huntName} backHref={`/pwa/scavenger-hunt/${huntSlug}`} />
        </div>
      </div>

      <div className="scrollbar-hide flex-1 overflow-y-auto">
        {/* Hero image */}
        <div
          className="relative h-[200px] w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${heroSrc})` }}
        >
          <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {/* Icon overlay */}
          <div className="absolute right-3 top-3">
            <TaskTypeIcon type={task.type} size={32} />
          </div>
          {/* Name */}
          <span
            className="absolute bottom-3 left-4 text-[16px] font-bold text-white"
            style={OPEN_SANS}
          >
            {task.name}
          </span>
        </div>

        {/* Action button */}
        <div className="px-4 py-3">
          <button
            type="button"
            onClick={onAction}
            disabled={loading}
            className="w-full rounded-[6px] py-[10px] text-center text-[13px] font-bold uppercase tracking-wider text-white disabled:opacity-50"
            style={{ ...OPEN_SANS, backgroundColor: 'hsl(var(--brand-primary))' }}
          >
            {loading ? 'Completing...' : actionLabel}
          </button>
        </div>

        {/* Mini mapa Mapbox */}
        <div className="mx-4 mt-1 h-[90px] overflow-hidden rounded-[8px]">
          {token ? (
            <MapCanvas
              token={token}
              items={mapItems}
              center={task.coords}
              zoom={14}
              selectedSlug={null}
              onSelect={() => {}}
              cluster={false}
              pinScale={0.5}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-100 text-[11px] text-gray-400">
              Map unavailable
            </div>
          )}
        </div>

        {/* Address + directions */}
        {task.address && (
          <div className="px-4 pt-3" style={OPEN_SANS}>
            <p className="text-[12px] text-gray-600">{task.address}</p>
            {task.directionsUrl && (
              <a
                href={task.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] font-bold"
                style={{ color: 'hsl(var(--brand-primary))' }}
              >
                {config.taskDetail.seeDirections}
              </a>
            )}
          </div>
        )}

        {/* Description */}
        <div className="px-4 pb-6 pt-4" style={OPEN_SANS}>
          <h3
            className="mb-2 border-b pb-1 text-[14px] font-bold"
            style={{ color: 'hsl(var(--brand-primary))', borderColor: 'hsl(var(--brand-primary))' }}
          >
            {config.taskDetail.descriptionLabel}
          </h3>
          <p className="text-[12px] leading-relaxed text-gray-600">{task.description}</p>
        </div>
      </div>

      <PwaBottomNav />
    </div>
  );
}
