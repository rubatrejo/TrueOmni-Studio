'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { MapCanvas } from '@/components/map/map-canvas';
import { resolveAssetUrl } from '@/lib/asset-url';
import type { MapItem } from '@/lib/map-item';

import type { ListingItem } from './listing-row';
import { PwaHeart } from './pwa-heart';

const OLIVE = 'hsl(var(--brand-tertiary))';
const FOOTER = 'hsl(0 0% 33%)'; // gris neutro del footer (≈ #555 del card del kiosk)
const OPEN_SANS = 'var(--font-open-sans)';

/* Card estilo kiosk (imagen 16:9 + footer): ~2.5 visibles en el canvas 390. */
const CARD_W = 140;
const CARD_GAP = 10;
const IMG_H = Math.round((CARD_W * 9) / 16); // 16:9

/**
 * Módulo de listings #3 — vista Map. Reutiliza `MapCanvas` del kiosk (pines/cluster/
 * pin seleccionado idénticos) + un carrusel inferior de cards sincronizado con el pin
 * seleccionado. Tap en una card → detalle (`${basePath}/${slug}`).
 */
export function ListingsMap({
  token,
  center,
  zoom = 13,
  items,
  mapItems,
  basePath,
  hrefForItem,
}: {
  token: string | undefined;
  center: { lat: number; lng: number };
  zoom?: number;
  items: ListingItem[];
  mapItems: MapItem[];
  /** Ruta base del módulo, ej. "/pwa/restaurants" o "/pwa/stay". */
  basePath: string;
  /** Destino del tap por item (default `${basePath}/${slug}`). Útil en agregados. */
  hrefForItem?: (it: ListingItem) => string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(items[0]?.slug ?? null);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const railRef = useRef<HTMLDivElement | null>(null);
  const syncing = useRef(false);

  const toggleFav = (slug: string) =>
    setFavs((s) => {
      const next = new Set(s);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  // Pin seleccionado en el mapa → centrar la card en el carrusel.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || selected == null) return;
    const idx = items.findIndex((i) => i.slug === selected);
    if (idx < 0) return;
    syncing.current = true;
    rail.scrollTo({ left: idx * (CARD_W + CARD_GAP), behavior: 'smooth' });
    const t = setTimeout(() => (syncing.current = false), 400);
    return () => clearTimeout(t);
  }, [selected, items]);

  // Scroll del carrusel → seleccionar el pin centrado.
  const onRailScroll = () => {
    if (syncing.current || !railRef.current) return;
    const idx = Math.round(railRef.current.scrollLeft / (CARD_W + CARD_GAP));
    const slug = items[idx]?.slug;
    if (slug && slug !== selected) setSelected(slug);
  };

  return (
    <div className="relative flex-1 overflow-hidden bg-background">
      <MapCanvas
        token={token}
        items={mapItems}
        center={center}
        zoom={zoom}
        selectedSlug={selected}
        onSelect={(slug) => setSelected(slug)}
        pinScale={0.5}
        selectedPinScale={0.34}
        cluster={false}
        className="h-full w-full"
      />

      {/* Carrusel inferior — cards estilo kiosk (imagen 16:9 + footer) */}
      <div
        ref={railRef}
        onScroll={onRailScroll}
        className="scrollbar-hide absolute inset-x-0 flex snap-x snap-mandatory overflow-x-auto px-4"
        style={{ bottom: 16, gap: CARD_GAP }}
      >
        {items.map((it) => {
          const isActive = it.slug === selected;
          return (
            // Card = contenedor (no button) para no anidar el botón de favorito
            // dentro del botón de navegación (HTML inválido → hydration error).
            <div
              key={it.slug}
              className="relative shrink-0 snap-center overflow-hidden rounded-[6px] shadow-md"
              style={{ width: CARD_W, opacity: isActive ? 1 : 0.55 }}
            >
              <button
                type="button"
                onClick={() => router.push(hrefForItem?.(it) ?? `${basePath}/${it.slug}`)}
                className="block w-full text-left"
              >
                {/* Imagen 16:9 */}
                <div
                  className="bg-cover bg-center"
                  style={{ height: IMG_H, backgroundImage: `url("${resolveAssetUrl(it.image)}")` }}
                />
                {/* Footer */}
                <div className="px-2.5 py-1.5" style={{ backgroundColor: FOOTER }}>
                  <p
                    className="truncate uppercase text-white"
                    style={{ fontSize: 8, letterSpacing: 0.4, fontFamily: OPEN_SANS }}
                  >
                    {it.subcategory}
                  </p>
                  <p
                    className="truncate font-semibold text-white"
                    style={{ fontSize: 13, lineHeight: 1.1, fontFamily: OPEN_SANS }}
                  >
                    {it.title}
                  </p>
                  <p
                    className="truncate text-white"
                    style={{ fontSize: 8.5, fontWeight: 300, marginTop: 2, fontFamily: OPEN_SANS }}
                  >
                    {it.distanceMi.toFixed(1)} mi · {it.cityState}
                  </p>
                  <p
                    className="truncate font-semibold"
                    style={{ fontSize: 8.5, color: OLIVE, marginTop: 1, fontFamily: OPEN_SANS }}
                  >
                    {it.openUntil}
                  </p>
                </div>
              </button>
              {/* Corazón — hermano del botón de navegación (overlay sobre la imagen) */}
              <button
                type="button"
                aria-label="Favorite"
                onClick={() => toggleFav(it.slug)}
                className="absolute flex items-center justify-center rounded-full"
                style={{
                  right: 6,
                  top: 6,
                  width: 28,
                  height: 28,
                  backgroundColor: 'hsl(0 0% 100% / 0.7)',
                }}
              >
                <PwaHeart filled={favs.has(it.slug)} size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
