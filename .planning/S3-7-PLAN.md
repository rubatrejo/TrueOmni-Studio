# S3-7 — Content tab CRUD masivo (Studio)

> Editores visuales para los 5 catálogos del kiosk (Listings, Events, Tickets,
> Passes, Trails). CRUD + reorder + taxonomías + imágenes (URL o data URL) +
> live preview en iframe del kiosk. Spec: `docs/superpowers/specs/2026-04-29-studio-s3-7-content-tab-design.md`.

**Goal:** un cliente del Studio crea/edita/borra/reordena items de los 5 catálogos sin tocar código ni `clients/<slug>/config.json` a mano.

**Architecture:** patrón compositivo `<CatalogEditor>` (no wrapper rígido) — los 5 editores reusan 6 primitivos (`TaxonomyEditor`, `ImageUrlField`, `LatLngField`, `CatalogList`, `CatalogToolbar`, `CatalogItemForm`). Cada editor parametriza los primitivos con su `kind`. Misma fachada zod + API PATCH + bridge debounced + backfill defensivo que S3.1–S3.6.

**Tech stack:** Next.js 15, TypeScript estricto, zod, dnd-kit (drag-reorder existente), postMessage, Upstash KV.

---

## Tasks

<task type="auto">
  <name>Schemas zod + types + defaults para los 5 módulos</name>
  <files>src/lib/studio/schema.ts</files>
  <action>
    Replicar tipos del kiosk runtime (`HomeListingsModule`, `HomeEventsModule`,
    `HomeTicketsModule`, `HomePassesModule`, `HomeTrailsModule`,
    `HomeGuestbookModule` etc. en `src/lib/config.ts`) como schemas zod:

    - `ListingItemSchema` (slug, title, image, subcategory, features[],
      description, lat, lng, address, hours, price, rating).
    - `ListingsCatalogSchema` (label, heroImage, subcategories[], features[],
      listings: ListingItemSchema[]).
    - `ListingsModuleSchema` ({ restaurants, thingsToDo, stay } cada uno
      ListingsCatalogSchema).
    - `EventItemSchema` (slug, title, category, image, date `YYYY-MM-DD`,
      startTime/endTime `HH:MM`, venue, priceMode 'free'|'paid', priceBand 1|2|3|4,
      ticketable boolean, description).
    - `EventsModuleSchema` (label, heroImage, categories[], venues[],
      events: EventItemSchema[]).
    - `TicketsModuleSchema` (label, heroImage, categories[], fallbackHero,
      copy — sin items, derivados de events).
    - `PassItemSchema` (slug, title, image, price, type, description, qrLogo).
    - `PassesModuleSchema` (label, heroImage, passes: PassItemSchema[]).
    - `TrailItemSchema` (slug, title, image, distance, difficulty 'easy'|'moderate'|'hard',
      lat, lng, polyline, considerations: string[], description).
    - `TrailsModuleSchema` (label, heroImage, trails: TrailItemSchema[]).

    Validación de slug: `/^[a-z0-9-]+$/` con `.refine` que verifica unicidad
    dentro del array padre (refine a nivel del catálogo).

    Extender `KioskConfigSchema` con: `listings?, events?, tickets?, passes?, trails?`
    todas opcionales.

    Exportar 5 factories `defaultListings()`, `defaultEvents()`, `defaultTickets()`,
    `defaultPasses()`, `defaultTrails()` que devuelven la estructura mínima
    vacía (label en inglés por defecto, heroImage `''`, arrays vacíos).

    Extender `makeBlankConfig()` para incluir las 5 secciones nuevas vía structuredClone
    de los defaults.

    Type exports: `ListingItem`, `EventItem`, `PassItem`, `TrailItem`, etc. para
    consumo desde editores.
  </action>
</task>

