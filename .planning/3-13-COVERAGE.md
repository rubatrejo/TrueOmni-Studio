# Fase 3.13 — Coverage checklist (Trails)

Sin SVGs del XD (Rubén confirmó en brainstorming que el módulo reusa el
patrón visual establecido de listings/events/tickets). Coverage por
componente y flujo.

## Listing

- [x] Hero header (logo + clock + weather + heroImage) → `HomeHeader` reusado.
- [x] Toolbar azul label "Trails" + search + sort + filter → `ListingsToolbar` reusado.
- [x] Grid 3-col de cards → `ListingsGrid` reusado vía adapter `trailToListing`.
- [x] Cards con heart + subcategory + title + city + hours → `ListingCard` reusado.
- [x] Favoritos con heart persistido en `kiosk_trail_favorites` → `useTrailFavorites`.
- [x] Filter overlay con 3 secciones (Features AND + Difficulty OR + Trail Type OR) → `TrailsFilterOverlay`.
- [x] Sort overlay con `SORT_OPTIONS` reusado → `SortOverlay`.
- [x] Search overlay con QWERTY → `SearchOverlay` reusado.
- [x] Scroll-hint gradient bottom.
- [x] Floating home button.

## Detail

- [x] Header azul con SUBCATEGORY + TITLE + X (reusado del `ListingDetail`).
- [x] Hero image full-width (reusado).
- [x] Action row: hours + phone + WEBSITE (reusado).
- [x] Sharing row: SEND TO EMAIL + SEND TO PHONE + ADD TO FAVORITES con bucket `trail` (`useTrailFavorites` en `ListingDetail`).
- [x] **Tabs [Default Map | Trail Map]** con underline azul del activo → `TrailMapTabs`.
- [x] **Tab Default**: mapa Mapbox con pin del trailhead.
- [x] **Tab Trail**: GeoJSON LineString renderizado como layer `line-color: #1796d6` + fit al bbox.
- [x] Address + GET DIRECTIONS (replica chrome del MapSection clásico).
- [x] DESCRIPTION (reusado).
- [x] **CONSIDERATIONS panel** con 6 campos posibles (distance, difficulty, duration, elevationGain, trailType, dogFriendly) → `ConsiderationsPanel`.
- [x] Cada field con icon + label + value.
- [x] Card height extendida a 1780 para acomodar los 6 rows (prop `cardHeight` añadida al `ListingDetail`).

## Data

- [x] Tipos `Trail`, `TrailConsiderations`, `HomeTrailsModule` añadidos a `src/lib/config.ts` + union `HomeModuleVariant`.
- [x] Pipeline `applyTrailsFilter` → `searchTrails` → `trailToListing` → `sortListings` en `src/lib/trails.ts`.
- [x] 15 trails seed en `clients/default/config.json` (Arizona classics).
- [x] GeoJSON LineString embed por trail (~10-15 puntos).
- [x] 21 textos `trails_*` tokenizados en los 3 clientes (default EN, \_template EN, demo-cliente-a ES).

## Pendientes (TODO menores)

- [ ] **Map aggregator integration**: añadir `trails` como source al `src/lib/map-aggregator.ts` con chip propio. El módulo Map actualmente no muestra trails. Documentado en STATE.
- [ ] **GET DIRECTIONS del TrailMapTabs**: v1 abre `maps.google.com?q=` en nueva tab (fallback). El `DirectionsModal` con turn-by-turn está encapsulado en `ListingDetail` sin API externa; v2 podría exponer la callback o mover el modal al `ListingDetail` shell.
- [ ] **Event hover/tap en la ruta del GeoJSON**: v1 solo muestra el line; v2 podría añadir markers en puntos clave (trailhead, summit, viewpoint).
