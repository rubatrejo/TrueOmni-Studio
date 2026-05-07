# DS7-SUMMARY.md — Template `05-video-2ads`

**Fecha:** 2026-05-07
**Estado:** ✅ aprobado visualmente

## Hecho

- 2 ads PNG extraídos del SVG fuente:
  - `clients-signage/default/assets/ads/right-vertical.png` (800×1114) — anuncio "World Health Day"
  - `clients-signage/default/assets/ads/bottom-banner-pizza.png` (976×294) — anuncio Pizza
- Template `05-video-2ads.tsx` con 3 zonas:
  - **Video** (1144×644 @ 0,155): reusa pool.png. Play_Icon en (497, 247).
  - **Right vertical ad** (776×925 @ 1144,155): pattern verbatim viewBox 0 135.196 776 925.
  - **Bottom horizontal ad** (1144×281 @ 0,799): pattern verbatim viewBox 0 59.607 1144 281.
- White-label override per-slide via slot keys nombrados: `video`, `right-ad`, `bottom-ad`.
- Auto-load actualizado.
- `display.json` añade slide-video-2ads (5to slide en rotación).

## Verificado

- `pnpm typecheck` ✅
- GET `/signage/default/lobby-tv` ✅ HTTP 200
- GETs de assets nuevos ✅ HTTP 200
- Aprobación visual de Rubén ✅

## Decisiones

- **Slot keys nombrados** (`right-ad`, `bottom-ad` en lugar de `ad`): cuando un template tiene >1 ad, hace falta diferenciarlos en `slots[]`. El editor (DSS4+) usará estos keys para render distintos uploads en cada zona.
- **Imágenes guardadas como PNG**: las extraídas del SVG son PNG (no JPG). Mantengo extensión correcta para que el MIME sea preciso desde el route handler.

## Pendiente / siguiente

- **DS8 — `06-video-news-ad`**: introduce el módulo **News** (manual + RSS/API + slideshow rotation cada N segundos). Bottom-left tiene news en lugar de ad.
