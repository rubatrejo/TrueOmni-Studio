# DSS0-SUMMARY.md — Bootstrap Signage Studio

**Fecha:** 2026-05-07
**Estado:** ✅ aprobado visualmente

## Hecho

### 1. Activación del producto en el dropdown

- `STUDIO_PRODUCTS['digital-displays']` pasa de `status: 'soon'` (con
  comingSoonCopy + features) a `status: 'live'`. El `<ProductDropdown>` en el
  header del Studio ahora muestra "Digital Displays" sin punto ámbar y navega a
  `/studio/digital-displays`.

### 2. Listing helpers fs-only

- `src/lib/signage/config.ts` exporta:
  - `listSignageClients(): SignageClientListEntry[]` — escanea
    `clients-signage/*` (excluyendo `_template`/dotfiles), lee `client.json` de
    cada slug, retorna `{ slug, name, displaysCount }`.
  - `listSignageDisplays(slug): SignageDisplayListEntry[]` — escanea
    `clients-signage/<slug>/displays/*`, lee `display.json` de cada display,
    retorna `{ slug, name, slidesCount }`.
- Ambos cacheados con `cache()` por petición. Errores de parse skippean el
  cliente/display sin tirar la página.

### 3. Página única `/studio/digital-displays`

- Server component (force-dynamic) carga clients + sus displays en paralelo.
- Sin sub-URLs: cada signage theme se gestiona desde esta única página.
  El click en una card abre el primer display del theme en una nueva pestaña
  (preview directo del runtime).
- `<ClientsDashboard>` (client) renderiza shell del Studio
  (`<StudioPageHeader>`) + hero "Run scheduled content on lobby TVs" + banner
  ámbar "Editor coming soon (DSS1+)" + grid de cards.

### 4. Card visual consistente con el kiosk

- Replica EXACTA del `ClientCard` de `/studio` (kiosk dashboard):
  - `rounded-2xl border border-zinc-200 bg-white shadow-sm`.
  - Hero `h-40 w-full` con gradient brand del signage (`--signage-brand-primary`
    → variant más claro), 2 blobs blur decorativos.
  - Logo TrueOmni si `slug === 'default'`, sino `client.name` uppercase.
  - Top-right: badge "X displays" con icono `Monitor`.
  - Bottom-left: pill slug en mono.
  - Body `p-5`: nombre + pill `signage` + footer "Preview lobby-tv ↗".
  - Hover: `-translate-y-0.5` + `border-zinc-300` + `shadow-md`. Línea
    inferior animada con gradient sky-400 (idéntica al kiosk).
- Click abre `/signage/<slug>/<firstDisplay>` en nueva tab. Si el theme no
  tiene displays, la card queda visualmente disabled (no es link).

### 5. Layout dedicado para inyectar tokens signage

- `src/app/studio/digital-displays/layout.tsx` (NUEVO) carga
  `clients-signage/default/tokens.css` server-side y lo inyecta en un `<style>`
  scoped al wrapper `[data-signage-studio-scope]`. Permite que las CSS vars
  `--signage-*` resuelvan en el dashboard sin contaminar el resto del Studio.
- Patrón forward-compatible: cuando DSS1+ traiga branding per-theme, el layout
  cargará el tokens del theme activo dinámicamente.

### 6. KV namespace `signage:*` listo (sin cablear runtime)

- `src/lib/signage/kv-store.ts` (NUEVO) — wrappers thin sobre
  `src/lib/studio/kv.ts` usando keys de `kv-keys.ts`:
  - `kvSignageClient.{list, addToList, removeFromList, get, set, delete}`
  - `kvSignageDisplay.{get, set, setRaw, getRaw, delete}`
- Validación Zod en `get()` con `safeParse` (devuelve null si shape inválido).
- **NO se cablea desde el runtime todavía**. `loadSignageClient` y
  `loadSignageDisplay` siguen fs-only. DSS3 introducirá el bridge
  editor↔preview con lectura híbrida KV→fs.

## Archivos tocados

| Archivo                                                            | Tipo                                                |
| ------------------------------------------------------------------ | --------------------------------------------------- |
| `src/app/studio/_lib/products.ts`                                  | digital-displays: soon → live                       |
| `src/app/studio/digital-displays/page.tsx`                         | reemplazo (era ComingSoon placeholder)              |
| `src/app/studio/digital-displays/layout.tsx`                       | NUEVO                                               |
| `src/app/studio/digital-displays/_components/ClientsDashboard.tsx` | NUEVO                                               |
| `src/lib/signage/config.ts`                                        | export `listSignageClients` + `listSignageDisplays` |
| `src/lib/signage/kv-store.ts`                                      | NUEVO                                               |
| `.planning/DSS0-PLAN.md`                                           | NUEVO                                               |
| `.planning/DSS0-SUMMARY.md`                                        | NUEVO                                               |

## Verificado

- `pnpm typecheck` ✅ limpio.
- `pnpm exec eslint` archivos tocados ✅.
- `pnpm kiosk:dev` arranca limpio.
- `/studio` (kiosks) sigue funcional, dropdown muestra "Digital Displays" sin punto ámbar.
- `/studio/digital-displays` carga el dashboard con 1 card "Default Signage Client" consistente visualmente con kiosk cards.
- Click en card abre `/signage/default/lobby-tv` en nueva pestaña con runtime live.
- Cero regression del kiosk (`/`) ni del runtime signage.
- Aprobación visual de Rubén ✅.

## Decisiones

- **Sin sub-URLs en DSS0**: cada signage theme se gestiona desde
  `/studio/digital-displays` único (decisión del usuario durante review). El
  click en card abre el primer display directo en nueva tab. Cuando DSS1+
  implemente el editor real, **se reintroducirá** `/studio/digital-displays/<slug>`
  como editor del theme (no como sub-listing).
- **Card identical to kiosk**: replicar el `ClientCard` del kiosk garantiza
  consistencia visual cross-product. Los signage themes y los kiosk clients se
  ven y se sienten iguales en el Studio.
- **Layout inyecta tokens default**: en DSS0 todos los signage themes muestran
  el mismo gradient (todavía no hay branding per-theme). DSS1+ introducirá un
  loader dinámico por slug en el editor.
- **KV namespace listo pero no cableado**: el wrapper `kv-store.ts` queda
  exportado y testeable, pero el runtime sigue siendo fs-only. Esto desbloquea
  DSS3 (bridge) sin que DSS0 tenga que rediseñar las claves después.
- **Removido el `comingSoonCopy` de digital-displays**: ya no es soon. Si
  retomamos un placeholder de marketing, sería en otra página.

## Pendiente / siguiente sub-fase

**DSS1** — Client view tabs (Branding · Header · Displays · Versions · Publish).
Reintroduce `/studio/digital-displays/<slug>` como editor del theme con tabs.
Click en card del dashboard ahora navega al editor en lugar de abrir preview.
"Preview" pasa a ser un botón explícito en el header del editor.
