# DSS4-PLAN.md — Playlist editor + save al KV

Atomic plan ejecutable en sesión fresca. Convierte el `<DisplayEditor>` de
read-only (DSS2) a **editable** con working copy local + push live al iframe
+ save al KV via API. Cubre settings + playlist (drag-to-reorder, edit,
delete, add) + schedule popover (`always` | `hours`).

```xml
<task type="auto">
  <name>DSS4 — Editor de display editable: settings + playlist (drag/edit/add/delete) + schedule popover + save al KV</name>
  <files>
    src/app/studio/digital-displays/_lib/display-edit-store.ts                    (NUEVO — zustand working copy)
    src/app/studio/digital-displays/_lib/save-display.ts                          (NUEVO — POST a la API + autosave debounce)
    src/app/api/studio/signage/displays/[client]/[displaySlug]/route.ts           (NUEVO — POST/PUT al KV)
    src/app/studio/digital-displays/_components/DisplayEditor.tsx                 (cabla store + autosave + push live + dirty badge)
    src/app/studio/digital-displays/_components/display/DisplaySettingsPanel.tsx  (read-only → editable)
    src/app/studio/digital-displays/_components/display/PlaylistPanel.tsx         (read-only → editable con drag/edit/delete/add)
    src/app/studio/digital-displays/_components/display/AddSlideModal.tsx         (NUEVO — modal simple template + duration)
    src/app/studio/digital-displays/_components/display/SchedulePopover.tsx       (NUEVO — popover edit always/hours)
    .planning/DSS4-SUMMARY.md
    .planning/SIGNAGE-ROADMAP.md
  </files>
  <action>
    ## 1. Working copy store
    1.1. `display-edit-store.ts`:
         - State: `displayDraft: SignageDisplayConfig`, `dirty: boolean`,
           `saving: boolean`, `lastSavedAt: number | null`, `error: string | null`.
         - Actions:
           - `init(display)` — set draft + reset flags.
           - `updateSettings(patch)` — merge en `draft.settings`.
           - `addSlide(slide)` — push al final.
           - `removeSlide(slideId)`.
           - `reorderSlides(fromIdx, toIdx)`.
           - `updateSlide(slideId, patch)` — merge en slide específico.
           - `markSaved()` / `markSaving(saving)` / `setError(err)`.
         - Cualquier action setea `dirty: true` y limpia `error`.

    ## 2. API route POST/PUT
    2.1. `route.ts`:
         - `PUT /api/studio/signage/displays/[client]/[displaySlug]`
           con body `display: SignageDisplayConfig` validado por Zod.
           Llama `kvSignageDisplay.set(client, display, parsed)`. Retorna 200.
         - Errors: 400 si shape inválido, 500 si KV falla.
         - Server-only (no exposed cliente).

    ## 3. Save infra
    3.1. `save-display.ts`:
         - `saveDisplay(client, display)` — `fetch(PUT, body)` + parse response.
         - `useDebouncedAutosave(displayDraft, dirty, save, 1000ms)` — hook
           que dispara save 1s después del último cambio.
         - Manejo de errores con setError en el store.

    ## 4. Editable settings panel
    4.1. `<DisplaySettingsPanel>`:
         - audio: toggle button.
         - defaultDurationMs: number input (segundos) → ms al store.
         - defaultTransition: select 4 opciones.
         - sleepSchedule.enabled: toggle.
         - sleepSchedule.startTime / endTime: time inputs (HH:MM).
         - Cada onChange dispatcha `updateSettings`.

    ## 5. Editable playlist panel
    5.1. `<PlaylistPanel>`:
         - Cada slide row es `draggable={true}` con HTML5 native drag.
         - `onDragStart` set source idx; `onDragOver` preview indicator;
           `onDrop` calls `reorderSlides`.
         - Visual: barra azul above/below durante drag.
         - Cada slide muestra:
           - Index (no editable).
           - templateId mono (no editable en DSS4 — se decide al add).
           - duration: inline edit (small input → ms al store).
           - transition: inline select.
           - Schedule pill: click → abre `<SchedulePopover>`.
           - Delete button (icono trash) → `removeSlide`.
         - Botón "Add slide" → abre `<AddSlideModal>`.

    ## 6. AddSlideModal
    6.1. Modal Radix Dialog (ya existe en _components):
         - Template select (8 opciones: 01-08).
         - Duration default 7000ms (input segundos).
         - Transition default `cut`.
         - Schedule default `always`.
         - Confirm → `addSlide({ id: nanoid(), templateId, durationMs, schedule, slots: [] })`.

    ## 7. SchedulePopover
    7.1. Popover compacto:
         - Tab toggle: Always · Hours.
         - Si Hours: time inputs startTime + endTime + checkbox "every day"
           (DSS4 simple: no daysOfWeek individual).
         - Apply → `updateSlide(id, { schedule: ... })`.
         - Cancel → cierra sin tocar.

    ## 8. Live push + autosave
    8.1. `<DisplayEditor>`:
         - Inicializa store con `display` recibido del server.
         - `useEffect` observa `displayDraft` y dispara `bridge.pushDisplay`
           (debounce 120ms ya viene del hook).
         - `useDebouncedAutosave` 1s para PUT al KV.
         - Header del editor: badge "Unsaved" / "Saving…" / "Saved" según state.
         - Si error de save: pill rojo con mensaje.

    ## 9. Out of scope (DSS4.5+ si necesario)
    - Date-range schedule UI (solo hours en DSS4).
    - daysOfWeek picker (solo "every day" en DSS4).
    - Add slide wizard 3 pasos completo (solo modal simple).
    - Slot configurator (slots = [] al crear; DSS5 cablea module editors).

    ## 10. Bridge runtime aplicar overrides (out of scope DSS4)
    El runtime YA recibe `signage:display-update` desde DSS3 y popula el
    store. Pero los componentes runtime aún no leen del store. Para que el
    push live se vea, **DSS4 reload el iframe** con `bridge` reload-on-save.
    DSS5 cablea componentes para leer overrides.
  </action>
  <verify>
    - `pnpm typecheck` ✅
    - `pnpm exec eslint` archivos tocados ✅
    - `pnpm kiosk:dev` arranca limpio
    - Visitar `/studio/digital-displays/default/displays/lobby-tv`:
      - Edit defaultDuration → badge "Unsaved" → 1s después "Saved".
      - Reload iframe → cambio aplicado (si guardó al KV).
      - Drag slide #2 sobre #5 → reorder.
      - Click delete en slide → remove.
      - Click "Add slide" → modal → confirm → slide nuevo aparece.
      - Click pill schedule → popover → cambiar a hours 09:00-18:00 → apply.
      - Refrescar página: cambios persisten (KV).
    - `/signage/default/lobby-tv` directo: refleja los cambios del KV.
    - Sin regression del kiosk.
  </verify>
  <done>
    - Settings editables.
    - Playlist drag-to-reorder + edit + delete + add.
    - Schedule popover funcional para always/hours.
    - Save al KV via PUT API.
    - Autosave 1s después del último cambio.
    - Dirty badge / Saving / Saved.
    - DSS4 marcado ✅ en SIGNAGE-ROADMAP.md.
    - Aprobación visual.
  </done>
</task>
```

## Notas de diseño

- **HTML5 native drag** (sin @dnd-kit/react-beautiful-dnd): suficiente para
  N≤20 slides. Si crece, migrar después.
- **Working copy + autosave 1s**: balance entre UX (no hay que hacer click
  Save) y network (no flooding del KV en cada keystroke).
- **Store zustand local en editor**: separa la working copy del server fetch
  inicial. Permite undo/redo en futuro (out of scope DSS4).
- **Autosave Strategy**:
  1. Mutación → `dirty: true`.
  2. Debounce 1s sin más mutaciones → `markSaving(true)` + PUT.
  3. Response OK → `markSaved()`.
  4. Response error → `setError(msg)` (manual retry).
- **Bridge push 120ms vs autosave 1s**: el push live al iframe es más rápido
  para feedback inmediato; el save es lento porque persiste.
- **Add slide simple**: solo template + duration default. El user reordena
  después si quiere otra posición. Wizard elaborado DSS4.5 si necesario.

## Out of scope explícito

- daysOfWeek granular (solo "every day").
- date-range schedule UI.
- Slot configurator (los slots se cablean en DSS5 con module editors).
- Overrides reactivos en runtime (DSS5 cablea componentes con
  `useSignageBridgeStore`).
