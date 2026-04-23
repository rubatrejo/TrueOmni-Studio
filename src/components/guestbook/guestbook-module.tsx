'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

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

export function GuestbookModule({
  module: mod,
  mapboxToken,
  textos,
  clientFallbackCoords,
  startHeader,
  formHeader,
}: {
  module: HomeGuestbookModule;
  mapboxToken: string | undefined;
  textos: Record<string, string>;
  /** Coord de fallback si el geocoding falla. */
  clientFallbackCoords?: { lat: number; lng: number };
  startHeader: ReactNode;
  formHeader: ReactNode;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('start');
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
    return [...mod.seedPins, ...fromStore];
  }, [mod.seedPins, userPins, textos.guestbook_pin_today]);

  const visibleSeedPins = useMemo(() => {
    if (!userCoords) return seedPinsEnriched;
    return filterPinsByProximity(seedPinsEnriched, userCoords, 6);
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
      router.push('/home');
    },
    [userData, userAddress, addUserPin, router],
  );

  const getGlobeMap = useCallback(() => globeRef.current?.getMap() ?? null, []);

  // Al cambiar phase (sobre todo start/form ↔ map) el container del globe
  // cambia de tamaño inline. Mapbox necesita un resize manual para
  // ajustar el canvas WebGL a las nuevas dimensiones.
  useEffect(() => {
    const t = setTimeout(() => globeRef.current?.resize(), 50);
    return () => clearTimeout(t);
  }, [phase]);

  // Layout: globo siempre presente. Las pantallas Start/Form se montan
  // encima durante esas phases. En transition el globo es full-screen
  // (sin UI). En map la UI del rail + finish se muestra sobre el mapa.
  // Posicionamiento del globo como "media luna" asomando desde abajo
  // (como el mockup pantalla 0). El canvas es más alto que la parte
  // visible: el centro del globo cae debajo del viewport → solo se ve
  // el top del planeta.
  const globeStyle: React.CSSProperties =
    phase === 'start' || phase === 'form'
      ? {
          position: 'absolute',
          left: '-200px',
          right: '-200px',
          top: phase === 'start' ? '1220px' : '1280px',
          height: '1600px',
          zIndex: 0,
        }
      : {
          position: 'absolute',
          inset: 0,
          zIndex: 0,
        };

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: '#f8f8f8' }}>
      <GuestbookGlobeCanvas
        ref={globeRef}
        token={mapboxToken}
        earthStart={mod.earthStart}
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
            title={textos.guestbook_form_title ?? 'Start your Guestbook!'}
            labels={{
              name: textos.guestbook_field_name ?? 'Complete Name',
              email: textos.guestbook_field_email ?? 'Email',
              phone: textos.guestbook_field_phone ?? 'Phone',
              country: textos.guestbook_field_country ?? 'Country',
              zip: textos.guestbook_field_zip ?? 'Zip Code',
              termsPrivacy: textos.guestbook_terms_privacy ?? 'Accept our Privacy policy',
              termsUpdates: textos.guestbook_terms_updates ?? 'Receive Destination Email Updates',
            }}
            countries={mod.countries}
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
          getMap={getGlobeMap}
          seedPins={visibleSeedPins}
          pinCatalog={mod.pinCatalog}
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
    </div>
  );
}
