# Specs — Módulo Map (Fase 3.7)

## Identidad

- **Nombre interno:** `map`
- **Ruta Next.js:** `/home/map`
- **Fase del roadmap:** Fase 3.7 — Map module (kind agregado).
- **SVGs:** `designs/Map/Map.svg` (main), `Map-Small-Detail.svg` (burbuja), `Maps-Welcome-PopUp.svg`, `Maps-Filter.svg`.
- **Medidas del canvas:** 1080 × 1920.

---

## Estados

- `welcome` — primer render de la sesión. Overlay "Welcome to Omni Maps" encima del main. Se gatea con `sessionStorage.kiosk_map_welcome_seen`.
- `main` — carrusel + chips + mapa + pins/clusters (default tras dismiss welcome).
- `bubble` — tras tap en pin: burbuja Map-Small-Detail anclada.
- `filter` — overlay oscuro con FILTERS y pills de features/subcategorías.
- `search` — `SearchOverlay` del home reutilizado con el pool combinado (listings + events).

---

## Jerarquía (main)

1. **HomeHeader** — logo TrueOmni + reloj + weather (showLanguage=false), gradient top→bottom sobre el `heroImage`.
2. **Carrusel horizontal** — cards compactas (img+title) con una **card activa** expandida mostrando category + title + address + "Open until 11:00 pm".
3. **Chips de categoría** — Play / Eat / Stay / Events con X para deseleccionar.
4. **MapCanvas** — Mapbox GL streets-v12 con clustering y layers de pins por categoría.
5. **FloatingHomeButton** — pill azul-izquierda, asset existente.

---

## Medidas clave

Valores extraídos del SVG `Map.svg` (aprox):

| Bloque                   |   x  |   y  |  w   |  h   | Notas                                    |
| ------------------------ | ---- | ---- | ---- | ---- | ---------------------------------------- |
| Header (hero image)      |   0  |    0 | 1080 |  260 | gradient overlay azul, logo + reloj      |
| Carrusel                 |   0  |  200 | 1080 |  195 | cards compactas 160 + activa ~340        |
| Chips row                |   0  |  410 | 1080 |   80 | gap 12px entre chips                     |
| MapCanvas                |   0  |  490 | 1080 | 1430 | resto del alto, con floating home button |
| FloatingHomeButton       |   0  | 1000 |  116 |  232 | asset reusado                            |

**Map-Small-Detail** (burbuja): 490 ancho × 252 alto (sin la flecha). Flecha inferior 24×12.

**Welcome popup**: card 640 × 420 centrada + backdrop `rgba(0,0,0,0.6)`.

**Filters overlay**: backdrop `rgba(0,0,0,0.75)` + pills en grid 3-4 columnas.

---

## Tipografía por bloque

| Bloque                 | Token fuente   | Tamaño              | Peso |
| ---------------------- | -------------- | ------------------- | ---- |
| Card activa category   | `--font-sans`  | 12px uppercase      | 600  |
| Card activa título     | `--font-sans`  | 18px                | 600  |
| Chips label            | `--font-sans`  | 18px                | 500  |
| Burbuja título         | `--font-sans`  | 24px                | 700  |
| Burbuja address/phone  | `--font-sans`  | 14px                | 400  |
| Burbuja mi-away        | `--font-sans`  | 14px                | 700  |
| Burbuja buttons        | `--font-sans`  | 14px uppercase      | 700  |
| Welcome title          | `--font-sans`  | 28px                | 700  |
| Welcome body           | `--font-sans`  | 18px                | 400  |
| FILTERS title          | `--font-sans`  | 36px uppercase      | 700  |
| Pills filter           | `--font-sans`  | 16px                | 500  |
| Buttons CLEAR/APPLY    | `--font-sans`  | 18px uppercase      | 700  |

---

## Colores por bloque

| Bloque                | Fondo                         | Texto / Icono           |
| --------------------- | ----------------------------- | ----------------------- |
| Chip Play             | `--chip-play` (azul claro)    | `--primary-foreground`  |
| Chip Eat              | `--chip-eat` (azul primary)   | `--primary-foreground`  |
| Chip Stay             | `--chip-stay` (olive)         | `--primary-foreground`  |
| Chip Events           | `--chip-events` (rojo)        | `--primary-foreground`  |
| Pin restaurants       | `--pin-eat`                   | white                   |
| Pin things-to-do      | `--pin-play`                  | white                   |
| Pin stay              | `--pin-stay`                  | white                   |
| Pin events            | `--pin-events`                | white                   |
| Pin seleccionado      | `--pin-selected`              | white                   |
| Cluster count         | `--cluster-bg`                | `--cluster-fg`          |
| Burbuja bg            | `--foreground` (dark)         | `--background`          |
| Welcome tab           | `--primary`                   | `--primary-foreground`  |
| Welcome card body     | `--background`                | `--foreground`          |
| Filter backdrop       | `rgba(0,0,0,0.75)`            | —                       |
| Filter pills inactivo | transparente outline white    | white                   |
| Filter pills activo   | `--background`                | `--primary`             |

