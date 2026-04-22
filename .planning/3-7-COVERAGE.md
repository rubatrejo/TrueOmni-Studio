# Coverage Checklist — Fase 3.7 Map

Tracking pixel-perfect vs los 4 SVGs de `designs/Map/`. Cada item se marca
✅ cuando el render coincide con el SVG ±2px. Ver protocolo en
`.planning/PIXEL-PERFECT-PROTOCOL.md`.

---

## `designs/Map/Map.svg` (pantalla principal)

### Header

- [ ] Dashboard Main Header — heroImage + gradient top→bottom + logo TrueOmni + 12:00 PM + 50° + Friday, December 10, 2025 + icon weather (reusa `HomeHeader` con `heroImage={mod.heroImage}` + `showLanguage={false}`).

### Carrusel horizontal (Maps Listing + thumbnails)

- [ ] Scroll Group 1 — contenedor horizontal scroll, peek del siguiente, alto ~200.
- [ ] thumbnail 1..5 — cards compactas (image 142×142 + título debajo).
- [ ] Maps Listing — card activa expandida con category uppercase + title + address + hora.
- [ ] Group 3622 / Group 7331 — agrupadores de thumbnail+texto del carrusel.

### Chips categoría (toolbar sobre mapa)

- [ ] Chip Play (Rectangle 3 + X) — fondo azul claro, texto blanco, ícono filter + close.
- [ ] Chip Eat (Rectangle 8) — fondo azul primary, texto blanco.
- [ ] Chip Stay (Rectangle Copy 3) — fondo olive, texto blanco.
- [ ] Chip Events (cuarto chip añadido) — fondo rojo, texto blanco (no en SVG, añadido porque el plan cubre 4 chips).

### Pins sobre el mapa

- [ ] Restaurant - Pin (×N) — azul con cubiertos (pin/restaurant group).
- [ ] Things To Do - Pin (×N) — pin/thing-to-do (azul con pata).
- [ ] Hotel - Pin (×N) — pin/hotel (olive con pata outline).
- [ ] Star - Pin (×N) — icono eventos (usamos para events, estilo del SVG).
- [ ] Number - Pin (cluster) — pin rojo con número centrado (cluster-count).
- [ ] Pin seleccionado — teardrop rojo grande con flecha inferior, anclado al selected slug.

### Mapa base

- [ ] MapCanvas — streets-v12, centrado en `mod.defaultCenter ?? client.coords`, zoom `mod.defaultZoom ?? 13`, interactive, attributionControl false.

### Floating home button

- [ ] Button Back Home — reuso del componente existente `FloatingHomeButton`.

---

## `designs/Map/Map-Small-Detail.svg` (burbuja tooltip)

- [ ] Card base — rounded 14px, fondo oscuro 18-25% opacidad con imagen + gradient.
- [ ] Flecha inferior — triángulo blanco 24×12 apuntando al pin.
- [ ] Pill walking (top-left) — `{min} min` con icono persona caminando sobre fondo blanco rounded pill.
- [ ] X close (top-right) — círculo olive outline con × blanco.
- [ ] Imagen hero — object-cover + gradient oscuro bottom (`linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.65) 100%)`).
- [ ] CATEGORY — 12px olive uppercase.
- [ ] Título — "Lorem Ipsum" estilo (24px white bold).
- [ ] Address + phone (línea 1) — "123 Some Street, Breckenridge, CO 12345" 14px white.
- [ ] Phone + hours (línea 2) — "(555) 555-5555 | Open until 11:00 pm" 14px light.
- [ ] Columna derecha — "7.5 mi away" 14px white bold + "Open until 11:00 pm" olive.
- [ ] Divisor vertical — 1px rgba(255,255,255,0.3) entre botones.
- [ ] Botón SEE MORE INFO — azul fill, texto white uppercase.
- [ ] Botón ADD TO ITINERARY — blue outline / fill olive según favorito, texto white uppercase.

---

## `designs/Map/Maps-Welcome-PopUp.svg`

- [ ] Backdrop — `rgba(0,0,0,0.6)` fullscreen dentro del canvas.
- [ ] Card — 640×420 centrada, rounded 16px.
- [ ] Tab azul superior — 640×140 rounded-top, fondo `--primary`, padding interno.
- [ ] Title "Welcome to Omni Maps" — 28px white bold centered.
- [ ] Subtitle "powered by Google" — 14px white regular centered (aparece bajo el title).
- [ ] Body párrafo — 18px `--foreground` regular, padding 32 lateral, centered.
- [ ] CTA "OK" — botón `--primary` full-width bottom-padding, texto white uppercase.

---

## `designs/Map/Maps-Filter.svg`

- [ ] Backdrop — `rgba(0,0,0,0.75)` fullscreen dentro del canvas.
- [ ] Title "FILTERS" — 36px white uppercase bold.
- [ ] Grid de Filter Name pills — 3-4 columnas, outline white (inactivo), fill `--background` text `--primary` (activo).
- [ ] CLEAR ALL button — olive fill, texto uppercase white bold.
- [ ] APPLY button — `--primary` fill, texto uppercase white bold.
- [ ] Las 14 "Filter Name" placeholder se reemplazan con `buildFeaturePool(items)` + `buildSubcategoryPool(items)`.

---

## Tokens CSS a añadir (`clients/_template/tokens.css`)

- [ ] `--chip-play`, `--chip-eat`, `--chip-stay`, `--chip-events`.
- [ ] `--pin-eat`, `--pin-play`, `--pin-stay`, `--pin-events`, `--pin-selected`.
- [ ] `--cluster-bg`, `--cluster-fg`.

## Strings a config (`clients/default/config.json`)

- [ ] `textos.map_filters_title`, `map_clear_all`, `map_apply`.
- [ ] `textos.map_see_more_info`, `map_add_to_itinerary`, `map_added_to_itinerary`.
- [ ] `textos.map_mi_away_suffix`, `map_min_walking_suffix`, `map_open_until_prefix`.
- [ ] `textos.map_welcome_title`, `map_welcome_subtitle`, `map_welcome_body`, `map_welcome_cta`.
- [ ] `textos.map_chip_play`, `map_chip_eat`, `map_chip_stay`, `map_chip_events`.
- [ ] `features.home.modules.map.welcomeCopy.{title,subtitle,body,cta}` (copy completa como backup; el UI consume este primero).
- [ ] `features.home.modules.map.chips.{play,eat,stay,events}`.

---

## Screenshots requeridos (.planning/verifications/3-7-\*.png)

- [ ] `3-7-welcome.png` — carga inicial con popup.
- [ ] `3-7-main.png` — mapa con chips y pins tras dismiss welcome.
- [ ] `3-7-chip-eat-off.png` — tras tap X del chip Eat.
- [ ] `3-7-filter-open.png` — overlay FILTERS abierto.
- [ ] `3-7-bubble.png` — burbuja Map-Small-Detail con pin seleccionado.
- [ ] `3-7-cluster-zoom.png` — before/after tap en cluster.
- [ ] `3-7-search-map.png` — SearchOverlay abierto con pool combinado.

---

## Olas

- [x] Ola 1 — tipos, config, data layer, routing stub.
- [ ] Ola 2 — designs depositados + COVERAGE inventariado + `MapCanvas` con clustering.
- [ ] Ola 3 — carrusel + chips + sync card↔pin.
- [ ] Ola 4 — burbuja `MapPinBubble` verbatim SVG + acciones.
- [ ] Ola 5 — welcome popup + filter overlay + search generalizado.
- [ ] Ola 6 — verificación `revisor-visual` + `auditor-white-label` + commit.
