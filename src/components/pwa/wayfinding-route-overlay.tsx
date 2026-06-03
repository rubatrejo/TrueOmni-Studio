'use client';

import type { WayfindingPoint } from '@/lib/config';

interface WayfindingRouteOverlayProps {
  routePoints: WayfindingPoint[];
  origin: WayfindingPoint;
  destination: WayfindingPoint;
  destinationName: string;
  youAreHereLabel: string;
}

const OPEN_SANS = { fontFamily: 'var(--font-open-sans), sans-serif' } as const;

/** Pin rojo de origen con label "YOU ARE HERE". */
function OriginMarker({ point, label }: { point: WayfindingPoint; label: string }) {
  return (
    <div
      className="pointer-events-none absolute flex flex-col items-center"
      style={{ left: `${point.x}%`, top: `${point.y}%`, transform: 'translate(-50%, -100%)' }}
    >
      <span
        className="mb-[2px] whitespace-nowrap text-[8px] font-bold"
        style={{ ...OPEN_SANS, color: '#e53935' }}
      >
        {label}
      </span>
      <svg width="18" height="24" viewBox="0 0 18 24" fill="none">
        <path
          d="M9 0C4.03 0 0 4.03 0 9c0 6.75 9 15 9 15s9-8.25 9-15c0-4.97-4.03-9-9-9z"
          fill="#e53935"
        />
        <circle cx="9" cy="8.5" r="3.5" fill="white" />
      </svg>
    </div>
  );
}

/** Marker de destino con estrella azul + label. */
function DestinationMarker({ point, name }: { point: WayfindingPoint; name: string }) {
  return (
    <div
      className="pointer-events-none absolute flex flex-col items-center"
      style={{ left: `${point.x}%`, top: `${point.y}%`, transform: 'translate(-50%, -100%)' }}
    >
      <span
        className="mb-[2px] whitespace-nowrap text-[8px] font-bold"
        style={{ ...OPEN_SANS, color: 'hsl(var(--brand-primary))' }}
      >
        {name}
      </span>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle
          cx="10"
          cy="10"
          r="9"
          fill="hsl(var(--brand-primary))"
          stroke="white"
          strokeWidth="2"
        />
        <text x="10" y="14" textAnchor="middle" fontSize="12" fill="white" fontFamily="sans-serif">
          ★
        </text>
      </svg>
    </div>
  );
}

/**
 * Overlay que dibuja la ruta sobre el floor plan usando posicionamiento CSS
 * en porcentaje (no SVG viewBox) para que los markers y textos no se estiren
 * con el aspect ratio del contenedor.
 *
 * - Polyline: SVG absoluto con viewBox="0 0 100 100" + preserveAspectRatio="none"
 *   (la línea SÍ se estira para coincidir con las coordenadas %)
 * - Markers + labels: divs HTML posicionados con left/top en %
 *   (NO se estiran, mantienen su proporción)
 */
export function WayfindingRouteOverlay({
  routePoints,
  origin,
  destination,
  destinationName,
  youAreHereLabel,
}: WayfindingRouteOverlayProps) {
  const polyline = routePoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Polyline SVG (la línea se estira, eso es correcto) */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <polyline
          points={polyline}
          fill="none"
          stroke="hsl(var(--brand-primary))"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Markers HTML (no se estiran) */}
      <DestinationMarker point={destination} name={destinationName} />
      <OriginMarker point={origin} label={youAreHereLabel} />
    </div>
  );
}
