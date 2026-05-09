# DSS3-PLAN.md — Bridge editor↔iframe + loader híbrido KV→fs

Atomic plan ejecutable en sesión fresca. Establece la infraestructura de
comunicación bidireccional entre el editor del Studio y el iframe del runtime
signage. **DSS3 valida el flow end-to-end** con un mensaje de prueba; los
pushes reales (cambios en sidebar reflejados sin reload) requieren la edición
real que aterriza en DSS4-DSS5.

```xml
<task type="auto">
  <name>DSS3 — Bridge signage editor↔runtime: postMessage + handshake + loader híbrido KV→fs + status badge</name>
  <files>
    src/components/signage/runtime/SignageBridge.tsx                  (NUEVO — listener postMessage + handshake outbound)
    src/app/(signage)/signage/[client]/[display]/page.tsx              (montar `<SignageBridge>` en árbol runtime)
    src/lib/signage/config.ts                                          (loader híbrido: KV primero → fs fallback)
    src/app/studio/digital-displays/_lib/use-signage-bridge.ts         (NUEVO — hook iframeRef + pushClient/pushDisplay + bridgeStatus)
    src/app/studio/digital-displays/_components/display/PreviewFrame.tsx  (cablear hook + status badge)
    .planning/DSS3-SUMMARY.md
    .planning/SIGNAGE-ROADMAP.md
  </files>
  <action>
    ## 1. Bridge runtime side
    1.1. `SignageBridge.tsx` (client):
         - Props: `clientSlug`, `displaySlug`.
         - useEffect en mount:
           a. Emite `window.parent.postMessage({ type: 'signage:ready', clientSlug, displaySlug }, '*')`.
           b. Re-emite cada 5s como heartbeat.
         - Listener `window.addEventListener('message')` que filtra por:
           - `signage:client-update` → store-pendiente (DSS4-5 lo consume).
           - `signage:display-update` → store-pendiente.
           - Otros types: ignora.
         - **DSS3 NO implementa override visual** todavía. El listener guarda
           el patch en un store interno (zustand simple) que DSS4-5 conectará.
         - Cleanup unmount.
    1.2. Crear `src/components/signage/runtime/signage-bridge-store.ts` —
         zustand store simple con `clientPatch | null` + `displayPatch | null`
         + setters. DSS4-5 lo cablea a los componentes que respetan los
         overrides.
    1.3. Montar `<SignageBridge>` en `page.tsx` del runtime, dentro del
         `<SignageStage>`. No interrumpe nada — solo escucha y hace handshake.

    ## 2. Loader híbrido KV→fs
    2.1. Modificar `loadSignageClient(slug)` en `src/lib/signage/config.ts`:
         - Primero `kvSignageClient.get(slug)` → si retorna client, mergear con
           events/social/news (que siguen leyéndose de fs en DSS3 — DSS5
           moverá events/social/news también a KV).
         - Si KV miss → fs como antes.
    2.2. `loadSignageDisplay(client, display)`:
         - Primero `kvSignageDisplay.get(client, display)`.
         - Si KV miss → fs como antes.
    2.3. **NO se llena el KV automáticamente** — eso es responsabilidad del
         editor cuando DSS5 introduzca save. En DSS3 el KV está vacío y el
         loader cae al fs. El bridge funciona pero los pushes son silenciosos
         hasta DSS4-5.
    2.4. Cuidado: `loadSignageClient` sigue usando `cache()` de React. Eso
         es OK — el cache es por petición, no global. Pero DSS5 puede
         necesitar invalidación cuando un save dispare revalidation; lo
         vemos entonces.

    ## 3. Bridge editor side
    3.1. `use-signage-bridge.ts` hook:
         - `iframeRef`: pasada al `<iframe ref>`.
         - State `isReady` + `lastAckAt` + `bridgeStatus`
           (`'connecting' | 'connected' | 'stale' | 'lost'`).
         - Listener postMessage: filtra `signage:ready`.
         - `pushClient(client)` y `pushDisplay(display)`: postMessage al iframe
           con type `signage:client-update` / `signage:display-update`.
           Debounce 120ms (mismo patrón que kiosk).
         - `onIframeLoad()` callback que resetea ready + ack + mountAt.
         - `bridgeStatus` derivado:
           - `connecting` si mountedAt <5s sin ack.
           - `connected` si lastAck <5s.
           - `stale` si 5–30s.
           - `lost` >30s o handshake falló.
    3.2. `<PreviewFrame>` cabla el hook:
         - Asigna `iframeRef` al `<iframe>`.
         - Llama `onIframeLoad` en `onLoad` del iframe.
         - Renderiza badge de status en la toolbar (color verde / amber / rojo).
         - Tooltip explica qué significa cada estado.

    ## 4. Wire-up `<DisplayEditor>`
    4.1. `<DisplayEditor>` invoca el hook y pasa `iframeRef` + `onIframeLoad` +
         `bridgeStatus` al `<PreviewFrame>` como props.
    4.2. **DSS3 NO llama pushClient/pushDisplay todavía** — el sidebar es
         read-only. El hook se expone listo para DSS4-5.

    ## 5. Out of scope (DSS4+)
    - Edición real (settings + playlist drag-to-reorder + add slide).
    - pushClient/pushDisplay desde el sidebar a cada change.
    - Save al KV (kvSignageDisplay.setRaw / set).
    - Module editors (DSS5).
  </action>
  <verify>
    - `pnpm typecheck` ✅
    - `pnpm exec eslint` archivos tocados ✅
    - `pnpm kiosk:dev` arranca limpio
    - `/signage/default/lobby-tv` (runtime directo) funciona como antes; `<SignageBridge>` no rompe nada.
    - Console del browser muestra `signage:ready` postMessage emitidos cada 5s.
    - `/studio/digital-displays/default/displays/lobby-tv` (display editor):
      - Iframe carga; tras 1s aprox el badge cambia de "connecting" a "connected" (verde).
      - Si recargas con Reload button, vuelve a "connecting" → "connected".
    - Sin regression del kiosk (`/studio` y `/studio/<slug>`).
  </verify>
  <done>
    - `<SignageBridge>` montado en runtime emitiendo handshake.
    - `useSignageBridge` hook expuesto en el editor con bridgeStatus.
    - `<PreviewFrame>` muestra status badge (connecting/connected/stale/lost).
    - Loader híbrido KV→fs en `loadSignageClient` + `loadSignageDisplay`.
    - DSS3 marcado ✅ en SIGNAGE-ROADMAP.md.
    - Aprobación visual.
  </done>
</task>
```

