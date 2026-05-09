# DSS1-SUMMARY.md — Theme editor con tabs (read-only)

**Fecha:** 2026-05-07
**Estado:** ✅ aprobado visualmente

## Hecho

Reintroduce `/studio/digital-displays/[slug]` como **editor del signage theme**
con un sistema de 5 tabs. Read-only en DSS1: muestra la configuración
filesystem tal cual; los formularios editables aterrizan en DSS5+ (Branding,
Header, módulos), DSS6 (Versions), DSS7 (Publish).

### Server page

- `src/app/studio/digital-displays/[slug]/page.tsx` (nuevo) — server component
  force-dynamic. Carga `loadSignageClient(slug)` + `listSignageDisplays(slug)`
  - `loadSignageTokensCss(slug)` en paralelo. Si client === null → notFound().
    Pasa todo al `<ThemeEditor>`.

### `<ThemeEditor>` (client)

- Breadcrumb "← All signage themes" → `/studio/digital-displays`.
- Hero con `client.name` + slug pill + count displays + locale + timezone.
- Botón "Preview {firstDisplay.slug}" top-right → abre `/signage/<slug>/<display>`
  en nueva tab.
- Banner ámbar "Editor read-only en DSS1".
- Sidebar vertical de 5 tabs (lucide icons + label + badge `DSS6/7` para
  disabled): Branding (Palette), Header (LayoutPanelTop), Displays (Monitor),
  Versions (History · disabled), Publish (Send · disabled).
- Content area renderiza el componente del tab activo. Cambio de tab via
  `useState` sin recargar.

### Tabs

| Tab      | Componente        | Estado      | Contenido                                                                                                                                                       |
| -------- | ----------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branding | `BrandingTab.tsx` | read-only   | logos default+dark, fonts default+display, tabla de token overrides, pre-block con `tokens.css` resuelto                                                        |
| Header   | `HeaderTab.tsx`   | read-only   | position/height/layout pills, toggles showLogo/Weather/Clock (enabled/disabled chips), clockFormat/weatherUnits/forecastDays, background (color/gradient/image) |
| Displays | `DisplaysTab.tsx` | read-only   | lista de displays con Monitor icon + name + slug + slidesCount + "Preview ↗"                                                                                    |
| Versions | `VersionsTab.tsx` | placeholder | hint con icono + copy "DSS6"                                                                                                                                    |
| Publish  | `PublishTab.tsx`  | placeholder | hint con icono + copy "DSS7" + botón disabled                                                                                                                   |

### Dashboard actualizado

- `<ClientsDashboard>`: card del theme YA NO abre preview directo. Ahora es un
  `<Link href="/studio/digital-displays/<slug>">` que navega al editor en la
  misma pestaña.
- Footer del card cambió: "Preview <slug> ↗" → "Open editor →".
- Banner del dashboard actualizado: "Editor read-only en DSS1" reemplaza al
  banner DSS0.
- Preview se mueve al header del editor (botón explícito).

## Archivos tocados

| Archivo                                                            | Tipo                              |
| ------------------------------------------------------------------ | --------------------------------- |
| `src/app/studio/digital-displays/[slug]/page.tsx`                  | NUEVO                             |
| `src/app/studio/digital-displays/_components/ThemeEditor.tsx`      | NUEVO                             |
| `src/app/studio/digital-displays/_components/tabs/BrandingTab.tsx` | NUEVO                             |
| `src/app/studio/digital-displays/_components/tabs/HeaderTab.tsx`   | NUEVO                             |
| `src/app/studio/digital-displays/_components/tabs/DisplaysTab.tsx` | NUEVO                             |
| `src/app/studio/digital-displays/_components/tabs/VersionsTab.tsx` | NUEVO                             |
| `src/app/studio/digital-displays/_components/tabs/PublishTab.tsx`  | NUEVO                             |
| `src/app/studio/digital-displays/_components/ClientsDashboard.tsx` | card → editor link, banner update |
| `.planning/DSS1-PLAN.md`                                           | NUEVO                             |
| `.planning/DSS1-SUMMARY.md`                                        | NUEVO                             |

## Verificado

- `pnpm typecheck` ✅ limpio.
- `pnpm exec eslint src/app/studio/digital-displays/` ✅ limpio.
- `pnpm kiosk:dev` arranca sin errores nuevos.
- `/studio/digital-displays` (dashboard) → cards navegan al editor.
- `/studio/digital-displays/default` → editor con 5 tabs funcionales.
- Click en cada tab cambia contenido sin recargar.
- Preview abre `/signage/default/lobby-tv` en nueva tab.
- Breadcrumb regresa al dashboard.
- Sin regression del kiosk (`/studio` y `/`).
- Aprobación visual de Rubén ✅.

## Decisiones

- **Read-only en DSS1**: el objetivo es entregar la **estructura** del editor
  (rutas, tabs, navegación). Los formularios editables esperan a DSS5+ con
  primitivas Field/TextInput. Esto desbloquea DSS2 (preview iframe) y DSS3
  (bridge KV) sin saltar steps.
- **Sidebar vertical en lugar de tabs horizontales**: consistencia con el
  patrón Shell del kiosk editor. Mobile responsive con `flex-row` overflow-x.
- **Versions y Publish disabled visible**: el contrato es claro. El usuario ve
  la promesa de extensibilidad sin poder activarlas todavía.
- **Card del dashboard navega al editor, no al preview**: el preview se mueve
  al header del editor. Más natural una vez que el editor existe — el
  dashboard es navegación, el editor es contexto.
- **Breadcrumb en lugar de tabs en el header**: el patrón del Studio kiosk
  también usa breadcrumbs. Mantenemos consistencia.

## Pendiente / siguiente sub-fase

**DSS2** — Display editor (sidebar + preview iframe). Cuando el usuario hace
click en un display dentro del Displays tab, abre un editor del display con
preview iframe live de `/signage/<client>/<display>` al lado de los controles.
DSS3 introduce el bridge bidireccional (cambios en el editor reflejados en el
iframe vía postMessage + KV).
