# SIGNAGE-ROADMAP.md

Roadmap del producto Digital Displays. Dos milestones secuenciales con gate de
aprobación visual entre ambos. Plan completo de diseño en
`/Users/rubenramirez/.claude/plans/esta-vez-vamos-a-zesty-wilkinson.md`.

---

## Milestone Signage Local ✅ CERRADO 2026-05-07

> Replicar las 8 pantallas del usuario pixel-perfect en código, sin Studio, sin KV.
> Configuradas por filesystem (`clients-signage/default/`). Aprobación visual
> contigo es el gate para pasar al Milestone Studio.
>
> **Cerrado 2026-05-07 con GATE DS15 aprobado.** 16 sub-fases (DS0..DS15)
> ejecutadas en 2 días (2026-05-06 + 2026-05-07). Listo para arrancar
> Milestone Signage Studio (DSS0+) cuando se priorice.

### Sub-fases

- [x] **DS0** — Bootstrap (2026-05-06). Route group `(signage)`, ruta runtime `/signage/[client]/[display]`, `clients-signage/_template/` + `default/`, schema Zod base, `<SignageStage>` responsive (scale 1.0→2.0 + letterbox), loader fs-only, tailwind extension `signage-*`, tokens.css base, placeholder render. Resumen en `.planning/DS0-SUMMARY.md`.
- [x] **DS1** — `<SignageHeader>` pixel-perfect (2026-05-06). Logo TrueOmni verbatim + current temp + 3 weather icons (sun-rays / sun+cloud / cloud-only) + 3 forecast cards FRI/SAT/SUN con high/low + clock + date. Live updates cada 1s. Open-Meteo API real. Resumen en `.planning/DS1-SUMMARY.md`. Aprobación visual confirmada.
- [x] **DS2** — `<SignagePlayer>` rotación básica (2026-05-06). Cut transition + 2 placeholder slides A/B + registry singleton + auto-load. Rotación confirmada cada 5s. Resumen en `.planning/DS2-SUMMARY.md`.
- [x] **DS3** — Template `01-full-events` pixel-perfect (2026-05-06). 5 events con images extraídas del SVG verbatim, asset route signage, olive label centered, parseAsWallClock fix timezone, title wrap 2 lines. Resumen en `.planning/DS3-SUMMARY.md`.
- [x] **DS4** — Template `02-full-ad` (2026-05-07). Single PNG fullscreen del SVG fuente, asset white-label en `clients-signage/<slug>/assets/ads/full-ad.png`, override per-slide opcional. Resumen en `.planning/DS4-SUMMARY.md`.
- [x] **DS5** — Template `03-full-video-image` (2026-05-07). Image fullbleed con pattern verbatim del XD, viewBox clipea franja header, Play_Icon decorativo, soporte video via foreignObject. Resumen en `.planning/DS5-SUMMARY.md`.
- [x] **DS6** — Template `04-video-events-ad` (2026-05-07). 3 zonas (video top-izq + ad bottom-izq + events column derecha). Reusa pool.png y events JPGs ya extraídos; nuevo bottom-banner.jpg. Resumen en `.planning/DS6-SUMMARY.md`.
- [x] **DS7** — Template `05-video-2ads` (2026-05-07). Video top-izq + ad vertical der (World Health) + ad horizontal bottom-izq (Pizza). Slot keys nombrados (right-ad, bottom-ad). Resumen en `.planning/DS7-SUMMARY.md`.
- [x] **DS8** — Template `06-video-news-ad` + módulo **News** (2026-05-07). Manual + RSS + API resolver, ticker rotativo en foreignObject, Olympic ad clipeado, header right-aligned, cache no-store en dev. Resumen en `.planning/DS8-SUMMARY.md`.
- [x] **DS9** — Template `07-video-social-ad` + módulo Social Wall (2026-05-07). 3×3 grid de 9 tiles (decisión post-review: layout uniforme en lugar de 6+tweet del SVG), gradient azul brand-primary, patterns verbatim con dimensiones naturales por image. 6 fotos del XD + 3 mock Unsplash. Resumen en `.planning/DS9-SUMMARY.md`.
- [x] **DS10** — Template `08-video-social` + redesign módulo News (2026-05-07). 8/8 templates del catálogo completos. News con animación slide-in/out, badge pulsante, line-clamp 3, QR a website del cliente, "Local News" labels. Resumen en `.planning/DS10-SUMMARY.md`.
- [x] **DS11** — Header position runtime (top↔bottom) en los 8 templates (2026-05-07). `<SignageRuntime>` aplica `flex-col-reverse` cuando `client.header.position === 'bottom'`, preservando orden DOM. Templates intactos (cada uno renderiza un bloque 1920×925 autocontenido). Resumen en `.planning/DS11-SUMMARY.md`.
- [x] **DS12** — Transitions reales (2026-05-07). 4 modos (`cut` · `fade` 600ms · `slide-left` 700ms · `slide-up` 700ms). Resolución `slide.transition ?? settings.defaultTransition`. State machine 2-slide cancel-safe en `<SignagePlayer>`. CSS keyframes en `transitions.css`. Resumen en `.planning/DS12-SUMMARY.md`.
- [x] **DS13** — Dayparting runtime (2026-05-07). `isSlideActive(schedule, now, timezone)` con soporte `always | hours | date-range` + wrap medianoche + `daysOfWeek`. Re-eval por minuto alineada al boundary. Dev override `?clock=HH:MM&day=YYYY-MM-DD` client-only. Placeholder cuando 0 activos. Resumen en `.planning/DS13-SUMMARY.md`.
- [x] **DS14** — Audio toggle · Sleep schedule · i18n (2026-05-07). `loadSignageI18n` server-only con cascada de fallbacks + `<SignageI18nProvider>` client + hook `useSignageT()`. `<SignageSleepGate>` overlay z-50 evaluado por minuto. Audio cableado a `<video>` del template 03. Fix hydration mismatch (locale `es`) via `normalizeIntlWhitespace`. Resumen en `.planning/DS14-SUMMARY.md`.
- [x] **DS15** — Smoke E2E local. Aprobación visual del usuario ✅ **GATE APROBADO** (2026-05-07). 8/8 templates rotando pixel-perfect con header live, 4 transitions, dayparting, sleep gate, i18n. Heap estable 5min sin leak. Regression kiosk OK. Resumen en `.planning/DS15-SUMMARY.md`.