<task type="auto">
  <name>API PATCH/GET extendido con backfill defensivo</name>
  <files>
    src/app/api/studio/configs/[slug]/route.ts,
    src/app/studio/[slug]/page.tsx
  </files>
  <action>
    En `route.ts` extender el `PatchBodySchema` añadiendo 5 keys opcionales:
    `listings, events, tickets, passes, trails` con sus respectivos schemas.
    El handler PATCH ya hace `merge` por sección — sólo añadir los 5 cases
    al spread.

    Backfill en GET: tras leer KV, si `cfg.listings === undefined` → asignar
    `defaultListings()`, idem para los otros 4. Importante: **mutar antes de
    devolver** para que el cliente recibe shape completo (no sólo si fueron
    creados pre-S3.7 — también si KV se corrompió).

    En `studio/[slug]/page.tsx` (server component que carga cfg para el
    cliente component) hacer el mismo backfill: si no llegan, asignar defaults
    antes de pasar al `Shell`. Replicar patrón S3.1–S3.6 (ya hace backfill de
    survey/deals/photoBooth/brochures/socialWall/guestbook).

    Cap de tamaño: si `JSON.stringify(body).length > 480_000` (480 KB),
    PATCH responde 413 con `{ error: 'Config too large for KV (cap 512KB).
    Reduce image sizes or use external URLs.' }`.
  </action>
</task>

<task type="auto">
  <name>Bridge: 5 message types + push helpers debounced</name>
  <files>
    src/app/studio/_lib/use-preview-bridge.ts,
    src/components/studio-bridge.tsx
  </files>
  <action>
    En `use-preview-bridge.ts` añadir 5 push helpers debounced 120ms (mismo
    patrón que `pushSurvey`, `pushDeals`, etc.):

    - `pushListings(listings)` → postMessage `{ type: 'studio:listings-update', payload }`.
    - `pushEvents(events)` → idem `studio:events-update`.
    - `pushTickets(tickets)` → idem `studio:tickets-update`.
    - `pushPasses(passes)` → idem `studio:passes-update`.
    - `pushTrails(trails)` → idem `studio:trails-update`.

    Re-emit los 5 en el handshake `studio:ready` (mismo patrón existente).

    En `studio-bridge.tsx` (kiosk side) añadir 5 listeners que dispatchan
    eventos custom al `window` del kiosk:

    - `studio:listings-update` → `window.dispatchEvent(new CustomEvent('kiosk:listings-override', { detail }))`.
    - Idem para events, tickets, passes, trails.

    Añadir tipado discriminado en `BridgeMessage` para que TypeScript valide
    los 5 nuevos types.
  </action>
</task>

<task type="auto">
  <name>StudioOverrideProvider + integración en home/[module]</name>
  <files>
    src/components/studio-override-provider.tsx,
    src/app/(kiosk)/home/[module]/page.tsx,
    src/app/(kiosk)/home/[module]/[slug]/page.tsx
  </files>
  <action>
    Crear `StudioOverrideProvider` (client component) que mantiene state
    para los 5 módulos override (`listings`, `events`, `tickets`, `passes`,
    `trails`). Escucha los 5 eventos `kiosk:*-override` del window y
    actualiza el state.

    Hook `useStudioOverride<T>(moduleKey, fallback): T` — si hay override
    para `moduleKey` lo devuelve, si no el `fallback` (server config).

    En `home/[module]/page.tsx` (server component) seguir leyendo `home.modules[module]`
    como fallback. Wrappear el render con un client component que use
    `useStudioOverride(module, serverFallback)` para los 5 kinds (listings,
    events, tickets, passes, trails). Para los otros kinds (passes, deals,
    etc. ya manejados por StudioBridge en S3.x) no tocar.

    En `home/[module]/[slug]/page.tsx` mismo patrón — el detail page debe
    leer del override si está activo.

    Verificación: el provider sólo se monta cuando `window.parent !== window`
    (estamos en iframe) — en producción el cliente no paga el coste.
  </action>
</task>

<task type="auto">
  <name>Catalog primitives leaves: TaxonomyEditor, ImageUrlField, LatLngField</name>
  <files>
    src/app/studio/_components/catalog/TaxonomyEditor.tsx,
    src/app/studio/_components/catalog/ImageUrlField.tsx,
    src/app/studio/_components/catalog/LatLngField.tsx
  </files>
  <action>
    `TaxonomyEditor`: props `{ label, items: string[], onChange, getUsage?:
    (item) => number }`. Lista drag-reorderable (dnd-kit). Cada string editable
    inline (input que se muestra al click, blur guarda). Botón `+ Add` abajo.
    Delete con icono X — si `getUsage(item) > 0`, modal de confirmación
    `"N items use this. Reassign to: [select / Cancel / Delete anyway]"`.

    `ImageUrlField`: props `{ label, value, onChange, helpText? }`. Input de
    URL (validación: `/^(https?:\/\/|data:image\/)/`) + dropzone (drag&drop o
    click → file picker → FileReader → data URL). Cap blando 200_000 bytes:
    si `dataUrl.length > 200_000`, warning visible (no bloquea). Preview
    thumbnail 80×80 si hay value.

    `LatLngField`: props `{ value: { lat, lng }, onChange }`. Dos inputs
    numéricos `step="0.000001"` con validación `[-90,90]` / `[-180,180]`.
    Botón "Open in Maps" → `window.open('https://maps.google.com/?q=' + lat + ',' + lng)`.

    Los 3 componentes consumen tokens del Studio CSS — cero hex hardcoded.
  </action>