Nuevos tokens a añadir en `tokens.css`:

```css
--chip-play: 201 100% 45%;      /* azul claro */
--chip-eat: 210 55% 27%;        /* azul oscuro (primary del kiosk) */
--chip-stay: 75 45% 55%;        /* olive (del listings) */
--chip-events: 0 75% 55%;       /* rojo */
--pin-eat: 210 55% 27%;
--pin-play: 210 55% 27%;
--pin-stay: 75 45% 55%;
--pin-events: 0 75% 55%;
--pin-selected: 0 75% 55%;
--cluster-bg: 0 65% 50%;
--cluster-fg: 0 0% 100%;
```

---

## Contenido (qué se lee de `config`)

- `features.home.modules.map.label` → sólo para accesibilidad; el módulo no muestra título porque no hay toolbar.
- `features.home.modules.map.welcomeCopy.{title,subtitle,body,cta}` → Welcome popup.
- `features.home.modules.map.chips.{play,eat,stay,events}` → labels de los chips.
- `features.home.modules.map.heroImage` → fondo del HomeHeader.
- `features.home.modules.map.defaultZoom` → zoom inicial.
- `features.home.modules.map.defaultCenter` → centro inicial. Si no, `config.client.coords`.
- `features.home.modules.map.eventsWindowDays` → ventana de eventos (default 7).
- `textos.map_filters_title` → "FILTERS".
- `textos.map_clear_all` / `map_apply` → botones del filter overlay.
- `textos.map_see_more_info` / `map_add_to_itinerary` / `map_added_to_itinerary` → botones burbuja.
- `textos.map_mi_away_suffix` → "mi away" suffix.
- `textos.map_min_walking_suffix` → "min" suffix de la pill walking.
- `textos.map_open_until_prefix` → "Open until" para la línea openToday.
- `integraciones.mapbox_token` → token pasado a `MapCanvas` como prop.

La data de pins sale de `features.home.modules.{restaurants,things-to-do,stay,events}` — el módulo Map no declara listings propios (ver `map-aggregator.ts`).

---

## Interacciones

- **Tap chip inactiva** → añade `source` al filtro.
- **Tap X del chip activo** → remueve `source` del filtro.
- **Tap card compacta** → `setSelected(slug) + easeTo(coords, max(14, zoom))`; la card se expande inline y el pin correspondiente se marca selected.
- **Tap pin (unclustered)** → igual que card tap + `carousel.scrollTo(indexOf(slug) * step)`.
- **Tap cluster** → `easeTo({center, zoom: currentZoom + 2})`.
- **Tap SEE MORE INFO** → `router.push('/home/{item.moduleSlug}/{item.slug}')`.
- **Tap ADD TO ITINERARY** → `useFavorites().toggle(slug)` o `useEventFavorites().toggle(slug)`.
- **Tap X burbuja** → cierra burbuja (reset selected).
- **Tap fuera card welcome** → ignora; solo dismissable via CTA "OK".

---

## Accesibilidad

- `aria-label` en chips ("Filter by Play", etc.).
- `role="dialog"` + `aria-modal="true"` en Welcome + Filter overlays.
- Target táctil ≥ 96×96 px en chips, pills, CTAs.
- Welcome popup es auto-focus al botón OK para navegación por teclado.

---

## Verificación (checklist)

- [ ] 4 SVGs en `designs/Map/` y spec en este archivo.
- [ ] Inventario de groups en `.planning/3-7-COVERAGE.md`.
- [ ] Render idéntico ±2px vs cada SVG (`revisor-visual`).
- [ ] `pnpm check` limpio.
- [ ] `auditor-white-label` sin hallazgos.
- [ ] Cambiar `KIOSK_CLIENT` cambia chips/welcome/pins sin tocar `.tsx`.
- [ ] Screenshots: `welcome.png`, `main.png`, `chip-eat-off.png`, `filter-open.png`, `bubble.png`, `cluster-zoom.png`, `search-map.png` en `.planning/verifications/3-7-*.png`.

---

**Notas libres:** el pool de pins combina Listings + Events filtrados a 7 días. Los chips reflejan los 4 kinds lógicos; si un cliente no declara `events`, el chip Events se oculta automáticamente (via `availableChips`).
