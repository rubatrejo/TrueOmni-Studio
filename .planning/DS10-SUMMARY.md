# DS10-SUMMARY.md — Template `08-video-social` + redesign módulo News

**Fecha:** 2026-05-07
**Estado:** ✅ aprobado visualmente

## Hecho

### Template 08-video-social

- 2 zonas: Video left (1144×925 full body height) + Social Wall right (3×3 grid 9 tiles).
- Reusa pool.png + post-{1..9}.jpg de DS5/DS9. Sin extracciones nuevas.
- ClipPath `vs-clip-video` 1144×925 + pattern `xMidYMid slice` para el video.
- Auto-load registry: 8/8 templates registrados — catálogo completo del Milestone Local.

### Redesign módulo News (template 06-video-news-ad)

- **Animación cinematográfica**: cada item slide-in desde la derecha (translateX 100%→0 + fade), pausa visible, slide-out hacia la izquierda. Re-keyed por item para reiniciar el cycle.
- **Badge categoría pulsante** con halo box-shadow expansivo (efecto "live").
- **Body max 3 líneas** con `-webkit-line-clamp: 3` (truncate elegante).
- **Date más visible**: 18px medium uppercase tracking-wider, opacity 100% (vs 15px 75% antes).
- **Progress dots verticales** en borde derecho — el activo es 6× más alto y opaco.
- **QR code** reemplaza el icono de periódico (180×180 card blanca, QR azul brand-primary apuntando a `client.website`). Schema gana `website` opcional.
- **"Local News"** reemplaza "Breaking News" en news.json.

## Verificado

- `pnpm typecheck` ✅
- GET `/signage/default/lobby-tv` ✅ HTTP 200
- Aprobación visual de Rubén ✅

## Decisiones

- **3×3 grid en DS10** consistente con DS9 (no 6+tweet del SVG fuente).
- **Animación CSS keyframes inline** vs Framer Motion: cero deps añadidas, keyframes son simples (translateX + opacity), idempotentes.
- **QR via foreignObject** porque qrcode.react renderea SVG/HTML en lugar de paths SVG raw.
- **`will-change: transform, opacity`** activa GPU compositing para animación 60fps en displays grandes.

## Siguiente sub-fase

DS11 — Header position toggle (top↔bottom) runtime.
