# Studio S3.7 — Content tab CRUD masivo

**Fecha:** 2026-04-29
**Milestone:** Kiosk Studio
**Sub-fase:** S3.7
**Estado:** Diseño aprobado por Rubén — pendiente plan de implementación.

## Contexto

S3.1–S3.6 (cerradas 2026-04-29) entregaron los 6 editores de módulo del Studio para Survey, Deals, Photo Booth, Digital Brochure, Social Wall y Guestbook. Cada uno con schema zod, API PATCH dedicada, bridge debounced y backfill defensivo.

Quedan los 5 módulos del kiosk con **catálogos grandes** sin editor en Studio: Listings (Restaurants / Things to Do / Stay), Events, Tickets, Passes, Trails. S3.7 cierra esa carencia entregando los 5 editores en una sola sub-fase, reusando el patrón establecido en S3.1–S3.6.

## Objetivo

Hacer que un cliente del Studio pueda crear/editar/borrar/reordenar items de los 5 catálogos del kiosk con live preview, sin tocar código ni `clients/<slug>/config.json` a mano.

## Scope

### Dentro

1. CRUD por catálogo (crear, editar, borrar, duplicar).
2. Reorder por drag&drop.
3. Búsqueda + filtro básico (texto libre + por categoría).
4. Validación zod por sección + API PATCH unificada.
5. Live preview vía postMessage debounced (120 ms) con re-emit en handshake.
6. Image upload por URL **o** drop de archivo → data URL (cap blando 200 KB/imagen, aviso si excede).
7. Edición de taxonomías (subcategories, features, categories, venues) como listas de strings con validación de uso.
8. Tickets como **wrapper derivado** de events (no edita items individuales — define qué events ticketables se muestran).
9. Backfill defensivo en GET para clientes pre-S3.7.

### Fuera (otras fases)

- Bulk import CSV/JSON → S3.8 dedicada.
- Vercel Blob para imágenes → S5/S6.
- Picker Mapbox visual para lat/lng → S6 Integraciones.
- Edición de strings i18n por item → S4 i18n editor.

## Arquitectura

### Patrón único `<CatalogEditor>`

Composición — no wrapper rígido. Cada uno de los 5 editores compone los mismos primitivos parametrizados por `kind`:

```
<CatalogEditor>
  ├── <TaxonomyEditor />      ← lista de strings drag-reorderable
  ├── <CatalogToolbar />      ← search + add + filter
  └── <CatalogList>           ← items con drag-reorder + accordion expand
       └── <CatalogItemForm /> ← campos específicos del kind (inline al expandir)
</CatalogEditor>
```

**Decisión: inline accordion (no modal)** — consistente con DealsEditor / SocialWallEditor existentes, mantiene el live preview visible mientras editas.

### Sidebar tabs (5 nuevas)

```
12. Listings   (sub-tabs: Restaurants · Things to Do · Stay)
13. Events
14. Tickets
15. Passes
16. Trails
```

Cada tab respeta el `disabled state` heredado de S2 — si su Module toggle está OFF en `02 Modules`, queda bloqueada con candado.

## Componentes

### Schemas zod (`src/lib/studio/schema.ts`)

Se añaden estos schemas al fichero existente:

```ts
ListingItemSchema       // slug, title, image, subcategory, features[],
                        // description, lat, lng, address, hours, price, rating, ...
ListingsCatalogSchema   // label, heroImage, subcategories[], features[], listings[]
ListingsModuleSchema    // { restaurants: ListingsCatalogSchema, thingsToDo: ..., stay: ... }

EventItemSchema         // slug, title, category, image, date, startTime, endTime,
                        // venue, priceMode, priceBand, ticketable, ...
EventsModuleSchema      // label, heroImage, categories[], venues[], events[]

TicketsModuleSchema     // label, heroImage, categories[] (visibles, subset de events),
                        // fallbackHero, copy
                        // (no edita items — derivados de events)

PassItemSchema          // slug, title, image, price, type, qrLogo, ...
PassesModuleSchema      // label, heroImage, passes[]

TrailItemSchema         // slug, title, image, distance, difficulty,
                        // lat, lng, polyline, considerations[], ...
TrailsModuleSchema      // label, heroImage, trails[]
```

`KioskConfigSchema` se extiende con cinco campos opcionales: `listings · events · tickets · passes · trails`. Opcionales para no romper clientes pre-S3.7; el backfill defensivo en GET los rellena con defaults vacíos.

### Editores (`src/app/studio/_components/`)

