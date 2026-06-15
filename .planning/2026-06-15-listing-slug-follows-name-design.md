# Spec — El slug de los listing modules sigue al nombre (kiosk + PWA)

**Fecha:** 2026-06-15 · **Aprobado por:** Rubén ("Apruebo, avanza y que nada se rompa")

## Alcance FINAL (re-decidido 2026-06-15 tras hallazgo PWA)

**Solo listing modules CUSTOM/duplicados.** El slug sigue al nombre en kiosk + PWA
(se añade la ruta dinámica `/pwa/[module]`, que además arregla el 404 actual de los
custom en la PWA). Los 3 **canónicos** (`restaurants`/`things-to-do`/`stay`) y los
**típados** (map/photo-booth/events/passes/tickets/deals/trails/guestbook/social-wall/
digital-brochure/trip-planner) **conservan su slug fijo** — su NOMBRE visible ya es
100% editable. Motivo del recorte: `features.pwa` es un objeto **tipado de claves
fijas** (restaurants/stay/thingsToDo/…) y las 3 páginas PWA leen el catálogo por su
clave canónica (`home.modules.restaurants`); re-sluggear canónicos rompería la PWA.
El refactor profundo (PwaConfig → Record slug-agnóstico) queda como milestone aparte.

## Objetivo (original)

Al renombrar un listing module, su `slug`/`key` se regenera del nombre (slugify) y
se migra TODO lo asociado.

UX: slug "sticky" — sigue al nombre hasta que el operador edite el slug a mano
(entonces se desacopla); commit en `onBlur` (no por tecla). Colisión → sufijo.

## Estado actual (hechos verificados)

- Kiosk: `/home/[module]/page.tsx` es **dinámico** y resuelve cualquier key por
  `home.modules[module].kind` → re-slug seguro en kiosk.
- PWA: `/pwa/{restaurants,stay,things-to-do}` son **estáticas** (`page.tsx` +
  `list/` + `[slug]/`), leen `config.features.pwa.{key}` (slice propio: textos,
  navActive hardcodeado p.ej. `"dining"`) + `features.home.modules[key]` (catálogo
  compartido, vía `buildSubcategoryTiles`). Usan `ListingsGridScreenLive` con
  `moduleKey`, `basePath`, `navActive`, `subcategoryTiles`.
- Listing modules **custom** NO tienen ruta PWA → hoy 404 (deuda preexistente).
- Editor: `handleListingRename` (label) y `handleListingRenameKey` (slug, slugify
  - colisión + migra listings+tiles + `syncItineraryActivity`) YA existen
    (ModulesEditor.tsx). `uniqueListingKey()` (listings.ts:225) slugifica+unicidad.
- Shell.tsx cascada de i18n `tile_label_*`/`module_label_*` al renombrar label.

## Fase 1 — PWA: ruta de listings dinámica (NO destructiva primero)

1. Crear `src/app/(pwa)/pwa/[module]/page.tsx`, `[module]/list/page.tsx`,
   `[module]/[slug]/page.tsx` espejando las estáticas pero resolviendo por
   `params.module`: `features.pwa[module]` (slice) + `features.home.modules[module]`
   (catálogo). Solo para `kind === 'listings'` (o sin kind); otros → notFound (los
   típados tienen sus propias rutas estáticas que ganan por precedencia).
2. `navActive`: derivar — canónicos a su celda (`restaurants→dining`,
   `things-to-do→explore`, `stay→stay`…); custom → sin `active`. Mapa en un helper.
3. **No destructivo:** las 3 carpetas estáticas se quedan (Next: segmento estático
   gana sobre `[module]`). La dinámica solo captura las keys sin carpeta estática
   (custom) → arregla el 404 de custom SIN tocar las canónicas.
4. **Verificar** (no-regresión): `/pwa/restaurants|stay|things-to-do` idénticas;
   un listing **custom** ahora renderiza en `/pwa/<custom>` en vez de 404.
5. Luego (paso destructivo, tras verificar la dinámica con un canónico): **borrar**
   las 3 carpetas estáticas → `/pwa/restaurants` cae a la dinámica. Re-verificar las
   3 idénticas. (Este paso habilita el re-slug de canónicos en la PWA.)

## Fase 2 — Auto slug-from-name + migración atómica

- Al commit del label (onBlur) de un listing module: `newKey = uniqueListingKey(label)`;
  si difiere del actual y el operador no editó el slug a mano (sticky flag) → re-slug.
- Extender la migración (sobre `handleListingRenameKey`) a:
  - **i18n**: crear `tile_label_<newKey>` / `module_label_<newKey>` copiando el valor
    de las viejas, en los 6 locales (las viejas quedan huérfanas, inofensivas).
  - **CategoryMapping.moduleKey** (KV `client:{slug}:content`): `oldKey→newKey`.
  - **slice PWA** `features.pwa[oldKey]` → `features.pwa[newKey]`.
- Sticky: marcar el módulo como "slug manual" si el operador editó el slug; entonces
  el rename de label ya no lo toca.
- Colisión: `uniqueListingKey` ya sufija.

## Riesgos / no-regresión (mandato "que nada se rompa")

- Fase 1 incremental: la dinámica no pisa las estáticas hasta el borrado explícito.
- Verificar kiosk + PWA tras CADA paso (no solo typecheck): render real de
  restaurants/stay/things-to-do + un custom.
- Deep links viejos `/home/restaurants` → huérfanos (aceptable; redirect opcional fuera de alcance).
- Saved trips localStorage con slug viejo: riesgo bajo, no se aborta.

## Tests

- Unit: `uniqueListingKey` en rename; helpers de migración (i18n keys, categoryMap,
  pwa slice) con deps inyectables.
- E2E (agent-browser): renombrar Restaurants→"Eat & Drink" → `/home/eat-drink` y
  `/pwa/eat-drink` renderizan el contenido; option del Trip Planner migrada;
  un custom renderiza en PWA.
- typecheck + lint + suite + validate:configs en cada commit. `pnpm kiosk:dev` y
  `/pwa` arrancan limpios antes de cada commit (regla §9 de fixes de routing).
