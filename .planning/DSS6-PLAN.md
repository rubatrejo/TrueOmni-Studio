# DSS6-PLAN.md — Snapshots / Versions del display + restore

Atomic plan ejecutable en sesión fresca. Cada PUT al display crea un
snapshot inmutable del display **previo** en KV antes de sobrescribirlo. UI
nueva `<VersionsPanel>` en el display editor lista la historia con cap FIFO
10 y permite restore con confirmación.

```xml
<task type="auto">
  <name>DSS6 — Snapshots/Versions del display: auto-snapshot al PUT + lista + restore con cap 10 FIFO</name>
  <files>
    src/lib/signage/kv-store.ts                                                            (extender con kvSignageSnapshot)
    src/app/api/studio/signage/displays/[client]/[displaySlug]/route.ts                     (PUT crea snapshot del previo)
    src/app/api/studio/signage/displays/[client]/[displaySlug]/snapshots/route.ts           (NUEVO — GET list)
    src/app/api/studio/signage/displays/[client]/[displaySlug]/snapshots/[id]/restore/route.ts  (NUEVO — POST restore)
    src/app/studio/digital-displays/_lib/snapshots-api.ts                                  (NUEVO — fetch helpers cliente)
    src/app/studio/digital-displays/_components/display/VersionsPanel.tsx                  (NUEVO — UI list + restore)
    src/app/studio/digital-displays/_components/DisplayEditor.tsx                          (montar VersionsPanel)
    .planning/DSS6-SUMMARY.md
    .planning/SIGNAGE-ROADMAP.md
  </files>
  <action>
    ## 1. KV helpers `kvSignageSnapshot`
    1.1. En `kv-store.ts` añadir el namespace `kvSignageSnapshot`:
         - `list(client, display): Promise<string[]>` — lee
           `kSignageSnapList(client, display)` (JSON array de IDs ordenados
           más reciente primero).
         - `get(client, display, id): Promise<SignageDisplayConfig | null>`
           — lee `kSignageSnap(client, display, id)` con safeParse.
         - `create(client, display, data, sourceMeta?)`:
           - id = `Date.now().toString()` (ms epoch como ID estable).
           - Set snapshot en `kSignageSnap(client, display, id)`.
           - Rotar lista: prepend id, cap 10. Eliminar IDs por encima.
           - Para cada id eliminado, `kv.del(kSignageSnap(...))`.
         - `delete(client, display, id)`.
    1.2. Tipo de metadata por snapshot lo guardamos junto con el snapshot
         (no separado): el snapshot es `SignageDisplayConfig` + `_snapshotMeta:
         { ts, savedBy?, note? }`. Ojo: esto rompe el schema strict; mejor
         guardar como wrapper:
         `{ data: SignageDisplayConfig, meta: { ts, ... } }`.
         **Decisión**: wrapper. Más limpio.
    1.3. Tipo `SignageSnapshotEntry = { id, meta, data }`.

    ## 2. Auto-snapshot en PUT
    2.1. En el handler PUT de `displays/[client]/[displaySlug]/route.ts`:
         - Antes de `kvSignageDisplay.set`, llamar
           `kvSignageDisplay.get(client, displaySlug)` para obtener el state
           actual (puede ser null si es primera escritura).
         - Si existe, llamar `kvSignageSnapshot.create(client, displaySlug,
           previous, { ts: Date.now() })`.
         - Después continuar con `kvSignageDisplay.set` con el nuevo display.
         - Si el snapshot create falla, log warning pero NO falla el save.

    ## 3. API GET list
    3.1. `GET /api/studio/signage/displays/[c]/[d]/snapshots` retorna
         `{ snapshots: { id, ts }[] }` ordenados más reciente primero. Usa
         `kvSignageSnapshot.list` + para cada id `get` solo la meta (mismo
         wrapper).

    ## 4. API POST restore
    4.1. `POST /api/studio/signage/displays/[c]/[d]/snapshots/[id]/restore`:
         - Lee el snapshot.
         - Crea un nuevo snapshot del current (igual que un save normal).
         - Sobrescribe current con el snapshot.data.
         - Retorna `{ ok: true, restoredId, newCurrentTs }`.

    ## 5. Cliente fetch helpers
    5.1. `snapshots-api.ts`:
         - `listSnapshots(clientSlug, displaySlug): Promise<SnapshotMeta[]>`.
         - `restoreSnapshot(clientSlug, displaySlug, id): Promise<{ ok }>`.

    ## 6. `<VersionsPanel>` UI
    6.1. Card collapsible debajo del PlaylistPanel en el sidebar del display
         editor. Header con icono History + count + chevron.
    6.2. Cuerpo:
         - Estado `loading` mientras fetch list.
         - Lista de snapshots con: ts (`Apr 23 · 14:32`), badge "current"
           para el primero después de restore, botón "Restore".
         - Click Restore → modal confirm → llama API → on success: refresh
           list + reload del editor (re-fetch de display).
         - Empty state: "No versions yet — every save creates a snapshot."
    6.3. State management:
         - useEffect carga la lista al mount + después de cada save (observar
           lastSavedAt del store).
         - Restore exitoso → refresh la lista + reset del store (la próxima
           navegación reload el SSR).

    ## 7. UX consideration
    7.1. El primer save no crea snapshot (no hay previous en KV — la primera
         carga viene del fs). El segundo save crea el primer snapshot del
         draft inicial. Después de N saves, hay N-1 snapshots.
    7.2. Cap 10 FIFO: el snapshot 11 elimina el 1.

    ## 8. Out of scope
    - Diff visual entre snapshots (DSS6.5 si surge).
    - Notes/labels custom por snapshot (DSS6.5).
    - Export/import individual de snapshot a JSON.
    - Snapshots a nivel client (branding/header) — DSS6.5 si surge.
  </action>
  <verify>
    - `pnpm typecheck` ✅
    - `pnpm exec eslint` archivos tocados ✅
    - `pnpm kiosk:dev` arranca limpio
    - Editor `/studio/digital-displays/default/displays/lobby-tv`:
      - Hacer un cambio → autosave → "Saved".
      - Repetir 3 veces → en VersionsPanel aparecen ~2-3 snapshots.
      - Click "Restore" en uno antiguo → modal confirma → on confirm: editor
        recarga el display y muestra el state restaurado.
      - Refresh → snapshots persisten.
    - Hacer 12 saves → solo 10 snapshots (FIFO cap).
    - Sin regression del runtime.
  </verify>
  <done>
    - kvSignageSnapshot CRUD funcional con FIFO cap 10.
    - PUT crea snapshot del previo automáticamente.
    - GET list + POST restore endpoints.
    - VersionsPanel UI funcional con restore.
    - DSS6 marcado ✅ en SIGNAGE-ROADMAP.md.
    - Aprobación visual.
  </done>
</task>
```

## Notas de diseño

- **Snapshot wrapper `{ data, meta }`**: el schema valida `data` como
  SignageDisplayConfig estricto; `meta` lleva timestamp + savedBy futuro.
- **Cap 10 FIFO**: balance entre history útil y storage KV. Cada snapshot
  ~3-10KB; 10×10KB = 100KB. Lejos del cap 950KB de KV.
- **Restore vía nuevo snapshot del current antes de overwrite**: el operador
  puede deshacer un restore restaurando el snapshot que se creó del current
  pre-restore. Pattern git-like.
- **Auto-snapshot al PUT vs explicit "Save"**: el editor ya tiene autosave
  cada 1s. Si creáramos snapshot por cada autosave, tendríamos 10 snapshots
  en 10s. **Decisión DSS6**: snapshot solo cuando el save SUCCEED y haya
  diff vs el state previo en KV (proxy: el current existe). En DSS6 simple:
  snapshot si previous existe.
- **Sin notes custom**: DSS6.5 si surge necesidad.

## Out of scope explícito

- Diff UI entre snapshots.
- Snapshot del client (branding/header) — DSS6.5.
- Export individual a JSON — DSS7.
