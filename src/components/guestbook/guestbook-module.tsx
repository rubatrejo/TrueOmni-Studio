'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { useTextosMap } from '@/components/i18n-provider';
import type { HomeGuestbookModule } from '@/lib/config';
import { filterPinsByProximity } from '@/lib/guestbook-bbox';
import { geocodeZip } from '@/lib/guestbook-geo';
import { useGuestbookUserPins, type GuestbookUserPin } from '@/lib/guestbook-store';

import { GuestbookFormScreen, type GuestbookFormData } from './guestbook-form-screen';
import { GuestbookGlobeCanvas, type GlobeHandle } from './guestbook-globe-canvas';
import { GuestbookMapScreen, type PlacedPin } from './guestbook-map-screen';
import { GuestbookStartScreen } from './guestbook-start-screen';

/**
 * Máquina de estados del módulo Guestbook:
 *
 *   start → form → transition → map → done (redirect /home)
 *
 * El `GuestbookGlobeCanvas` persiste todas las phases. En `start`/`form` se
 * ve crop en la parte inferior; en `transition`/`map` ocupa el viewport
 * completo. `flyToZip` se dispara al enviar el form.
 */
type Phase = 'start' | 'form' | 'transition' | 'map';

/**
 * Coords decorativas distribuidas por el mundo para los pins que giran
 * con el globo en phase start/form. Seleccionadas para que siempre
 * haya pins visibles independientemente de la rotación.
 */
const GLOBE_DECORATIVE_COORDS: ReadonlyArray<{ lat: number; lng: number }> = [
  // América ~separación 1500+ km
  { lat: 40.71, lng: -74.0 }, // New York
  { lat: 34.05, lng: -118.24 }, // Los Angeles
  { lat: 25.77, lng: -80.19 }, // Miami
  { lat: 19.43, lng: -99.13 }, // Mexico City
  { lat: -12.05, lng: -77.04 }, // Lima
  { lat: -22.9, lng: -43.17 }, // Rio de Janeiro
  // Europa / África
  { lat: 48.85, lng: 2.35 }, // Paris
  { lat: 41.9, lng: 12.49 }, // Rome
  { lat: 55.75, lng: 37.61 }, // Moscow
  { lat: 30.04, lng: 31.23 }, // Cairo
  { lat: -1.29, lng: 36.82 }, // Nairobi
  { lat: -26.2, lng: 28.04 }, // Johannesburg
  // Asia / Oceanía
  { lat: 28.61, lng: 77.21 }, // New Delhi
  { lat: 35.68, lng: 139.69 }, // Tokyo
  { lat: 1.35, lng: 103.82 }, // Singapore
  { lat: -33.86, lng: 151.2 }, // Sydney
];

