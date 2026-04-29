# Studio S3.8 — Bulk import CSV/JSON

**Fecha:** 2026-04-29
**Fase:** Studio S3.8 (sigue de S3.7).
**Estado:** diseño aprobado por Rubén el 2026-04-29.

## Problema

Tras S3.7 cada catálogo (Listings, Events, Passes, Trails) se edita item-a-item desde un panel. Para clientes reales que llegan con 50–200 entradas en una hoja Excel o un export antiguo, eso es inviable. Necesitamos una entrada masiva que pegue contenido sin rompernos un editor.

## Alcance

**Sí:**

- Importar `.json` y `.csv` a 4 catálogos: **Listings (entry seleccionada), Events, Passes, Trails**.
- Modal único `ImportModal` lanzado desde `CatalogToolbar` (botón "Import" al lado de "Add").
- Preview pre-import: tabla con primeras 10 filas, errores por fila marcados.
- Modos: **`replace`** (sustituye items existentes) o **`merge`** (upsert por `slug`, default).
- Roundtrip JSON: el formato exportable es exactamente el mismo que se acepta de import.

**No (fuera de S3.8):**

- Tickets (derivado de Events, no tiene catálogo propio).
- Surveys, Deals, Photo Booth, Brochures, Social Wall, Guestbook (catálogos pequeños o con sub-objetos costosos).
- Imágenes en CSV (solo URLs string; binarios se quedan en S5/S6 con Vercel Blob).
- Sub-objetos complejos en CSV: `event.ticket`, `pass.activities`, `trail.considerations`, `trail.trailMap.geojson` quedan en defaults. Sí se aceptan via JSON.
- Export desde el modal (lo dejamos para una S3.8.1 si hace falta — el roundtrip está garantizado).

## Arquitectura

### Pieza 1 — `import-helpers.ts`

`src/app/studio/_lib/import-helpers.ts` — puro, sin React.

- `parseCsv(text: string): { headers: string[]; rows: Record<string,string>[] }` — RFC 4180 mínimo (quoted fields, comma separator, `\r\n`/`\n`).
- `parseJson(text: string): unknown` — wrapper con error legible.
- `coerceCatalogRow(kind, raw): { ok: true; item } | { ok: false; errors }` — toma un object plano y lo coacciona al schema (CSV trae todo string → conversión a number/array/coords). Usa zod safeParse.
- `normalizeImport(kind, parsed, mode, existing): { items, errors, stats }` — pipeline completo: coerce + dedupe slug + merge/replace.

`kind` ∈ `'listings' | 'events' | 'passes' | 'trails'`. Por kind hay un mapa de columnas CSV → field paths con coercers (`csvSpecs[kind]`).

### Pieza 2 — `ImportModal`

`src/app/studio/_components/catalog/ImportModal.tsx`.

- Drop zone + file picker (`.csv`, `.json`).
- Detección automática por extensión + sniff (`{`/`[` → JSON; resto → CSV).
- Preview de 10 filas + contador de filas válidas / errores.
- Toggle `replace | merge`.
- Botones `Cancel` y `Import N items` (deshabilitado si 0 válidos).
- Tras import: callback `onImport(items, mode)` con los items zod-validos.

### Pieza 3 — Wiring en `CatalogToolbar` + 4 editores

- `CatalogToolbar` gana prop opcional `onImport?: () => void`. Si está, renderiza botón secundario "Import" antes de "Add".
- `EventsEditor`, `PassesEditor`, `TrailsEditor`, `ListingsEditor` (por entry activa): estado `[importOpen, setImportOpen]`, handler `handleImport(items, mode)` que aplica replace/merge sobre `value.{events|passes|trails|catalog.listings}`.

## Formato CSV — columnas soportadas por kind

Convenciones globales:

- `;`-separated arrays para `features`, `subcategories` (taxonomies se inicializan auto a partir de los items si vienen vacías en el catálogo).
- `lat,lng` en una sola columna `coords`.
- Booleanos: `true`/`false`/`1`/`0`/`yes`/`no` (case-insensitive).
- Empty cell ⇒ default del schema.
- `slug` opcional — si falta, derivado de `title` (`kebab-case` + sufijo `-N` si colisiona).

### Listings

```
slug,title,subcategory,image,hours,priceRange,features,popularity,address,phone,coords,website,description
```

### Events

```
slug,title,category,image,date,startTime,endTime,venue,priceMode,priceBand,features,popularity,address,phone,coords,website,ticketsUrl,description
```

### Passes

```
slug,title,cover,bandwangoUrl,tagline
```

(activities se quedan vacías en CSV — se editan a mano por el panel.)

### Trails

```
slug,title,subcategory,image,hours,features,popularity,address,phone,coords,website,description,distance,difficulty,duration,elevationGain,trailType,dogFriendly
```

(`considerations.*` se mapean a top-level. `trailMap.geojson` queda vacío — se importa via JSON o se edita a mano.)

## Flujo del usuario

1. Abre tab Events → click "Import" en toolbar.
2. Modal abre con drop zone. Arrastra `events.csv` (87 filas).
3. Preview muestra primeras 10 + "85 valid · 2 errors".
4. Click en "2 errors" expande lista: "row 12: invalid date '2026-31-04'" / "row 47: missing title".
5. Selecciona `merge`. Click "Import 85 events".
6. Modal cierra. Toast "85 events imported (3 updated, 82 added)". Lista del editor refleja cambios al instante.
7. Live preview kiosk se actualiza tras el debounce normal.

## Verificación (E2E)

- [ ] CSV de 50 events bien-formateado importa todos en `merge`.
- [ ] CSV con 3 filas inválidas: 47 importan, 3 reportan error específico.
- [ ] JSON exportado de un editor → re-importado en `replace` → catálogo idéntico.
- [ ] Slugs duplicados en el archivo: el último gana en `merge`, dedupe interno reportado.
- [ ] Modo `replace` sustituye limpiamente; `merge` upsertea por slug.
- [ ] Listings con entry activa "things-to-do" importa al catálogo correcto.
- [ ] Cancelar el modal sin afectar state.
- [ ] `pnpm typecheck` y `pnpm lint` limpios.
- [ ] auditor-white-label sin hallazgos.

## Riesgos

- **Cap KV 480 KB**: 200 items con descripciones largas pueden saturar. Mitigación: warning en el modal si el patch supera 400 KB tras merge; el cap final lo enforza el server.
- **CSV mal-formateado**: comillas mal cerradas → fallo entero. Mitigación: parser tolera `\r\n` y comillas dobladas; en error cataclísmico, mensaje genérico + sugerencia de validar con LibreOffice.

## Archivos afectados

- **Nuevos:** `src/app/studio/_lib/import-helpers.ts`, `src/app/studio/_components/catalog/ImportModal.tsx`.
- **Modificados:** `src/app/studio/_components/catalog/CatalogToolbar.tsx`, `src/app/studio/_components/{Listings,Events,Passes,Trails}Editor.tsx`.
