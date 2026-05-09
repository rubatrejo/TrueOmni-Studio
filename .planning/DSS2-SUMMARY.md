# DSS2-SUMMARY.md — Display editor con preview iframe live

**Fecha:** 2026-05-07
**Estado:** ✅ aprobado visualmente

## Hecho

Introduce el editor del display individual con sidebar settings/playlist
read-only y preview iframe live del runtime al lado.

### Server page

- `src/app/studio/digital-displays/[slug]/displays/[displaySlug]/page.tsx`
  (NUEVO) — server component force-dynamic. Carga `loadSignageClient(slug)`
  - `loadSignageDisplay(slug, displaySlug)` en paralelo. Si client o display
    null → notFound(). Pasa al `<DisplayEditor>`.

### `<DisplayEditor>` (client)

- Layout 2-col `[420px_1fr]` desktop / stack mobile.
- Sidebar izquierda contiene `<DisplaySettingsPanel>` arriba +
  `<PlaylistPanel>` abajo, separados por gap.
- Derecha contiene `<PreviewFrame>` con iframe live.
- Breadcrumb "← {client.name}" → theme editor.
- Hero: name + slug + slidesCount + targetResolution.
- Banner ámbar "Editor read-only en DSS2".

### `<DisplaySettingsPanel>` read-only

- Resolution pill (1080p|4k).
- Audio toggle (enabled/disabled chip).
- Default duration (s).
- Default transition pill.
- Sleep schedule (start–end pills si enabled, "disabled" italic si no).

### `<PlaylistPanel>` read-only

- Lista de cards compactas, una por slide:
  - Index 1-based en mono-pill.
  - templateId font-mono truncado.
  - Duration en segundos.
  - Transition pill sky si override del default, gray si inherits.
  - Schedule pill amber si `kind: 'hours'` o `'date-range'` (con start–end).
- Botón "Add slide" disabled (DSS4).

### `<PreviewFrame>` con iframe live

- Aspect-ratio 16:9 con `aspectRatio: "16 / 9"` inline (escala al ancho).
- `<iframe src="/signage/<slug>/<display>" loading="lazy" allow="autoplay; fullscreen" />`
  con border tokenizado.
- Toolbar arriba: botones "Reload" (bump del key del iframe → desmonta+remonta) y
  "New tab" (abre runtime en pestaña nueva).
- Sin sandbox en DSS2 — DSS3 lo añadirá cuando introduzca el bridge.

### Click navigation

- `<DisplaysTab>`: las cards de display ahora son `<Link>` al display editor
  (acción primaria), con un botón "Preview ↗" pequeño como atajo a runtime
  en nueva tab.

## Archivos tocados

| Archivo                                                                        | Tipo               |
| ------------------------------------------------------------------------------ | ------------------ |
| `src/app/studio/digital-displays/[slug]/displays/[displaySlug]/page.tsx`       | NUEVO              |
| `src/app/studio/digital-displays/_components/DisplayEditor.tsx`                | NUEVO              |
| `src/app/studio/digital-displays/_components/display/DisplaySettingsPanel.tsx` | NUEVO              |
| `src/app/studio/digital-displays/_components/display/PlaylistPanel.tsx`        | NUEVO              |
| `src/app/studio/digital-displays/_components/display/PreviewFrame.tsx`         | NUEVO              |
| `src/app/studio/digital-displays/_components/tabs/DisplaysTab.tsx`             | card → editor link |
| `.planning/DSS2-PLAN.md`                                                       | NUEVO              |
| `.planning/DSS2-SUMMARY.md`                                                    | NUEVO              |

## Verificado

- `pnpm typecheck` ✅ limpio.
- `pnpm exec eslint src/app/studio/digital-displays/` ✅ limpio.
- `pnpm kiosk:dev` arranca sin errores.
- `/studio/digital-displays/default/displays/lobby-tv` renderiza editor con
  iframe live mostrando rotación de los 8 templates.
- Botón Reload bumpea key y recarga iframe.
- Botón New tab abre runtime en pestaña nueva.
- Breadcrumb regresa al theme editor.
- Click en card de display dentro del tab Displays navega aquí.
- Sin regression del kiosk (`/studio` y runtime `/signage/...`).
- Aprobación visual de Rubén ✅.

## Decisiones

- **Iframe `loading="lazy"`** evita carga eager si el editor está fuera del
  viewport. `allow="autoplay; fullscreen"` permite que el video del template
  03 se reproduzca automáticamente.
- **Bump del `key` para reload**: más robusto que tocar `src` (algunos
  navegadores cachean). Desmonta + remonta el iframe limpio.
- **Sin sandbox en DSS2**: el bridge bidireccional de DSS3 añadirá
  `sandbox="allow-scripts allow-same-origin"` para enclaustrar el runtime.
- **Aspect-ratio 16:9 con inline style**: garantiza la proporción exacta del
  runtime 1920×1080 escalado uniformemente. SignageStage internamente hace
  fit-contain con letterbox tokenizado, así que cualquier aspect anómalo del
  contenedor se resuelve dentro.
- **Click primario en card del Displays tab → editor; preview ↗ secundario**:
  el flow natural es ir al editor; abrir directo el runtime es atajo de QA
  rápida. Coherente con el patrón Studio (cards llevan al editor).

## Pendiente / siguiente sub-fase

**DSS3** — Bridge `signage:*` events live preview. Establece comunicación
bidireccional editor ↔ iframe vía postMessage + KV. Cambios en sidebar
(cuando DSS4 los habilite) reflejados en el iframe sin recargar URL.
Activa el loader híbrido KV→fs en runtime (`loadSignageDisplay` lee KV
primero, fallback fs).
