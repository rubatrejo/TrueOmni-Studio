# DSS4-SUMMARY.md — Playlist editor + save al KV

**Fecha:** 2026-05-07
**Estado:** ✅ aprobado visualmente

## Hecho

Convierte el `<DisplayEditor>` de read-only (DSS2) a **editable** con
working copy local, push live al iframe vía bridge, y autosave al KV via API
nueva. Primer flow real de edición del editor signage.

### Working copy zustand

- **`display-edit-store.ts`** (nuevo) — store del draft con state
  `{ draft, dirty, saving, lastSavedAt, error }` y actions
  `init / updateSettings / addSlide / removeSlide / reorderSlides /
updateSlide / markSaving / markSaved / setError / reset`. `structuredClone`
  del display al inicializar para no mutar la prop server.

### Persistence layer

- **`save-display.ts`** (nuevo) — `saveDisplay(client, display)` PUT a la
  API + `useDebouncedAutosave(trigger, dirty, onSave, 1000)` que agenda save
  1s después del último cambio (cancela ticks pendientes).
- **`/api/studio/signage/displays/[client]/[displaySlug]/route.ts`** (nuevo)
  — `PUT` valida con `SignageDisplayConfigSchema`, defensa de slug match
  path↔body.slug, llama `kvSignageDisplay.set`. Errors 400 (shape) / 500 (KV).

### Settings panel editable

- **`<DisplaySettingsPanel>`**: ahora consume el store. Cada change dispatcha
  `updateSettings`:
  - Resolution select (1080p/4k).
  - Audio toggle button (chip enabled/disabled).
  - Default duration en segundos (input number).
  - Default transition select 4 opciones.
  - Sleep schedule toggle + time inputs start/end (solo si enabled).

### Playlist editable

- **`<PlaylistPanel>`**: cards draggable HTML5 nativo:
  - `onDragStart` set source idx.
  - `onDragOver` preview indicator (border azul + ring).
  - `onDrop` → `reorderSlides`.
  - Visual dragging slide al 50% opacity.
- Cada slide row:
  - Grip icon + index pill + templateId mono (read-only en DSS4 — DSS5 cablea
    module editors).
  - Inline edit: duration (number input segundos), transition (select; sky si
    override).
  - Schedule pill: click → abre `<SchedulePopover>`.
  - Trash icon → `removeSlide`.
- Botón "Add slide" → `<AddSlideModal>`.

### AddSlideModal

- Modal Radix-style propio: select template (8 opciones), duration default 7s,
  transition default `cut`. Confirm → `addSlide({ id: nanoid-like, templateId,
durationMs, schedule:'always', slots: [], transition })`.
- Cierra con Esc / click outside.

### SchedulePopover

- Popover absolute-positioned junto al pill. Tabs `Always`/`Hours`. Si `Hours`,
  inputs `time` para start/end. Apply → `updateSlide(id, { schedule })`.
- Cancel/Esc/click outside cierra sin tocar.

### Live preview + autosave wire-up

- `<DisplayEditor>` ahora:
  - `useEffect` inicializa store con `display` recibido del server al cambiar
    `display.slug` o `client.slug`.
  - `useEffect` observa `draft` y dispara `bridge.pushDisplay(draft)` (debounce
    120ms ya en hook).
  - `useDebouncedAutosave(draft, dirty, onAutosave, 1000)` para PUT al KV.
  - Header: `<SaveStatusBadge>` con state-driven copy:
    - `error`: rojo "Save error" + tooltip mensaje.
    - `saving`: ámbar "Saving…" con spinner.
    - `dirty`: ámbar "Unsaved changes".
    - `lastSavedAt !== null && !dirty`: verde "Saved".
    - Default: zinc "Synced".

### Persistencia E2E

- Save al KV → próxima carga del runtime `/signage/<client>/<display>` lee
  desde KV (gracias al loader híbrido DSS3) → cambios visibles.
- DSS5 cablea overrides reactivos en runtime para que push live se vea sin
  reload.

## Archivos tocados

| Archivo                                                                        | Tipo                                         |
| ------------------------------------------------------------------------------ | -------------------------------------------- |
| `src/app/studio/digital-displays/_lib/display-edit-store.ts`                   | NUEVO                                        |
| `src/app/studio/digital-displays/_lib/save-display.ts`                         | NUEVO                                        |
| `src/app/api/studio/signage/displays/[client]/[displaySlug]/route.ts`          | NUEVO                                        |
| `src/app/studio/digital-displays/_components/display/DisplaySettingsPanel.tsx` | read-only → editable                         |
| `src/app/studio/digital-displays/_components/display/PlaylistPanel.tsx`        | read-only → editable + DnD                   |
| `src/app/studio/digital-displays/_components/display/AddSlideModal.tsx`        | NUEVO                                        |
| `src/app/studio/digital-displays/_components/display/SchedulePopover.tsx`      | NUEVO                                        |
| `src/app/studio/digital-displays/_components/DisplayEditor.tsx`                | store + autosave + bridge push + dirty badge |
| `.planning/DSS4-PLAN.md`                                                       | NUEVO                                        |
| `.planning/DSS4-SUMMARY.md`                                                    | NUEVO                                        |

## Verificado

- `pnpm typecheck` ✅ limpio.
- `pnpm exec eslint src/app/studio/digital-displays/ src/app/api/studio/signage/` ✅ limpio.
- `pnpm kiosk:dev` arranca limpio.
- Settings: edit audio/duration/transition/sleep → "Unsaved" → "Saving…" → "Saved".
- Playlist: drag #2 sobre #5 → reorder. Delete slide → remove. Edit duration/transition inline → updates. Click pill schedule → popover edit hours → apply.
- Add slide modal: confirm → slide nuevo aparece al final con templateId seleccionado.
- Refresh página → cambios persisten desde KV.
- Runtime directo `/signage/default/lobby-tv` → refleja cambios del KV.
- Sin regression del kiosk.
- Aprobación visual de Rubén ✅.

## Decisiones

- **HTML5 native drag** vs `@dnd-kit`: cero deps añadidas. Suficiente para
  N≤20 slides. Si crece, migrar después.
- **Working copy zustand local en editor** vs server state via SWR/React Query:
  separación clara entre fetch inicial (Server Component) y mutación interactiva
  (Client store). Permite undo/redo en futuro.
- **Autosave 1s + bridge push 120ms**: el push live es rápido para feedback
  inmediato; el save es lento porque persiste KV. Si la red está lenta y otro
  save está pendiente cuando el primero acaba, el debounce los colapsa.
- **Add slide modal simple** vs wizard 3 pasos: la 1.0 entrega el flow base.
  Wizard elaborado se pospone a DSS4.5 si surge necesidad de UX más guiada.
- **`structuredClone(display)` al init**: evita mutar la prop server. Cada
  navegación re-init con la nueva data del fs/KV.
- **Schedule popover solo always/hours**: 95% de los casos. date-range +
  daysOfWeek granular se posponen a DSS4.5.
- **PUT (no POST)**: idempotente. El frontend puede llamar repetidamente sin
  acumular versiones.
- **Defensa de slug match en API**: path `[displaySlug]` vs `body.display.slug`.
  Mismatch → 400.

## Pendiente / siguiente sub-fase

**DSS5** — Module editors (6 forms: Events / SocialWall / VideoImage / Ads /
News / Weather) por slot del template + cablear overrides reactivos en runtime
para que el bridge push live se vea sin reload.