### Verificación por sub-fase

- `pnpm typecheck && pnpm lint` limpios.
- `pnpm kiosk:dev` arranca limpio post-commit.
- Auditor `auditor-white-label` sin hallazgos (extendido para `signage-*`).
- Browser test en localhost.
- Test no-touch: cero `onClick` / `onTouchStart` / `onPointerDown` en árbol signage.
- Render verificado en 1080p y 4K en devtools.

### Verificación por sub-fase de template (DS3..DS10)

- `revisor-visual` diff ±2px contra SVG correspondiente.
- `_COVERAGE.md` 100% paths verbatim.
- Audit `web-design-guidelines` (Tier 2) antes de cerrar.

### Gate (DS15)

- Player corriendo 5 minutos en localhost sin memory leak.
- Diff visual de cada slide en rotación.
- Aprobación visual contigo en pantalla.
- Render verificado en 1080p y 4K.
- Dayparting verificado con `?clock=HH:MM` (dev-only).
- Audio toggle verificado on/off.

---

## Milestone Signage Studio

> Habilita el editor signage en el Studio. Solo arranca tras el gate del Local.

### Sub-fases

- [x] **DSS0** — Bootstrap Signage Studio (2026-05-07). Dropdown `digital-displays` activado como `live`. Página única `/studio/digital-displays` con clients dashboard fs-only (sin sub-URLs por decisión UX: cada theme se gestiona desde el dashboard, click → preview del primer display). Cards visualmente idénticas al ClientCard del kiosk (rounded-2xl + hero h-40 + body p-5). Layout dedicado inyecta tokens signage scoped. KV namespace `signage:*` (`kv-store.ts`) preparado pero no cableado runtime — DSS3 lo activa. Resumen en `.planning/DSS0-SUMMARY.md`.
- [x] **DSS1** — Theme editor con tabs read-only (2026-05-07). Reintroduce `/studio/digital-displays/<slug>` con sidebar de 5 tabs (Branding · Header · Displays · Versions · Publish). Branding/Header/Displays muestran configuración fs read-only. Versions/Publish placeholders DSS6/7. Card del dashboard ahora navega al editor; preview se mueve al header del editor. Resumen en `.planning/DSS1-SUMMARY.md`.
- [x] **DSS2** — Display editor + preview iframe live (2026-05-07). Ruta `/studio/digital-displays/<slug>/displays/<displaySlug>`. Layout 2-col: sidebar settings + playlist read-only / iframe live 16:9 con Reload + Open-in-new-tab. Click en card del Displays tab navega aquí. Resumen en `.planning/DSS2-SUMMARY.md`.
- [x] **DSS3** — Bridge editor↔iframe + loader híbrido KV→fs (2026-05-07). `<SignageBridge>` runtime emite `signage:ready` + heartbeat 5s; listener postMessage popula zustand store. `useSignageBridge` hook editor con iframeRef + pushClient/pushDisplay + bridgeStatus (connecting/connected/stale/lost). Status badge en `<PreviewFrame>`. `loadSignageClient/Display` ahora consultan KV primero con fallback fs. Resumen en `.planning/DSS3-SUMMARY.md`.
- [x] **DSS4** — Playlist editor + save al KV (2026-05-07). Working copy zustand, autosave 1s, bridge push live 120ms. Settings editables (audio/duration/transition/sleep). Drag-to-reorder HTML5 nativo. Edit inline duration/transition por slide. Schedule popover always/hours. Add slide modal simple. Delete slide. PUT API `/api/studio/signage/displays/[client]/[displaySlug]` valida con Zod. Dirty/Saving/Saved badge. Resumen en `.planning/DSS4-SUMMARY.md`.
- [x] **DSS5** — Module editors (6 forms) + overrides reactivos runtime (2026-05-07). Template catalog client-safe POJO. Slot configurator inline en playlist con chevron expand. 6 forms (Events/Social/VideoImage/Ads/News/Weather) compactos. `<SignagePlayer>` consume `useSignageBridgeStore` con shallow merge → push live se ve sin reload. AI suggest hooks deferidos a DSS5.5. Resumen en `.planning/DSS5-SUMMARY.md`.
- [x] **DSS6** — Snapshots / Versions del display + restore (2026-05-07). Cada PUT crea snapshot del previo (FIFO cap 10). API endpoints GET list + POST restore. UI `<VersionsPanel>` collapsible con timestamp + restore button con confirm inline. Patrón git-like: restore crea snapshot del current pre-restore. Resumen en `.planning/DSS6-SUMMARY.md`.
- [x] **DSS7** — Publish + JSON export/import + KV size advisor (2026-05-07). 4 endpoints API: publish (reusa github-publisher con autoMerge), export (`<a download>`), import (snapshot pre-import + Zod), size. UI `<PublishToolbar>` + `<KvSizeAdvisor>` (bar verde/amber/red). Solo `display.json` en publish; theme publish difere a DSS7.5. Resumen en `.planning/DSS7-SUMMARY.md`.
- [x] **DSS8** — Diagnostics + i18n editor (2026-05-07). Página `/studio/digital-displays/diagnostics` con system info (clients/displays count, KV usage, GitHub config). i18n editor tab nuevo en theme editor (locale selector + keys editables + KV persistence). `loadSignageI18n` ahora KV-first. Onboarding tour deferido a DSS8.5. Resumen en `.planning/DSS8-SUMMARY.md`.
- [ ] **DSS9** — Smoke E2E producción + doc paso a paso.

### Verificación

- Crear cliente real en producción → publicar → URL live verificada en TV/browser.
- Lighthouse > 90 performance + accesibilidad.
- KV usage dentro de cap 950KB por display.
- Doc smoke E2E `.planning/2026-XX-XX-signage-smoke-e2e.md`.

---

## Dependencias

```
DS0 → DS1 → DS2 → DS3..DS10 (templates secuenciales) → DS11 → DS12 → DS13 → DS14 → DS15 (gate)
                                                                                       ↓
                                                                            DSS0 → DSS1 → ... → DSS9
```
