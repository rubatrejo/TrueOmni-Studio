'use client';

import type { PwaWayfindingModuleConfig, WayfindingAmenity, WayfindingFloor } from '@/lib/config';

import { move, PwaField, PwaGroup, PwaPanelHeader, ReorderButtons } from './pwa-ui';

/**
 * Editor del módulo Wayfinding (PWA-only). v1 cubre los textos white-label y
 * el orden/etiquetas de pisos y amenidades. Las coordenadas, rutas y pasos
 * geométricos (data técnica del setup inicial) no se editan aquí todavía.
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

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Wayfinding"
        description="Indoor navigation texts, floors and amenities. Floor plans, coordinates and route geometry come from the initial setup."
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
            label="“You are here” label"
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
                </div>
                {f.amenities.length > 0 ? (
                  <div className="ml-2 space-y-2 border-l border-zinc-200 pl-3 dark:border-zinc-800">
                    {f.amenities.map((a, ai) => (
                      <div key={a.slug} className="flex items-start gap-2">
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
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          )}
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
