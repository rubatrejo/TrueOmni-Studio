# DS5-SUMMARY.md — Template `03-full-video-image`

**Fecha:** 2026-05-07
**Estado:** ✅ completado, aprobado visualmente

## Hecho

- Imagen pool extraída del SVG → `clients-signage/default/assets/video-image/pool.png` (1280×720 PNG, 1.6MB).
- Template `03-full-video-image.tsx`:
  - `<svg viewBox="0 155 1920 925">` con rect 1920×1080 fill via pattern. El viewBox clipea el top 155px (donde overlapping va el header), preservando el visual del SVG donde la imagen se extiende detrás del header band.
  - Pattern verbatim del XD: `width=100% height=100% viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice"` con image natural 1280×720.
  - Play_Icon centrado en (885, 543): path circular blanco con triángulo de play interior, `fillOpacity=0.8`. Verbatim del SVG.
- White-label: `getAsset()` lee `slots[0].module.asset.url` y `kind` (`video` | `image`). Para video usa `<foreignObject>` + HTML5 `<video autoPlay muted loop playsInline objectFit:cover>`. Para image usa SVG `<pattern>` + `<image>`.
- Display playlist actualizada: rota entre `01-full-events` (10s), `02-full-ad` (8s), `03-full-video-image` (8s).

## Verificado

- `pnpm typecheck` ✅
- GET `/signage/default/lobby-tv` ✅ HTTP 200
- GET `/signage-assets/default/assets/video-image/pool.png` ✅ HTTP 200 image/png
- Aprobación visual de Rubén ✅

## Decisiones

- **viewBox 0 155 1920 925 con rect 1920×1080**: la imagen del SVG fuente extends detrás del header (header opaque). Para preservar el visual, renderea el rect a tamaño completo y usa el viewBox para clipear la franja superior. Mantiene composición exacta del XD.
- **Video via foreignObject**: HTML `<video>` no es nativo de SVG. `<foreignObject>` permite embed HTML dentro de SVG manteniendo el clipping del viewBox. Trade-off: foreignObject puede no renderear en algunos browsers viejos, pero los signage players modernos (Chromium-based) lo soportan.
- **Play_Icon decorativo siempre**: el icon se renderea sobre image y video. Para video es redundante visualmente cuando reproduce, pero coincide con el SVG fuente. Sub-fase tardía puede ocultar el icon cuando el video está reproduciendo.
- **Audio desactivado en DS5**: el `<video>` siempre va `muted`. El toggle global por display llega en DS14.

## Pendiente / siguiente

- **DS6 — Template `04-video-events-ad`**: primer composed template (3 zonas). Video top-izq + Events column derecha (1 hero + 3 tiles) + Ad bottom-izq.
