'use client';

import type mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import type { GuestbookPinOption, GuestbookSeedPin } from '@/lib/config';

import { GuestbookFloatingBackButton } from './guestbook-floating-back-button';
import { GuestbookPinCommentModal } from './guestbook-pin-comment-modal';
import { GuestbookPinRail } from './guestbook-pin-rail';

export interface PlacedPin {
  optionId: string;
  pinImage: string;
  coords: { lat: number; lng: number };
  comment: string;
}

/**
 * Pantallas 4-5-6 del Guestbook: map overlay con seedPins (otros users),
 * rail de pins drag&drop abajo, comment modal al soltar y FINISH.
 *
 * El `GuestbookGlobeCanvas` persiste por debajo (renderizado por el padre).
 * Aquí solo añadimos markers HTML al `map` pasado por ref.
 */
export function GuestbookMapScreen({
  header,
  onBack,
  getMap,
  seedPins,
  pinCatalog,
  texts,
  authorName,
  userAddress,
  onFinish,
}: {
  header: ReactNode;
  onBack: () => void;
  getMap: () => mapboxgl.Map | null;
  seedPins: readonly GuestbookSeedPin[];
  pinCatalog: readonly GuestbookPinOption[];
  texts: {
    pinTitle: string;
    pinSubtitle: string;
    todayLabel: string;
    commentPlaceholder: string;
    confirmLabel: string;
    finishLabel: string;
  };
  authorName: string;
  userAddress: string;
  onFinish: (pin: PlacedPin | null) => void;
}) {
  const [placed, setPlaced] = useState<PlacedPin | null>(null);
  const [viewingSeed, setViewingSeed] = useState<GuestbookSeedPin | null>(null);
  const [pendingDrop, setPendingDrop] = useState<{
    optionId: string;
    pinImage: string;
    /** Imagen solo-círculo (sin pointer) — para mostrar en el popup. */
    circleImage: string;
    coords: { lat: number; lng: number };
  } | null>(null);

  const placedMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const seedMarkersRef = useRef<mapboxgl.Marker[]>([]);

  // Render seedPins como markers DOM.
  useEffect(() => {
    const map = getMap();
    if (!map) return;
    let cancelled = false;

    for (const m of seedMarkersRef.current) m.remove();
    seedMarkersRef.current = [];

    const mapboxglGlobal = (globalThis as unknown as {
      mapboxgl?: typeof mapboxgl;
    }).mapboxgl;
    void import('mapbox-gl').then((mod) => {
      if (cancelled) return;
      const Marker = mod.Marker ?? mapboxglGlobal?.Marker;
      if (!Marker) return;
      for (let i = 0; i < seedPins.length; i++) {
        const p = seedPins[i];
        if (!p) continue;
        // Asignamos una opción del catálogo por índice: cada seed pin usa
        // uno de los 5 pins (star/man/woman/usa/logo) cicládos. En el
        // mapa mostramos el pin completo (pin-N.png). En el popup (al
        // click) mostramos el Pin-N-Circle.png correspondiente para que
        // el avatar del popup coincida con el pin del mapa.
        const option = pinCatalog[i % pinCatalog.length];
        if (!option) continue;
        const pinPng = option.image;
        const circlePng = option.circleImage ?? option.image;
        const el = document.createElement('button');
        el.setAttribute('type', 'button');
        el.setAttribute('aria-label', `${p.authorName}: ${p.comment ?? ''}`);
        el.style.backgroundColor = 'transparent';
        el.style.border = 'none';
        el.style.cursor = 'pointer';
        el.style.padding = '0';
        // PNG natural 113×183 (ratio 0.617). Altura 120 + ancho auto →
        // respeta aspect ratio natural (≈74×120 display).
        el.innerHTML = `
          <img src="${pinPng}" alt="" style="height:120px;width:auto;display:block;filter:drop-shadow(0 5px 10px rgba(0,0,0,0.4));" />
        `;
        el.addEventListener('click', () => setViewingSeed({ ...p, pinImage: circlePng }));
        const m = new Marker({ element: el, anchor: 'bottom' })
          .setLngLat([p.coords.lng, p.coords.lat])
          .addTo(map);
        seedMarkersRef.current.push(m);
      }
    });

    return () => {
      cancelled = true;
      for (const m of seedMarkersRef.current) m.remove();
      seedMarkersRef.current = [];
    };
  }, [getMap, seedPins, pinCatalog]);

  // Render del pin colocado por el usuario.
  useEffect(() => {
    const map = getMap();
    if (!map) return;
    let cancelled = false;

    if (placedMarkerRef.current) {
      placedMarkerRef.current.remove();
      placedMarkerRef.current = null;
    }
    if (!placed) return;

    void import('mapbox-gl').then((mod) => {
      if (cancelled) return;
      const Marker = mod.Marker;
      const el = document.createElement('div');
      // Placed pin — más grande que los seed (160 vs 120) + glow pulsante
      // olive debajo para que el usuario vea claramente su pin recién
      // colocado entre los seed.
      el.innerHTML = `
        <div style="position:relative;width:auto;height:170px;display:inline-block;">
          <div style="position:absolute;left:50%;bottom:-4px;transform:translateX(-50%);width:86px;height:24px;border-radius:50%;background:radial-gradient(ellipse,hsl(var(--brand-tertiary) / 0.65) 0%,hsl(var(--brand-tertiary) / 0) 70%);animation:gbPulse 1.6s ease-in-out infinite;"></div>
          <img src="${placed.pinImage}" alt="" style="position:relative;height:160px;width:auto;display:block;filter:drop-shadow(0 8px 14px rgba(0,0,0,0.5));" />
        </div>
        <style>@keyframes gbPulse { 0%,100% { opacity: 0.45; transform: translateX(-50%) scale(0.9); } 50% { opacity: 0.9; transform: translateX(-50%) scale(1.15); } }</style>
      `;
      const m = new Marker({ element: el, anchor: 'bottom' })
        .setLngLat([placed.coords.lng, placed.coords.lat])
        .addTo(map);
      placedMarkerRef.current = m;
    });
    return () => {
      cancelled = true;
    };
  }, [getMap, placed]);

  const handleDrop = (optionId: string, clientX: number, clientY: number) => {
    const map = getMap();
    if (!map) return;
    const option = pinCatalog.find((p) => p.id === optionId);
    if (!option) return;

    map.resize();

    // Conversión viewport → canvas-internal: el KioskCanvas usa
    // `transform: scale()` en un ancestro, así que `getBoundingClientRect`
    // devuelve dimensiones escaladas (visuales) mientras que
    // `map.unproject` espera coords del canvas sin escalar (su layout
    // real, 1080×1920). Dividimos por el factor de escala para obtener
    // las coords correctas.
    const canvas = map.getCanvas();
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / (canvas.offsetWidth || rect.width);
    const scaleY = rect.height / (canvas.offsetHeight || rect.height);
    const xCanvas = (clientX - rect.left) / (scaleX || 1);
    const yCanvas = (clientY - rect.top) / (scaleY || 1);
    // Clamp dentro del canvas interno (por seguridad ante drops fuera).
    const clampedX = Math.max(0, Math.min(canvas.offsetWidth || rect.width, xCanvas));
    const clampedY = Math.max(0, Math.min(canvas.offsetHeight || rect.height, yCanvas));
    const lngLat = map.unproject([clampedX, clampedY]);

    setPendingDrop({
      optionId,
      pinImage: option.image,
      circleImage: option.circleImage ?? option.image,
      coords: { lat: lngLat.lat, lng: lngLat.lng },
    });
  };

  const usedIds = placed ? [placed.optionId] : [];

  return (
    <>
      {/* Header TrueOmni (logo + hora/clima + gradiente) sobre el mapa. */}
      <div className="absolute inset-x-0 top-0" style={{ zIndex: 15 }}>
        {header}
      </div>

      {/* Back button flotando sobre el mapa. */}
      <GuestbookFloatingBackButton onBack={onBack} />

      {/* Pin rail + FINISH button debajo de los pins (cuando hay un pin
          colocado). Todo en el mismo contenedor blanco para que el mapa
          pueda ocupar todo el bajo sin comerse espacio al FINISH. */}
      <div
        className="absolute inset-x-0"
        style={{
          top: '210px',
          zIndex: 20,
        }}
      >
        <GuestbookPinRail
          title={texts.pinTitle}
          subtitle={texts.pinSubtitle}
          options={pinCatalog}
          usedIds={usedIds}
          onDrop={handleDrop}
          finishSlot={
            placed ? (
              <button
                type="button"
                onClick={() => onFinish(placed)}
                className="font-sans text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                style={{
                  width: '420px',
                  height: '92px',
                  borderRadius: '16px',
                  backgroundColor: 'hsl(var(--brand-tertiary))',
                  fontSize: '30px',
                  lineHeight: '30px',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  boxShadow: '0 10px 22px hsl(var(--brand-tertiary) / 0.35)',
                  marginTop: '32px',
                }}
              >
                {texts.finishLabel}
              </button>
            ) : null
          }
        />
      </div>

      {/* Modal de comentario para el pin del usuario */}
      <GuestbookPinCommentModal
        open={pendingDrop !== null}
        pinImage={pendingDrop?.circleImage ?? ''}
        authorName={authorName}
        dateLabel={texts.todayLabel}
        address={userAddress}
        initialComment={placed?.comment ?? ''}
        placeholder={texts.commentPlaceholder}
        confirmLabel={texts.confirmLabel}
        onConfirm={(comment) => {
          if (!pendingDrop) return;
          setPlaced({
            optionId: pendingDrop.optionId,
            pinImage: pendingDrop.pinImage,
            coords: pendingDrop.coords,
            comment,
          });
          setPendingDrop(null);
        }}
        onCancel={() => setPendingDrop(null)}
      />

      {/* Modal readonly para pins de otros usuarios */}
      <GuestbookPinCommentModal
        open={viewingSeed !== null}
        pinImage={viewingSeed?.pinImage ?? ''}
        authorName={viewingSeed?.authorName ?? ''}
        dateLabel={viewingSeed?.dateLabel ?? ''}
        address={viewingSeed?.address ?? ''}
        initialComment={viewingSeed?.comment ?? ''}
        placeholder=""
        confirmLabel=""
        readonly
        onConfirm={() => setViewingSeed(null)}
        onCancel={() => setViewingSeed(null)}
      />
    </>
  );
}
