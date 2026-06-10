# DESIGN — Studio Audit Fase 3b: editores PWA con add/remove + validación Zod

> Fecha: 2026-06-10 · Audit origen: `STUDIO-AUDIT-2026-06-09` (hallazgos **F-PWA-5** y **F-PWA-6**).
> Estado: diseño aprobado por Rubén (brainstorming 2026-06-10). Pendiente: plan de implementación.

## 1. Objetivo

Cerrar los dos hallazgos diferidos de la Fase 3b del audit del Studio:

- **F-PWA-6 (ux/debt):** el editor PWA no tiene validación. El PATCH solo chequea
  `typeof body.pwa === 'object'` (`route.ts:38`); el slice PWA no tiene schema Zod.
- **F-PWA-5 (feature/ux):** los editores PWA-only solo renombran/reordenan el seed; no
  permiten add/remove real de items ni editar coords/geofence. Montar un Scavenger Hunt o
  Wayfinding real exige editar `config.json` a mano — justo lo que el white-label elimina.

**Orden de ejecución (decidido):** primero F-PWA-6 (schema = red de seguridad), luego F-PWA-5.

## 2. Alcance

### F-PWA-6 — Schema Zod + validación

- Nuevo archivo `src/lib/studio/pwa-schema.ts` (NO engordar el monolito `schema.ts` de 2355
  líneas; el audit marca los monolitos como deuda F-QA-1).
- Exporta `PwaConfigSchema` compuesto de sub-schemas por módulo, espejo de los tipos de
  `src/lib/config.ts` (`PwaConfig`, línea ~1167).
- **Estrategia permisiva (decidida):** casi todos los campos `.optional()` y cada slice con
  `.passthrough()`, para **validar forma sin rechazar** configs ya guardados en KV con campos
  extra. Empezamos permisivos; endurecemos en una pasada posterior. Evita romper kiosks en prod.
- PATCH `src/app/api/studio/pwa/[slug]/route.ts:38`: reemplazar el check booleano por
  `PwaConfigSchema.safeParse()`; en error → `400` con `flatten()`. Patrón idéntico a
  `src/app/api/studio/clients/[slug]/branding/route.ts:55-61`.
- Validación inline mínima en editores: `label`/`name` requerido, `min={0}` en number fields
  (geofence radius, taskCount), `maxLength` en títulos, formato URL en social/website.

### F-PWA-5 — Add/remove real en los editores PWA

Base: `src/app/studio/[slug]/mobile-pwa/_components/`. Patrón canónico a imitar:
`src/app/studio/_components/ListingsEditor.tsx` (add `:164`, remove con Undo `:203`,
reorder `:192`, duplicate `:216`). Key estable = `slug`. Helpers `move()`/`ReorderButtons`
ya viven en `pwa-ui.tsx`.

| Editor                  | Listas con add/remove                                                  | Picker de coords                                        |
| ----------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------- |
| **ScavengerHuntEditor** | `hunts[]`; por hunt `tasks[]`                                          | Mapbox geográfico (`coords{lat,lng}` + `checkinRadius`) |
| **WayfindingEditor**    | `floors[]`; por floor `amenities[]`; por amenity `routePoints[]`       | Picker sobre imagen del floor-plan (`{x,y}` en %)       |
| **NotificationsEditor** | `seed[]` (rotulado "datos demo")                                       | —                                                       |
| **ProfileEditor**       | `favorites.items[]`, `upcomingEvents.items[]` (rotulados "datos demo") | —                                                       |
| **ConnectWithUsEditor** | sin add/remove (objeto de keys fijas) → solo validación F-PWA-6        | —                                                       |

- ScavengerTask: selector de tipo (`photo`/`checkin`/`question`); campos condicionales
  (`question`/`options`/`correctIndex` solo si `type==='question'`).
- Notifications/Profile: rotular las listas como datos de ejemplo (en prod llegan del backend),
  para no dar la impresión de que se editan datos reales de usuario.

### Pickers de coordenadas (reusando lo existente)

**A) `ScavengerCoordsField` (Mapbox geográfico).**

- Adaptar `src/app/studio/_components/TrailGeoJsonField.tsx` a single-point: marker arrastrable
  - click-to-place → escribe `coords{lat,lng}`.
- Token Mapbox **por prop**, resuelto desde `config.integraciones?.mapbox_token` (nunca
  `process.env` en client component — regla CLAUDE.md / memoria `mapbox_no_css_vars`).
- Sin token → degradación a inputs numéricos `lat`/`lng` + aviso (como `TrailGeoJsonField:63`).
- Campo numérico `checkinRadius` (metros, `min={0}`) al lado.

**B) `FloorPointField` (picker sobre imagen, NO Mapbox).**

- Coords `{x,y}` en **% (0–100)** sobre `floor.floorPlanImage`. Mapbox no aplica.
- Componente nuevo ligero: render de la imagen; click → convierte offset a % del contenedor.
  Sirve para `origin` (por floor), `destination` y cada `routePoint` (por amenity).
- Sin imagen del floor → fallback a inputs numéricos `x`/`y`.
- Reusa el render del marcador del runtime Wayfinding para paridad visual editor↔PWA.

## 3. No-regresión

- Los editores mutan vía `onChange(next)` con spread defensivo; add/remove respeta esa firma
  exacta. No se cambia cómo el Shell persiste — solo se agregan operaciones sobre arrays.
- `.passthrough()` + `.optional()` garantiza que configs PWA existentes en KV sigan validando.

## 4. Verificación (al cierre)

- `pnpm typecheck` + `pnpm lint` + `pnpm validate:configs` limpios en cada commit.
- QA `agent-browser` del **runtime público** (Scavenger/Wayfinding renderizados con un config
  editado). El editor en sí pide login GitHub → ese QA lo hace Rubén.
- Push incremental por commit temático: (1) F-PWA-6, (2) F-PWA-5; cada uno con deploy Vercel
  READY antes del siguiente.

## 5. Fuera de alcance

- Endurecer el schema (rechazar campos desconocidos): diferido; empezamos permisivos.
- Materializar assets data-URI (F-PWA-3), refactor de monolitos (F-QA-1), limpieza de
  warnings de lint (F-QA-8): son otros hallazgos de la Fase 4.
- Add/remove en Connect (no modela listas).
