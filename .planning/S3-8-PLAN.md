# S3-8-PLAN.md — Bulk import CSV/JSON

> Sub-fase: Studio S3.8 (sigue de S3.7).
> Spec: `docs/superpowers/specs/2026-04-29-studio-s3-8-bulk-import-design.md`.
> Fecha: 2026-04-29.

3 tareas atómicas. Ejecutables en una sola sesión. Cada una commiteada por separado.

---

<task type="auto">
  <name>T1 — import-helpers.ts core</name>
  <files>src/app/studio/_lib/import-helpers.ts (nuevo)</files>
  <action>
    Crear el módulo puro de parsing + coerción.
    - `parseCsv(text)`: RFC 4180 mínimo (quoted fields, comma sep, `\r\n`/`\n`, double-quote escape). Retorna `{ headers, rows }` con `rows` como `Record<string,string>[]`.
    - `parseJson(text)`: wrapper con error legible.
    - Por kind (`listings|events|passes|trails`) un `csvSpecs` mapea columna → `{ path, coerce }`.
      Coercers: string identidad, number (parseFloat con NaN guard), bool (`true|1|yes` etc.), array (split por `;` trim), coords (`"lat,lng"` → `{lat,lng}`).
    - `coerceCatalogRow(kind, rawRow)`: aplica spec → object plano → `XSchema.safeParse`. Retorna `{ok:true, item}` o `{ok:false, errors}` con `errors` legibles.
    - Slug auto-derivado del title si falta (kebab + dedupe local).
    - `normalizeImport(kind, parsed, mode, existing)`: dispatch según `parsed` sea array o `{items:[...]}` (JSON) o rows CSV. Retorna `{ items, errors:[{row, message}], stats:{added, updated, skipped} }`.
    - Sin React. Sin imports de cliente. Tipos `ImportKind`, `ImportMode`, `ImportResult`, `ImportRowError` exportados.
  </action>
  <verify>
    `pnpm typecheck` limpio.
    Importar la función desde un editor vacío y llamarla con un CSV pequeño hard-coded en una prueba mental.
    Tipos exportados consumibles desde editores y el Modal.
  </verify>
  <done>
    Archivo creado, sin warnings, exporta los símbolos arriba.
    Cubre los 4 kinds.
  </done>
</task>

---

<task type="auto">
  <name>T2 — ImportModal + prop opcional en CatalogToolbar</name>
  <files>
    src/app/studio/_components/catalog/ImportModal.tsx (nuevo),
    src/app/studio/_components/catalog/CatalogToolbar.tsx (modificar)
  </files>
  <action>
    `CatalogToolbar`: añadir prop opcional `onImport?: () => void` y renderizar botón "Import" (Upload icon) ANTES del Add cuando esté presente. Estilo coherente con sidebar light/dark mode.

    `ImportModal`:
    - Props: `open, onClose, kind, existingItems, onImport(items, mode)`.
    - Layout: overlay full-screen + dialog centrado (consistencia con NewClientModal).
    - Drop zone (drag&drop o click) acepta `.csv,.json`. Auto-detect por extensión + content sniff.
    - Tras parsear: muestra "N valid · M errors" + tabla 10 filas + lista colapsable de errores por fila.
    - Toggle radio `merge` (default) / `replace`.
    - Footer: `Cancel` + `Import N items` (disabled si 0 válidos).
    - Texto y placeholders sin hardcoded de colores; usa tokens zinc/sky del Studio.
    - Cuando se hace click Import: llama `onImport` y cierra.
  </action>
  <verify>
    `pnpm typecheck` limpio.
    Render mental: drop CSV con 3 filas → preview correcto, errors detectados.
    `auditor-white-label` no chilla por strings — son textos del Studio, no kiosk.
  </verify>
  <done>
    Modal accesible (Esc cierra), focus trap mínimo, light+dark OK.
    CatalogToolbar con prop opcional sin romper editores actuales.
  </done>
</task>

---

<task type="auto">
  <name>T3 — Wirear import en 4 editores + smoke E2E</name>
  <files>
    src/app/studio/_components/EventsEditor.tsx,
    src/app/studio/_components/PassesEditor.tsx,
    src/app/studio/_components/TrailsEditor.tsx,
    src/app/studio/_components/ListingsEditor.tsx
  </files>
  <action>
    Por editor:
    - `[importOpen, setImportOpen] = useState(false)`.
    - `<CatalogToolbar onImport={() => setImportOpen(true)} ... />`.
    - Renderizar `<ImportModal open={importOpen} kind="..." existingItems={value.X} onImport={handleImport} onClose={() => setImportOpen(false)} />`.
    - `handleImport(items, mode)`:
      * `merge` ⇒ upsert por slug (item del payload reemplaza si existe; appendea si no). Mantiene orden: items existentes mantienen posición; nuevos se anteponen.
      * `replace` ⇒ `update({X: items})`.
      * Auto-fill taxonomies vacías: si `value.categories`/`features`/`subcategories` están vacías y los items aportan, recogerlas (Set, sorted, max 64 chars/each, max 100 entries).
    - ListingsEditor: opera sobre la entry seleccionada (`activeEntry.catalog.listings`).
    - Tickets queda fuera (derivado).
  </action>
  <verify>
    `pnpm typecheck && pnpm lint` limpio.
    `pnpm kiosk:dev` levanta. Smoke en `/studio/default`:
    - Tab Events → "Import" → drop pequeño CSV → preview + import → items aparecen.
    - JSON roundtrip: copiar `value.events` a un `.json` (mock manual), re-import en `replace` → catálogo idéntico.
    - ListingsEditor: cambiar entry → Import → items se cargan en la entry correcta.
    - Tickets editor sin botón Import (no se rompe).
  </verify>
  <done>
    4 editores con import funcional sin regresiones.
    Live preview se actualiza tras import (postMessage corre solo).
    Commit con mensaje `feat(studio): S3.8 — bulk import CSV/JSON en 4 catálogos`.
  </done>
</task>
