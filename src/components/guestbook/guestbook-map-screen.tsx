'use client';

import type mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';

import type { GuestbookPinOption, GuestbookSeedPin } from '@/lib/config';

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
  getMap,
  seedPins,
  pinCatalog,
  texts,
  authorName,
  userAddress,
  onFinish,
}: {
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
    coords: { lat: number; lng: number };
  } | null>(null);

  const placedMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const seedMarkersRef = useRef<mapboxgl.Marker[]>([]);

  // Render seedPins como markers DOM.
  useEffect(() => {
    const map = getMap();
    if (!map) return;

    // Limpia markers previos
    for (const m of seedMarkersRef.current) m.remove();
    seedMarkersRef.current = [];

    const mapboxgl = (globalThis as unknown as { mapboxgl?: typeof import('mapbox-gl') }).mapboxgl;
    // Import dinámico para evitar SSR issues
    void import('mapbox-gl').then((mod) => {
      const Marker = mod.Marker ?? mapboxgl?.Marker;
      if (!Marker) return;
      for (const p of seedPins) {
        const el = document.createElement('button');
        el.setAttribute('type', 'button');
        el.setAttribute('aria-label', `${p.authorName}: ${p.comment ?? ''}`);
        el.style.width = '54px';
        el.style.height = '68px';
        el.style.backgroundColor = 'transparent';
        el.style.border = 'none';
        el.style.cursor = 'pointer';
        el.style.padding = '0';
        el.innerHTML = `
          <div style="position:relative;width:54px;height:68px;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
            <div style="position:absolute;left:3px;top:0;width:48px;height:48px;border-radius:50%;border:3px solid #1796d6;background:#fff;overflow:hidden;">
              <img src="${p.pinImage}" alt="" style="width:100%;height:100%;object-fit:cover;" />
            </div>
            <div style="position:absolute;left:22px;top:42px;width:10px;height:10px;background:#1796d6;transform:rotate(45deg);"></div>
          </div>
        `;
        el.addEventListener('click', () => setViewingSeed(p));
        const m = new Marker({ element: el, anchor: 'bottom' })
          .setLngLat([p.coords.lng, p.coords.lat])
          .addTo(map);
        seedMarkersRef.current.push(m);
      }
    });

    return () => {
      for (const m of seedMarkersRef.current) m.remove();
      seedMarkersRef.current = [];
    };
  }, [getMap, seedPins]);

  // Render del pin colocado por el usuario.
  useEffect(() => {
    const map = getMap();
    if (!map) return;

    if (placedMarkerRef.current) {
      placedMarkerRef.current.remove();
      placedMarkerRef.current = null;
    }
    if (!placed) return;

    void import('mapbox-gl').then((mod) => {
      const Marker = mod.Marker;
      const el = document.createElement('div');
      el.style.width = '72px';
      el.style.height = '90px';
      el.innerHTML = `
        <img src="${placed.pinImage}" alt="" style="width:72px;height:90px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.4));" />
      `;
      const m = new Marker({ element: el, anchor: 'bottom' })
        .setLngLat([placed.coords.lng, placed.coords.lat])
        .addTo(map);
      placedMarkerRef.current = m;
    });
  }, [getMap, placed]);

  const handleDrop = (optionId: string, clientX: number, clientY: number) => {
    const map = getMap();
    if (!map) return;
    const canvas = map.getCanvasContainer();
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return; // fuera del mapa

    const lngLat = map.unproject([x, y]);
    const option = pinCatalog.find((p) => p.id === optionId);
    if (!option) return;

    setPendingDrop({
      optionId,
      pinImage: option.image,
      coords: { lat: lngLat.lat, lng: lngLat.lng },
    });
  };

  const usedIds = placed ? [placed.optionId] : [];

  return (
    <>
      {/* Rail + FINISH en la parte inferior del canvas */}
      <div
        className="absolute inset-x-0"
        style={{
          bottom: 0,
          zIndex: 20,
        }}
      >
        {placed ? (
          <div
            className="flex items-center justify-center"
            style={{
              paddingTop: '14px',
              paddingBottom: '6px',
              backgroundColor: '#ffffff',
            }}
          >
            <button
              type="button"
              onClick={() => onFinish(placed)}
              className="font-sans text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
              style={{
                width: '240px',
                height: '54px',
                borderRadius: '8px',
                backgroundColor: '#b9bd39',
                fontSize: '20px',
                lineHeight: '20px',
                fontWeight: 700,
                letterSpacing: '0.12em',
              }}
            >
              {texts.finishLabel}
            </button>
          </div>
        ) : null}

        <GuestbookPinRail
          title={texts.pinTitle}
          subtitle={texts.pinSubtitle}
          options={pinCatalog}
          usedIds={usedIds}
          onDrop={handleDrop}
        />
      </div>

      {/* Modal de comentario para el pin del usuario */}
      <GuestbookPinCommentModal
        open={pendingDrop !== null}
        pinImage={pendingDrop?.pinImage ?? ''}
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
