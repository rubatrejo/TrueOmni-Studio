# 3-3-3-COVERAGE — Ola 3: Detail screen

Inventario verbatim del SVG `designs/Listings/Food & Drink – Detail.svg`.
Todas las coords son del card (898×1589) con offset global
`translate(90, 166)` respecto al canvas 1080×1920. El fondo exterior al card
es el overlay negro `rgba(0,0,0,0.8)` (path `Overlay_Opacity` opacity 0.8).

## Checklist de groups (10 secciones + 3 stubs)

- [ ] **1. Backdrop + card base**
      Overlay `rgba(0,0,0,0.8)` en canvas completo (1080×1920).
      Card blanco 898×1589 rx=8 at card-origin, shadow `filter(Rectangle_11)`.

- [ ] **2. Header azul**
      `rect 899×312 fill #004f8b` at (0, 0) del card. Clip a rx=8 arriba.

- [ ] **3. SUBCATEGORY text**
      Helvetica 24, fill #fff, at card (48, 48). Baseline tspan y=18.
      Texto = `listing.subcategory.toUpperCase()`.

- [ ] **4. TITLE text**
      Helvetica 60, fill #fff, at card (48, 48+33=81). Baseline tspan y=46.
      Texto = `listing.title`. (Sin uppercase.)

- [ ] **5. X close button**
      Font Awesome Pro (U+F00D) 67px, fill #fff, at card (804, 31),
      tspan y=59 → baseline card y=90. Click → `/home/{moduleKey}`.

- [ ] **6. Hero image**
      `rect 899×369` at card (0, 190) `object-cover listing.image`.

- [ ] **7. SEE 360 badge**
      Pastilla dark `#282724` opacity 0.547, 254×61 rx=30.5,
      at card (~30, ~468). Icon 360-degrees white + texto "SEE 360"
      OctinCollegeFree 38 white. Stub Ola 7 (sólo renderiza si
      `listing.threshold360Url`).

- [ ] **8. Time and phone text**
      Helvetica 20, fill black default, at card (59, 663.5).
      Formato: `{listing.hours}  |  {listing.phone}`.

- [ ] **9. WEBSITE button**
      `rect 260.211×64.083 rx=8 fill #1796d6` at card (609, 581.128).
      Texto "WEBSITE" Tahoma 24 white centered. Link `listing.website`.

- [ ] **10. RESERVE NOW button (OpenTable)**
      Rect 260×64 rx=8 white bg + border `#da3743` stroke. Logo OpenTable
      (3 círculos en cascada `#da3743`) + "RESERVE NOW" red. At card (609, 665).
      Sólo si `listing.reserveUrl`.

- [ ] **11. Sharing row (3 cells)**
      Contenedor at card (1.242, 753) altura 90. Dividers horizontales arriba
      y abajo `#e0e0e0`, 2 dividers verticales en x=299 y x=597 (card-relative).
      3 celdas (iconos 48×48 olive `#b9bd39` + label Helvetica-Bold 18
      `rgba(0,0,0,0.57)`): - Cell 1 **SEND TO EMAIL** — icon sobre (~57, ~787), texto `(108.757, 808)`. - Cell 2 **SEND TO PHONE** — icon (~340, ~781), texto `(396.874, 808)`. - Cell 3 **ADD TO FAVORITES** — icon heart Font Awesome (U+F004)
      en olive, texto `(687.758, 808)`.
      Stubs Ola 4/6: click no hace nada aún (Ola 4: favorites; Ola 6: email/phone modal).

- [ ] **12. Map section**
      Contenedor at card (0, 844). Rect 899×312 map real (Mapbox GL).
      Marker teardrop `#1796d6` 44.643×64.223 en coords del listing, centrado
      en listing.coords.

- [ ] **13. GET DIRECTIONS area (below map)** - Divider horizontal `#e0e0e0` at card y=1151 (ancho 894). - Texto address Helvetica 24 `rgba(74,74,74,0.9)` at card (36, 1216) +
      baseline. Contenido = `listing.address`. - Icon direcciones (pin+bandera) `#004f8b` ~25×25 at card (~634, ~1184). - Texto "GET DIRECTIONS" Helvetica-Bold 18 `#6e6e6e` at card (706, 1213).
      Stub Ola 7: click abre DirectionsModal (solo console.log por ahora).

- [ ] **14. DESCRIPTION heading**
      Helvetica-Bold 24, fill #444 opacity 0.85, at card (48, 1309).

- [ ] **15. Description body**
      Helvetica 18, fill #898989, at card (48, 1341). Multi-párrafo. Line
      height ~26px. Contenido = `listing.description`.

## Coords absolutas (canvas) para referencia

- Card: (90, 166) → (988, 1755).
- Header azul visible: (90, 166) → (989, 478) aprox.
- Hero: (90, 356) → (989, 725).
- Sharing row: (90, 919) → (989, 1009).
- Map: (90, 1010) → (989, 1322).
- Descripción: (138, 1475)+.

## Stubs explícitos

- **Favorites (cell 3)**: wire en Ola 4 con `useFavorites()`. Por ahora
  `onClick={() => {}}`.
- **Send email/phone (cells 1-2)**: wire en Ola 6. Por ahora `onClick={() => {}}`.
- **SEE 360 badge (hero)**: wire en Ola 7. Sólo render condicional.
- **GET DIRECTIONS**: wire en Ola 7. Por ahora `onClick={() => {}}`.

## Aceptación

- [ ] Render idéntico al SVG ±2px (revisor-visual).
- [ ] Cambiar `listing.website`/`listing.description` vía JSON cambia UI
      sin tocar TSX.
- [ ] Map renderiza con Mapbox real cuando `integraciones.mapbox_token`
      está presente; placeholder "Map unavailable" sino.
- [ ] X → `/home/{moduleKey}`.
- [ ] Click en card del grid → navega a `/home/{moduleKey}/{slug}`.
- [ ] `pnpm check` limpio.
