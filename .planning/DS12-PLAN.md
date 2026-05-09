# DS12-PLAN.md — Transitions reales (fade · slide-left · slide-up)

Atomic plan ejecutable en sesión fresca. Reemplaza el `cut` instantáneo del
`<SignagePlayer>` por transitions cinemáticas. Schema ya soporta los 4 valores
(`cut | fade | slide-left | slide-up`) en `settings.defaultTransition` y en
`slide.transition` (override per-slide).

```xml
<task type="auto">
  <name>DS12 — Transitions reales en SignagePlayer (fade · slide-left · slide-up + cut intacto)</name>
  <files>
    src/components/signage/player/SignagePlayer.tsx       (state machine current+outgoing + clases)
    src/components/signage/player/transitions.css         (NUEVO — keyframes 4 transitions)
    clients-signage/default/displays/lobby-tv/display.json (verificación: 4 transitions distribuidas)
    .planning/DS12-SUMMARY.md                             (al cerrar)
    .planning/SIGNAGE-ROADMAP.md                          (marcar DS12 ✅)
  </files>
  <action>
    1. Crear `src/components/signage/player/transitions.css` con 4 pares de keyframes:
         - `signage-fade-in` / `signage-fade-out`     (opacity 0→1 / 1→0)
         - `signage-slide-left-in` / `signage-slide-left-out` (translateX 100%→0 / 0→-100%)
         - `signage-slide-up-in` / `signage-slide-up-out`     (translateY 100%→0 / 0→-100%)
       Duración: 600ms fade, 700ms slides. Easing `cubic-bezier(0.4, 0, 0.2, 1)`.
       Helper class `signage-transition-host` con `position: absolute; inset: 0; will-change: transform, opacity`.
    2. Modificar `SignagePlayer`:
         - State machine: `currentIdx`, `outgoingIdx | null`, `transitionKind`.
         - Al avanzar: leer `nextSlide.transition ?? settings.defaultTransition`.
           * Si es `cut`: swap directo (comportamiento DS2 — outgoing nunca rendering).
           * Si es animado: poner outgoing + current en DOM, ambos absolute. Cleanup
             del outgoing tras la duración exacta de la animación + 50ms guard.
         - Render layout: wrapper `relative h-full w-full`. Cada slide en wrapper
           `signage-transition-host` con clase de animación correspondiente.
         - Cancel-safe: si tick siguiente llega antes de cleanup, cancela timer
           pendiente y descarta el outgoing previo (queda solo el current entrando).
    3. Importar `./transitions.css` desde `SignagePlayer.tsx` (Next 15 lo bundlea
       como CSS module global del componente client).
    4. `display.json` default: distribuir las 4 transitions en los 8 slides para
       smoke E2E (`cut`, `fade`, `slide-left`, `slide-up`, `cut`, `fade`,
       `slide-left`, `slide-up`). Restaurar `cut` global en `defaultTransition`
       como fallback explícito.
    5. NO se tocan los 8 templates ni el SignageRuntime/SignageHeader.
  </action>
  <verify>
    - `pnpm typecheck` ✅ limpio.
    - `pnpm exec eslint src/components/signage/player/SignagePlayer.tsx` limpio.
    - `pnpm kiosk:dev` arranca limpio.
    - `/signage/default/lobby-tv` rota los 8 slides aplicando las 4 transitions.
    - Cero glitches: header se mantiene fijo (no entra en la animación), solo el body 1920×925 anima.
    - No leak de outgoing slides en DOM (`document.querySelectorAll('.signage-transition-host').length <= 2`).
    - Cero touch handlers introducidos. Cero hex hardcoded.
  </verify>
  <done>
    - 4 transitions visualmente correctas en localhost (`cut`, `fade`, `slide-left`, `slide-up`).
    - Aprobación visual de Rubén ✅.
    - DS12 marcado ✅ en SIGNAGE-ROADMAP.md y SUMMARY redactado.
  </done>
</task>
```

## Notas de diseño

- **2 slides en DOM solo durante la animación**: outgoing entra al state cuando
  comienza el tick de transición; sale del state cuando se cumple la duración.
  En estado estable solo hay 1 slide rendering.
- **`cut` por separado**: para no pagar el coste de mount/animación. Sigue siendo
  el caso default y comportamiento histórico DS2..DS11.
- **El header NO se anima**: solo el body 1920×925 (que es el `<SignagePlayer>`).
  El runtime mantiene su flex-col(-reverse) intacto y el header queda quieto.
- **Cancel-safe**: si la rotación tiene `durationMs` (7s) menor que la duración
  de la animación (700ms), no hay problema — la animación termina antes del
  siguiente tick. Pero si alguien configura durationMs absurdo (< 700ms), el
  cleanup del outgoing previo se cancela y se reemplaza con el nuevo outgoing.
- **`will-change: transform, opacity`**: GPU compositing para 60fps en displays
  4K. Costoso si se usa permanentemente, pero solo está en el host de transición.

## Dimensiones

| Transition   | Duración | Animación entrante               | Animación saliente                |
| ------------ | -------- | -------------------------------- | --------------------------------- |
| `cut`        | 0ms      | (sin animación)                  | (no rendering)                    |
| `fade`       | 600ms    | opacity 0 → 1                    | opacity 1 → 0                     |
| `slide-left` | 700ms    | translateX(100%) → translateX(0) | translateX(0) → translateX(-100%) |
| `slide-up`   | 700ms    | translateY(100%) → translateY(0) | translateY(0) → translateY(-100%) |

Easing común: `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard out).

## Out of scope (DS13+)

- Dayparting runtime (filter `effectivePlaylist` por wall-clock cada minuto).
- Audio toggle global / sleep schedule / i18n strings de signage modules.
- Smoke E2E + gate del Milestone Local.