## Notas de diseño

- **DSS3 valida la INFRAESTRUCTURA**: el bridge funciona end-to-end (handshake
  - push silencioso) pero no hay edición real que pushear. DSS4-5 conectarán
    los formularios → pushClient/pushDisplay del hook.
- **`signage:*` types** mantienen consistencia con el namespace KV. El kiosk
  usa `studio:*` y `kiosk:*`. Por aislamiento de productos, signage usa
  `signage:*`.
- **Heartbeat 5s** vs handshake-once: replica el patrón del kiosk para que
  el editor pueda detectar cuándo el iframe se "cuelga" (ej. crashea el
  template). Si lastAck > 30s → status `lost`.
- **Loader híbrido en DSS3 sin save**: el cambio es defensivo. Cuando DSS5
  introduzca save al KV, el runtime ya estará leyendo desde KV automáticamente
  sin tocar el código del runtime.
- **Store zustand para overrides** (`signage-bridge-store.ts`): patrón
  forward-compat con DSS4-5. El store tiene `clientPatch` y `displayPatch`
  null por default. Cuando DSS5 cablea componentes signage para leer del
  store con fallback a la prop server, los overrides funcionan automáticamente.

## Out of scope explícito

- No introducimos override visual en runtime (DSS4-5).
- No tocamos `<SignageRuntime>` ni los 8 templates.
- No editamos settings ni playlist.
- No persistimos al KV.
- No tocamos el bridge del kiosk.
