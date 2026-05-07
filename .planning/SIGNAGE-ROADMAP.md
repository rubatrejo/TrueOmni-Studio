# SIGNAGE-ROADMAP.md

Roadmap del producto Digital Displays. Dos milestones secuenciales con gate de
aprobación visual entre ambos. Plan completo de diseño en
`/Users/rubenramirez/.claude/plans/esta-vez-vamos-a-zesty-wilkinson.md`.

---

## Milestone Signage Local

> Replicar las 8 pantallas del usuario pixel-perfect en código, sin Studio, sin KV.
> Configuradas por filesystem (`clients-signage/default/`). Aprobación visual
> contigo es el gate para pasar al Milestone Studio.

### Sub-fases

- [x] **DS0** — Bootstrap (2026-05-06). Route group `(signage)`, ruta runtime `/signage/[client]/[display]`, `clients-signage/_template/` + `default/`, schema Zod base, `<SignageStage>` responsive (scale 1.0→2.0 + letterbox), loader fs-only, tailwind extension `signage-*`, tokens.css base, placeholder render. Resumen en `.planning/DS0-SUMMARY.md`.
- [x] **DS1** — `<SignageHeader>` pixel-perfect (2026-05-06). Logo TrueOmni verbatim + current temp + 3 weather icons (sun-rays / sun+cloud / cloud-only) + 3 forecast cards FRI/SAT/SUN con high/low + clock + date. Live updates cada 1s. Open-Meteo API real. Resumen en `.planning/DS1-SUMMARY.md`. Aprobación visual confirmada.
- [x] **DS2** — `<SignagePlayer>` rotación básica (2026-05-06). Cut transition + 2 placeholder slides A/B + registry singleton + auto-load. Rotación confirmada cada 5s. Resumen en `.planning/DS2-SUMMARY.md`.
- [ ] **DS3** — Template `01-full-events` pixel-perfect (incluye módulo Events).
- [ ] **DS4** — Template `02-full-ad` pixel-perfect (incluye módulo Ads).
- [ ] **DS5** — Template `03-full-video-image` pixel-perfect (incluye módulo Video/Image).
- [ ] **DS6** — Template `04-video-events-ad` (composed 3-zone).
- [ ] **DS7** — Template `05-video-2ads` (composed 3-zone, 2 ads).
- [ ] **DS8** — Template `06-video-news-ad` + módulo **News** (manual + RSS/API + slideshow rotation).
- [ ] **DS9** — Template `07-video-social-ad` + módulo Social Wall.
- [ ] **DS10** — Template `08-video-social` (composed 2-zone).
- [ ] **DS11** — Header position runtime (top↔bottom + body shift) en los 8 templates.
- [ ] **DS12** — Transitions reales (fade · slide-left · slide-up). Default por display.
- [ ] **DS13** — Dayparting runtime (filter por wall-clock cada minuto).
- [ ] **DS14** — Audio toggle global · sleep schedule · i18n strings de signage modules.
- [ ] **DS15** — Smoke E2E local. Aprobación visual del usuario (**GATE**).

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

- [ ] **DSS0** — Header dropdown (Kiosks ↔ Digital Displays) + rutas `/studio/displays/...` + clients dashboard + KV namespace `signage:*`.
- [ ] **DSS1** — Client view tabs (Branding · Header · Displays · Versions · Publish).
- [ ] **DSS2** — Display editor (sidebar + preview iframe).
- [ ] **DSS3** — Bridge `signage:*` events live preview.
- [ ] **DSS4** — Playlist editor (drag-to-reorder + Add slide wizard 3 pasos + dayparting popover).
- [ ] **DSS5** — Module editors (6 forms: Events / SocialWall / VideoImage / Ads / News / Weather) + AI suggest hooks.
- [ ] **DSS6** — Snapshots / Versions cliente + display.
- [ ] **DSS7** — Publish (GitHub PR auto-merge) + JSON export/import + KV size advisor.
- [ ] **DSS8** — Diagnostics + onboarding tour signage + i18n editor extension.
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
