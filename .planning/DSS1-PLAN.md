# DSS1-PLAN.md — Theme editor con tabs (Branding · Header · Displays · Versions · Publish)

Atomic plan ejecutable en sesión fresca. Reintroduce
`/studio/digital-displays/<slug>` como **editor del signage theme** con un
sistema de tabs. **DSS1 es read-only** (muestra configuración fs sin permitir
edición); las acciones de save/publish llegan en DSS5..DSS7. Click en card del
dashboard ahora navega aquí en lugar de abrir preview directo.

```xml
<task type="auto">
  <name>DSS1 — Theme editor con tabs read-only (Branding · Header · Displays · Versions · Publish)</name>
  <files>
    src/app/studio/digital-displays/[slug]/page.tsx                    (NUEVO — server component carga client + displays + tokens)
    src/app/studio/digital-displays/_components/ThemeEditor.tsx        (NUEVO — orquesta tabs + content)
    src/app/studio/digital-displays/_components/tabs/BrandingTab.tsx   (NUEVO — logos, fonts, tokens read-only)
    src/app/studio/digital-displays/_components/tabs/HeaderTab.tsx     (NUEVO — position, layout, weather/clock settings read-only)
    src/app/studio/digital-displays/_components/tabs/DisplaysTab.tsx   (NUEVO — lista displays + slidesCount + Preview link)
    src/app/studio/digital-displays/_components/tabs/VersionsTab.tsx   (NUEVO — placeholder DSS6)
    src/app/studio/digital-displays/_components/tabs/PublishTab.tsx    (NUEVO — placeholder DSS7)
    src/app/studio/digital-displays/_components/ClientsDashboard.tsx   (cambiar href de card: a /studio/digital-displays/<slug> en lugar de tab nueva)
    .planning/DSS1-SUMMARY.md
    .planning/SIGNAGE-ROADMAP.md
  </files>
  <action>
    ## 1. Server page `/studio/digital-displays/[slug]`
    1.1. Server component force-dynamic.
    1.2. Carga en paralelo: `loadSignageClient(slug)`, `listSignageDisplays(slug)`,
         `loadSignageTokensCss(slug)`. Si client === null → notFound().
    1.3. Pasa `client`, `displays`, `tokensCss` al `<ThemeEditor>` client component.

    ## 2. `<ThemeEditor>` (client)
    2.1. Props: `client: SignageClientResolved`, `displays: SignageDisplayListEntry[]`,
         `tokensCss: string`.
    2.2. State `activeTab: 'branding' | 'header' | 'displays' | 'versions' | 'publish'`.
         Default `'branding'`.
    2.3. Layout: shell del Studio (`<StudioPageHeader>`) + breadcrumb
         "← All signage themes" + hero con `client.name` + slug pill +
         "Preview" button (abre primer display en nueva tab) + sidebar tabs
         + content area.
    2.4. Sidebar vertical de tabs (mimetiza el patrón del kiosk editor con
         icons): Branding (Palette icon), Header (LayoutTop icon),
         Displays (Monitor icon), Versions (History icon, disabled),
         Publish (Send icon, disabled).
    2.5. Content area renderiza el componente del tab activo.

    ## 3. Tabs read-only (DSS1)
    3.1. **`<BrandingTab>`**: muestra
         - `client.branding.logos.default` (path + preview img si existe en
           `/signage-assets/<slug>/<path>`).
         - `client.branding.fonts.default` + `display` (texto).
         - `client.branding.tokens` (record key→value HSL) en tabla.
         - Banner "Editor read-only en DSS1. Edición arriba en DSS5+."
    3.2. **`<HeaderTab>`**: muestra
         - `client.header.position` (top|bottom).
         - `client.header.height`, `layout`, `clockFormat`, `weatherUnits`,
           `forecastDays`.
         - `client.header.background` (kind + color/gradient/image).
         - Toggles `showLogo`, `showWeather`, `showClock` como pills read-only.
    3.3. **`<DisplaysTab>`**: muestra
         - Lista cards compactas de displays: `slug`, `name`, `slidesCount`,
           "Preview" link.
         - Banner "El editor del display llega en DSS2+."
    3.4. **`<VersionsTab>`**: placeholder "History de versiones llega en DSS6".
         Lista mock de 1 entry "current · today" para hint visual.
    3.5. **`<PublishTab>`**: placeholder "Publish llega en DSS7".
         Botón "Publish" disabled con tooltip.

    ## 4. Router del dashboard
    4.1. `<ClientsDashboard>`: card del theme YA NO abre preview directo.
         Ahora navega a `/studio/digital-displays/<slug>` (link interno).
    4.2. La preview del primer display se mueve al header del editor (el
         botón "Preview" queda dentro del editor de cada theme).

    ## 5. Reusar tokens del layout
    5.1. El layout `/studio/digital-displays/layout.tsx` ya inyecta tokens
         del default. Funciona para DSS1 (todos los themes muestran mismo
         gradient en branding tab). En DSS5+ cuando se permita branding
         per-theme, el layout cargará el tokens del slug activo dinámicamente.

    ## 6. Out of scope (DSS2..DSS9)
    - Preview iframe live (DSS2).
    - Bridge editor↔preview con KV (DSS3).
    - Playlist editor con drag-to-reorder (DSS4).
    - Module editors (Events / SocialWall / VideoImage / Ads / News / Weather) (DSS5).
    - Snapshots / Versions cliente + display (DSS6).
    - Publish a `clients-signage/<slug>/` via GitHub PR (DSS7).
    - Diagnostics + onboarding tour signage + i18n editor extension (DSS8).
    - Smoke E2E producción (DSS9).
  </action>
  <verify>
    - `pnpm typecheck` ✅
    - `pnpm exec eslint` archivos tocados ✅
    - `pnpm kiosk:dev` arranca limpio
    - `/studio/digital-displays` (dashboard) sigue OK; cards navegan ahora a `/studio/digital-displays/<slug>`.
    - `/studio/digital-displays/default` carga el editor con tabs.
    - Click en cada tab cambia el contenido sin recargar.
    - "Preview" abre `/signage/default/lobby-tv` en nueva tab.
    - Breadcrumb "← All signage themes" navega al dashboard.
    - Sin regression del kiosk (`/studio` sigue funcional).
  </verify>
  <done>
    - 1 nueva ruta `/studio/digital-displays/<slug>`.
    - 5 tabs funcionales (3 read-only con datos reales, 2 placeholders).
    - Card del dashboard navega al editor, no a preview directo.
    - Botón Preview disponible en header del editor.
    - DSS1 marcado ✅ en SIGNAGE-ROADMAP.md.
    - Aprobación visual del usuario.
  </done>
</task>
```

## Notas de diseño

- **Read-only en DSS1**: el objetivo es entregar la **estructura** del editor
  con tabs y rutas. Los formularios editables aterrizan en DSS5 con primitivas
  Field/TextInput. DSS1 demuestra que la navegación cross-tab y el routing
  funcionan, sin invertir en CRUD complejo todavía.
- **Sidebar vertical** en lugar de tabs horizontales para mantener consistencia
  con el editor del kiosk (Shell.tsx usa sidebar). Reusa lucide icons.
- **No hay preview iframe en DSS1**: el botón "Preview" abre nueva pestaña.
  DSS2 introduce iframe live + DSS3 el bridge bidireccional.
- **VersionsTab y PublishTab disabled**: el contrato es claro — son placeholders
  para mostrar que el patrón de tabs es extensible. El usuario ve que existirán
  pero no puede activarlos hasta su sub-fase.

## Out of scope explícito

- No tocamos `loadSignageClient` ni `listSignageDisplays` (ya entregados en DSS0).
- No tocamos el runtime `/signage/<client>/<display>`.
- No introducimos KV runtime (kvSignageClient/Display siguen no cableados).
- No añadimos NewClientModal — esperamos a DSS5/7 (publish flow lo necesitará).
