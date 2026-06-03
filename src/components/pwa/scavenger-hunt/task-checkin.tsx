'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMemo } from 'react';

import { MapCanvas } from '@/components/map/map-canvas';
import { useHuntProgress } from '@/hooks/use-hunt-progress';
import { resolveAssetUrl } from '@/lib/asset-url';
import type { ScavengerTask, PwaScavengerHuntConfig } from '@/lib/config';
import { haversineMi } from '@/lib/listings-sort';
import type { MapItem } from '@/lib/map-item';

import { PwaBottomNav } from '../bottom-nav';
import { S } from '../mobile-layer';
import { PwaAlertModal } from '../pwa-alert-modal';
import { PwaSubHeader } from '../pwa-sub-header';

import { TaskCompleted } from './task-completed';
import { TaskTypeIcon } from './task-type-icon';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;
const METERS_PER_MILE = 1609.34;

/** Mini mapa inline para el detalle del checkin task. */
function MiniMap({ task, token }: { task: ScavengerTask; token?: string }) {
  const items: MapItem[] = useMemo(
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
  if (!token) return null;
  return (
    <div className="mx-4 mt-1 h-[90px] overflow-hidden rounded-[8px]">
      <MapCanvas
        token={token}
        items={items}
        center={task.coords}
        zoom={14}
        selectedSlug={null}
        onSelect={() => {}}
        cluster={false}
        pinScale={0.5}
        className="h-full w-full"
      />
    </div>
  );
}

interface TaskCheckinProps {
  huntSlug: string;
  huntName: string;
  task: ScavengerTask;
  config: PwaScavengerHuntConfig;
  totalTasks: number;
  mapboxToken?: string;
  clientName: string;
}

/**
 * Check-in Task: muestra detalle + botón CHECK-IN. Al tap abre mapa GPS con
 * geofence. Cuando está dentro del radio, permite check-in.
 */
export function TaskCheckin({
  huntSlug,
  huntName,
  task,
  config,
  totalTasks,
  mapboxToken,
  clientName,
}: TaskCheckinProps) {
  const [mapMode, setMapMode] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [distanceM, setDistanceM] = useState<number | null>(null);
  const [geoError, setGeoError] = useState(false);
  const { completeTask, isTaskCompleted } = useHuntProgress(huntSlug, totalTasks);

  const radius = task.checkinRadius ?? 100;
  const isNear = distanceM !== null && distanceM <= radius;

  // Watch position
  useEffect(() => {
    if (!mapMode) return;
    if (!navigator.geolocation) {
      setGeoError(true);
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const d = haversineMi(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          { lat: task.coords.lat, lng: task.coords.lng },
        );
        setDistanceM(Math.round(d * METERS_PER_MILE));
      },
      () => setGeoError(true),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [mapMode, task.coords.lat, task.coords.lng]);

  const handleCheckin = useCallback(() => {
    completeTask(task.slug);
    setCompleted(true);
  }, [completeTask, task.slug]);

  if (isTaskCompleted(task.slug) || completed) {
    return (
      <TaskCompleted
        huntSlug={huntSlug}
        huntName={huntName}
        task={task}
        config={config}
        variant="checkin"
        clientName={clientName}
      />
    );
  }

  // Map GPS mode
  if (mapMode) {
    const mapItems: MapItem[] = [
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
    ];
    return (
      <div className="relative flex h-full w-full flex-col bg-gray-100">
        {/* Header */}
        <div className="relative z-10 shrink-0" style={{ height: 90 * S }}>
          <div
            className="absolute left-0 top-0"
            style={{
              width: 375,
              height: 90,
              transform: `scale(${S})`,
              transformOrigin: 'top left',
            }}
          >
            <PwaSubHeader
              title={huntName}
              backHref={`/pwa/scavenger-hunt/${huntSlug}/${task.slug}`}
            />
          </div>
        </div>

        {/* Mapa real full-bleed + geofence + banner inferior (verbatim #10) */}
        <div className="relative flex-1 overflow-hidden">
          {mapboxToken ? (
            <MapCanvas
              token={mapboxToken}
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
            <div className="flex h-full items-center justify-center text-[13px] text-gray-400">
              Map unavailable
            </div>
          )}

          {/* Geofence circle (centrado sobre el destino) */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              className="h-[150px] w-[150px] rounded-full border-[3px]"
              style={{
                borderColor: isNear ? '#43a047' : 'hsl(var(--brand-primary))',
                backgroundColor: isNear
                  ? 'hsl(120 40% 50% / 0.18)'
                  : 'hsl(var(--brand-primary) / 0.18)',
              }}
            />
          </div>

          {/* Distance badge */}
          {distanceM !== null && (
            <div
              className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-[12px] font-bold text-gray-700 shadow"
              style={OPEN_SANS}
            >
              {distanceM < 1000 ? `${distanceM}m away` : `${(distanceM / 1000).toFixed(1)}km away`}
            </div>
          )}

          {/* Banner inferior sobre el mapa */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0">
            {isNear ? (
              <div className="pointer-events-auto px-4 pb-4">
                <button
                  type="button"
                  onClick={handleCheckin}
                  className="w-full rounded-full py-[13px] text-center text-[14px] font-bold uppercase text-white"
                  style={{ ...OPEN_SANS, backgroundColor: 'hsl(var(--brand-primary))' }}
                >
                  {config.taskDetail.checkIn}
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-t from-black/75 via-black/40 to-transparent px-4 pb-5 pt-12 text-center">
                <p className="text-[15px] font-bold text-white" style={OPEN_SANS}>
                  {config.taskDetail.goToPoint}
                </p>
              </div>
            )}
          </div>
        </div>

        <PwaBottomNav />

        {/* Geo error modal */}
        <PwaAlertModal
          open={geoError}
          onClose={() => {
            setGeoError(false);
            setMapMode(false);
          }}
          title="Location Required"
          body="Please enable location services to use the check-in feature."
          primaryCta="OK"
        />
      </div>
    );
  }

  // Task detail (before opening map)
  return (
    <div className="relative flex h-full w-full flex-col bg-white">
      <div className="relative z-10 shrink-0" style={{ height: 90 * S }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: 375, height: 90, transform: `scale(${S})`, transformOrigin: 'top left' }}
        >
          <PwaSubHeader title={huntName} backHref={`/pwa/scavenger-hunt/${huntSlug}`} />
        </div>
      </div>

      <div className="scrollbar-hide flex-1 overflow-y-auto">
        {/* Hero */}
        <div
          className="relative h-[200px] w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${resolveAssetUrl(task.image)})` }}
        >
          <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute right-3 top-3">
            <TaskTypeIcon type="checkin" size={32} />
          </div>
          <span
            className="absolute bottom-3 left-4 text-[16px] font-bold text-white"
            style={OPEN_SANS}
          >
            {task.name}
          </span>
        </div>

        <div className="px-4 py-3">
          <button
            type="button"
            onClick={() => setMapMode(true)}
            className="w-full rounded-[6px] py-[10px] text-center text-[13px] font-bold uppercase tracking-wider text-white"
            style={{ ...OPEN_SANS, backgroundColor: 'hsl(var(--brand-primary))' }}
          >
            {config.taskDetail.checkIn}
          </button>
        </div>

        {/* Mini mapa */}
        <MiniMap task={task} token={mapboxToken} />

        {task.address && (
          <div className="px-4 pt-1" style={OPEN_SANS}>
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
