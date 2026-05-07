# DS11-SUMMARY.md — Header position runtime (top ↔ bottom)

**Fecha:** 2026-05-07
**Estado:** ✅ aprobado visualmente

## Hecho

- `<SignageRuntime>` ahora respeta `client.header.position`:
  - `'top'` → `flex-col` (header arriba, body 1920×925 abajo). Default histórico DS1..DS10.
  - `'bottom'` → `flex-col-reverse` (body arriba, header abajo en y=925..1080).
- `flex-col-reverse` invierte solo el orden visual; el orden DOM se preserva
  (header primero) por accesibilidad — assistive tech sigue leyéndolo primero.
- Comentario obsoleto del runtime ("DS11 cablea el toggle… Hoy asume top.")
  reemplazado por la doc del cableo real.
- Diff total: ~5 líneas en `src/components/signage/runtime/SignageRuntime.tsx`.

## Por qué los 8 templates NO se tocaron

Cada template renderiza un SVG con `viewBox="0 155 1920 925"` y
`width="1920" height="925"`. Internamente usa `transform="translate(0 155)"`
para reproducir verbatim las coords del XD, pero el resultado renderizado es
un bloque autocontenido 1920×925. El runtime decide dónde queda ese bloque
vs. el header dentro del canvas 1920×1080. Cero cambios en pixel-perfect.

## Verificado

- `pnpm typecheck` ✅
- `pnpm exec eslint` sobre runtime ✅
- `pnpm kiosk:dev` arranca limpio (`Ready in 1544ms`).
- `position: bottom` en `clients-signage/default/client.json` → header
  visualmente en y=925..1080, body 1920×925 arriba. Rotación de los 8
  templates sin glitch. Aprobación visual de Rubén ✅.
- `position` restaurado a `top` (default oficial) antes del cierre.
- Cero touch handlers introducidos. Cero hex hardcoded.

## Decisiones

- **`flex-col-reverse` en lugar de swap condicional de children**: solución
  estándar Tailwind que invierte solo lo visual y preserva el orden semántico
  del DOM. Una clase, sin React keys reordering, sin remount.
- **Body region permanece 1920×925**: el cliente no puede ajustar la altura
  del header (schema fija `height ∈ {80, 100, 120}` pero el SVG header
  renderiza 155px). El offset 155→925 está cableado en cada template viewBox.
  Cualquier cambio futuro de altura header requerirá refactor del viewBox de
  los 8 templates — out of scope DS11.
- **No se tocó el schema**: `position` ya existía desde DS0; DS11 era solo
  cableo runtime.

## Siguiente sub-fase

**DS12** — Transitions reales (fade · slide-left · slide-up). Reemplaza el
`cut` instantáneo del player. Default por display vía
`settings.defaultTransition`; override per-slide vía `slide.transition`.
