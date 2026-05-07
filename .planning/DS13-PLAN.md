# DS13-PLAN.md — Dayparting runtime

Atomic plan ejecutable en sesión fresca. Filtra `playlist` según `slide.schedule`
respetando wall-clock del cliente (`client.timezone`). Re-evalúa cada minuto.
Soporta dev override `?clock=HH:MM` y `?day=YYYY-MM-DD` para QA del gate (DS15).

```xml
<task type="auto">
  <name>DS13 — Dayparting runtime: filtrar playlist por schedule de cada slide cada minuto, con dev override</name>
  <files>
    src/lib/signage/schedule.ts                              (NUEVO — helper isSlideActive + parseClockOverride)
    src/components/signage/player/SignagePlayer.tsx          (effectivePlaylist + tick 1min + override read)
    clients-signage/default/displays/lobby-tv/display.json   (verificación: 1-2 slides con schedule horas)
    .planning/DS13-SUMMARY.md                                (al cerrar)
    .planning/SIGNAGE-ROADMAP.md                             (marcar DS13 ✅)
  </files>
  <action>
    1. Crear `src/lib/signage/schedule.ts` con:
         - `isSlideActive(schedule: SignageSlideSchedule, now: Date, timezone: string): boolean`
           * `kind: 'always'` → true.
           * `kind: 'hours'` → wall-clock HH:MM en `timezone` está en [startTime, endTime).
             Si `daysOfWeek` está, valida también el día (0=Sun..6=Sat).
             endTime puede ser < startTime (wrap medianoche): activo si `now >= start || now < end`.
           * `kind: 'date-range'` → wall-clock day YYYY-MM-DD ∈ [startDate, endDate].
             startDate/endDate con format YYYY-MM-DD; comparación lexicográfica.
         - `getNowFromSearch(searchParams: URLSearchParams, timezone: string): Date`
           * Lee `?clock=HH:MM` y `?day=YYYY-MM-DD` (dev override).
           * Si están, construye Date a partir de wall-clock + timezone offset usando Intl.
           * Si no, retorna `new Date()`.
    2. Modificar `<SignagePlayer>`:
         - Leer `useSearchParams()` para clock/day override.
         - State `now: Date` actualizado vía `setInterval` cada 60s (alineado al minuto).
         - `effectivePlaylist = playlist.filter(s => isSlideActive(s.schedule, now, client.timezone))`.
         - Si `effectivePlaylist.length === 0` → render placeholder "No active slides at this time".
         - `currentIdx` se mapea sobre `effectivePlaylist`. Si el slide actual sale de
           schedule, saltar al siguiente activo en el siguiente tick (no kill mid-anim).
         - Importante: el state `currentIdx` debe re-mapearse cuando la `effectivePlaylist`
           cambia. Usar el `id` del slide como ancla; si desaparece, reset a 0.
    3. Configurar `display.json`:
         - Mantener 6 slides con `kind: 'always'`.
         - 1-2 slides con `kind: 'hours'` para validar (ej: video-news-ad 9:00-18:00).
         - Verificar con `?clock=10:00` (debe verse) y `?clock=20:00` (debe ocultarse).
    4. NO se tocan los 8 templates ni el SignageRuntime/SignageHeader.
    5. `hideOutsideSchedule` se trata implícitamente como `true` (slide oculto si fuera
       de schedule). El campo queda en schema para v2 (mostrar dimmed o "next event in 2h").
  </action>
  <verify>
    - `pnpm typecheck` ✅ limpio.
    - `pnpm exec eslint` sobre archivos tocados ✅.
    - `pnpm kiosk:dev` arranca limpio.
    - `/signage/default/lobby-tv` rota normalmente con todos los slides
      `kind: 'always'` (sin regression DS12).
    - `?clock=10:00` → slide hours-restricted aparece. `?clock=20:00` → no.
    - Re-evaluación cada minuto sin reset del current slide ni glitch visual.
    - Cero touch handlers, cero hex hardcoded.
  </verify>
  <done>
    - `isSlideActive` retorna boolean correcto para los 3 kinds del schema.
    - Dev override `?clock=HH:MM&day=YYYY-MM-DD` funciona.
    - Placeholder "No active slides" cuando todos están fuera.
    - Aprobación visual de Rubén ✅.
    - DS13 marcado ✅ en SIGNAGE-ROADMAP.md.
  </done>
</task>
```

## Notas de diseño

- **Wall-clock en `client.timezone`**: usar `Intl.DateTimeFormat` con
  `timeZone: client.timezone` para extraer HH:MM y YYYY-MM-DD del `now`.
  No depende del timezone del navegador / servidor.
- **Wrap medianoche en `kind: 'hours'`**: ej. `start=22:00 end=06:00` (overnight).
  Activo si `now >= start || now < end`.
- **Re-eval cada minuto, no cada segundo**: la granularidad mínima de schedule es
  HH:MM. setInterval(60_000) alineado al próximo cambio de minuto exacto evita
  drift visual (ej. slide entra/sale a los 30s del minuto).
- **`currentIdx` ancla por slide.id**: cuando la lista cambia, mantener el slide
  visible si sigue activo; si no, fallback a `0` del nuevo array.
- **Dev override ?clock=...**: solo afecta la evaluación de schedule, no el reloj
  del header (ese sigue mostrando el now real). Justificación: el override es
  para QA de dayparting, no para fingir que el TV está en otra hora.
- **`hideOutsideSchedule: true` implícito en v1**: simplifica. Si v2 necesita
  modos diferentes (dimmed slide, next-event countdown), se cablean entonces.

## Out of scope (DS14+)

- Audio toggle global por display + sleep schedule (cambiar a black screen).
- i18n strings de signage modules ("No active slides", "Loading…").
- Smoke E2E + gate del Milestone Local.
