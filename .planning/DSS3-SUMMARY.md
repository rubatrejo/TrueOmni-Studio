# DSS3-SUMMARY.md — Bridge editor↔iframe + loader híbrido KV→fs

**Fecha:** 2026-05-07
**Estado:** ✅ aprobado visualmente

## Hecho

Establece la infraestructura de comunicación bidireccional entre el editor
del Studio y el iframe del runtime signage, más el loader híbrido KV→fs.
**DSS3 valida el flow end-to-end** con handshake + heartbeat. Los pushes
reales (cambios en sidebar reflejados sin reload) requieren la edición que
aterriza en DSS4-DSS5.

### 1. Bridge runtime side

- **`src/components/signage/runtime/signage-bridge-store.ts`** (nuevo) —
  zustand store con `clientPatch | null` + `displayPatch | null` + setters.
  DSS4-5 cablea componentes para leer overrides desde aquí con fallback a
  prop server.
- **`src/components/signage/runtime/SignageBridge.tsx`** (nuevo) — client
  component que:
  - Emite `signage:ready { clientSlug, displaySlug, ts }` al `window.parent`
    al montar.
  - Heartbeat cada 5s con el mismo type.
  - Listener postMessage filtra `signage:client-update` y
    `signage:display-update` → popula el store.
  - Cleanup interval + listener al desmontar.
- **`page.tsx` del runtime** monta `<SignageBridge>` dentro de `<SignageStage>`
  (no interrumpe el árbol; solo escucha y handshake).

### 2. Bridge editor side

- **`src/app/studio/digital-displays/_lib/use-signage-bridge.ts`** (nuevo) —
  hook con `iframeRef` + `pushClient` + `pushDisplay` (debounce 120ms) +
  `bridgeStatus` derivado (`connecting | connected | stale | lost`) +
  `onIframeLoad` callback.
  - Listener postMessage espera `signage:ready` del runtime para marcar
    `isReady` y resendear pushes pendientes (race-safe).
  - Ticker 1s actualiza `bridgeStatus` con paso del tiempo.
  - Reglas: `connecting` <5s desde mount, `connected` <7s desde lastAck,
    `stale` 7-30s, `lost` >30s.
- **`<DisplayEditor>`** invoca el hook y pasa `iframeRef` + `onIframeLoad` +
  `bridgeStatus` al `<PreviewFrame>`.
- **`<PreviewFrame>`**:
  - Asigna `iframeRef` al `<iframe>` y `onLoad={onIframeLoad}`.
  - Toolbar nueva: badge de bridge status con dot color + label + tooltip
    (verde / ámbar pulsante / ámbar / rojo).

### 3. Loader híbrido KV→fs

- **`loadSignageClient(slug)`**: primero `kvSignageClient.get(slug)`. Si KV
  hit, mergea con events/social/news del fs (DSS5 los moverá a KV también).
  Si KV miss → fs como antes. Mantiene fallback a `default` si nada resuelve.
- **`loadSignageDisplay(client, display)`**: primero
  `kvSignageDisplay.get(client, display)`. Si miss → fs como antes.
- KV está vacío hasta que DSS5 introduzca el flow de save. Hasta entonces el
  comportamiento es idéntico al de DS0..DS15 (fs-only puro).

## Archivos tocados

| Archivo                                                                | Tipo                              |
| ---------------------------------------------------------------------- | --------------------------------- |
| `src/components/signage/runtime/signage-bridge-store.ts`               | NUEVO                             |
| `src/components/signage/runtime/SignageBridge.tsx`                     | NUEVO                             |
| `src/app/(signage)/signage/[client]/[display]/page.tsx`                | montar `<SignageBridge>`          |
| `src/lib/signage/config.ts`                                            | loader híbrido KV→fs              |
| `src/app/studio/digital-displays/_lib/use-signage-bridge.ts`           | NUEVO                             |
| `src/app/studio/digital-displays/_components/display/PreviewFrame.tsx` | iframeRef + onLoad + status badge |
| `src/app/studio/digital-displays/_components/DisplayEditor.tsx`        | invoca hook                       |
| `.planning/DSS3-PLAN.md`                                               | NUEVO                             |
| `.planning/DSS3-SUMMARY.md`                                            | NUEVO                             |

## Verificado

- `pnpm typecheck` ✅ limpio.
- `pnpm exec eslint` archivos tocados ✅.
- `pnpm kiosk:dev` arranca limpio.
- `/signage/default/lobby-tv` (runtime directo) funciona como antes.
- `/studio/digital-displays/default/displays/lobby-tv`:
  - Iframe carga; badge cambia de "Connecting" (ámbar pulsante) a "Connected"
    (verde) tras el primer handshake.
  - Reload bumpea key → vuelve a "Connecting" → "Connected".
  - Heartbeat cada 5s mantiene el badge en "Connected".
- Sin regression del kiosk (`/studio` y `/studio/<slug>`).
- Aprobación visual de Rubén ✅.

## Decisiones

- **Shape simplificada vs `usePreviewBridge` del kiosk**: signage solo tiene
  2 entidades (client + display) vs 18+ del kiosk. Hook compacto: 2 push
  methods en lugar de uno por módulo.
- **Heartbeat 5s**: replica el patrón del bridge kiosk para detectar iframes
  congelados. Ventana `connected <7s` con +2s de margen sobre el heartbeat.
- **Store zustand para overrides**: forward-compat con DSS4-5. El runtime
  todavía no consume el store visualmente; cuando DSS5 cablee componentes
  con `clientPatch ?? prop`, los overrides se aplican automáticamente.
- **Loader híbrido try/catch silencioso en KV miss**: si KV está
  unreachable o devuelve shape inválido, el loader continúa al fs sin
  romper. Sin telemetría todavía — DSS8 introducirá diagnostics.
- **Bridge se emite incluso standalone**: si el runtime se abre en pestaña
  directa (sin iframe parent), el handshake postMessage no llega a nadie
  pero no es un error. Cero side-effects en uso standalone.
- **`signage:*` prefix** en types postMessage para aislar del kiosk
  (`studio:*` / `kiosk:*`).

## Pendiente / siguiente sub-fase

**DSS4** — Playlist editor (drag-to-reorder + Add slide wizard 3 pasos +
dayparting popover). Primera sub-fase con edición real del display:

- Sidebar editable (settings + slides reorder/delete/edit + add).
- Push al iframe en cada cambio (`pushDisplay` del hook DSS3).
- Save al KV via API route nueva.
- Working copy local (zustand store en editor) + sync al KV con debounce.