```
ListingsEditor.tsx     ← compone CatalogEditor 3 veces (sub-tabs Restaurants / Things to Do / Stay)
EventsEditor.tsx       ← CatalogEditor + campos de fecha/hora/venue
TicketsEditor.tsx      ← variante sin item list (sólo taxonomía + copy)
PassesEditor.tsx       ← CatalogEditor con campos de pase/QR
TrailsEditor.tsx       ← CatalogEditor con campos de ruta/considerations

catalog/
  CatalogList.tsx        ← items con dnd-kit reorder + accordion
  CatalogToolbar.tsx     ← search + Add + filter por categoría
  CatalogItemForm.tsx    ← form genérico, recibe field config por prop
  TaxonomyEditor.tsx     ← lista de strings + Add + edit inline + delete con warning de uso
  ImageUrlField.tsx      ← input URL + dropzone → data URL (cap 200 KB)
  LatLngField.tsx        ← 2 inputs numéricos + botón "Open in Maps"
```

### API (`src/app/api/studio/configs/[slug]/route.ts`)

El handler PATCH actual ya acepta una unión discriminada de secciones. Se extiende añadiendo 5 keys al validator:

```ts
const PatchBodySchema = z.object({
  branding: BrandingSchema.partial().optional(),
  modules: ModulesSchema.optional(),
  // ... existing
  listings: ListingsModuleSchema.optional(),
  events: EventsModuleSchema.optional(),
  tickets: TicketsModuleSchema.optional(),
  passes: PassesModuleSchema.optional(),
  trails: TrailsModuleSchema.optional(),
});
```

GET extiende el backfill defensivo:

```ts
listings: cfg.listings ?? defaultListings(),
events:   cfg.events   ?? defaultEvents(),
tickets:  cfg.tickets  ?? defaultTickets(),
passes:   cfg.passes   ?? defaultPasses(),
trails:   cfg.trails   ?? defaultTrails(),
```

### Bridge (`src/lib/studio/bridge.ts` + `StudioBridge.tsx`)

Cinco message types nuevos:

```
studio:listings-update
studio:events-update
studio:tickets-update
studio:passes-update
studio:trails-update
```

Cada uno: debounce 120 ms en envío, re-emit en handshake `studio:ready`.

En el lado kiosk runtime, `StudioBridge.tsx` (montado en `layout (kiosk)`) escucha los 5 messages y aplica overrides via un `StudioOverrideProvider` (React context) que envuelve la rama `home/[module]`. Los componentes existentes (`PassesModule`, `TicketsModule`, etc.) ya reciben `module` por prop — el override intercepta antes del render server-side fallback.

## Data flow

```
Studio editor → useBrandStorage().set(...)
              → use-preview-bridge debounced 120ms
              → postMessage(studio:<kind>-update)
              → iframe StudioBridge listener
              → StudioOverrideProvider context update
              → módulo del kiosk re-renderiza con override

Save (Cmd+S) → PATCH /api/studio/configs/[slug] body { listings, events, ... }
            → zod validation por sección
            → KV write
            → savedSnapshot ← current
```

## Imágenes

`<ImageUrlField />` — dos modos en el mismo control:

1. Input de URL (validación: empieza con `http(s)://` o `data:image/`).
2. Dropzone (drag&drop o click → file picker) que convierte a data URL.

Cap blando: 200 KB por imagen. Si excede, warning visible: `"Image too large (X KB). Limit is 200 KB to keep config under KV cap. Consider hosting externally."` — no bloquea, sólo avisa.

## Geocoding

`<LatLngField />` — dos inputs numéricos `step="0.000001"` lado a lado con validación `[-90, 90]` / `[-180, 180]`. Botón secundario `"Open in Maps"` que abre `https://maps.google.com/?q={lat},{lng}` en nueva tab para verificar visualmente. Picker Mapbox queda para S6.

## Taxonomías editables

`<TaxonomyEditor label="Subcategories" />` — lista drag-reorderable de strings:

- `[+ Add]` botón inferior.
- Edit inline al click (input se enfoca, blur guarda).
- Delete con icono X.
- Si borrás una taxonomía en uso por N items, modal de confirmación: `"3 items use this subcategory. Reassign to: [dropdown] / Cancel / Delete anyway"`.

## Tickets — wrapper derivado

El kiosk ya deriva tickets de events ticketables. El `TicketsEditor` por tanto **no edita items individuales** — sólo configura el wrapper:

- `label`, `heroImage`, `copy` (free-form strings).
- `categories[]`: subset de `events.categories` que muestra como tabs ticketables.
- `fallbackHero`: imagen para events sin hero propio.

UI: igual que un editor "fino" tipo SocialWallEditor pero más corto. Sin `<CatalogList>` — sólo metadatos + taxonomy chips para `categories`.

## Backfill defensivo

`GET /api/studio/configs/[slug]` ya hace backfill de S2/S3.x. Se añaden defaults vacíos para los 5 módulos nuevos en `defaultListings()`, `defaultEvents()`, `defaultTickets()`, `defaultPasses()`, `defaultTrails()`.

Estructura mínima por catálogo (ejemplo Listings):

