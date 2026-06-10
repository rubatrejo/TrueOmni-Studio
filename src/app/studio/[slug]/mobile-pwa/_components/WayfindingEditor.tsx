'use client';

import type { PwaWayfindingModuleConfig, WayfindingAmenity, WayfindingFloor } from '@/lib/config';

import { useToast } from '../../../_components/Toast';

import { FloorPointField } from './FloorPointField';
import {
  AddItemButton,
  DeleteItemButton,
  makeBlankAmenity,
  makeBlankFloor,
} from './pwa-list-helpers';
import { move, PwaField, PwaGroup, PwaPanelHeader, ReorderButtons } from './pwa-ui';

/**
 * Editor del módulo Wayfinding (PWA-only). Cubre textos white-label, orden y
 * etiquetas de pisos/amenidades, imagen del plano, puntos de origen/destino y
 * waypoints de ruta editables sobre la imagen del plano.
 */

const EMPTY: PwaWayfindingModuleConfig = {
  title: '',
  subtitle: '',
  youAreHereLabel: '',
  welcome: { title: '', description: '', tagline: '', button: '' },
  floors: [],
  directions: { goBack: '', thanks: '' },
};

export function WayfindingEditor({
  value,
  onChange,
}: {
  value: PwaWayfindingModuleConfig | undefined;
  onChange: (next: PwaWayfindingModuleConfig) => void;
}) {
  const v: PwaWayfindingModuleConfig = {
    ...EMPTY,
    ...value,
    welcome: { ...EMPTY.welcome, ...value?.welcome },
    directions: { ...EMPTY.directions, ...value?.directions },
    floors: value?.floors ?? [],
  };

  const { show } = useToast();

  const updateFloor = (i: number, patch: Partial<WayfindingFloor>) =>
    onChange({ ...v, floors: v.floors.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) });

  const updateAmenity = (fi: number, ai: number, patch: Partial<WayfindingAmenity>) =>
    onChange({
      ...v,
      floors: v.floors.map((f, idx) =>
        idx === fi
          ? { ...f, amenities: f.amenities.map((a, j) => (j === ai ? { ...a, ...patch } : a)) }
          : f,
      ),
    });

  const addFloor = () => onChange({ ...v, floors: [...v.floors, makeBlankFloor()] });
  const removeFloor = (fi: number) => {
    const removed = v.floors[fi];
    const prev = v.floors;
    onChange({ ...v, floors: v.floors.filter((_, idx) => idx !== fi) });
    show(`Deleted floor "${removed?.label || removed?.key}"`, {
      variant: 'info',
      durationMs: 6000,
      action: { label: 'Undo', onClick: () => onChange({ ...v, floors: prev }) },
    });
  };
  const addAmenity = (fi: number) =>
    updateFloor(fi, { amenities: [...v.floors[fi]!.amenities, makeBlankAmenity()] });
  const removeAmenity = (fi: number, ai: number) => {
    const floor = v.floors[fi]!;
    const removed = floor.amenities[ai];
    const prev = floor.amenities;
    updateFloor(fi, { amenities: floor.amenities.filter((_, j) => j !== ai) });
    show(`Deleted amenity "${removed?.name || removed?.slug}"`, {
      variant: 'info',
      durationMs: 6000,
      action: { label: 'Undo', onClick: () => updateFloor(fi, { amenities: prev }) },
    });
  };
  const addRoutePoint = (fi: number, ai: number) => {
    const a = v.floors[fi]!.amenities[ai]!;
    updateAmenity(fi, ai, { routePoints: [...a.routePoints, { x: 50, y: 50 }] });
  };
  const removeRoutePoint = (fi: number, ai: number, pi: number) => {
    const a = v.floors[fi]!.amenities[ai]!;
    updateAmenity(fi, ai, { routePoints: a.routePoints.filter((_, j) => j !== pi) });
  };
  const setRoutePoint = (fi: number, ai: number, pi: number, p: { x: number; y: number }) => {
    const a = v.floors[fi]!.amenities[ai]!;
    updateAmenity(fi, ai, { routePoints: a.routePoints.map((rp, j) => (j === pi ? p : rp)) });
  };

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Wayfinding"
        description="Indoor navigation: add/remove floors and amenities, set floor plan images and place origin, destination and route waypoints on the map."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <PwaGroup title="Header">
          <PwaField label="Title" value={v.title} onChange={(t) => onChange({ ...v, title: t })} />
          <PwaField
            label="Subtitle"
            value={v.subtitle}
            onChange={(t) => onChange({ ...v, subtitle: t })}
          />
          <PwaField
            label={'“You are here” label'}
            value={v.youAreHereLabel}
            onChange={(t) => onChange({ ...v, youAreHereLabel: t })}
          />
        </PwaGroup>

        <PwaGroup title="Welcome modal">
          <PwaField
            label="Title"
            value={v.welcome.title}
            onChange={(t) => onChange({ ...v, welcome: { ...v.welcome, title: t } })}
          />
          <PwaField
            label="Description"
            multiline
            value={v.welcome.description}
            onChange={(t) => onChange({ ...v, welcome: { ...v.welcome, description: t } })}
          />
          <PwaField
            label="Tagline"
            value={v.welcome.tagline}
            onChange={(t) => onChange({ ...v, welcome: { ...v.welcome, tagline: t } })}
          />
          <PwaField
            label="Button"
            value={v.welcome.button}
            onChange={(t) => onChange({ ...v, welcome: { ...v.welcome, button: t } })}
          />
        </PwaGroup>

        <PwaGroup title="Floors & amenities">
          {v.floors.length === 0 ? (
            <p className="text-[12px] text-zinc-400 dark:text-zinc-500">No floors configured.</p>
          ) : (
            v.floors.map((f, fi) => (
              <div
                key={f.key}
                className="space-y-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <div className="flex items-start gap-2">
                  <ReorderButtons
                    index={fi}
                    count={v.floors.length}
                    onMove={(to) => onChange({ ...v, floors: move(v.floors, fi, to) })}
                  />
                  <div className="flex-1">
                    <PwaField
                      label={`Floor · ${f.key}`}
                      value={f.label}
                      onChange={(label) => updateFloor(fi, { label })}
                    />
                  </div>
                  <DeleteItemButton label="Delete floor" onClick={() => removeFloor(fi)} />
                </div>
                <PwaField
                  label="Floor plan image (asset path)"
                  value={f.floorPlanImage}
                  onChange={(floorPlanImage) => updateFloor(fi, { floorPlanImage })}
                />
                <FloorPointField
                  label={'"You are here" origin'}
                  point={f.origin}
                  imageUrl={f.floorPlanImage}
                  accent="#10b981"
                  onChange={(origin) => updateFloor(fi, { origin })}
                />
                <div className="ml-2 space-y-3 border-l border-zinc-200 pl-3 dark:border-zinc-800">
                  {f.amenities.map((a, ai) => (
                    <div
                      key={a.slug}
                      className="space-y-2 rounded-md border border-zinc-100 p-2 dark:border-zinc-900"
                    >
                      <div className="flex items-start gap-2">
                        <ReorderButtons
                          index={ai}
                          count={f.amenities.length}
                          onMove={(to) => updateFloor(fi, { amenities: move(f.amenities, ai, to) })}
                        />
                        <div className="flex-1">
                          <PwaField
                            label={`Amenity · ${a.slug}`}
                            value={a.name}
                            onChange={(name) => updateAmenity(fi, ai, { name })}
                          />
                        </div>
                        <DeleteItemButton
                          label="Delete amenity"
                          onClick={() => removeAmenity(fi, ai)}
                        />
                      </div>
                      <PwaField
                        label="Image (asset path)"
                        value={a.image}
                        onChange={(image) => updateAmenity(fi, ai, { image })}
                      />
                      <FloorPointField
                        label="Destination"
                        point={a.destination}
                        imageUrl={f.floorPlanImage}
                        accent="#0ea5e9"
                        onChange={(destination) => updateAmenity(fi, ai, { destination })}
                      />
                      <div className="space-y-2">
                        <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                          Route points
                        </span>
                        {a.routePoints.map((rp, pi) => (
                          <div key={pi} className="flex items-start gap-2">
                            <div className="flex-1">
                              <FloorPointField
                                label={`Waypoint ${pi + 1}`}
                                point={rp}
                                imageUrl={f.floorPlanImage}
                                accent="#f59e0b"
                                onChange={(p) => setRoutePoint(fi, ai, pi, p)}
                              />
                            </div>
                            <DeleteItemButton
                              label="Delete waypoint"
                              onClick={() => removeRoutePoint(fi, ai, pi)}
                            />
                          </div>
                        ))}
                        <AddItemButton label="Add waypoint" onClick={() => addRoutePoint(fi, ai)} />
                      </div>
                    </div>
                  ))}
                  <AddItemButton label="Add amenity" onClick={() => addAmenity(fi)} />
                </div>
              </div>
            ))
          )}
          <AddItemButton label="Add floor" onClick={addFloor} />
        </PwaGroup>

        <PwaGroup title="Directions screen">
          <PwaField
            label="Go back"
            value={v.directions.goBack}
            onChange={(t) => onChange({ ...v, directions: { ...v.directions, goBack: t } })}
          />
          <PwaField
            label="Thanks"
            value={v.directions.thanks}
            onChange={(t) => onChange({ ...v, directions: { ...v.directions, thanks: t } })}
          />
        </PwaGroup>
      </div>
    </div>
  );
}
