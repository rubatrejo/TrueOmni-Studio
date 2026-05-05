# Studio · Trip Builder editor + propagación (DESIGN)

**Fecha:** 2026-05-05
**Estado:** aprobado por Rubén (sesiones 1, 2, 3 confirmadas)
**Contexto previo:** STATE.md sesión 2026-05-04 nocturna, pendiente #1 (Itinerary local_listings rewrite).

## Objetivo

Cerrar tres gaps del Studio en torno al Trip Builder:

1. Reescribir `local_listings` (`"Phoenix Foodie Trail"`) al clonar un kiosk nuevo, igual que ya se hace con listings/events/passes/trails/deals/brochures/socialWall.
2. Permitir desde el Studio prender/apagar el flujo AI del Trip Builder.
3. Permitir desde el Studio editar las preguntas del wizard AI (kicker, title, subtitle, type, hero image, options).

Cuando se publique el kiosk `default` con cambios en estas áreas, los kiosks nuevos creados después del publish heredan el toggle + las questions actualizadas.

## Decisiones aprobadas

- `aiEnabled` controla el módulo Trip Builder entero (mapea a `features.home.modules.itinerary.enabled` legacy). NO se separa "módulo on/off" vs "AI flow on/off" en v1; si se necesita después, se añade `ai.enabled` aparte.
- `local_listings` se persiste passthrough en el Studio shape pero NO se edita por UI en v1.
- Questions tienen `id` estable solo en KV/Studio. El publish a fs hace strip de ids — el bootstrap los regenera al releer.
- El toggle visual del editor cuando `aiEnabled = false` deshabilita ("disabled" gris + tooltip) la sección de Questions, pero NO borra las preguntas del KV.
- `key` de la question (`'duration'`, `'travel_type'`, …) es editable solo al crear, readonly después: el runtime usa `key === 'duration'` para asignar días al loop AI.
- Drag-reorder de questions y de options.
- Validation: kicker ≤ 80, title ≤ 200, subtitle ≤ 200, type ∈ {single, multi}, options 1-20, days 0-30. Max 8 questions.

## Data model

Nuevo schema en `src/lib/studio/schema.ts`:

```ts
ItineraryAiOptionSchema = { value, label, days? }
ItineraryAiQuestionSchema = {
  id, key, kicker, title, subtitle?, type: 'single'|'multi',
  hero_image, options: [...]
}
ItineraryLocalListingSchema = { slug, title, description, image, stops: [...] }
ItineraryBuilderSchema = {
  aiEnabled: boolean (default true),
  loadingImage: string,
  defaultTitleTemplate: string,
  questions: ItineraryAiQuestion[],
  localListings: ItineraryLocalListing[],
}
```

Añadir a `KioskConfigSchema`:

```ts
itineraryBuilder: ItineraryBuilderSchema.optional()
```

Optional + defaults garantizan compat con KV de kiosks viejos.

## Flujo end-to-end

1. **Bootstrap from fs** (`src/lib/studio/bootstrap-from-fs.ts`):
   `parseItineraryFromFs(fsConfig.features?.home?.modules?.itinerary)` mapea snake_case → camelCase y auto-genera `id` en cada question si falta. Se aplica con `takeFsIfDefault` igual que el resto de módulos.

2. **Studio editor** (`src/app/studio/_components/ItineraryBuilderEditor.tsx`):
   Sección `'itinerary-builder'` nueva en `STUDIO_SECTIONS`, num `17`, entre Trails (16) y Languages (renumera a 18). `systemModuleKey: 'itineraryBuilder'`. UI de tres bloques: AI flow (switch), Loading screen (image + title template), Questions (CRUD con drag-reorder + options inline). LocalListings sin UI.

3. **Bridge** (`src/components/studio-bridge.tsx`):
   Nuevo `KIOSK_ITINERARY_OVERRIDE_EVENT = 'kiosk:itinerary-override'` + helper `pushItineraryOverride()`.

4. **Runtime reactivo** (`src/components/itinerary/itinerary-builder-module.tsx`):
   Hook que escucha el evento + reemplaza `config` reactivamente (sin remount).

5. **Publish merger** (`src/lib/studio/publish-merger.ts`):
   Si `studio.itineraryBuilder` difiere del factory default, escribe `home.modules.itinerary` con shape legacy: `enabled` ← `aiEnabled`, `local_listings` ← `localListings`, `ai: { questions, loading_image, default_title_template }`. `welcome_always_visible/show_driving_default/hide_markers_default/max_stops` se preservan tal cual del fs (legacy passthrough).

6. **POST /api/studio/configs** (`src/app/api/studio/configs/route.ts`):
   `rewriteContentInPlace` añade visit a `config.itineraryBuilder.localListings` (title/description) y `config.itineraryBuilder.questions` (title/subtitle). Las options no se rewritean (labels genéricas).

7. **Resync** (`/api/studio/configs/[slug]/resync`):
   Ya re-lee fs por design — sin cambios propios necesarios.

## Wiring en Shell.tsx

- State `itineraryBuilder` con default `DEFAULT_ITINERARY_BUILDER`.
- `shallowEqualItinerary` (JSON.stringify completo, patrón post-2026-05-04 nocturna).
- `pushItineraryOverride(itineraryBuilder)` en useEffect.
- Dirty diff + payload al `Save`.
- `EditorPanel` renderea `<ItineraryBuilderEditor>` cuando `sectionKey === 'itinerary-builder'`.

## Cambios al SystemModulesEditor

Ninguno: el toggle "module on/off" maestro (`systemModules.itineraryBuilder`) sigue donde está. El nuevo `aiEnabled` vive en la sección dedicada, NO duplica el toggle maestro. Si el módulo está OFF maestro, la sección se renderea en gris (mismo patrón que el resto via `systemModuleKey`).

## Trade-offs aceptados

- Toggle único `aiEnabled` mapeando al `enabled` legacy: si el operador apaga el AI flow, el módulo entero queda apagado. Es el comportamiento real del runtime hoy. Si después se quiere granularidad, se añade `ai.enabled` aparte sin breaking change.
- IDs de question solo en KV: una "diff dirty" falsa al releer del fs queda mitigada porque `shallowEqualItinerary` ignora `id` (excepción explícita en el comparator).
- LocalListings sin UI: si el operador necesita editar un local_listing custom, edita `clients/<slug>/config.json` a mano y publica. Suficiente para v1.

## Verificación

- `pnpm typecheck`, `pnpm lint`, `pnpm build` limpios.
- Smoke: editar `default`, togglear `aiEnabled`, añadir/editar question, drag-reorder, save → ver el preview reactivo (CTA AI desaparece/aparece, questions reflejan el cambio).
- Crear kiosk `davenport-fl` con location `Davenport, FL` → ver que `localListings[0].title` = "Davenport Foodie Trail" y questions con title rewritten.
- Publish via PR mode (mode=pr) → GitHub PR contiene cambios surgical en `home.modules.itinerary`.
- Resync existing kiosk → labels propagados.

## Done

- Schema + bootstrap + bridge + editor + publish merger + rewrite + Shell wiring + runtime listener todos en main.
- Toggle aiEnabled prende/apaga el CTA del wizard en preview reactivo y al publicar.
- Questions editables (CRUD + drag) y persisten al save.
- Kiosk nuevo creado con location no-AZ trae `localListings.title/description` reescritos.
- Default publicado vía Studio propaga toggle + questions a kiosks nuevos posteriores.
