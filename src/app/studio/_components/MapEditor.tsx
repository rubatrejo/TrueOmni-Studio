'use client';

import { Locate, MapPin, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { EXTENDED_ICON_KEYS } from '@/components/map/map-pin-icons';
import {
  DEFAULT_MAP,
  MapSourceSchema,
  type MapConfig,
  type MapCustomPin,
  type MapSourceKey,
} from '@/lib/studio/schema';

/** Labels human-readable para el catálogo de iconos extendidos. */
const ICON_LABELS: Record<string, string> = {
  shopping: 'Shopping',
  coffee: 'Coffee',
  bar: 'Bar / Drinks',
  hospital: 'Hospital / Health',
  museum: 'Museum / Culture',
  bus: 'Transit / Bus',
  beach: 'Beach / Outdoor',
  info: 'Info / Help',
  parking: 'Parking',
  star: 'Featured',
};

const SOURCE_OPTIONS: ReadonlyArray<{ value: MapSourceKey; label: string; color: string }> = [
  { value: 'things-to-do', label: 'Things to Do', color: 'hsl(var(--brand-primary))' },
  { value: 'restaurants', label: 'Restaurants', color: 'hsl(var(--brand-secondary))' },
  { value: 'stay', label: 'Stay', color: 'hsl(var(--brand-tertiary))' },
  { value: 'events', label: 'Events', color: '#f16651' },
];

export function MapEditor({
  map,
  onChange,
}: {
  map: MapConfig;
  onChange: (next: MapConfig) => void;
}) {
  const center = map.defaultCenter ?? { lat: 33.4484, lng: -112.074 };

  return (
    <div className="space-y-6">
      <DefaultViewSection
        center={center}
        zoom={map.defaultZoom}
        useDefaultCenter={!map.defaultCenter}
        onChange={(next) => onChange({ ...map, ...next })}
      />

      <WelcomeCopySection
        copy={map.welcomeCopy}
        onChange={(welcomeCopy) => onChange({ ...map, welcomeCopy })}
      />

      <ChipsLabelsSection chips={map.chips} onChange={(chips) => onChange({ ...map, chips })} />

      <PinStylingSection
        pinSize={map.pinSize}
        categoryIcons={map.categoryIcons}
        onChange={(next) => onChange({ ...map, ...next })}
      />

      <CustomPinsSection
        pins={map.customPins}
        onChange={(customPins) => onChange({ ...map, customPins })}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Sections                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

function DefaultViewSection({
  center,
  zoom,
  useDefaultCenter,
  onChange,
}: {
  center: { lat: number; lng: number };
  zoom: number;
  useDefaultCenter: boolean;
  onChange: (next: { defaultCenter?: { lat: number; lng: number }; defaultZoom?: number }) => void;
}) {
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [addressQuery, setAddressQuery] = useState('');

  const handleGeocode = async () => {
    if (!addressQuery.trim()) {
      setGeocodeError('Enter an address first');
      return;
    }
    setGeocodeError(null);
    setGeocoding(true);
    try {
      const url =
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(addressQuery.trim())}&format=json&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
      const first = Array.isArray(data) ? data[0] : null;
      const lat = first ? Number(first.lat) : NaN;
      const lng = first ? Number(first.lon) : NaN;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setGeocodeError('Could not find that address');
        return;
      }
      onChange({ defaultCenter: { lat, lng } });
    } catch {
      setGeocodeError('Geocoding failed (network error)');
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <Section
      title="Default center & zoom"
      description="Where the map opens. Use the address geocoder to set lat/lng to the exact spot of the kiosk, or enter coordinates manually."
    >
      <label className="flex items-center gap-2 text-[13px] text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={useDefaultCenter}
          onChange={(e) => {
            if (e.target.checked) onChange({ defaultCenter: undefined });
            else onChange({ defaultCenter: center });
          }}
        />
        Use kiosk location ({`client.coords`}) as center
      </label>

      {!useDefaultCenter ? (
        <>
          <div className="flex items-end gap-2">
            <Field label="Address to geocode (optional)" className="flex-1">
              <input
                type="text"
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                placeholder="123 Main St, Davenport, FL"
                className={INPUT_CLASS}
              />
            </Field>
            <button
              type="button"
              onClick={handleGeocode}
              disabled={geocoding}
              className={BUTTON_CLASS_PRIMARY}
            >
              <Locate className="h-3.5 w-3.5" />
              {geocoding ? 'Looking up…' : 'Geocode'}
            </button>
          </div>
          {geocodeError ? (
            <p className="text-[12px] text-red-600 dark:text-red-400">{geocodeError}</p>
          ) : null}
          <div className="flex gap-3">
            <Field label="Center latitude" className="flex-1">
              <input
                type="number"
                step="0.000001"
                value={center.lat}
                onChange={(e) =>
                  onChange({ defaultCenter: { lat: Number(e.target.value), lng: center.lng } })
                }
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Center longitude" className="flex-1">
              <input
                type="number"
                step="0.000001"
                value={center.lng}
                onChange={(e) =>
                  onChange({ defaultCenter: { lat: center.lat, lng: Number(e.target.value) } })
                }
                className={INPUT_CLASS}
              />
            </Field>
          </div>
        </>
      ) : null}

      <Field label={`Zoom (${zoom})`}>
        <input
          type="range"
          min={1}
          max={22}
          step={1}
          value={zoom}
          onChange={(e) => onChange({ defaultZoom: Number(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-zinc-500">
          <span>1 (world)</span>
          <span>13 (city)</span>
          <span>22 (street)</span>
        </div>
      </Field>
    </Section>
  );
}

function WelcomeCopySection({
  copy,
  onChange,
}: {
  copy: MapConfig['welcomeCopy'];
  onChange: (copy: MapConfig['welcomeCopy']) => void;
}) {
  return (
    <Section
      title="Welcome popup"
      description="Shown the first time the visitor opens the Map. Use {client} to interpolate the kiosk name."
    >
      <Field label="Title">
        <input
          type="text"
          value={copy.title}
          onChange={(e) => onChange({ ...copy, title: e.target.value })}
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="Subtitle (optional)">
        <input
          type="text"
          value={copy.subtitle}
          onChange={(e) => onChange({ ...copy, subtitle: e.target.value })}
          placeholder="powered by Google"
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="Body">
        <textarea
          rows={3}
          value={copy.body}
          onChange={(e) => onChange({ ...copy, body: e.target.value })}
          className={`${INPUT_CLASS} resize-y`}
        />
      </Field>
      <Field label="CTA">
        <input
          type="text"
          value={copy.cta}
          onChange={(e) => onChange({ ...copy, cta: e.target.value })}
          className={INPUT_CLASS}
        />
      </Field>
    </Section>
  );
}

function ChipsLabelsSection({
  chips,
  onChange,
}: {
  chips: MapConfig['chips'];
  onChange: (chips: MapConfig['chips']) => void;
}) {
  return (
    <Section
      title="Chips labels"
      description="Labels shown on the 4 category chips above the map. Empty falls back to the canonical English label."
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Things to Do (Play)">
          <input
            type="text"
            value={chips.play}
            onChange={(e) => onChange({ ...chips, play: e.target.value })}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Restaurants (Eat)">
          <input
            type="text"
            value={chips.eat}
            onChange={(e) => onChange({ ...chips, eat: e.target.value })}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Stay">
          <input
            type="text"
            value={chips.stay}
            onChange={(e) => onChange({ ...chips, stay: e.target.value })}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Events">
          <input
            type="text"
            value={chips.events}
            onChange={(e) => onChange({ ...chips, events: e.target.value })}
            className={INPUT_CLASS}
          />
        </Field>
      </div>
    </Section>
  );
}

function PinStylingSection({
  pinSize,
  categoryIcons,
  onChange,
}: {
  pinSize: 'S' | 'M' | 'L';
  categoryIcons: MapConfig['categoryIcons'];
  onChange: (next: {
    pinSize?: 'S' | 'M' | 'L';
    categoryIcons?: MapConfig['categoryIcons'];
  }) => void;
}) {
  return (
    <Section
      title="Pin styling"
      description="Tamaño global de los pins del mapa y override del icono por categoría. El color permanece ligado al brand del kiosk para mantener coherencia con los chips."
    >
      <Field label="Pin size">
        <div className="flex gap-2">
          {(['S', 'M', 'L'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ pinSize: s })}
              className={`rounded-md border px-4 py-1.5 text-[12.5px] font-medium transition ${
                pinSize === s
                  ? 'border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300'
              }`}
            >
              {s === 'S' ? 'Small (75%)' : s === 'M' ? 'Medium (100%)' : 'Large (130%)'}
            </button>
          ))}
        </div>
      </Field>

      <div className="space-y-2">
        <p className="text-[11.5px] font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          Icon override per category
        </p>
        {SOURCE_OPTIONS.map((opt) => (
          <div key={opt.value} className="flex items-center gap-3">
            <MapPin className="h-4 w-4 shrink-0" style={{ color: opt.color }} />
            <span className="w-32 text-[12.5px] text-zinc-700 dark:text-zinc-300">{opt.label}</span>
            <select
              value={categoryIcons?.[opt.value] ?? ''}
              onChange={(e) =>
                onChange({
                  categoryIcons: {
                    ...categoryIcons,
                    [opt.value]: e.target.value,
                  } as MapConfig['categoryIcons'],
                })
              }
              className={INPUT_CLASS}
            >
              <option value="">Default</option>
              {EXTENDED_ICON_KEYS.map((key) => (
                <option key={key} value={key}>
                  {ICON_LABELS[key] ?? key}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </Section>
  );
}

function CustomPinsSection({
  pins,
  onChange,
}: {
  pins: MapCustomPin[];
  onChange: (pins: MapCustomPin[]) => void;
}) {
  const addPin = () => {
    const next: MapCustomPin = {
      id: `pin-${Date.now()}`,
      label: 'New pin',
      source: 'things-to-do',
      iconKey: '',
      coords: { lat: 0, lng: 0 },
      address: '',
    };
    onChange([...pins, next]);
  };
  const updatePin = (idx: number, patch: Partial<MapCustomPin>) => {
    onChange(pins.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };
  const deletePin = (idx: number) => {
    onChange(pins.filter((_, i) => i !== idx));
  };

  return (
    <Section
      title="Custom pins"
      description="Pins that show on the map regardless of listings. Use them for the kiosk location, info points, or featured spots."
    >
      {pins.length === 0 ? (
        <p className="text-[12px] italic text-zinc-500">No custom pins yet.</p>
      ) : (
        <ul className="space-y-2">
          {pins.map((p, idx) => (
            <li
              key={p.id}
              className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/40"
            >
              <div className="flex items-start gap-2">
                <MapPin
                  className="mt-1 h-4 w-4 shrink-0"
                  style={{
                    color: SOURCE_OPTIONS.find((s) => s.value === p.source)?.color ?? '#999',
                  }}
                />
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={p.label}
                    onChange={(e) => updatePin(idx, { label: e.target.value })}
                    placeholder="Label"
                    className={INPUT_CLASS}
                  />
                  <div className="flex gap-2">
                    <select
                      value={p.source}
                      onChange={(e) =>
                        updatePin(idx, {
                          source: MapSourceSchema.parse(e.target.value),
                        })
                      }
                      className={INPUT_CLASS}
                      title="Color category"
                    >
                      {SOURCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={p.iconKey}
                      onChange={(e) => updatePin(idx, { iconKey: e.target.value })}
                      className={INPUT_CLASS}
                      title="Icon"
                    >
                      <option value="">Default (category icon)</option>
                      {EXTENDED_ICON_KEYS.map((key) => (
                        <option key={key} value={key}>
                          {ICON_LABELS[key] ?? key}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.000001"
                      value={p.coords.lat}
                      onChange={(e) =>
                        updatePin(idx, {
                          coords: { lat: Number(e.target.value), lng: p.coords.lng },
                        })
                      }
                      placeholder="Latitude"
                      className={INPUT_CLASS}
                    />
                    <input
                      type="number"
                      step="0.000001"
                      value={p.coords.lng}
                      onChange={(e) =>
                        updatePin(idx, {
                          coords: { lat: p.coords.lat, lng: Number(e.target.value) },
                        })
                      }
                      placeholder="Longitude"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <input
                    type="text"
                    value={p.address}
                    onChange={(e) => updatePin(idx, { address: e.target.value })}
                    placeholder="Address (optional)"
                    className={INPUT_CLASS}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => deletePin(idx)}
                  className="rounded-md p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                  aria-label="Delete pin"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={addPin} className={BUTTON_CLASS_SECONDARY}>
        <Plus className="h-3.5 w-3.5" />
        Add pin
      </button>
    </Section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Tiny presentational helpers                                              */
/* ────────────────────────────────────────────────────────────────────────── */

const INPUT_CLASS =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[13px] text-zinc-900 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100';

const BUTTON_CLASS_PRIMARY =
  'inline-flex items-center gap-1.5 rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-[12px] font-medium text-sky-700 transition hover:bg-sky-500/20 disabled:opacity-50 dark:text-sky-300';

const BUTTON_CLASS_SECONDARY =
  'inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900';

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-900 dark:bg-zinc-950">
      <header>
        <h3 className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-[12px] leading-relaxed text-zinc-500">{description}</p>
        ) : null}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="block text-[11.5px] font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  );
}

// Re-export helper for callers that want the default config.
export { DEFAULT_MAP };