```ts
{
  restaurants: {
    label: 'Restaurants',
    heroImage: '',
    subcategories: [],
    features: [],
    listings: [],
  },
  thingsToDo: { /* ... */ },
  stay:       { /* ... */ },
}
```

## Casos edge

- **Cliente pre-S3.7 abre Studio**: GET aplica defaults vacíos; sidebar tabs aparecen pero los catálogos están vacíos (estado "Add your first item" en cada uno).
- **Imagen > 200 KB**: warning visible, save permitido. Si excede 480 KB total del config, el PATCH responde 413 con mensaje claro.
- **Borrar taxonomía en uso**: modal de confirmación con conteo + opción de reasignar.
- **Slug duplicado dentro de un catálogo**: validation zod rechaza con error per-field "Slug already exists in this catalog".
- **Reorder durante save**: `useBrandStorage` ya maneja race condition (último write gana, optimistic UI).
- **Toggle del Module OFF mientras editás**: tab del sidebar pasa a disabled, switch automático a `02 Modules` (ya implementado en S2).

## Out of scope (registro explícito)

| Feature | Fase futura |
|---|---|
| Bulk import CSV/JSON | S3.8 |
| Vercel Blob para imágenes | S5/S6 |
| Picker Mapbox visual | S6 Integraciones |
| Edición i18n por item | S4 i18n editor |
| Galería de imágenes reusable por cliente | S5/S6 |
| Versioning/diff por item | S7 publish flow |

## Verificación

E2E al cierre de S3.7:

- [ ] Abrir `/studio/default` → 5 tabs nuevas visibles después de Guestbook.
- [ ] Crear listing nuevo en Restaurants → aparece en grid del kiosk en <300 ms.
- [ ] Reorder de eventos en Events → orden refleja en week strip del kiosk.
- [ ] Add taxonomy `'Vegan'` en Listings → chip disponible en filter overlay.
- [ ] Borrar pase con QR custom → confirma + desaparece de PassesModule.
- [ ] Cmd+S → PATCH manda sólo secciones sucias → reload conserva.
- [ ] Cliente nuevo (vía S0 modal cuando esté lista) → seed con catálogos vacíos sin errores.
- [ ] Toggle Tickets OFF en Modules → tab Tickets gris + lock icon + tickets desaparecen del kiosk.
- [ ] Imagen 250 KB → warning, save permitido. Imagen 600 KB en config total → PATCH 413.
- [ ] `pnpm check` (typecheck + lint + format) limpio.
- [ ] auditor-white-label sin hallazgos.

## Riesgos

- **Cap KV 512 KB**: 5 catálogos × 50 items × imagen base64 → puede saturar. Mitigación: cap blando 200 KB/imagen + recomendar URLs externas. Solución real en S5/S6 (Vercel Blob).
- **Tamaño de la sub-fase**: 5 editores + framework compartido es grande. Mitigación: el plan XML se desglosa en tareas atómicas por catálogo; cada una testeable independiente.
- **Tickets derivado**: si en runtime hay races entre `events-update` y `tickets-update` postMessage, el kiosk puede ver tickets sin events. Mitigación: el listener kiosk re-deriva tickets en cada update de events o tickets.

## Archivos afectados (estimación)

```
+ src/app/studio/_components/ListingsEditor.tsx
+ src/app/studio/_components/EventsEditor.tsx
+ src/app/studio/_components/TicketsEditor.tsx
+ src/app/studio/_components/PassesEditor.tsx
+ src/app/studio/_components/TrailsEditor.tsx
+ src/app/studio/_components/catalog/CatalogList.tsx
+ src/app/studio/_components/catalog/CatalogToolbar.tsx
+ src/app/studio/_components/catalog/CatalogItemForm.tsx
+ src/app/studio/_components/catalog/TaxonomyEditor.tsx
+ src/app/studio/_components/catalog/ImageUrlField.tsx
+ src/app/studio/_components/catalog/LatLngField.tsx
~ src/lib/studio/schema.ts                          (extend)
~ src/lib/studio/bridge.ts                          (extend)
~ src/app/studio/_components/SidebarTabs.tsx        (5 tabs nuevas)
~ src/app/studio/_components/EditorPanel.tsx        (5 cases nuevos)
~ src/app/api/studio/configs/[slug]/route.ts        (PATCH validators + GET backfill)
~ src/app/(kiosk)/layout.tsx (o donde monte StudioBridge)  (5 listeners nuevos)
+ src/components/studio-override-provider.tsx        (kiosk-side context wrapper)
~ src/app/(kiosk)/home/[module]/page.tsx             (consumir StudioOverrideProvider)
```

## Próximo paso

Plan XML atómico en `.planning/S3-7-PLAN.md` siguiendo el formato GSD del proyecto, desglosado en tareas testeables por catálogo + framework compartido.
