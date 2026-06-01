'use client';

import { useRouter } from 'next/navigation';

import { resolveAssetUrl } from '@/lib/asset-url';

import { PwaHeart } from './pwa-heart';

const OPEN_SANS = 'var(--font-open-sans)';

export interface ListingItem {
  slug: string;
  title: string;
  subcategory: string;
  image: string;
  coords: { lat: number; lng: number };
  distanceMi: number;
  /** "City, ST" derivado de la dirección (para la card del mapa, estilo kiosk). */
  cityState: string;
  /** "Open until 11 pm" (prefijo de config + cierre de hoy). */
  openUntil: string;
  /** Módulo de origen (solo en agregados, ej. el módulo Maps). */
  moduleSlug?: string;
  /** Slug real para construir el href de detalle cuando `slug` es un uid agregado. */
  detailSlug?: string;
}

/**
 * Fila del list view de listings (thumb + título + distancia + favorito). Extraída
 * de `ListingsListScreen` para reutilizarse también en el módulo Maps (`PwaMapScreen`)
 * sin duplicar UI. El destino del tap se pasa como `href` (cada consumidor decide:
 * `${basePath}/${slug}` o `/pwa/map/${module}/${slug}`).
 */
export function ListingRow({
  item,
  href,
  fav,
  onToggleFav,
  distanceSuffix,
}: {
  item: ListingItem;
  href: string;
  fav: boolean;
  onToggleFav: () => void;
  distanceSuffix: string;
}) {
  const router = useRouter();
  return (
    <li
      className="flex items-center gap-3 border-b px-[18px] py-3"
      style={{ borderColor: 'hsl(var(--foreground) / 0.1)' }}
    >
      <button
        type="button"
        onClick={() => router.push(href)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span
          className="shrink-0 rounded-[6px] bg-cover bg-center"
          style={{
            width: 84,
            height: 64,
            backgroundImage: `url("${resolveAssetUrl(item.image)}")`,
          }}
        />
        <span className="min-w-0 flex-1">
          <span
            className="block truncate font-bold text-foreground"
            style={{ fontSize: 17, fontFamily: OPEN_SANS }}
          >
            {item.title}
          </span>
          <span
            className="block text-foreground/50"
            style={{ fontSize: 13, fontFamily: OPEN_SANS }}
          >
            {item.distanceMi.toFixed(1)} {distanceSuffix}
          </span>
        </span>
      </button>
      <button type="button" aria-label="Favorite" onClick={onToggleFav} className="shrink-0">
        <PwaHeart filled={fav} size={27} />
      </button>
    </li>
  );
}
