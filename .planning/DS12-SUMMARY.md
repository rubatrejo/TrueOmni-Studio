# DS12-SUMMARY.md — Transitions reales (fade · slide-left · slide-up)

**Fecha:** 2026-05-07
**Estado:** ✅ aprobado visualmente

## Hecho

- `<SignagePlayer>` reemplaza el `cut` instantáneo de DS2 por un mecanismo de
  transition con 4 modos:
  - **`cut`** — swap directo, comportamiento histórico DS2..DS11.
  - **`fade`** — cross-fade 600ms con `cubic-bezier(0.4, 0, 0.2, 1)`.
  - **`slide-left`** — entrante desde derecha, saliente a la izquierda (700ms).
  - **`slide-up`** — entrante desde abajo, saliente hacia arriba (700ms).
- Resolución: `nextSlide.transition ?? settings.defaultTransition`.
- 2 slides en DOM solo durante la animación (`outgoingIdx` state). Cleanup
  agendado a `duration + 50ms guard`. Cancel-safe ante ticks rápidos.
- Cleanup en unmount (timer ref clearable).
- Wrapper común `.signage-transition-host` con `position: absolute; inset: 0;
  will-change: transform, opacity` (GPU compositing).
- `display.json` default distribuye las 4 transitions en los 8 slides para
  smoke E2E continuo en localhost.

## Archivos tocados

- `src/components/signage/player/SignagePlayer.tsx` — state machine + 2-slide
  layout absolute + clases dinámicas.
- `src/components/signage/player/transitions.css` — NUEVO. 4 pares de
  keyframes + clase host común.
- `clients-signage/default/displays/lobby-tv/display.json` — 8 slides con
  transition distinta cada uno.

## Verificado

- `pnpm typecheck` ✅
- `pnpm exec eslint SignagePlayer.tsx` ✅
- `pnpm kiosk:dev` arranca limpio (`Ready in 1306ms`).
- Localhost `/signage/default/lobby-tv` rotando los 8 slides con las 4
  transitions distintas. Header fijo, body anima.
- Aprobación visual de Rubén ✅.

## Decisiones

- **CSS keyframes inline en archivo dedicado** vs. Framer Motion: cero deps
  añadidas, animaciones triviales (opacity / translateX / translateY).
  Compatible con SSR de Next sin "use client" extra (el CSS es estático;
  el state machine sí requiere "use client" pero ya lo tenía de DS2).
- **`forwards` fill mode**: el slide queda en su estado final tras la
  animación, evitando flash al limpiar la clase.
- **El header NO se anima**: `<SignageRuntime>` mantiene el header como
  flex-item separado del player; la animación está enclaustrada en el
  body 1920×925 del `<SignagePlayer>` con `overflow-hidden`.
- **Cancel-safe**: si `durationMs` < `transitionDuration + 50ms` (config
  loca), el cleanup pendiente se cancela y el outgoing previo se reemplaza
  con el nuevo. Sin acumulación de DOM.
- **`will-change` solo en hosts de transition**: evitamos el costo permanente
  fuera de la zona animada.

## Out of scope (DS13+)

- Dayparting runtime (filter `effectivePlaylist` por wall-clock).
- Audio toggle global / sleep schedule / i18n strings de signage modules.
- Smoke E2E + gate del Milestone Local.

## Siguiente sub-fase

**DS13** — Dayparting runtime: filtrar `playlist` según `slide.schedule`
(`always` | `hours` con daysOfWeek + start/end | `date-range` con startDate/
endDate), re-evaluando cada minuto. Si todos los slides quedan fuera de
schedule → placeholder "No active slides".
