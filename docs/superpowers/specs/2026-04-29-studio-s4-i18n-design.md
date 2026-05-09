# Studio S4 — i18n editor (base, sin AI translate)

**Fecha:** 2026-04-29
**Fase:** Studio S4 base. AI translate queda para S4.1.
**Estado:** diseño aprobado por Rubén.

## Problema

El kiosk soporta 6 idiomas (`en/es/fr/de/pt/ja`) y cada cliente tiene un bundle de ~363 keys. Hoy se editan a mano archivo por archivo en `clients/<slug>/i18n/*.json`. Para un cliente nuevo, traducir 363 × 5 idiomas mirando 6 ventanas paralelas es impracticable.

## Alcance

**Sí:**

- Editor side-by-side de los 6 locales en una tabla (rows = keys, cols = locales).
- Detección automática de keys faltantes por locale vs `en` (canónico).
- Filtro por sección (prefijo de la key) + search global.
- Edit inline con autosave (vía debounce del Shell, igual que el resto de editores).
- Storage en KV con key separada `i18n:<slug>` (no se mete en `KioskConfig` para no inflar el JSON principal).
- Bootstrap desde filesystem `clients/<slug>/i18n/*.json` la primera vez. Fallback a `clients/_template/i18n/*.json`.

**No (S4.1+):**

- AI translate por celda con `@anthropic-ai/sdk` (requiere instalar SDK + API key).
- Bulk import/export de i18n bundles (CSV/JSON) — patrón ya existe en S3.8 si después se quiere.
- Edición jerárquica (con namespaces nested). Por ahora todas las keys son flat.

## Arquitectura

### Storage

Nueva clave en KV:

```
i18n:<slug>  →  { en: {...}, es: {...}, fr: {...}, de: {...}, pt: {...}, ja: {...} }
```

Mantener separado del `cfg:<slug>` mantiene cada PATCH bajo el cap KV de 480KB y simplifica el bridge (no re-bota todo el config cada vez que cambia una traducción).

### Schema

```ts
export const LOCALES = ['en', 'es', 'fr', 'de', 'pt', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];

const LocaleStringsSchema = z.record(z.string().max(2000));

export const I18nBundleSchema = z.object({
  en: LocaleStringsSchema.default({}),
  es: LocaleStringsSchema.default({}),
  fr: LocaleStringsSchema.default({}),
  de: LocaleStringsSchema.default({}),
  pt: LocaleStringsSchema.default({}),
  ja: LocaleStringsSchema.default({}),
});
export type I18nBundle = z.infer<typeof I18nBundleSchema>;
```

### Endpoint

`GET  /api/studio/i18n/[slug]`

- Lee `i18n:<slug>` de KV.
- Si no existe, bootstrap: lee `clients/<slug>/i18n/*.json` (fs); si tampoco existe, `clients/_template/i18n/*.json`.
- Devuelve `{ bundle: I18nBundle }`.

`PATCH /api/studio/i18n/[slug]`

- Body: `{ bundle: I18nBundle }` (full replacement) o `{ patch: { [locale]: { [key]: value } } }` (partial).
- Re-valida con zod, hace merge si `patch`, guarda. Cap 480 KB enforzado.
- 413 si supera el cap.

### UI

`I18nEditor.tsx` con layout:

```
┌────────────────────────────────────────────────────────────┐
│ Section ▼  · Search…                          🌐 Add key   │
├──────────────┬──────┬──────┬──────┬──────┬──────┬──────────┤
│ key          │ EN   │ ES   │ FR   │ DE   │ PT   │ JA       │
│              │ ★    │      │      │      │      │          │  (canónico)
├──────────────┴──────┴──────┴──────┴──────┴──────┴──────────┤
│ tile_label_… │ Rest…│ Rest…│ ⚠ ── │ Rest…│ Rest…│ レス …    │
│ ...                                                        │
└────────────────────────────────────────────────────────────┘
```

- Encabezado sticky.
- Cada celda es un `<textarea>` auto-grow (1 línea collapsed, expand on focus).
- Celdas faltantes (`!== '' && key in en && !(key in locale)`): borde ámbar + placeholder "missing".
- EN destacado (★) y disabled (no se edita desde aquí — es referencia; cambios en `en` se hacen vía la propia celda EN como cualquier otro locale).
- Filtro por sección: dropdown con secciones derivadas del prefijo de la key antes del primer `_` (ej. `tile`, `home`, `module`, `cta`, `survey`, `itinerary`, etc.).
- Search global: filtra por `key includes` o `value includes` en cualquier locale.
- Stats arriba: "X keys · 5 missing en ES · 12 missing en FR · ..."

### Bridge (live preview)

El kiosk runtime ya consume i18n de filesystem en SSR. Para preview en vivo desde el Studio:

- Inyectar `kiosk:i18n-override` event con el bundle, similar al patrón S3.6.
- El kiosk client component `I18nProvider` re-renderiza con el bundle override.

Para esta sub-fase: simplemente despachar el evento de override; si el kiosk no tiene el listener todavía, lo añadimos como parte del wiring (pequeño, ~15 líneas).

## Verificación

- [ ] Abrir `/studio/default`, click en tab Languages.
- [ ] Tabla muestra ~363 keys × 6 locales.
- [ ] Filtro por sección funciona (`tile_*` muestra solo los `tile_label_*`).
- [ ] Search filtra por key o value.
- [ ] Editar celda ES → tras debounce el endpoint responde 200.
- [ ] Recargar página → cambio persiste.
- [ ] Borrar valor de `tile_label_restaurants` en ES → celda se marca "missing" + counter sube.
- [ ] Live preview: si el kiosk muestra ES activo, el cambio se ve sin recargar.
- [ ] `pnpm typecheck` y `pnpm lint` limpios.

## Riesgos

- **Cap KV 480KB**: ~363 keys × 6 locales × ~30 chars ≈ 65 KB. Holgado.
- **Bootstrap conflict**: si un cliente vivo en KV todavía no tiene `i18n:<slug>` y el filesystem existe, el GET hace seed. Idempotente.
- **Bridge listener nuevo**: el kiosk runtime tiene `I18nProvider` server-side; añadir override es la única pieza con riesgo. Mitigación: mantener el override no-bloqueante (si el provider no escucha, el editor sigue funcional sin live preview).
