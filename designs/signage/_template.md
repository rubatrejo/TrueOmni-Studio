# designs/signage/NN-<name>.md — Plantilla de specs por template signage

Cada template del catálogo Digital Display (8 totales) se documenta con un `.svg`,
un `.png` (referencia visual rasterizada) y este `.md` que captura la información
necesaria para replicarlo pixel-perfect.

**Resolución base:** 1920×1080 (16:9 landscape). Todas las medidas de este doc
son en pixels @ 1080p baseline. El `<SignageStage>` aplica `transform: scale`
uniforme al renderear a otras resoluciones (4K = 2.0x).

---

## 1. Identidad

- **ID:** `NN-name` (ej `01-full-events`).
- **Categoría:** `fullscreen` | `composed`.
- **SVG fuente:** `designs/signage/NN-name.svg`.
- **PNG referencia:** `designs/signage/NN-name.png`.
- **Última actualización:** YYYY-MM-DD.

## 2. Header común

Todos los templates incluyen el header universal (logo + 5-day weather + clock).
Su altura por defecto es 80px. El cliente lo configura en su Branding signage.
Position default = `top` (como en el SVG); el toggle a `bottom` es runtime.

## 3. Slots del template

Lista declarativa de slots con sus dimensiones y módulos aceptados:

| slotKey | kind | rect (x, y, w, h @ 1080p) | acceptedModules |
|---|---|---|---|
| ej `main` | hero | (0, 80, 1920, 1000) | events |
| ej `sidebar` | sidebar | … | events, social, ads |

## 4. Tokens consumidos

Lista los tokens CSS que el template usa explícitamente para que el auditor
pueda detectar drift:

- `--signage-brand-primary`
- `--signage-events-accent`
- (etc.)

## 5. Strings i18n

Lista los keys del namespace `signage.*` que el template hace bind. Aclara qué
contenido es interpolado vs estático del SVG.

## 6. Notas de implementación

- Animaciones internas (carrusel events, ticker news): nombre del módulo + intervalo default.
- Responsive: confirmar que el SVG no usa `vw`/`vh` (deben ser dimensiones absolutas).
- Cuidados específicos del SVG (paths con transforms, masks, gradients que requieren coords absolutas).

## 7. Pixel-perfect checklist

Ver `designs/signage/_coverage-template.md` para la checklist por template.
