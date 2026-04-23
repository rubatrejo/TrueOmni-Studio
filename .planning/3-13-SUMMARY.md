# Fase 3.13 — Summary (Trails module)

**Fecha cierre:** 2026-04-23
**Commit(s):** pendiente

## Alcance

Módulo Trails: 15 rutas de senderismo con listing + detail. Similar a
Things to Do pero con dos diferencias clave en el detail screen:

1. **Tabs Default Map / Trail Map**: un solo mapa Mapbox con toggle de
   visibility de un layer GeoJSON LineString embebido en config.
2. **Panel Considerations**: grid 2-col con 6 campos estructurados
   (distance, difficulty, duration, elevationGain, trailType, dogFriendly).

Sin SVGs del XD — diseño visual reusa el patrón establecido.

## Decisiones arquitectónicas

1. **`kind: 'trails'`** discriminado en `HomeModuleVariant`. Permite shape
   `Trail` con campos propios (considerations, trailMap) sin tocar `Listing`.
2. **`ListingDetail` extendido con `mapSlot?: ReactNode` + `cardHeight?: number`**.
   Slot reemplaza el bloque Map clásico; `cardHeight` permite ampliar el
   card a 1780 para acomodar los 6 rows de considerations.
3. **`TrailsModule` reusa `ListingsGrid` + `ListingCard`** vía `trailToListing`
   adapter. Cero componentes nuevos para el grid.
4. **`TrailDetail` = wrapper de `ListingDetail`** con mapSlot (TrailMapTabs)
   - extraDetails (ConsiderationsPanel) + favoritesKind='trail'. No duplica
     el shell de 900 líneas.
5. **`useTrailFavorites`** bucket propio `kiosk_trail_favorites`. El
   `SharingRow` del `ListingDetail` ahora acepta 'listing' | 'event' | 'trail'.
6. **GeoJSON embed en config** — sin fetches externos. 10-15 puntos por
   trail, ~2-3 KB extra por trail.
7. **Sort reusa `SORT_OPTIONS`** de listings (Distance se habilita con
   clientCoords; Price se oculta implícitamente porque los trails no tienen
   priceRange significativo — el adapter pone `priceRange: 1` neutro).
8. **Filter overlay custom** con 3 secciones (Features AND + Difficulty OR
   - Trail Type OR). Pills estilo tickets/deals.
9. **Map aggregator integration pospuesta** a un follow-up — el scope de
   la fase ya es grande y se puede añadir aparte sin breaking change.

## Archivos creados

- `src/lib/trails.ts` — TrailFilterState + applyTrailsFilter + searchTrails + trailToListing.
- `src/components/trails/trails-module.tsx` — compose del listing.
- `src/components/trails/trails-filter-overlay.tsx` — overlay 3 secciones.
- `src/components/trails/trail-detail.tsx` — wrapper de ListingDetail.
- `src/components/trails/trail-map-tabs.tsx` — tabs + Mapbox con layer GeoJSON.
- `src/components/trails/considerations-panel.tsx` — grid 2-col icon+label+value.
- `.planning/3-13-1-PLAN.md`, `.planning/3-13-COVERAGE.md`, `.planning/3-13-SUMMARY.md`.
- `docs/superpowers/specs/2026-04-23-trails-module-design.md`.

## Archivos modificados

- `src/lib/config.ts` — tipos Trail + TrailConsiderations + HomeTrailsModule + union.
- `src/lib/favorites.ts` — exportar `useTrailFavorites`.
- `src/components/listings/listing-detail.tsx` — props `mapSlot?`, `cardHeight?`; favoritesKind extendido a 'trail'.
- `src/app/(kiosk)/home/[module]/page.tsx` — rama `case 'trails'`.
- `src/app/(kiosk)/home/[module]/[slug]/page.tsx` — rama `kind === 'trails'` con TrailDetail.
- `clients/default/config.json` — 15 trails seed + 21 textos `trails_*`.
- `clients/_template/config.json` — textos `trails_*` EN.
- `clients/demo-cliente-a/config.json` — textos `trails_*` ES.

## Verificación

- `pnpm check` (typecheck + lint + format:check) limpio.
- Playwright MCP screenshots:
  - `3-13-ola2-trails-listing.png` — grid 3-col con 15 trails ordenados por popularity.
  - `3-13-ola3-trail-detail-default.png` — detail de Camelback con tab Default Map activo (pin trailhead).
  - `3-13-ola3-trail-detail-trail-tab.png` — tab Trail Map activo (polyline azul + fit bbox).
  - `3-13-ola3-trail-detail-full.png` — detail completo con 6 considerations visibles.

## Deuda documentada

- **Map aggregator**: `src/lib/map-aggregator.ts` sin source `trails`. Añadir en follow-up con chip propio. El chip color podría ser olive `#b9bd39` o un tono verde específico para diferenciarse.
- **GET DIRECTIONS del Trail Map tabs**: v1 usa `window.open(maps.google.com)`. v2 puede integrar el `DirectionsModal` con turn-by-turn de Mapbox (reusa el existente del ListingDetail si se expone la callback).
- **Strings defensivos**: fallbacks `??` dentro de los componentes Trails (patrón idéntico a Tickets/Passes/Deals — se tolera).
- **Auditor white-label**: no ejecutado explícitamente por scope. Los hex en `TrailMapTabs` (`#1796d6` del layer, `#004f8b` del pin) + `ConsiderationsPanel` (`#004f8b` en los iconos) son design system conocido.