</task>

<task type="auto">
  <name>Catalog primitives main: CatalogToolbar, CatalogList, CatalogItemForm</name>
  <files>
    src/app/studio/_components/catalog/CatalogToolbar.tsx,
    src/app/studio/_components/catalog/CatalogList.tsx,
    src/app/studio/_components/catalog/CatalogItemForm.tsx
  </files>
  <action>
    `CatalogToolbar`: props `{ search, onSearchChange, onAdd, filter?, onFilterChange?, filterOptions? }`.
    Search input + Add button + dropdown filter opcional. Layout horizontal flex.

    `CatalogList<T extends { slug: string }>`: props `{ items: T[], onChange,
    onSelect, selectedSlug, renderRow, renderForm }`. dnd-kit reorder vertical.
    Cada item: row colapsada (renderRow recibe item, devuelve nodo compacto)
    con icono drag handle, chevron expand, delete. Al expandir, debajo del
    row aparece `renderForm(item, onItemChange)` (el form específico del kind).

    Al expandir un item, los otros se colapsan (single-expanded mode). El
    parent decide qué item está seleccionado vía `selectedSlug`.

    `CatalogItemForm`: helper genérico que recibe `{ item, fields, onChange }`.
    `fields` es array de field configs:
    `{ key, label, kind: 'text' | 'textarea' | 'number' | 'image' | 'latlng' |
       'select' | 'taxonomy-pick', options? }`.
    Renderiza el campo correcto. Para `'image'` usa `ImageUrlField`, para
    `'latlng'` usa `LatLngField`, etc.

    Convención de slugs: si el usuario crea un item nuevo, `slug` se genera
    desde `title` con `kebab-case(title)`. Si edita el title, ofrecer botón
    "Sync slug" (no auto-rename — los favoritos del kiosk persisten por slug).
  </action>
</task>

<task type="auto">
  <name>ListingsEditor (3 sub-tabs: Restaurants, Things to Do, Stay)</name>
  <files>
    src/app/studio/_components/ListingsEditor.tsx
  </files>
  <action>
    Componente con tabs internas (3): Restaurants / Things to Do / Stay.
    State: tab activa local (default 'restaurants').

    Props: `{ value: ListingsModule, onChange }`.

    Por sub-tab compone:

    1. `<ImageUrlField label="Hero image" value={catalog.heroImage} ... />`
    2. `<TaxonomyEditor label="Subcategories" items={catalog.subcategories} ...
        getUsage={item => catalog.listings.filter(l => l.subcategory === item).length} />`
    3. `<TaxonomyEditor label="Features" items={catalog.features} ...
        getUsage={item => catalog.listings.filter(l => l.features.includes(item)).length} />`
    4. `<CatalogToolbar search={...} onAdd={() => addListing()} filter />`
    5. `<CatalogList items={catalog.listings} renderRow={...} renderForm={...} />`

    `renderRow(listing)`: thumbnail 60×60 + title + subcategory chip + features count.

    `renderForm(listing)`: `<CatalogItemForm fields=[
      { key: 'title', kind: 'text' },
      { key: 'slug', kind: 'text', helpText: 'Sync from title' },
      { key: 'image', kind: 'image' },
      { key: 'subcategory', kind: 'taxonomy-pick', options: catalog.subcategories },
      { key: 'features', kind: 'taxonomy-pick', options: catalog.features, multiple: true },
      { key: 'description', kind: 'textarea' },
      { key: 'address', kind: 'text' },
      { key: 'hours', kind: 'text' },
      { key: 'price', kind: 'text' },
      { key: 'rating', kind: 'number' },
      { key: 'lat,lng', kind: 'latlng' },
    ] />`

    `addListing()`: nuevo item con slug `'new-listing-' + Date.now()`, title
    `'Untitled'`, demás campos vacíos.

    Llama `onChange(updatedListingsModule)` en cada mutation.
  </action>
