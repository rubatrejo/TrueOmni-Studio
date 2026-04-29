'use client';

import { ExternalLink } from 'lucide-react';

interface LatLngFieldProps {
  label?: string;
  value: { lat: number; lng: number };
  onChange: (next: { lat: number; lng: number }) => void;
}

/**
 * Dos inputs numéricos lado a lado para latitud / longitud + botón "Open in Maps"
 * para verificar visualmente. Picker Mapbox queda para S6.
 */
export function LatLngField({ label = 'Coordinates', value, onChange }: LatLngFieldProps) {
  const setLat = (lat: number) => onChange({ ...value, lat });
  const setLng = (lng: number) => onChange({ ...value, lng });

  const valid =
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lng) &&
    value.lat >= -90 &&
    value.lat <= 90 &&
    value.lng >= -180 &&
    value.lng <= 180;

  const openInMaps = () => {
    if (typeof window === 'undefined') return;
    const url = `https://maps.google.com/?q=${value.lat},${value.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-[12px] font-medium text-zinc-300">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.000001"
          min={-90}
          max={90}
          value={Number.isFinite(value.lat) ? value.lat : 0}
          onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
          aria-label="Latitude"
          placeholder="Latitude"
          className="w-full rounded-md border border-zinc-800 bg-zinc-900/40 px-2 py-1.5 text-[12px] text-zinc-100 placeholder:text-zinc-600 focus:border-sky-500/60 focus:outline-none"
        />
        <input
          type="number"
          step="0.000001"
          min={-180}
          max={180}
          value={Number.isFinite(value.lng) ? value.lng : 0}
          onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
          aria-label="Longitude"
          placeholder="Longitude"
          className="w-full rounded-md border border-zinc-800 bg-zinc-900/40 px-2 py-1.5 text-[12px] text-zinc-100 placeholder:text-zinc-600 focus:border-sky-500/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={openInMaps}
          disabled={!valid}
          className="flex shrink-0 items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/40 px-2 py-1.5 text-[11px] text-zinc-300 transition hover:border-sky-500/40 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
          title="Open in Google Maps to verify"
        >
          <ExternalLink className="h-3 w-3" />
          Maps
        </button>
      </div>
      {!valid ? (
        <p className="text-[11px] text-amber-400">
          Lat must be within [-90, 90], Lng within [-180, 180].
        </p>
      ) : null}
    </div>
  );
}
