# DSS5-PLAN.md — Module editors (6 forms) + overrides reactivos runtime

Atomic plan ejecutable en sesión fresca. Habilita el editor del slot por
slide: el operador expande un slide en el playlist y configura los modules
de cada slot del template. Además **cabla overrides reactivos del display
en runtime** para que el push live del bridge se refleje sin reload.

```xml
<task type="auto">
  <name>DSS5 — Module editors per-slot (6 forms) + overrides reactivos display en runtime</name>
  <files>
    src/lib/signage/template-catalog.ts                                          (NUEVO — descripción de templates client-safe)
    src/app/studio/digital-displays/_components/display/SlideRowExpanded.tsx     (NUEVO — expansión slot configurator)
    src/app/studio/digital-displays/_components/display/PlaylistPanel.tsx        (cabla expand/collapse)
    src/app/studio/digital-displays/_components/display/modules/EventsModuleForm.tsx       (NUEVO)
    src/app/studio/digital-displays/_components/display/modules/SocialModuleForm.tsx       (NUEVO)
    src/app/studio/digital-displays/_components/display/modules/VideoImageModuleForm.tsx   (NUEVO)
    src/app/studio/digital-displays/_components/display/modules/AdsModuleForm.tsx          (NUEVO)
    src/app/studio/digital-displays/_components/display/modules/NewsModuleForm.tsx         (NUEVO)
    src/app/studio/digital-displays/_components/display/modules/WeatherModuleForm.tsx      (NUEVO)
    src/components/signage/player/SignagePlayer.tsx                              (consumir useSignageBridgeStore para overrides reactivos)
    .planning/DSS5-SUMMARY.md
    .planning/SIGNAGE-ROADMAP.md
  </files>
  <action>
    ## 1. Template catalog client-safe
    1.1. `template-catalog.ts` exporta `SIGNAGE_TEMPLATES: TemplateDescriptor[]`
         con shape `{ id, label, slots: [{ key, kind, acceptedModules }] }`.
         Es el mismo patrón que el registry runtime, pero serializable y sin
         imports de React. Hardcodeado para los 8 templates conocidos
         (DSS5 lo mantiene en sync manual; DSS5.5 podría auto-generarlo).
    1.2. Helper `getTemplateDescriptor(id): TemplateDescriptor | null`.
    1.3. Helper `defaultModuleFor(kind: SignageModuleKind): SignageModuleInstance`
         con shapes mínimas válidas (los `default` del schema Zod).

    ## 2. Slide expand/collapse en PlaylistPanel
    2.1. Cada slide row tiene un toggle (`ChevronRight` / `ChevronDown`) que
         expande mostrando `<SlideRowExpanded>` debajo.
    2.2. State local `expandedSlideId: string | null` en el panel.

    ## 3. SlideRowExpanded
    3.1. Props: `slide`, `templateDescriptor`.
    3.2. Para cada `templateSlot`:
         - Card con header: `slot.key` + acceptedModules pills.
         - Body:
           - Dropdown "module type" con las opciones de `acceptedModules` +
             "(none)" para no configurarlo.
           - Si hay module: form correspondiente (los 6 components nuevos).
         - onChange dispatcha `updateSlide` con el slot[]actualizado.
    3.3. Si el slide tiene `slots: []` por defecto, el form arranca con cada
         slot en "(none)". El operador elige module type y el form aparece.

    ## 4. 6 Module forms
    Cada form es un client component que recibe `{ module, onChange }` y
    renderiza inputs para los campos del schema. Output: `SignageModuleInstance`.
    Al cambiar un campo, llama `onChange(nuevoModule)`.

    4.1. **EventsModuleForm**:
         - layout select (hero-grid / list / mosaic).
         - maxItems number 1-20.
         - titleOverride text input opcional.
         - filter.categories (comma-separated input → array).

    4.2. **SocialModuleForm**:
         - layout select (grid-tweet / mosaic / single / ticker).
         - maxPosts number 1-24.
         - rotationIntervalSec number 2-60.
         - filter.hashtag text + filter.network select.

    4.3. **VideoImageModuleForm**:
         - asset.url text input + asset.kind select (video/image).
         - loop checkbox.
         - fit select (cover/contain).

    4.4. **AdsModuleForm**:
         - asset.url + asset.kind.
         - link text input.
         - qr text input.
         - weight number 1-10.

    4.5. **NewsModuleForm**:
         - layout select (icon-headline-body / card).
         - maxItems number 1-10 opcional.

    4.6. **WeatherModuleForm**:
         - layout select (compact / detailed / hero).

    ## 5. Overrides reactivos en runtime
    5.1. `<SignagePlayer>` ahora suscribe a `useSignageBridgeStore`:
         - Lee `displayPatch`. Si existe, mergear shallow con prop `display`:
           `effectiveDisplay = displayPatch ? { ...display, ...displayPatch } : display`.
         - Renderizar usando `effectiveDisplay.settings` y
           `effectiveDisplay.playlist`.
    5.2. **Importante**: el shallow merge debe preservar el shape válido del
         schema. Si el patch trae `playlist` parcial, debe ser un array completo.
         El editor envía siempre el draft completo (no patches incrementales),
         así que el merge funciona.
    5.3. Los 8 templates NO se tocan — el cambio está aislado en el player.
         Cuando el slide cambia (por reorder o new slide), el player ya
         recompila la rotación con la lista nueva.

    ## 6. Out of scope (DSS5.5+)
    - Client overrides reactivos (header/branding) — DSS5.5 si surge.
    - AI suggest hooks (events.titleOverride, news inferencia) — DSS5.5.
    - daysOfWeek granular en schedules — DSS4.5.
    - Asset upload (los URLs son texto manual) — DSS7 cuando llegue Vercel Blob signage.
  </action>
  <verify>
    - `pnpm typecheck` ✅
    - `pnpm exec eslint` archivos tocados ✅
    - `pnpm kiosk:dev` arranca limpio
    - Editor `/studio/digital-displays/default/displays/lobby-tv`:
      - Click chevron de un slide → se expande mostrando slots según template.
      - Slide events (`01-full-events`): slot "main" acceptedModules `events`.
      - Cambiar layout a "mosaic" → autosave dispara → iframe refleja en push
        live (sin reload).
      - Add slide nuevo (`02-full-ad`) → slot "main" → cambiar asset.url → save.
    - Refrescar página → cambios persisten.
    - Sin regression del kiosk.
  </verify>
  <done>
    - 6 module forms operativos.
    - Slide expand/collapse funcional.
    - Overrides reactivos del display en `<SignagePlayer>`.
    - Bridge push live se refleja en iframe sin reload.
    - DSS5 marcado ✅ en SIGNAGE-ROADMAP.md.
    - Aprobación visual.
  </done>
</task>
```

## Notas de diseño

- **Template catalog client-safe** vs reusar registry runtime: el registry
  importa los componentes Render con SSR cost; el catalog es un POJO ligero
  que solo describe el shape. Sync manual hasta DSS5.5 si surge necesidad.
- **Forms con campos primarios solamente**: el schema tiene mucho detalle
  (filter por kind, modules variantes). DSS5 entrega el flow base; DSS5.5
  añade UI elaborada por kind si surge feedback de usuario real.
- **Shallow merge en SignagePlayer**: porque el editor envía draft completo
  (no incremental). Si DSS5.5 introduce patches incrementales, sustituir por
  deep merge con cuidado.
- **Sin client overrides en DSS5**: el branding/header live preview cambia
  raramente en signage (a diferencia del kiosk). DSS5.5 lo cabla si surge
  necesidad. El operador hoy hace save y reload del iframe para ver branding.

## Out of scope explícito

- AI suggest hooks (Anthropic API) — DSS5.5.
- Asset upload via Vercel Blob — DSS7.
- daysOfWeek granular schedules — DSS4.5.
- Client (branding/header) live preview — DSS5.5.
- Slot/module preview thumbnails — DSS5.5.