</task>

<task type="auto">
  <name>EventsEditor</name>
  <files>
    src/app/studio/_components/EventsEditor.tsx
  </files>
  <action>
    Props: `{ value: EventsModule, onChange }`.

    Compone:

    1. `<ImageUrlField label="Hero image" />`
    2. `<TaxonomyEditor label="Categories" items={value.categories}
        getUsage={c => value.events.filter(e => e.category === c).length} />`
    3. `<TaxonomyEditor label="Venues" items={value.venues}
        getUsage={v => value.events.filter(e => e.venue === v).length} />`
    4. `<CatalogToolbar search onAdd filter={byCategory} />`
    5. `<CatalogList items={value.events} renderRow={...} renderForm={...} />`

    `renderRow(event)`: thumbnail 60×60 + title + date + venue + chip
    `category` + chip `priceMode`.

    `renderForm(event)`: fields:
    - title (text), slug (text), image (image)
    - category (taxonomy-pick from categories)
    - date (text con type=date), startTime, endTime (text con type=time)
    - venue (taxonomy-pick from venues)
    - priceMode (select: free / paid)
    - priceBand (select 1/2/3/4, sólo si priceMode=paid)
    - ticketable (checkbox)
    - description (textarea)

    Order: la lista soporta drag-reorder pero también añadir un sort secundario
    "Sort by date asc" toggle en el toolbar (no destructivo — solo afecta
    visualización del editor; el orden persiste).
  </action>
</task>

<task type="auto">
  <name>TicketsEditor (wrapper, sin item list)</name>
  <files>
    src/app/studio/_components/TicketsEditor.tsx
  </files>
  <action>
    Props: `{ value: TicketsModule, eventsValue: EventsModule, onChange }`.

    Variante "fina" — sin `<CatalogList>`. Compone:

    1. `<TextInput label="Module label" value={value.label} />`
    2. `<ImageUrlField label="Hero image" />`
    3. `<ImageUrlField label="Fallback hero (events sin imagen propia)" />`
    4. `<TextArea label="Copy" value={value.copy} />` (string libre).
    5. `<TaxonomyEditor label="Visible categories" items={value.categories}
        availableOptions={eventsValue.categories.filter(c =>
          eventsValue.events.some(e => e.category === c && e.priceMode === 'paid'))}
        />`

    El `availableOptions` es nuevo en TaxonomyEditor — si está presente, en
    lugar de `+ Add` muestra un dropdown con las opciones disponibles.
    Modificar `TaxonomyEditor` para soportar este modo (mantener compat con
    el modo libre).

    Al final: panel informativo con conteo de tickets visibles (derivado live):
    `"X tickets visible across N categories"`.
  </action>
</task>

<task type="auto">
  <name>PassesEditor</name>
  <files>
    src/app/studio/_components/PassesEditor.tsx
  </files>
  <action>
    Props: `{ value: PassesModule, onChange }`.

    Compone:

    1. `<ImageUrlField label="Hero image" />`
    2. `<CatalogToolbar search onAdd />` (sin filter — passes no tienen taxonomía).
    3. `<CatalogList items={value.passes} renderRow={...} renderForm={...} />`

    `renderRow(pass)`: thumbnail 60×60 + title + price chip + type chip.

    `renderForm(pass)`:
    - title, slug, image
    - price (text)
    - type (select: 'day' / 'week' / 'month' / 'multi-day' — predefinidos
      por convención, no editable como taxonomy)
    - description (textarea)
    - qrLogo (image — opcional, helpText "Centered on the share QR")

    `addPass()`: nuevo con `type: 'day'` por default.
  </action>
</task>

<task type="auto">
  <name>TrailsEditor</name>
  <files>
    src/app/studio/_components/TrailsEditor.tsx
  </files>
  <action>
    Props: `{ value: TrailsModule, onChange }`.

    Compone:

    1. `<ImageUrlField label="Hero image" />`
    2. `<CatalogToolbar search onAdd filter={byDifficulty} />`
    3. `<CatalogList items={value.trails} renderRow={...} renderForm={...} />`

    `renderRow(trail)`: thumbnail 60×60 + title + chip difficulty + distance.

    `renderForm(trail)`:
    - title, slug, image
    - distance (text — ej "3.2 mi")
    - difficulty (select: easy / moderate / hard)
    - description (textarea)
    - lat,lng (latlng)
    - polyline (textarea, helpText "Encoded polyline string for map render")
    - considerations (mini taxonomy editor inline — lista de strings simples,
      no reusables entre trails — usar `<TaxonomyEditor>` con items locales
      al item).

    `addTrail()`: nuevo con `difficulty: 'easy'`, polyline `''`.
  </action>
