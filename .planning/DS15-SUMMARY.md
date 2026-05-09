# DS15-SUMMARY.md — Smoke E2E + GATE Milestone Signage Local

**Fecha:** 2026-05-07
**Estado:** ✅ GATE APROBADO — Milestone Signage Local CERRADO

## Hecho

DS15 es un gate de verificación. **No introduce código nuevo**. Validación
integral del trabajo acumulado DS0..DS14.

### Verificación automática (A)

| #   | Check                                                                            | Resultado                   |
| --- | -------------------------------------------------------------------------------- | --------------------------- |
| A1  | `pnpm typecheck`                                                                 | ✅ exit 0                   |
| A2  | `pnpm exec eslint src/components/signage/ src/lib/signage/ 'src/app/(signage)/'` | ✅ limpio                   |
| A3  | `pnpm kiosk:dev` arranque                                                        | ✅ Ready in <2s             |
| A4  | `GET /signage/default/lobby-tv`                                                  | ✅ HTTP 200                 |
| A5  | `GET /` (regression kiosk)                                                       | ✅ HTTP 200, Home renderiza |

> **Nota lint global:** `pnpm lint` reporta errores preexistentes en
> `src/components/map/map-canvas.tsx` y `src/components/photo-booth/screens/share-screen.tsx`
> introducidos en commit `e61e834` (feat(studio) Map dinámico + Photo Booth QR).
> Fuera de scope del Milestone Signage Local. Tracked como tech debt para
> milestone futuro.

### Verificación visual (B)

| #   | Vector                    | Resultado   | Notas                                                                                                                                                                        |
| --- | ------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | Rotación 5 min sin leak   | ✅          | Heap estable durante el ciclo. Sin acumulación de DOM.                                                                                                                       |
| B2  | 8 templates pixel-perfect | ✅          | 8/8 renderizan idéntico al SVG fuente                                                                                                                                        |
| B3  | Header live (clock 1s)    | ✅          | Logo + weather Phoenix + temp + 3 forecast + clock + date                                                                                                                    |
| B4  | 4 transitions             | ✅          | cut, fade, slide-left, slide-up todas suaves; header no anima                                                                                                                |
| B5  | Dayparting `?clock=HH:MM` | ✅          | Validado durante DS13 (boundaries 09:00 y 18:00) y DS14 (23:50–23:55 con override 23:52)                                                                                     |
| B6  | Sleep gate                | ✅          | Validado durante DS14 (display efímero `/sleep-demo` con sleepSchedule 00:00–23:59). Pantalla totalmente negra.                                                              |
| B7  | Header bottom             | ✅          | Validado durante DS11 con `position:"bottom"`                                                                                                                                |
| B8  | Audio toggle              | ⏳ deferred | Requiere asset mp4 real subido por cliente. Cableado verificado en código (template 03 → `muted={!display.settings.audio}`). Will be tested with first real client (Fase 4). |
| B9  | i18n locale `es`          | ✅          | Placeholders en español + hydration limpio post-fix `normalizeIntlWhitespace`                                                                                                |
| B10 | 1080p / 4K                | ✅          | SignageStage scale uniforme con letterbox tokenizado                                                                                                                         |

### Cleanup post-verificación

- ✅ `client.json` → `locale:"en"`, `position:"top"`, `displays:["lobby-tv"]`
- ✅ `display.json` → `audio:false`, `sleepSchedule.enabled:false`, schedule news-ad `09:00–18:00`
- ✅ Borrados `clients-signage/default/displays/{sleep-demo,dayparting-demo}/`

## Aprobación

**Aprobado por Rubén** vía smoke visual de las 2 pestañas:

- `/signage/default/lobby-tv` — rotación + header + transitions + dayparting (news-ad oculto fuera de 09:00–18:00 Phoenix)
- `/` — kiosk regression Home

## Decisiones del gate

- **B8 audio deferred a primer cliente real**: el toggle está cableado en el
  código y validado por inspección, pero el comportamiento solo se mide con
  asset mp4 real. Se valida en Fase 4 cuando el cliente real suba su video.
- **Lint preexistentes NO bloquean el gate**: errores de `map-canvas` y
  `share-screen` son del milestone Studio y no del Signage Local. El árbol
  signage tiene lint limpio.
- **Memory check empírico, no automatizado**: DS15 valida con DevTools en
  pantalla. Test automatizado con Playwright/Puppeteer queda para DSS9
  (smoke E2E producción).

## Resumen del Milestone Signage Local

**Recorrido completo (DS0..DS15) en 2 días (2026-05-06 + 2026-05-07):**

| Sub-fase | Entrega                                                            |
| -------- | ------------------------------------------------------------------ |
| DS0      | Bootstrap (route group + schema + tokens + stage + loader fs-only) |
| DS1      | `<SignageHeader>` pixel-perfect (logo + weather + clock + date)    |
| DS2      | `<SignagePlayer>` rotación cut + registry + load-templates         |
| DS3      | Template `01-full-events`                                          |
| DS4      | Template `02-full-ad`                                              |
| DS5      | Template `03-full-video-image` (con `<video>` real soportado)      |
| DS6      | Template `04-video-events-ad`                                      |
| DS7      | Template `05-video-2ads`                                           |
| DS8      | Template `06-video-news-ad` + módulo News core                     |
| DS9      | Template `07-video-social-ad` + Social Wall 3×3                    |
| DS10     | Template `08-video-social` + redesign News                         |
| DS11     | Header position toggle (top↔bottom) runtime                        |
| DS12     | 4 transitions reales (cut/fade/slide-left/slide-up)                |
| DS13     | Dayparting runtime + dev override `?clock=HH:MM`                   |
| DS14     | Audio toggle + Sleep schedule + i18n + fix hydration               |
| DS15     | Smoke E2E + GATE ✅                                                |

**Capacidades del producto al cierre:**

- 8 templates pixel-perfect rotando con 4 transitions configurables.
- Header live con weather Open-Meteo (Phoenix), clock + date locale-aware.
- Dayparting `kind: always | hours | date-range` con wrap medianoche.
- Sleep gate con overlay z-50.
- Audio toggle por display.
- i18n con cascada de fallbacks.
- Position runtime top↔bottom.
- News module manual + RSS + API.
- Social Wall 3×3.
- Configuración fs-only (Studio futuro: DSS0+).
- Cero touch handlers, cero hex hardcoded.

## Out of scope (Milestone Signage Studio = DSS0+)

Editor visual en el Studio (`/studio/displays/...`):

- Dropdown header `Kiosks ↔ Digital Displays`
- Clients dashboard signage
- Display editor con sidebar + preview iframe
- Playlist editor (drag-to-reorder + Add slide wizard + dayparting popover)
- 6 module editors (Events / SocialWall / VideoImage / Ads / News / Weather)
- Snapshots + Versions
- Publish a `clients-signage/<slug>/` via GitHub PR
- Smoke E2E producción + onboarding tour
