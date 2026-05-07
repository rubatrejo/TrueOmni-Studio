# DSS5-SUMMARY.md — Module editors (6 forms) + overrides reactivos runtime

**Fecha:** 2026-05-07
**Estado:** ✅ aprobado visualmente

## Hecho

Habilita el slot configurator por slide: el operador expande un slide en el
playlist y elige el module type por cada slot del template, configurando
sus campos via form inline. Además **cabla overrides reactivos del display
en runtime** para que el push live del bridge se vea sin reload.

### Template catalog client-safe

- **`src/lib/signage/template-catalog.ts`** (NUEVO): POJO ligero con
  descriptors de los 8 templates conocidos. Cada uno trae `slots: [{ key,
  kind, rect, acceptedModules }]`. Helpers `getTemplateDescriptor(id)` y
  `defaultModuleFor(kind)` (devuelve instancia mínima válida con defaults
  del schema Zod). Sync manual con los `<NN-template>.tsx`.

### Slot configurator UI

- **Toggle expand/collapse** en `<PlaylistPanel>`: chevron `>` que abre
  `<SlideRowExpanded>` debajo de la slide row. State `expandedSlideId`
  local al panel.
- **`<SlideRowExpanded>`**: para cada `templateSlot`, renderiza un card con:
  - Header: `slot.key` + `slot.kind` + dimensiones del rect.
  - Dropdown "(none) | <accepted module kinds>".
  - Form correspondiente del module si está configurado.
- **`<ModuleFormSwitch>`**: dispatcha al form correcto según `module.kind`.

### 6 module forms

Forms compactos en `_components/display/modules/`:
- `EventsModuleForm`: layout select, maxItems number, titleOverride text.
- `SocialModuleForm`: layout, maxPosts, rotationIntervalSec, hashtag filter.
- `VideoImageModuleForm`: asset.kind, asset.url, loop checkbox, fit select.
- `AdsModuleForm`: asset.kind, asset.url, link, qr, weight.
- `NewsModuleForm`: layout, maxItems.
- `WeatherModuleForm`: layout.

**Primitivas** en `module-form-primitives.tsx`: `FieldStack`, `TextField`,
`NumberField`, `SelectField`, `CheckboxField`. Estilo consistente con el
resto del editor signage.

### Overrides reactivos del display en runtime

- **`<SignagePlayer>`** ahora suscribe a `useSignageBridgeStore`:
  - Lee `displayPatch`. Si existe, mergea shallow con prop server:
    `display = { ...serverDisplay, ...displayPatch }`.
  - Renderiza usando `display.settings` y `display.playlist` (después del merge).
- **El editor envía siempre el draft completo** (no patches incrementales),
  así que el shallow merge funciona. Si DSS5.5 introduce patches granulares,
  sustituir por deep merge.
- **Los 8 templates NO se tocaron** — el cambio está aislado en el player.

### UX flow

1. Operador edita slot configurator (cambia `events.layout` a `mosaic`).
2. `updateSlide(slideId, { slots })` → store dirty.
3. `pushDisplay(draft)` (debounce 120ms) → iframe recibe `signage:display-update`.
4. `<SignageBridge>` popula `useSignageBridgeStore.displayPatch`.
5. `<SignagePlayer>` re-renderiza con el patch aplicado → cambio visible
   sin reload.
6. Autosave 1s → PUT al KV → persiste.

## Archivos tocados

| Archivo | Tipo |
|---|---|
| `src/lib/signage/template-catalog.ts` | NUEVO |
| `src/app/studio/digital-displays/_components/display/SlideRowExpanded.tsx` | NUEVO |
| `src/app/studio/digital-displays/_components/display/PlaylistPanel.tsx` | toggle expand + onUpdateSlots |
| `src/app/studio/digital-displays/_components/display/modules/EventsModuleForm.tsx` | NUEVO |
| `src/app/studio/digital-displays/_components/display/modules/SocialModuleForm.tsx` | NUEVO |
| `src/app/studio/digital-displays/_components/display/modules/VideoImageModuleForm.tsx` | NUEVO |
| `src/app/studio/digital-displays/_components/display/modules/AdsModuleForm.tsx` | NUEVO |
| `src/app/studio/digital-displays/_components/display/modules/NewsModuleForm.tsx` | NUEVO |
| `src/app/studio/digital-displays/_components/display/modules/WeatherModuleForm.tsx` | NUEVO |
| `src/app/studio/digital-displays/_components/display/modules/module-form-primitives.tsx` | NUEVO |
| `src/components/signage/player/SignagePlayer.tsx` | useSignageBridgeStore + shallow merge |
| `.planning/DSS5-PLAN.md` | NUEVO |
| `.planning/DSS5-SUMMARY.md` | NUEVO |

## Verificado

- `pnpm typecheck` ✅ limpio.
- `pnpm exec eslint` archivos tocados ✅ limpio.
- `pnpm kiosk:dev` arranca limpio.
- Editor `/studio/digital-displays/default/displays/lobby-tv`:
  - Chevron expand muestra slots del template.
  - Cambiar layout/maxItems/etc. en module form → autosave dispara → iframe
    refleja cambios sin reload (gracias a overrides reactivos del display).
  - Slot vacío `(none)` → asignar module → form aparece.
  - Refresh → cambios persisten desde KV.
- Sin regression del runtime ni del kiosk.
- Aprobación visual ✅.

## Decisiones

- **Catalog client-safe POJO** vs reusar registry runtime: el registry
  importa Render con coste SSR; el catalog es serializable y ligero. Sync
  manual hasta DSS5.5 si surge necesidad.
- **Forms con campos primarios solamente**: el schema tiene mucho detalle
  por kind (filter granular, variantes). DSS5 entrega flow base; DSS5.5
  añade UI más elaborada si surge feedback.
- **Shallow merge en SignagePlayer**: el editor envía draft completo. Si
  DSS5.5 introduce patches incrementales, deep merge con cuidado.
- **Sin client overrides en DSS5**: el branding/header live preview cambia
  raramente en signage (vs kiosk). DSS5.5 lo cabla si surge necesidad. El
  operador hoy hace save y reload del iframe para ver branding.

## Pendiente / siguiente sub-fase

**DSS6** — Snapshots / Versions cliente + display. Cada save crea snapshot
inmutable en KV con rotación FIFO. UI history en el display editor con
restore.
