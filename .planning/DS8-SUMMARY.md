# DS8-SUMMARY.md — Template `06-video-news-ad` + módulo News

**Fecha:** 2026-05-07
**Estado:** ✅ aprobado visualmente

## Hecho

- **Módulo News core**:
  - `src/lib/signage/news.ts`: `resolveNewsItems(config)` server-only. Soporta `manual` (items directos), `rss` (fetch + parser regex de `<item>` nodes con CDATA + strip HTML) y `api` (fetch JSON `{items: []}`). Cache 5min vía Next revalidate. Errores → array vacío + warn.
  - `src/components/signage/news/SignageNewsTicker.tsx`: client component con rotación cada `intervalSec` segundos. Renderea "Title:" bold + body semibold. Sin handlers touch.
- **Imágenes extraídas**: `clients-signage/default/assets/ads/right-vertical-olympic.png` (742×530 PNG, ad Olympic Games París 2024).
- **Template `06-video-news-ad.tsx`**:
  - Video top-left (1144×644 con pool.png + Play_Icon en (497, 247)).
  - Right vertical ad: image clipeado vía `<clipPath>` rect (1144 155 776×925), image natural posicionada con translate(892 155) width=1295 height=925 + preserveAspectRatio xMidYMid slice — verbatim del SVG fuente.
  - Bottom news: rect cyan #1796d6 1144×281 + Newspaper icon path verbatim + `<foreignObject>` que hostea el `<SignageNewsTicker>`.
- **Header right-aligned** (`SignageHeader.tsx`): clock + date ahora con `text-anchor="end"` y translate al edge derecho (1834). Strings de longitud variable (5:50 AM / 11:30 PM, Mon Apr 15 / Wed May 7) quedan alineados consistentemente al borde derecho.
- **Cache header asset route** cambiado a `no-store, must-revalidate` (era `public, max-age=3600`). Mejora dev-experience: cambios en assets se reflejan sin clear-cache manual. Sub-fase tardía puede reactivar cache para producción.

## Verificado

- `pnpm typecheck` ✅
- GET `/signage/default/lobby-tv` ✅ HTTP 200
- GET `/signage-assets/default/assets/ads/right-vertical-olympic.png` ✅ HTTP 200 770KB
- Aprobación visual de Rubén ✅ (Olympic ad carga + header right-aligned)

## Decisiones

- **News rendering vía `<foreignObject>`**: HTML text wrap automático funciona bien dentro del SVG, evita reimplementar word-wrap en SVG `<text>` con tspans. Trade-off: foreignObject puede no renderear en algunos browsers viejos pero los signage players modernos (Chromium-based) lo soportan.
- **Manual primero, rss/api funcionales pero sin cableo de runtime aún**: el lib `resolveNewsItems` está completo. Hoy el template lee `client.news.source.items` directo cuando es manual; cuando un cliente real configure rss/api, hay que cablear `resolveNewsItems` en page.tsx server-side y pasar items pre-resueltos. Sub-fase tardía.
- **Bug de extracción de imagen embedded**: la primera vez extraje image #0 asumiendo que era Olympic, pero era el pool (definido primero en `<defs>`). Fix: extraer específicamente desde `Mask_Group_85` no del SVG completo. Lección documentada para próximos templates.
- **Cache `no-store` en dev**: el `max-age=3600` retenía versiones obsoletas de assets cuando se reextraían. Hard refresh no las soltaba porque el browser considera el cache válido. `no-store` fuerza re-fetch siempre.

## Pendiente / siguiente

- **DS9 — `07-video-social-ad`**: video top-left + Social Wall (6-tile grid + featured tweet) en columna derecha + ad bottom-left (Booking.com).
