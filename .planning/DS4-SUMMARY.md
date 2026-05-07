# DS4-SUMMARY.md — Template `02-full-ad`

**Fecha:** 2026-05-07
**Estado:** ✅ completado, aprobado visualmente

## Hecho

- Imagen embedded del SVG extraída como PNG → `clients-signage/default/assets/ads/full-ad.png` (1398×782, 1.4MB).
- Template `02-full-ad.tsx` con `<svg viewBox="0 155 1920 925">` + group `Display_Full_Add` translate(0 155) + rect 1920×925 fill `url(#ad-fullbleed)`.
- Pattern verbatim del SVG: `width=1 height=1 viewBox="0 94.785 1920 925"` + image `width=1920 height=1073.991 preserveAspectRatio="xMidYMid slice"`.
- White-label: `getAssetUrl()` busca un `ads` module en los slots del slide. Si tiene asset propio → usa esa URL. Si no → fallback al `assets/ads/full-ad.png` del cliente.
- Auto-load del registry actualizado: `02-full-ad` registrado.
- `display.json` default: rota entre `01-full-events` (10s) y `02-full-ad` (8s).

## Verificado

- `pnpm typecheck` ✅
- GET `/signage/default/lobby-tv` ✅ HTTP 200
- GET `/signage-assets/default/assets/ads/full-ad.png` ✅ HTTP 200 image/png
- Aprobación visual de Rubén ✅

## Decisiones

- **Ad como single image white-label**: el contenido del ad (logo Travelife, copy "Let us take care of your trip", callout "Up to 30%", etc.) NO se renderea como SVG estructurado. Es un único asset rasterizado (PNG/JPG/video) que el cliente reemplaza completo en `clients-signage/<slug>/assets/ads/full-ad.png`. Simplifica el modelo y casa con la decisión del brainstorming ("el cliente sube los ads del tamaño que tenga cada container").
- **Slot override per-slide**: el template lee `slots[0].module.asset.url` para permitir slides con un ad distinto al default del cliente (ej: campaña promocional puntual). El default del cliente queda como fallback.

## Pendiente / siguiente

- **DS5 — Template `03-full-video-image`**: video fullscreen (con play overlay) + módulo Video/Image. El asset puede ser MP4/WebM además de imagen.
