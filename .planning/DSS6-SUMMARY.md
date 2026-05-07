# DSS6-SUMMARY.md — Snapshots / Versions del display

**Fecha:** 2026-05-07
**Estado:** ✅ aprobado visualmente

## Hecho

Cada PUT al display crea automáticamente un snapshot inmutable del state
previo en KV antes de overwrite. UI nueva `<VersionsPanel>` lista la historia
con cap FIFO 10 y permite restore con confirmación inline.

### KV layer

- **`kvSignageSnapshot`** en `kv-store.ts`:
  - `listIds(client, display)` → string[] desde `kSignageSnapList(...)`.
  - `listMeta(client, display)` → `{ id, meta }[]` enriquecido leyendo cada snap.
  - `get(client, display, id)` → `SignageSnapshotEntry` validado con safeParse.
  - `create(client, display, data, meta?)` → genera id (ms epoch), set en
    `kSignageSnap(...)`, prepend a list, **cap 10** (los excedidos se borran).
  - `delete(client, display, id)`.
- Wrapper format: `{ meta: { ts, savedBy?, note? }, data: SignageDisplayConfig }`.

### Auto-snapshot en PUT

- API route `/api/studio/signage/displays/[c]/[d]` (PUT) ahora:
  1. Lee el current desde KV (puede ser null).
  2. Si existe, llama `kvSignageSnapshot.create(client, display, previous, { ts: Date.now() })`.
  3. Continúa con `kvSignageDisplay.set` con el nuevo display.
- Si el snapshot falla, log warning pero el save sigue (no bloquea).

### API endpoints nuevos

- **`GET /api/studio/signage/displays/[c]/[d]/snapshots`** — lista metadata.
- **`POST /api/studio/signage/displays/[c]/[d]/snapshots/[id]/restore`**:
  1. Lee el snapshot por id.
  2. **Crea snapshot del current pre-restore** con note `pre-restore-of-<id>`.
  3. Sobrescribe current con `snapshot.data`.
  - Patrón git-like: el restore es atómico y reversible.

### UI VersionsPanel

- Card collapsible debajo del PlaylistPanel en el sidebar del display editor.
- Header: chevron + History icon + "Versions" + count "N/10".
- Cuerpo:
  - Empty state: "No versions yet — every save creates a snapshot of the
    previous state."
  - Lista de cards compactas: timestamp formateado (`May 7 · 11:32 AM`) +
    optional note (italic) + botón "Restore".
  - Click "Restore" → row inline change a Cancel/Confirm (ámbar).
  - Click Confirm → llama API → `window.location.reload()`.
- Refresh automático: `useEffect([refreshTrigger])` recarga la lista cuando
  `lastSavedAt` cambia (cada nuevo save).

### Cliente fetch helpers

- `snapshots-api.ts`:
  - `listSnapshots(c, d)` → `SnapshotListEntry[]`.
  - `restoreSnapshot(c, d, id)` → `{ ok, error? }`.

## Archivos tocados

| Archivo | Tipo |
|---|---|
| `src/lib/signage/kv-store.ts` | + `kvSignageSnapshot` namespace |
| `src/app/api/studio/signage/displays/[client]/[displaySlug]/route.ts` | PUT crea snapshot del previo |
| `src/app/api/studio/signage/displays/[client]/[displaySlug]/snapshots/route.ts` | NUEVO — GET list |
| `src/app/api/studio/signage/displays/[client]/[displaySlug]/snapshots/[id]/restore/route.ts` | NUEVO — POST restore |
| `src/app/studio/digital-displays/_lib/snapshots-api.ts` | NUEVO |
| `src/app/studio/digital-displays/_components/display/VersionsPanel.tsx` | NUEVO |
| `src/app/studio/digital-displays/_components/DisplayEditor.tsx` | montar VersionsPanel |
| `.planning/DSS6-PLAN.md` | NUEVO |
| `.planning/DSS6-SUMMARY.md` | NUEVO |

## Verificado

- `pnpm typecheck` ✅
- `pnpm exec eslint` archivos tocados ✅
- `pnpm kiosk:dev` arranca limpio
- Editor: edit → save → snapshot aparece. Multiple saves → lista crece hasta cap 10.
- Restore con confirmación → reload → state restaurado.
- Persistencia: refresh → snapshots persisten desde KV.
- Sin regression del runtime ni del kiosk.
- Aprobación visual ✅.

## Decisiones

- **Cap 10 FIFO**: balance history útil vs storage. ~10×10KB = 100KB lejos
  del cap 950KB del KV.
- **Snapshot del current pre-restore**: pattern git-like — el operador puede
  deshacer un restore. Add note `pre-restore-of-<id>` para que sea
  identificable en la lista.
- **Auto-snapshot al PUT vs explicit Save**: la edición tiene autosave 1s.
  En DSS6 cada save (autosave o explicit) crea snapshot. Si saturara, DSS6.5
  podría hacer dedup por contenido (skip snapshot si data === previous).
- **Reload completo en restore** vs reset inline: simpler. El editor lee
  current del KV en el SSR de page.tsx, así que reload garantiza consistencia.
- **Wrapper `{ meta, data }`**: separa metadata estructural del display real.
  `data` valida con schema strict; `meta` evolutiva sin tocar display schema.

## Pendiente / siguiente sub-fase

**DSS7** — Publish (GitHub PR auto-merge) + JSON export/import + KV size advisor.
Convertirá la working copy del KV en commit a `clients-signage/<slug>/` via PR.
JSON export: descarga display.json. Import: upload + parse + set al KV.