export function GuestbookModule({
  module: mod,
  mapboxToken,
  clientFallbackCoords,
  startHeader,
  formHeader,
  mapHeader,
}: {
  module: HomeGuestbookModule;
  mapboxToken: string | undefined;
  /** Coord de fallback si el geocoding falla. */
  clientFallbackCoords?: { lat: number; lng: number };
  startHeader: ReactNode;
  formHeader: ReactNode;
  mapHeader: ReactNode;
}) {
  const textos = useTextosMap();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('start');

  // Live override desde el Studio (S3.6).
  const [override, setOverride] = useState<HomeGuestbookModule | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<HomeGuestbookModule>).detail;
      if (!detail || !Array.isArray(detail.pinCatalog)) return;
      setOverride({ ...detail, kind: 'guestbook' });
    };
    window.addEventListener('kiosk:guestbook-override', handler);
    return () => window.removeEventListener('kiosk:guestbook-override', handler);
  }, []);
  const effective = override ?? mod;
  const [userData, setUserData] = useState<GuestbookFormData | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const globeRef = useRef<GlobeHandle | null>(null);
  const { pins: userPins, add: addUserPin } = useGuestbookUserPins();

  // Pool de pins visibles: seedPins del config + pins que este usuario
  // dejó en sesión. Filtrados por proximidad al coord del user.
  const seedPinsEnriched = useMemo(() => {
    const fromStore = userPins.map((p) => ({
      id: p.id,
      authorName: p.authorName,
      zipCode: p.zipCode,
      coords: p.coords,
      pinImage: p.pinImage,
      dateLabel: textos.guestbook_pin_today ?? 'Today',
      address: p.address ?? '',
      comment: p.comment,
    }));
    return [...effective.seedPins, ...fromStore];
  }, [effective.seedPins, userPins, textos.guestbook_pin_today]);

  const visibleSeedPins = useMemo(() => {
    if (!userCoords) return seedPinsEnriched.slice(0, 6);
    // Filtra por radio de 6 millas alrededor del zip y cap a 6 pins para
    // no saturar el mapa.
    return filterPinsByProximity(seedPinsEnriched, userCoords, 6).slice(0, 6);
  }, [seedPinsEnriched, userCoords]);

  const handleStart = useCallback(() => setPhase('form'), []);

  const handleFormSubmit = useCallback(
    async (data: GuestbookFormData) => {
      setUserData(data);
      setPhase('transition');
      let coords: { lat: number; lng: number } | null = null;
      let placeName: string | null = null;

      if (mapboxToken) {
        const result = await geocodeZip(data.zip, mapboxToken, data.countryCode ?? 'US');
        if (result) {
          coords = { lat: result.lat, lng: result.lng };
          placeName = result.placeName;
        }
      }
      if (!coords) {
        coords = clientFallbackCoords ?? { lat: 33.4484, lng: -112.074 };
        setFallbackUsed(true);
      }
      setUserCoords(coords);
      setUserAddress(placeName ?? `${data.zip}`);

      // Fly-to — resuelve cuando la animación termina y el style se intercambia.
      await globeRef.current?.flyToZip(coords);
      setPhase('map');
    },
    [mapboxToken, clientFallbackCoords],
  );

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showFinishThanks, setShowFinishThanks] = useState(false);

  const handleFinish = useCallback(
    (placed: PlacedPin | null) => {
      if (placed && userData) {
        const userPin: GuestbookUserPin = {
          id: `user-${Date.now()}`,
          authorName: userData.name,
          zipCode: userData.zip,
          coords: placed.coords,
          pinOptionId: placed.optionId,
          pinImage: placed.pinImage,
          comment: placed.comment,
          createdAt: new Date().toISOString(),
          address: userAddress,
        };
        addUserPin(userPin);
      }
      setShowFinishThanks(true);
    },
    [userData, userAddress, addUserPin],
  );

  // Redirect a /home 4s después de mostrar el popup de gracias.
  useEffect(() => {
    if (!showFinishThanks) return;
    const t = setTimeout(() => router.push('/home'), 4000);
    return () => clearTimeout(t);
  }, [showFinishThanks, router]);

  const getGlobeMap = useCallback(() => globeRef.current?.getMap() ?? null, []);

  // Al cambiar phase (sobre todo start/form ↔ map) el container del globe
  // cambia de tamaño inline. Llamamos a resize() varias veces durante la
  // transición CSS (0.7s) para mantener sincronizado el canvas WebGL con
  // las nuevas dimensiones. Sin esto, unproject() devuelve coords basadas
  // en el tamaño viejo del canvas.
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    for (const delay of [50, 200, 400, 600, 800, 1000]) {
      timers.push(setTimeout(() => globeRef.current?.resize(), delay));
    }
    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [phase]);

  // Zoom + easeTo al pasar entre start ↔ form. Form hace un 15% zoom-in
  // sobre el zoom base del config (earthStart.zoom) para acercar el
  // planeta justo antes del flyTo al zip.
  useEffect(() => {
    const baseZoom = effective.earthStart?.zoom ?? 2.55;
    // Form hace +5% zoom sobre el start (pedido del usuario tras
    // reducir 10% del 15% inicial).
    const target = phase === 'form' ? baseZoom * 1.05 : baseZoom;
    const map = globeRef.current?.getMap();
    if (!map) return;
    if (phase === 'start' || phase === 'form') {
      map.easeTo({ zoom: target, duration: 900, essential: true });
    }
  }, [phase, effective.earthStart?.zoom]);

  // Layout: globo siempre presente. Las pantallas Start/Form se montan
  // encima durante esas phases. En transition/map el globo pasa a
  // full-screen. Sin CSS transition en el container — el flyTo de
  // Mapbox anima la cámara, y el container cambia de tamaño al instante
  // para evitar desincronización entre el canvas WebGL y el viewport
  // (que rompe map.unproject()).
  const globeStyle: React.CSSProperties =
    phase === 'start' || phase === 'form'
      ? {
          position: 'absolute',
          left: '-200px',
          right: '-200px',
          top: phase === 'start' ? '1260px' : '800px',
          bottom: phase === 'start' ? '-940px' : '-480px',
          zIndex: 0,
        }
      : phase === 'map'
        ? {
            // Map phase: rail arriba en y=210, rail height ≈340 → map
            // empieza en y=550 (50px más arriba que antes, sigue al rail).
            position: 'absolute',
            top: '550px',
            bottom: '0px',
            left: '0px',
            right: '0px',
            zIndex: 0,
          }
        : {
            position: 'absolute',
            top: '0px',
            bottom: '0px',
            left: '0px',
            right: '0px',
            zIndex: 0,
          };

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
      <GuestbookGlobeCanvas
        ref={globeRef}
        token={mapboxToken}
        earthStart={effective.earthStart}
        overlayPins={
          phase === 'start' || phase === 'form'
            ? // Distribución decorativa global para que al girar el globo
              // se vean pins por todo el mundo durante start y form.
              GLOBE_DECORATIVE_COORDS.map((coords, i) => ({
                id: `globe-${i}`,
                coords,
                image: effective.pinCatalog[i % effective.pinCatalog.length]?.image ?? '',
              }))
            : undefined
        }
        style={globeStyle}
      />

      {phase === 'start' ? (
        <div className="absolute inset-0" style={{ zIndex: 1, backgroundColor: 'transparent' }}>
          <GuestbookStartScreen
            header={startHeader}
            title={textos.guestbook_start_title ?? 'Sign our Guestbook!'}
            subtitle={
              textos.guestbook_start_subtitle ?? 'Share your experiences with other guests.'
            }
            ctaLabel={textos.guestbook_start_cta ?? 'START'}
            onStart={handleStart}
          />
        </div>
      ) : null}

      {phase === 'form' ? (
        <div className="absolute inset-0" style={{ zIndex: 1, backgroundColor: 'transparent' }}>
          <GuestbookFormScreen
            header={formHeader}
            title={textos.guestbook_start_title ?? 'Sign our Guestbook!'}
            subtitle={
              textos.guestbook_start_subtitle ?? 'Share your experiences with other guests.'
            }
            labels={{
              name: textos.guestbook_field_name ?? 'Complete Name',
              email: textos.guestbook_field_email ?? 'Email',
              phone: textos.guestbook_field_phone ?? 'Phone',
              country: textos.guestbook_field_country ?? 'Country',
              zip: textos.guestbook_field_zip ?? 'Zip Code',
              termsPrivacy: textos.guestbook_terms_privacy ?? 'Accept our Privacy policy',
              termsUpdates: textos.guestbook_terms_updates ?? 'Receive Destination Email Updates',
            }}
            countries={effective.countries}
            countrySelectTitle={textos.guestbook_country_select_title ?? 'Select Country'}
            ctaLabel={textos.guestbook_next_cta ?? 'NEXT'}
            onSubmit={handleFormSubmit}
            onBack={() => setPhase('start')}
          />
        </div>
      ) : null}

      {phase === 'transition' ? (
        <div
          className="absolute inset-0 flex items-center justify-center font-sans"
          style={{
            zIndex: 1,
            color: '#ffffff',
            background: 'transparent',
            pointerEvents: 'none',
          }}
          aria-label="Zooming into your zip code"
        >
          {fallbackUsed ? (
            <p
              style={{
                position: 'absolute',
                bottom: '120px',
                left: '60px',
                right: '60px',
                textAlign: 'center',
                fontSize: '18px',
                color: '#ffffff',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              }}
            >
              {textos.guestbook_invalid_zip_fallback ??
                "Couldn't find that zip code, showing the local area."}
            </p>
          ) : null}
        </div>
      ) : null}

      {phase === 'map' && userCoords ? (
        <GuestbookMapScreen
          header={mapHeader}
          onBack={() => setShowExitConfirm(true)}
          getMap={getGlobeMap}
          seedPins={visibleSeedPins}
          pinCatalog={effective.pinCatalog}
          authorName={userData?.name ?? ''}
          userAddress={userAddress}
          texts={{
            pinTitle: textos.guestbook_pin_title ?? "Let's pin your location",
            pinSubtitle:
              textos.guestbook_pin_subtitle ?? 'Select your favorite pin and drop it in the map',
            todayLabel: textos.guestbook_pin_today ?? 'Today',
            commentPlaceholder:
              textos.guestbook_pin_comment_placeholder ?? 'Write a short comment…',
            confirmLabel: textos.guestbook_pin_confirm ?? 'CONFIRM',
            finishLabel: textos.guestbook_finish_cta ?? 'FINISH',
          }}
          onFinish={handleFinish}
        />
      ) : null}

      {/* Confirm-exit: si el user tapa back en map phase, preguntamos
          si está seguro antes de perder los datos. */}
      {showExitConfirm ? (
        <div
          role="alertdialog"
          aria-modal="true"
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 70 }}
        >
          <button
            type="button"
            aria-label="Cancelar"
            onClick={() => setShowExitConfirm(false)}
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          />
          <div
            className="relative flex flex-col items-center"
            style={{
              width: '620px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '44px 52px 40px',
              boxShadow: '0 40px 80px rgba(0,0,0,0.45)',
              gap: '20px',
            }}
          >
            <h3
              className="text-center font-sans"
              style={{
                fontSize: '32px',
                lineHeight: 1.2,
                fontWeight: 700,
                color: '#004f8b',
                whiteSpace: 'pre-line',
              }}
            >
              {textos.guestbook_exit_title ?? 'Are you sure\nyou want to exit?'}
            </h3>
            <p
              className="text-center font-sans"
              style={{ fontSize: '18px', lineHeight: 1.5, color: '#5a5a5a' }}
            >
              {textos.guestbook_exit_message ??
                "You'll lose all the information you've entered."}
            </p>
            <div className="mt-2 flex items-center justify-center" style={{ gap: '14px' }}>
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="font-sans focus:outline-none"
                style={{
                  height: '56px',
                  minWidth: '160px',
                  paddingInline: '28px',
                  border: '2px solid #bfbfbf',
                  borderRadius: '999px',
                  color: '#333',
                  fontSize: '16px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  backgroundColor: '#ffffff',
                }}
              >
                {textos.guestbook_exit_cancel ?? 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/home')}
                className="font-sans text-white focus:outline-none"
                style={{
                  height: '56px',
                  minWidth: '160px',
                  paddingInline: '28px',
                  borderRadius: '999px',
                  fontSize: '16px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  backgroundColor: '#d14343',
                  boxShadow: '0 10px 24px -6px rgba(209,67,67,0.5)',
                }}
              >
                {textos.guestbook_exit_confirm ?? 'Exit'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Thank-you popup tras FINISH. Auto-redirect a /home en 4s. */}
      {showFinishThanks ? (
        <div
          role="alertdialog"
          aria-modal="true"
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 70, backgroundColor: 'rgba(0,0,0,0.78)' }}
        >
          <div
            className="relative flex flex-col items-center overflow-hidden bg-white"
            style={{
              width: '720px',
              padding: '80px 72px 64px',
              borderRadius: '24px',
              boxShadow: '0 40px 80px rgba(0,0,0,0.45)',
            }}
          >
            <div
              aria-hidden
              className="absolute inset-x-0 top-0"
              style={{
                height: '8px',
                background: 'linear-gradient(90deg, #b9bd39 0%, #1796d6 100%)',
              }}
            />
            <div
              className="relative flex items-center justify-center"
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                backgroundColor: 'rgba(185,189,57,0.14)',
                marginBottom: '28px',
              }}
            >
              <svg width="72" height="72" viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M5 12l5 5 9-11"
                  fill="none"
                  stroke="#b9bd39"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3
              className="text-center font-sans"
              style={{
                fontSize: '38px',
                lineHeight: 1.15,
                fontWeight: 700,
                color: '#004f8b',
                marginBottom: '14px',
              }}
            >
              {textos.guestbook_thanks_title ?? 'Thanks for signing!'}
            </h3>
            <p
              className="text-center font-sans"
              style={{ fontSize: '20px', lineHeight: 1.45, color: '#5a5a5a' }}
            >
              {textos.guestbook_thanks_message ??
                'Your pin is now on the map for other guests to see.'}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
