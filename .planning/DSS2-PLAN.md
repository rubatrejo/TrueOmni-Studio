# DSS2-PLAN.md — Display editor con preview iframe live

Atomic plan ejecutable en sesión fresca. Introduce el editor del display
individual con sidebar de settings + playlist read-only y un preview iframe
live del runtime al lado. **DSS2 sigue read-only**: la edición de settings y
playlist aterriza en DSS4-DSS5. El bridge bidireccional (cambios en sidebar
→ iframe) llega en DSS3.

```xml
<task type="auto">
  <name>DSS2 — Display editor: sidebar settings/playlist + iframe live del runtime</name>
  <files>
    src/app/studio/digital-displays/[slug]/displays/[displaySlug]/page.tsx   (NUEVO — server component carga client + display + tokens)
    src/app/studio/digital-displays/_components/DisplayEditor.tsx            (NUEVO — orquesta layout 2-col sidebar + iframe)
    src/app/studio/digital-displays/_components/display/DisplaySettingsPanel.tsx  (NUEVO — settings read-only)
    src/app/studio/digital-displays/_components/display/PlaylistPanel.tsx        (NUEVO — playlist read-only)
    src/app/studio/digital-displays/_components/display/PreviewFrame.tsx          (NUEVO — iframe wrapper con refresh + open-in-new-tab)
    src/app/studio/digital-displays/_components/tabs/DisplaysTab.tsx              (cambio: cards de display ahora navegan al display editor en lugar de abrir preview directo)
    .planning/DSS2-SUMMARY.md
    .planning/SIGNAGE-ROADMAP.md
  </files>
  <action>
    ## 1. Server page `/studio/digital-displays/[slug]/displays/[displaySlug]`
    1.1. Server component force-dynamic.
    1.2. Carga en paralelo: `loadSignageClient(slug)`, `loadSignageDisplay(slug, displaySlug)`.
         Si client === null o display === null → notFound().
    1.3. Pasa `client`, `display` al `<DisplayEditor>`.

    ## 2. `<DisplayEditor>` (client)
    2.1. Props: `client: SignageClientResolved`, `display: SignageDisplayConfig`.
    2.2. Layout: shell del Studio (`<StudioPageHeader>`) + breadcrumb `←
         <client.name>` (volvemos a `/studio/digital-displays/<slug>` con
         tab Displays activo idealmente — pero como state está en cliente,
         volvemos a la default tab Branding; NO usamos query string en DSS2).
    2.3. Hero: nombre del display + slug pill + "X slides · Y resolution".
    2.4. Layout grid 2-col `[420px_1fr]` (mobile: stack):
         - Izquierda (sidebar): `<DisplaySettingsPanel>` arriba +
           `<PlaylistPanel>` abajo, separados por gap.
         - Derecha: `<PreviewFrame>` con iframe 16:9 escalado.

    ## 3. `<DisplaySettingsPanel>` read-only
    3.1. Muestra `display.settings`:
         - `targetResolution` pill (1080p | 4k).
         - `audio` toggle chip.
         - `defaultDurationMs` ms-pill.
         - `defaultTransition` pill.
         - `sleepSchedule` (si enabled): start–end pills + day labels (todo o "every day").
    3.2. Banner "Editor read-only en DSS2. Edición de settings llega en DSS4."

    ## 4. `<PlaylistPanel>` read-only
    4.1. Lista de cards compactas, una por slide:
         - Index 1-based + templateId mono.
         - Duration `${durationMs/1000}s`.
         - Transition pill (override del default si existe).
         - Schedule kind chip (always | hours · {start–end} | date-range · {start–end}).
    4.2. Banner "Drag-to-reorder + add slide en DSS4."
    4.3. Botón "Add slide" disabled.

    ## 5. `<PreviewFrame>` con iframe live
    5.1. Wrapper aspect-video (16:9) que escala al ancho disponible.
    5.2. `<iframe src="/signage/<clientSlug>/<displaySlug>" loading="lazy" />`
         con `allow="autoplay; fullscreen"` y border tokenizado.
    5.3. Toolbar arriba del iframe:
         - Botón "Reload" (refresca iframe via key bump).
         - Botón "Open in new tab" → abre runtime en nueva pestaña.
    5.4. Indicador de carga simple (skeleton bg) mientras el iframe hidrata.
    5.5. NO bridge bidireccional aún (DSS3). El iframe muestra el runtime tal
         cual, leyendo desde fs.

    ## 6. Click navigation desde DisplaysTab
    6.1. `<DisplaysTab>`: las cards de display dentro del ThemeEditor ahora
         son `<Link>` a `/studio/digital-displays/<client>/displays/<display>`,
         NO abren preview directo.
    6.2. Mantener un botón "Preview ↗" pequeño en cada card para abrir runtime
         en nueva tab (no es la acción primaria, pero útil como atajo).

    ## 7. Out of scope (DSS3+)
    - Bridge editor↔preview-iframe via postMessage + KV (DSS3).
    - Edición de settings (DSS4).
    - Drag-to-reorder + Add slide wizard (DSS4).
    - Module editors (DSS5).
    - Snapshots / Versions (DSS6).
    - Publish (DSS7).
  </action>
  <verify>
    - `pnpm typecheck` ✅
    - `pnpm exec eslint` archivos tocados ✅
    - `pnpm kiosk:dev` arranca limpio
    - `/studio/digital-displays/default` (theme editor) → tab Displays →
      click en card de `lobby-tv` navega a
      `/studio/digital-displays/default/displays/lobby-tv`.
    - El editor del display muestra sidebar (settings + playlist) y un iframe
      live a la derecha con la rotación funcionando.
    - Botones Reload y Open-in-new-tab funcionan.
    - Breadcrumb regresa al theme editor.
    - Sin regression del kiosk (`/studio` y runtime `/signage/...`).
  </verify>
  <done>
    - 1 nueva ruta `/studio/digital-displays/<slug>/displays/<displaySlug>`.
    - Sidebar 2-panel (settings + playlist) read-only.
    - Iframe live funcionando con refresh + open-in-new-tab.
    - Click en display card navega al display editor.
    - DSS2 marcado ✅ en SIGNAGE-ROADMAP.md.
    - Aprobación visual.
  </done>
</task>
```

## Notas de diseño

- **Iframe security**: `loading="lazy"` evita carga eager si el editor está
  lejos del scroll. `allow="autoplay; fullscreen"` permite que el video
  template 03 se reproduzca automáticamente. Sin `sandbox` en DSS2 — DSS3
  añadirá `sandbox="allow-scripts allow-same-origin"` cuando introduzca el
  bridge.
- **Sin URL state para tabs/return**: el breadcrumb vuelve al theme editor
  con la default tab activa (Branding). Aceptable en DSS2 — DSS3+ puede
  introducir query strings (`?tab=displays`) si el patrón se vuelve molesto.
- **Aspect-video del iframe**: el runtime es 1920×1080 base. `aspect-video`
  (16:9) garantiza que la proporción se preserve al escalar. SignageStage
  internamente hace fit-contain con letterbox.
- **`key` para forzar reload del iframe**: simple state increment cambia el
  key del iframe, lo cual lo desmonta + remonta. Más robusto que tocar `src`.

## Out of scope explícito

- No tocamos el runtime `/signage/<client>/<display>` ni el schema.
- No introducimos `iframe-ref` postMessage (DSS3).
- No editamos settings ni playlist (DSS4).
- No tocamos `kvSignageDisplay` ni `kvSignageClient`.
