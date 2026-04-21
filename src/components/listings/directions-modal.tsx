'use client';

import { useEffect, useState } from 'react';

import type { Listing } from '@/lib/config';

import { DirectionsMapWithRoute } from './directions-map-with-route';
import { useEscapeToClose } from './use-escape-to-close';

type TravelMode = 'driving' | 'walking';

interface DirectionsStep {
  distance: string;
  instruction: string;
  modifier: string;
}

/**
 * Get Directions modal — mismo tamaño que el card del detail.
 *
 *   - Header azul 899×180: "Directions to {title}" + X close.
 *   - Mapa 899×480 con polyline real por modo (driving / walking).
 *   - Tabs (SVG icons, sin emojis).
 *   - Lista turn-by-turn que CAMBIA según el modo (Mapbox Directions API).
 *   - Address + phone.
 *   - Botones SEND TO EMAIL (olive) / SEND TO PHONE (blue) al bottom
 *     (sin footer CLOSE — cierre con X arriba o click fuera).
 */
export function DirectionsModal({
  open,
  listing,
  clientCoords,
  mapboxToken,
  onClose,
  onSendEmail,
  onSendPhone,
}: {
  open: boolean;
  listing: Listing;
  clientCoords: { lat: number; lng: number } | undefined;
  mapboxToken: string | undefined;
  onClose: () => void;
  onSendEmail: () => void;
  onSendPhone: () => void;
}) {
  const [mode, setMode] = useState<TravelMode>('driving');
  const [geometry, setGeometry] = useState<GeoJSON.LineString | null>(null);
  const [steps, setSteps] = useState<DirectionsStep[] | null>(null);

  useEscapeToClose(open, onClose);
  useEffect(() => {
    if (open) setMode('driving');
  }, [open]);

  // Fetch directions cuando cambia el modo (o el modal se abre con origen).
  useEffect(() => {
    if (!open || !mapboxToken || !clientCoords) {
      setGeometry(null);
      setSteps(null);
      return;
    }
    let cancelled = false;
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/${mode}/` +
      `${clientCoords.lng},${clientCoords.lat};${listing.coords.lng},${listing.coords.lat}` +
      `?geometries=geojson&overview=full&steps=true&access_token=${mapboxToken}`;

    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const route = data.routes?.[0];
        if (!route) return;
        setGeometry(route.geometry as GeoJSON.LineString);
        // Extraer steps de legs
        const allSteps = (route.legs ?? []).flatMap(
          (leg: { steps?: unknown[] }) => leg.steps ?? [],
        );
        const parsed: DirectionsStep[] = allSteps.map((s: unknown) => {
          const step = s as {
            distance: number;
            maneuver: { instruction: string; modifier?: string; type?: string };
          };
          return {
            distance: formatDistance(step.distance, mode),
            instruction: step.maneuver.instruction,
            modifier: step.maneuver.modifier ?? step.maneuver.type ?? 'straight',
          };
        });
        setSteps(parsed);
      })
      .catch(() => {
        /* silencioso */
      });

    return () => {
      cancelled = true;
    };
  }, [
    open,
    mode,
    mapboxToken,
    clientCoords?.lat,
    clientCoords?.lng,
    listing.coords.lat,
    listing.coords.lng,
  ]);

  if (!open) return null;

  // Fallback si no hay steps de API: usa directions estáticos del listing.
  const visibleSteps: DirectionsStep[] =
    steps ??
    listing.directions.map((d) => ({
      distance: d.distance,
      instruction: d.instruction,
      modifier: d.icon,
    }));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Directions to ${listing.title}`}
      className="absolute inset-0"
      style={{ zIndex: 40 }}
    >
      <button
        type="button"
        aria-label="Cerrar direcciones"
        onClick={onClose}
        className="absolute inset-0 cursor-default focus:outline-none"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
        tabIndex={-1}
      />

      {/* Card — same size as detail card */}
      <div
        className="absolute flex flex-col overflow-hidden bg-white"
        style={{
          left: '90px',
          top: '166px',
          width: '898px',
          height: '1589px',
          borderRadius: '8px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header azul */}
        <div
          className="relative flex-shrink-0"
          style={{ width: '898px', height: '180px', backgroundColor: '#004f8b' }}
        >
          <div
            className="font-sans uppercase text-white"
            style={{
              position: 'absolute',
              left: '48px',
              top: '48px',
              fontSize: '18px',
              lineHeight: '18px',
              letterSpacing: '0.14em',
              opacity: 0.75,
            }}
          >
            Directions to
          </div>
          <div
            className="text-white"
            style={{
              position: 'absolute',
              left: '48px',
              top: '78px',
              fontSize: '48px',
              lineHeight: '56px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 700,
              maxWidth: '700px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {listing.title}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute flex items-center justify-center text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
            style={{
              right: '36px',
              top: '40px',
              width: '70px',
              height: '70px',
            }}
          >
            <svg width="42" height="42" viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="12" r="11" fill="none" stroke="#fff" strokeWidth="1.5" />
              <path d="M8 8l8 8M16 8l-8 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Map */}
        <div style={{ position: 'relative', width: '898px', height: '460px' }}>
          <DirectionsMapWithRoute
            token={mapboxToken}
            origin={clientCoords}
            destination={listing.coords}
            geometry={geometry}
            className="h-full w-full"
          />
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          className="flex-shrink-0"
          style={{
            display: 'flex',
            height: '70px',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <TabButton
            active={mode === 'driving'}
            onClick={() => setMode('driving')}
            icon={<CarIcon />}
            label="By car"
          />
          <div style={{ width: '1px', backgroundColor: '#e0e0e0' }} />
          <TabButton
            active={mode === 'walking'}
            onClick={() => setMode('walking')}
            icon={<WalkIcon />}
            label="By walking"
          />
        </div>

        {/* Directions content scrollable (fills remaining space above footer) */}
        <div
          className="scrollbar-hide"
          style={{
            padding: '24px 48px 20px 48px',
            overflowY: 'auto',
            flex: '1 1 auto',
          }}
        >
          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <StepRow icon={<OriginDot />} distance="" instruction="Current Location" />
            {visibleSteps.map((step, i) => (
              <StepRow
                key={i}
                icon={<TurnArrow direction={step.modifier} />}
                distance={step.distance}
                instruction={step.instruction}
                divider={i < visibleSteps.length - 1}
              />
            ))}
          </ol>

          {/* Address + phone */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              marginTop: '18px',
              paddingTop: '22px',
              borderTop: '1px solid #e0e0e0',
            }}
          >
            <LocationPinIcon />
            <div>
              <div
                style={{
                  fontFamily: 'Helvetica, Arial, sans-serif',
                  fontSize: '20px',
                  lineHeight: '28px',
                  color: '#242426',
                  fontWeight: 600,
                }}
              >
                {listing.title}
              </div>
              <div
                style={{
                  fontFamily: 'Helvetica, Arial, sans-serif',
                  fontSize: '18px',
                  lineHeight: '26px',
                  color: '#4a4a4a',
                }}
              >
                {listing.address}
              </div>
              <div
                style={{
                  fontFamily: 'Helvetica, Arial, sans-serif',
                  fontSize: '18px',
                  lineHeight: '26px',
                  color: '#4a4a4a',
                  marginTop: '4px',
                }}
              >
                {listing.phone}
              </div>
            </div>
          </div>
        </div>

        {/* Botones fijos abajo, reemplazan el footer CLOSE anterior */}
        <div
          className="flex-shrink-0"
          style={{
            display: 'flex',
            justifyContent: 'center',
            columnGap: '24px',
            padding: '20px 0',
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#ffffff',
          }}
        >
          <button
            type="button"
            onClick={onSendEmail}
            style={{
              width: '330px',
              height: '66px',
              borderRadius: '8px',
              backgroundColor: '#b9bd39',
              color: '#fff',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            SEND TO EMAIL
          </button>
          <button
            type="button"
            onClick={onSendPhone}
            style={{
              width: '330px',
              height: '66px',
              borderRadius: '8px',
              backgroundColor: '#1796d6',
              color: '#fff',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            SEND TO PHONE
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDistance(meters: number, mode: TravelMode): string {
  if (mode === 'walking') {
    if (meters < 1000) return `${Math.round(meters / 0.3048)} ft`;
    return `${(meters / 1609.34).toFixed(1)} mi`;
  }
  // driving
  const mi = meters / 1609.34;
  if (mi < 0.1) return `${Math.round(meters / 0.3048)} ft`;
  return `${mi.toFixed(1)} mi`;
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: '12px',
        backgroundColor: active ? '#ffffff' : '#f4f6f8',
        color: active ? '#004f8b' : 'rgba(0,0,0,0.57)',
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: '20px',
        fontWeight: 700,
        borderBottom: active ? '3px solid #1796d6' : '3px solid transparent',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function StepRow({
  icon,
  distance,
  instruction,
  divider = true,
}: {
  icon: React.ReactNode;
  distance: string;
  instruction: string;
  divider?: boolean;
}) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '18px',
        paddingBottom: '14px',
        marginBottom: '14px',
        borderBottom: divider ? '1px solid #eee' : 'none',
      }}
    >
      <div
        style={{
          width: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          paddingTop: distance ? '18px' : '2px',
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        {distance ? (
          <div
            style={{
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontSize: '13px',
              lineHeight: '13px',
              color: 'rgba(0,0,0,0.45)',
              marginBottom: '6px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {distance}
          </div>
        ) : null}
        <div
          style={{
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: '18px',
            lineHeight: '24px',
            color: '#242426',
          }}
        >
          {instruction}
        </div>
      </div>
    </li>
  );
}

function CarIcon() {
  return (
    <svg width="30" height="22" viewBox="0 0 30 22" aria-hidden>
      <path
        d="M3 10l2-6c.3-.9 1.1-1.5 2-1.5h10c.9 0 1.7.6 2 1.5l2 6h2c1.1 0 2 .9 2 2v5c0 .6-.4 1-1 1h-2v1.5c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5V18H10v1.5c0 .8-.7 1.5-1.5 1.5S7 20.3 7 19.5V18H5c-.6 0-1-.4-1-1v-5c0-1.1.9-2 2-2zm3-1h12l-1.3-4H7.3L6 9zm1 4a2 2 0 110 4 2 2 0 010-4zm10 0a2 2 0 110 4 2 2 0 010-4z"
        fill="currentColor"
      />
    </svg>
  );
}

function WalkIcon() {
  return (
    <svg width="20" height="28" viewBox="0 0 20 28" aria-hidden>
      <circle cx="12.5" cy="3.5" r="2.5" fill="currentColor" />
      <path
        d="M8 8.5c0-.9.7-1.5 1.5-1.5h3c.8 0 1.5.6 1.5 1.5l1.5 4.5 2.2 1.3c.7.4.9 1.3.5 2l-.1.1c-.4.7-1.3.9-2 .5l-2-1.2-.8-.3-1 4.2L15 23c.5.5.5 1.2 0 1.7l-.1.1c-.5.5-1.2.5-1.7 0l-2-2c-.3-.3-.4-.7-.3-1l.9-3.7-1.8-1-1.1 3.8c-.1.3-.3.6-.6.8l-2.5 1.7c-.6.4-1.3.3-1.7-.3l-.1-.1c-.4-.6-.3-1.4.3-1.8l1.9-1.3 2.4-8.4-2 1.3V15c0 .8-.7 1.5-1.5 1.5S3 15.8 3 15v-2.5c0-.6.3-1.1.8-1.4L8 8.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function OriginDot() {
  return (
    <span
      aria-hidden
      style={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        border: '3px solid #1796d6',
        backgroundColor: '#fff',
        display: 'inline-block',
      }}
    />
  );
}

function LocationPinIcon() {
  return (
    <svg width="28" height="36" viewBox="0 0 28 36" aria-hidden>
      <path
        d="M14 0C6.3 0 0 6.3 0 14c0 9.3 11.6 19.6 13.2 21.1.5.5 1.2.5 1.7 0C16.4 33.6 28 23.3 28 14c0-7.7-6.3-14-14-14zm0 19a5 5 0 110-10 5 5 0 010 10z"
        fill="#004f8b"
      />
    </svg>
  );
}

function TurnArrow({ direction }: { direction: string }) {
  // Mapbox modifiers: right, slight right, sharp right, left, slight left,
  // sharp left, straight, uturn, depart, arrive. Agrupamos a 4 variantes.
  const d = direction.toLowerCase();
  const isRight = d.includes('right');
  const isLeft = d.includes('left');
  const isUturn = d.includes('uturn') || d === 'south' || d === 'down';

  if (isUturn) {
    return (
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
        <path
          d="M8 28V14a6 6 0 0112 0v6"
          fill="none"
          stroke="#242426"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M14 14l6 6 6-6"
          fill="none"
          stroke="#242426"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (isRight) {
    return (
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
        <path
          d="M4 26V14a4 4 0 014-4h14"
          fill="none"
          stroke="#242426"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 5l6 5-6 5"
          fill="none"
          stroke="#242426"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (isLeft) {
    return (
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
        <path
          d="M28 26V14a4 4 0 00-4-4H10"
          fill="none"
          stroke="#242426"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 5l-6 5 6 5"
          fill="none"
          stroke="#242426"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  // arrive / depart / straight
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
      <path d="M16 28V6" fill="none" stroke="#242426" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M10 12l6-6 6 6"
        fill="none"
        stroke="#242426"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
