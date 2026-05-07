# DS13-SUMMARY.md — Dayparting runtime

**Fecha:** 2026-05-07
**Estado:** ✅ aprobado visualmente

## Hecho

- **`src/lib/signage/schedule.ts`** (nuevo): `isSlideActive(schedule, now, timezone)`
  + `getNowFromSearch(searchParams, timezone)` + `msUntilNextMinute(now)`.
  - `kind: 'always'` → true.
  - `kind: 'hours'` → wall-clock HH:MM en `timezone` ∈ `[startTime, endTime)`,
    soportando wrap medianoche (start > end). Si `daysOfWeek` está, valida también
    el día (0=Sun..6=Sat).
  - `kind: 'date-range'` → wall-clock day YYYY-MM-DD ∈ `[startDate, endDate]`.
    Si además trae `startTime`/`endTime`, los aplica como filtro adicional.
- **`<SignagePlayer>`** ahora deriva `effectivePlaylist` filtrando por
  `isSlideActive`. Re-evaluación cada minuto alineada al boundary del minuto
  exacto (vía `msUntilNextMinute`) para evitar drift.
- **Dev override `?clock=HH:MM&day=YYYY-MM-DD`**: leído client-only desde
  `window.location.search` (evita Suspense boundary de `useSearchParams`).
  Cuando hay override, el tick de re-evaluación se congela.
- **Re-anclaje del current slide**: si el slide actual sale de schedule por un
  cambio de hora, jump al primer activo (cut, sin animación). Mantiene el slide
  visible si sigue activo aunque su índice cambie.
- **Avance robusto**: el `next slide` busca el siguiente activo en la playlist
  original (preserva orden) saltando los inactivos.
- **Placeholder cuando 0 activos**: "No active slides at this time" + body
  explicativo. No tira la página.
- **`display.json` default**: `slide-video-news-ad` ahora con
  `kind: 'hours' 09:00–18:00` para smoke E2E. El header weather/clock sigue
  mostrando hora REAL (no del override) — el override solo afecta dayparting.

## Archivos tocados

- `src/lib/signage/schedule.ts` — NUEVO.
- `src/components/signage/player/SignagePlayer.tsx` — `effectivePlaylist` +
  re-eval por minuto + override + re-anclaje + placeholder.
- `clients-signage/default/displays/lobby-tv/display.json` — slide news-ad
  con schedule hours 09:00–18:00.

## Verificado

- `pnpm typecheck` ✅
- `pnpm exec eslint` schedule + player ✅
- `pnpm kiosk:dev` arranca limpio (`Ready in 1410ms`).
- Smoke con `?clock=10:00` → news-ad visible.
- `?clock=20:00` → news-ad oculto.
- `?clock=09:00` boundary inicial → news-ad visible (inclusivo).
- `?clock=18:00` boundary final → news-ad oculto (exclusivo).
- Aprobación visual de Rubén ✅.

## Decisiones

- **`window.location.search` en mount vs `useSearchParams`**: evita el
  Suspense boundary que Next 15 exige para `useSearchParams` en client
  components no-pre-renderizables. El override es de QA; la diferencia
  arquitectónica con el camino "oficial" es mínima.
- **Re-eval alineada al minuto exacto**: `msUntilNextMinute` calcula el delay
  hasta el siguiente boundary HH:MM:00. Un slide programado para "11:00"
  cambia exactamente a las 11:00:00, no a las 11:00:23.
- **`hideOutsideSchedule: true` implícito**: en v1 el slide se oculta. Si v2
  necesita modos diferentes (slide dimmed o "next event in 2h"), se cablea
  cuando haya UX necesitándolo.
- **El header NO usa override**: el override es para QA del dayparting; el
  reloj del header debe seguir mostrando la realidad del visitante. Si v2
  necesitara congelar el reloj para video tutorial, sería un flag aparte.
- **Re-anclaje sin animación (`cut`)**: evita que un slide entre con
  `slide-up` justo al cambio de hora si el current sale de schedule —
  sería un "salto" no anunciado por el playlist normal.

## Out of scope (DS14+)

- Audio toggle global por display + sleep schedule.
- i18n strings de signage modules / placeholders.
- Smoke E2E + gate del Milestone Local.

## Siguiente sub-fase

**DS14** — Audio toggle global + sleep schedule + i18n strings de signage
modules. Cablea `settings.audio` a los `<video>` de los 6 templates con
contenido video (03..08); cablea `settings.sleepSchedule` como overlay
black-screen cuando el display está en horario nocturno; expone `t()` simple
client-side leyendo `clients-signage/<slug>/i18n/<locale>.json`.
