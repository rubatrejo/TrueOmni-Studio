# Follow-up — Frames branded del Photo Booth v2 (feedback Rubén 2026-06-15)

Sobre la feature ya desplegada (`eee5780`). Pendiente para sesión fresca (se pausó
por límite de contexto). Reutiliza `src/lib/studio/photobooth-frame-templates.ts`,
`photobooth-frame-generate.ts`, el editor `photo-booth/tabs.tsx` (FramesTab) y el
schema `schema/photo-booth.ts`.

## Cambios pedidos

### Tweaks a plantillas existentes

1. **`branded-border` (label "Frame"):** el logo/footer queda muy pegado al borde →
   separarlo (subir el footer / más margen interior respecto al stroke de 96px).
2. **`branded-top-bottom-bands` (label "Bands"):** la banda inferior ya usa
   `secondaryHex`; añadir un **hashtag editable** (ver campos nuevos) en esa banda
   inferior (en vez de/además del nombre).

### Campos editables nuevos por cliente (CLAVE)

Los frames con frase/hashtag deben llevar **texto editable por cliente**. Añadir a
`PhotoBoothSchema` (opcionales, retrocompat):

- `frameTagline?: string` (ej. "Closer than you think. Cooler than you expect." /
  "DeKalibrate Deeper")
- `frameHashtag?: string` (ej. "#DiscoverDeKalb")

Cablear: schema → `generateAndSavePhotoBoothFrames` lee `cfg.photoBooth.frameTagline/
frameHashtag` y los pasa a `FrameTemplateInput` → `FrameSvgContext` (`tagline`,
`hashtag`) → las plantillas que los usan. **UI:** dos inputs de texto en el editor
del Photo Booth (FramesTab o una sección "Frame text") para tagline + hashtag.
Default vacío → la plantilla cae al nombre del cliente o lo omite.

### 4 plantillas nuevas (inspiradas en los frames reales de Discover Dekalb)

Centro transparente, brand colors + logo + tagline/hashtag editables. Refs vistas:

1. **`branded-logo-bottom`** — solo el logo del cliente centrado abajo, resto
   transparente (minimalista, sin bandas). (Ref Frame-1)
2. **`branded-angled-band`** — banda inferior dividida en **diagonal** en dos colores
   (primary + accent/secondary); logo abajo-izquierda + **tagline** abajo-derecha,
   ambos blancos. (Ref Frame-2)
3. **`branded-solid-border-tab`** — borde sólido full en `primaryHex` alrededor de un
   hueco central (transparente); **tab redondeada** arriba-izquierda con el logo;
   **tagline** centrada abajo en blanco. (Ref Frame-3)
4. **`branded-diagonal-corners`** — cuña diagonal en esquina superior-izquierda
   (`secondaryHex`/olive) con **tagline** + cuña inferior-derecha (`primaryHex`/navy)
   con el **logo** centrado abajo. (Ref Frame-4)

## Notas / riesgos

- **Fuente del tagline:** las refs usan tipografía script/handwritten. sharp/librsvg
  solo tiene fuentes del sistema (Helvetica/Arial) salvo que se embeba una fuente en
  el SVG (`@font-face` con data-URI woff). Decidir: aceptar sans, o embeber una fuente
  script. Anotar como decisión abierta.
- **Diagonales:** usar `<polygon>`/`<path>` con clip; thumbnails siguen rellenando el
  círculo (gradiente bg) — ya implementado en `renderFrameThumbnail`.
- El set crecería a ~10 plantillas → confirmar con Rubén si reemplaza algunas o suma.
- Retrocompat: campos nuevos opcionales; verificar `validate:configs` + editor con
  config viejo.
- Verificación: 17→N tests de plantillas (centro alpha=0, tagline/hashtag rendering),
  contact-sheet visual, deploy READY, confirmación de Rubén en su Studio.

```
Refs guardadas por Rubén: Google Drive .../Discover Dekalb/Photo Booth/Frames/Frame-1..4.png
```