</task>

<task type="auto">
  <name>SidebarTabs + EditorPanel + Shell wiring (5 tabs nuevas)</name>
  <files>
    src/app/studio/_components/SidebarTabs.tsx,
    src/app/studio/_components/EditorPanel.tsx,
    src/app/studio/_components/Shell.tsx
  </files>
  <action>
    `SidebarTabs.tsx`: añadir 5 entries al array de tabs después de Guestbook
    (posición 12-16 — Listings es 12 con sub-tabs internas, no se desglosa
    fuera). Iconos Lucide (UtensilsCrossed para Listings, CalendarDays para
    Events, Ticket para Tickets, TicketCheck para Passes, Footprints para
    Trails — replicar de ModulesEditor.tsx donde ya existen). Disabled state
    heredado: tab gris + Lock icon si module toggle OFF.

    `EditorPanel.tsx`: añadir 5 cases nuevos en el switch:
    - `'listings'` → `<ListingsEditor value={listings} onChange={setListings} />`
    - `'events'` → `<EventsEditor ... />`
    - `'tickets'` → `<TicketsEditor value={tickets} eventsValue={events} onChange={setTickets} />`
    - `'passes'` → `<PassesEditor ... />`
    - `'trails'` → `<TrailsEditor ... />`

    `Shell.tsx`: state expandido — `savedListings/listings`, idem 4 más.
    `listingsDirty = !equal(savedListings, listings)`. Push debounced via
    `pushListings(listings)` en useEffect. `isDirty` incluye los 5 dirty flags.
    `handleSave()` envía los 5 al PATCH si están dirty. `handleDiscard()`
    restaura los 5 desde saved. Initial load: lee de `cfg.listings ?? defaultListings()`.

    Al saving: dispatcha PATCH con sólo las secciones dirty (objeto sparse).
    En éxito: `savedX ← x` para cada sección dirty.
  </action>
</task>

---

## Verificación E2E (cierre de S3.7)

- `pnpm typecheck` y `pnpm lint` limpios.
- En `/studio/default`: 5 tabs nuevas visibles después de Guestbook.
- Listings → Restaurants → Add new → aparece en grid del kiosk en <300 ms.
- Events → reorder → orden refleja en week strip del kiosk al instante.
- Listings → add taxonomía `'Vegan'` en Subcategories → chip disponible en
  filter overlay del kiosk.
- Passes → borrar pass con QR custom → confirma + desaparece de PassesModule.
- Tickets → quitar categoría visible → tabs del módulo Tickets reaccionan en vivo.
- Trails → editar polyline → ruta del mapa se redibuja.
- Cmd+S → PATCH con sólo secciones dirty → reload conserva.
- Cliente nuevo (vía S0 modal) → seed con catálogos vacíos sin errores.
- Toggle Tickets OFF en `02 Modules` → tab Tickets gris + lock icon + tickets
  desaparecen del kiosk.
- Imagen 250 KB → warning visible, save permitido.
- Config total >480 KB → PATCH responde 413 con mensaje claro.
- Subagent `auditor-white-label` sin hallazgos en los 11 archivos nuevos.
- Verificación visual en iframe: cambiar 1 listing en cada catálogo y comprobar
  que el kiosk reacciona sin recargar.

## Riesgos y mitigaciones

- **Cap KV 512 KB**: cap blando 200 KB/imagen + warning UI + 413 en server.
  Solución real (Vercel Blob) en S5/S6.
- **Race tickets ↔ events**: el listener kiosk de tickets re-deriva sobre el
  override de events vigente; orden de mensajes irrelevante.
- **Slug colisión en reorder**: zod refine valida unicidad; UI muestra error inline.

## Out of scope (registro)

| Feature | Fase futura |
|---|---|
| Bulk import CSV/JSON | S3.8 |
| Vercel Blob para imágenes | S5/S6 |
| Mapbox picker visual | S6 |
| Edición i18n por item | S4 |
