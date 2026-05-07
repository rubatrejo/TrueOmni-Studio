# DS11-PLAN.md — Header position runtime (top ↔ bottom)

Atomic plan ejecutable en sesión fresca. Cabla en `<SignageRuntime>` el toggle
`client.header.position` (`top` | `bottom`) que ya existe en el schema desde DS0
y que hoy el runtime ignora ("hoy asume top" — comentario en SignageRuntime.tsx).

```xml
<task type="auto">
  <name>DS11 — Header position runtime: invertir orden visual cuando position === 'bottom' sin tocar templates</name>
  <files>
    src/components/signage/runtime/SignageRuntime.tsx       (cableo del toggle)
    clients-signage/default/client.json                     (verificación: temporalmente bottom, restaurar a top)
    .planning/DS11-SUMMARY.md                               (al cerrar)
    .planning/SIGNAGE-ROADMAP.md                            (marcar DS11 ✅)
    .planning/STATE.md                                      (entrada de sesión)
  </files>
  <action>
    1. Leer schema `SignageHeaderSchema` (campo `position: 'top' | 'bottom'`) — ya existe, no se toca.
    2. Modificar SignageRuntime para leer `client.header.position` y aplicar
       `flex-col-reverse` al wrapper cuando sea `'bottom'`. Mantener orden DOM
       (header primero) por accesibilidad: el reverse es solo visual.
    3. NO se tocan los 8 templates. Cada uno renderiza un SVG `viewBox="0 155 1920 925"`
       con `width="1920" height="925"` (bloque autocontenido del body region).
       El runtime los posiciona arriba/abajo del header sin requerir cambios internos.
    4. Borrar el comentario "DS11 cablea el toggle… Hoy asume top." del runtime y
       reemplazarlo por la doc del cableo real.
    5. Verificar visualmente con `position: 'bottom'` temporal en
       `clients-signage/default/client.json` — confirmar que el header queda en
       el fondo (y=925..1080) y el body arriba (y=0..925).
    6. Restaurar `position: 'top'` en `client.json` antes del commit (default oficial).
  </action>
  <verify>
    - `pnpm typecheck` ✅ limpio.
    - `pnpm lint` (sobre archivos tocados) ✅ sin errores nuevos.
    - `pnpm kiosk:dev` arranca limpio.
    - GET /signage/default/lobby-tv → HTTP 200 con `position: top` (estado por defecto).
    - Switch manual a `position: bottom` en client.json → header visualmente
      en y=925..1080, body en y=0..925, los 8 templates rotan sin glitch.
    - Restaurado a `top`, render idéntico al de DS10.
    - Cero touch handlers introducidos. Cero hex hardcoded.
  </verify>
  <done>
    - `client.header.position = 'top'` → header arriba (comportamiento histórico DS1..DS10).
    - `client.header.position = 'bottom'` → header abajo, body arriba; los 8 templates renderizan correctamente sin tocar su SVG.
    - Comentario obsoleto del runtime sustituido por descripción del comportamiento real.
    - DS11 marcado ✅ en SIGNAGE-ROADMAP.md y SUMMARY redactado.
  </done>
</task>
```

## Notas de diseño

- **Por qué `flex-col-reverse` y no condicionalmente swap children**: el reverse
  preserva el orden DOM (header primero → assistive tech lo lee primero) y solo
  invierte el orden visual. Es la solución estándar de Tailwind para este caso.
- **Por qué los templates no se tocan**: el SVG de cada template tiene
  `viewBox="0 155 1920 925"` y `width=1920 height=925`. Internamente usa
  `transform="translate(0 155)"` para reproducir verbatim las coords del XD,
  pero el resultado renderizado es un bloque 1920×925 autocontenido. El runtime
  decide dónde queda ese bloque vs. el header dentro del canvas 1920×1080.
- **Asunción**: el `<SignageStage>` envuelve el conjunto y escala uniformemente;
  el header sigue siendo 1920×155 fijo y el body 1920×925 (`flex-1`).

## Out of scope (DS12+)

- Transitions reales entre slides (cut → fade/slide-left/slide-up).
- Dayparting runtime (filter de `effectivePlaylist` por wall-clock).
- Audio toggle global / sleep schedule / i18n strings de signage.
