# DSS0-PLAN.md — Bootstrap Signage Studio

Atomic plan ejecutable en sesión fresca. **Primera sub-fase del Milestone
Signage Studio.** Cablea la entrada al editor signage en el Studio: dropdown
header activo, rutas `/studio/digital-displays/...`, clients dashboard,
display detail page, y prepara el namespace KV `signage:*` (sin cablearlo
runtime todavía — DSS3 lo activa).

```xml
<task type="auto">
  <name>DSS0 — Activar Digital Displays en Studio: dropdown live + clients dashboard + display detail + KV namespace listo</name>
  <files>
    src/app/studio/_lib/products.ts                               (status: 'soon' → 'live' para digital-displays)
    src/app/studio/digital-displays/page.tsx                      (NUEVO — clients dashboard signage)
    src/app/studio/digital-displays/[slug]/page.tsx               (NUEVO — display detail page)
    src/app/studio/digital-displays/_components/ClientsDashboard.tsx  (NUEVO — UI client list signage)
    src/app/studio/digital-displays/_components/DisplaysList.tsx       (NUEVO — UI displays list)
    src/lib/signage/config.ts                                     (export listSignageClients + listSignageDisplays)
    src/lib/signage/kv-store.ts                                   (NUEVO — wrappers KV namespace signage:* sin cablear aún)
    .planning/DSS0-SUMMARY.md
    .planning/SIGNAGE-ROADMAP.md
  </files>
  <action>
    ## 1. Activar Digital Displays en el dropdown
    1.1. `STUDIO_PRODUCTS['digital-displays'].status: 'soon' → 'live'`. El href ya
         apunta a `/studio/digital-displays`.

    ## 2. Listing helpers en signage/config.ts (server-only)
    2.1. `listSignageClients(): Promise<SignageClientListEntry[]>`
         - Lee subdirs de `clients-signage/` (excluyendo `_template`).
         - Para cada slug: lee `client.json` → name, displays count.
         - Retorna `{ slug, name, displaysCount }[]`.
         - Usa `node:fs/promises` + `cache()`.
    2.2. `listSignageDisplays(slug): Promise<SignageDisplayListEntry[]>`
         - Lee subdirs de `clients-signage/<slug>/displays/` (excluyendo `_template`).
         - Para cada display slug: lee `display.json` → name, slidesCount.
         - Retorna `{ slug, name, slidesCount }[]`.

    ## 3. Clients dashboard `/studio/digital-displays`
    3.1. Server component. Llama `listSignageClients()`. Renderiza:
         - StudioPageHeader con ProductDropdown (heredado del shell del Studio).
         - Lista de cards estilo del Kiosks dashboard (mimetizar
           `studio/page.tsx`): cada card muestra slug + name + displaysCount +
           "Preview default" link → `/signage/<slug>/<display>`.
         - Banner informativo: "Display editor en DSS1+. Por ahora puedes
           navegar a cada cliente y previsualizar sus displays."
         - Empty state estándar si no hay clients (no aplica con default).
    3.2. Client component `<ClientsDashboard>` para la UI interactiva:
         - Lista cards.
         - Botón "Preview" abre `/signage/<slug>/<display>` en nueva tab
           (`window.open(...)`).

    ## 4. Display detail page `/studio/digital-displays/[slug]`
    4.1. Server component. Carga `loadSignageClient(slug)` + `listSignageDisplays(slug)`.
         Si client no existe → notFound().
    4.2. Renderiza:
         - Breadcrumb: "Digital Displays › <client.name>".
         - Lista cards de displays: slug + name + slidesCount + "Preview"
           link → `/signage/<slug>/<display>`.
         - Banner: "Editor del display en DSS2+. Por ahora preview only."
    4.3. Client component `<DisplaysList>` para la UI.

    ## 5. KV namespace signage:* preparado (sin cablear runtime)
    5.1. `src/lib/signage/kv-store.ts` (server-only):
         - Wrappers thin sobre `src/lib/studio/kv.ts` usando keys de `kv-keys.ts`:
           - `kvSignageClient.list()` → string[]
           - `kvSignageClient.get(slug)` → SignageClientFile | null
           - `kvSignageClient.set(slug, data)` → void
           - `kvSignageDisplay.get(client, display)` / `set(...)` / `list(client)`.
         - Solo se exporta el helper. NO se llama desde runtime — DSS3 lo cablea.

    ## 6. NO cableamos KV runtime todavía
    6.1. `loadSignageClient` y `loadSignageDisplay` siguen fs-only. La página
         `/signage/<client>/<display>` no cambia. DSS3 introduce el bridge
         editor↔preview con KV.

    ## 7. NO tocamos:
    - API routes /api/studio/signage/* — DSS1+ las añade cuando haya editor real.
    - Bridge use-preview-bridge — DSS3.
    - NewClientModal de signage — DSS1.
  </action>
  <verify>
    - `pnpm typecheck` ✅
    - `pnpm exec eslint` archivos tocados ✅
    - `pnpm kiosk:dev` arranca limpio
    - `/studio` (kiosks dashboard) sigue funcional, dropdown muestra Digital Displays sin punto ámbar (status live).
    - `/studio/digital-displays` carga el clients dashboard con `default` listado.
    - `/studio/digital-displays/default` carga la lista de displays con `lobby-tv`.
    - "Preview" abre `/signage/default/lobby-tv` con rotación normal.
    - Cero regression del kiosk (`/`) ni del runtime signage.
  </verify>
  <done>
    - Dropdown muestra Digital Displays como producto live.
    - 2 nuevas rutas Studio funcionando.
    - 1 nuevo helper KV exportado pero no cableado.
    - listSignageClients + listSignageDisplays exportados.
    - DSS0 marcado ✅ en SIGNAGE-ROADMAP.md.
  </done>
</task>
```

## Notas de diseño

- **No-touch en signage NO aplica al Studio**: el editor signage SÍ tiene
  interactividad (clicks, forms). Solo el `/signage/<client>/<display>` runtime
  es no-touch. Esta distinción es importante: el editor reusará primitivas
  `Field/TextInput/...` del Studio.
- **fs-only en DSS0**: el editor todavía no escribe nada. Solo previsualiza.
  KV namespace queda listo para DSS3.
- **Reuso del shell del Studio**: la página `/studio/digital-displays`
  hereda el ProductDropdown automáticamente porque está bajo `studio/layout.tsx`.
  No hay que duplicar el header.
- **Server components + client components separados**: las páginas son server
  para cargar datos (fs); la UI interactiva es client (`<ClientsDashboard>`,
  `<DisplaysList>`). Patrón estándar Next 15 App Router.
- **No bloquear con datos pesados**: `listSignageClients` solo lee
  `client.json` (no events/social/news), por eso es rápido.

## Out of scope (DSS1+)

- DSS1: Client view tabs (Branding · Header · Displays · Versions · Publish).
- DSS2: Display editor (sidebar + preview iframe).
- DSS3: Bridge `signage:*` events live preview (cablear KV runtime).
- DSS4: Playlist editor (drag-to-reorder + Add slide wizard + dayparting popover).
- DSS5: Module editors (6 forms).
- DSS6: Snapshots / Versions.
- DSS7: Publish (GitHub PR auto-merge) + JSON export/import.
- DSS8: Diagnostics + onboarding tour signage.
- DSS9: Smoke E2E producción.
