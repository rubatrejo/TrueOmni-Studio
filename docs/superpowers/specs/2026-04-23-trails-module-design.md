# Trails Module — Design Spec

**Fecha:** 2026-04-23
**Autor:** Rubén (designers@trueomni.com) + Claude
**Fase:** 3.13

## Context

Módulo para el kiosk que muestra rutas de senderismo (trails) de la zona
del cliente. Similar al módulo Things to Do pero con dos diferencias en
el detail:

1. Un toggle de mapa: mapa por defecto (pin trailhead) vs mapa del trail
   (overlay con la ruta GeoJSON).
2. Una sección "Considerations" con información estructurada: distancia,
   dificultad, duración, desnivel, tipo de ruta, admite perros.

Sin SVGs del XD — el diseño visual reusa el `ListingDetail` establecido.

## Goal

Módulo funcional con reuso máximo del chrome (ListingsToolbar, SearchOverlay,
SortOverlay, ListingsGrid, ListingCard, ListingDetail). Componentes nuevos
se limitan a los bloques propios de Trails: filter overlay 3-secciones,
trail map tabs, considerations panel, wrapper del detail.

## Flow

```
/home/trails
  ├─ grid 3-col (ListingCard reusado)
  ├─ tap card → /home/trails/{slug}
  │
  └─ /home/trails/{slug} = TrailsModule (background) + TrailDetail (overlay)
        └─ TrailDetail = ListingDetail con:
             mapSlot       = <TrailMapTabs>
             extraDetails  = <ConsiderationsPanel>
             favoritesKind = 'trail'
             cardHeight    = 1780
```

## Data model

```ts
type TrailDifficulty = 'Easy' | 'Moderate' | 'Hard';
type TrailType = 'Loop' | 'Out & Back' | 'Point to Point';

interface TrailConsiderations {
  distance: string; // "5.2 mi"
  difficulty: TrailDifficulty;
  duration?: string; // "2-3 hours"
  elevationGain?: string; // "1,280 ft"
  trailType?: TrailType;
  dogFriendly?: boolean;
}

interface Trail {
  slug;
  title;
  subcategory;
  image: string;
  hours;
  address;
  phone;
  website;
  description: string;
  features: string[];
  popularity: number;
  coords: { lat; lng };
  directions: { icon; distance; instruction }[];
  considerations: TrailConsiderations;
  trailMap: {
    geojson: { type: 'LineString'; coordinates: [number, number][] };
    defaultCenter?: { lat; lng };
    defaultZoom?: number;
  };
}

interface HomeTrailsModule {
  kind: 'trails';
  label: string;
  heroImage: string;
  subcategories: string[];
  features: string[];
  difficulties: TrailDifficulty[];
  trailTypes: TrailType[];
  trails: Trail[];
}
```

## Pipeline

```ts
applyTrailsFilter(trails, filter)    // AND features + OR difficulty + OR type
  → searchTrails(query)              // title + subcategory + description
  → map(trailToListing)              // adapter → Listing[] para el grid
  → sortListings(order, coords)      // reusa SORT_OPTIONS
```

## Componentes

| Archivo                                           | Rol                             |
| ------------------------------------------------- | ------------------------------- |
| `src/lib/trails.ts`                               | filter + search + adapter       |
| `src/components/trails/trails-module.tsx`         | Compose                         |
| `src/components/trails/trails-filter-overlay.tsx` | 3 secciones                     |
| `src/components/trails/trail-detail.tsx`          | Wrapper ListingDetail           |
| `src/components/trails/trail-map-tabs.tsx`        | Tabs + Mapbox con layer GeoJSON |
| `src/components/trails/considerations-panel.tsx`  | Grid 2-col                      |

## Reuso

- `ListingsToolbar` (4 celdas).
- `ListingsGrid` + `ListingCard` vía `trailToListing`.
- `SearchOverlay` (Home) + `SortOverlay` (listings).
- `ListingDetail` shell entero, extendido con props `mapSlot` y `cardHeight`.
- `HomeHeader`, `FloatingHomeButton`, `AdsSlot`, `FavoriteAddedToast`.
- `createFavoritesStore` (nueva instancia `kiosk_trail_favorites`).

## Routing

- `[module]/page.tsx` → `case 'trails'` con `TrailsModule + AdsSlot`.
- `[module]/[slug]/page.tsx` → `kind === 'trails'` con `TrailsModule + TrailDetail + AdsSlot`.

## Strings tokenizados

21 keys `trails_*`: label, empty, considerations_title,
consideration_distance/difficulty/duration/elevation/type/dog_friendly,
dog_friendly_yes/no, map_tab_default/trail, filters_title,
filter_features/difficulty/type, clear_all, apply.

## Out of scope (v1)

- Map aggregator integration (trails como chip del módulo Map).
- DirectionsModal con turn-by-turn dentro del TrailMapTabs (v1 abre Google
  Maps externo en nueva tab).
- Marker adicionales en puntos del GeoJSON (summit, viewpoint).
- Sincronización de favoritos entre sesiones (sessionStorage no persiste).

## Verification

- `pnpm check` limpio.
- Playwright MCP: `/home/trails` listing con 15 cards; detail con tabs +
  considerations; tap Trail Map dibuja polyline y fit bbox; Default Map
  vuelve al pin.
- Toggle `KIOSK_CLIENT=demo-cliente-a` muestra textos ES.
- `applyTrailsFilter` con 1 feature + 1 difficulty + 1 trailType reduce el
  pool correctamente.
