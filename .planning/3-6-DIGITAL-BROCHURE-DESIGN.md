# Diseño — Módulo Digital Brochure (Fase 3.6)

## Contexto

El tile `digital-brochure` existe en el Home Dashboard pero sin módulo detrás.
Toca construirlo a partir de 3 PNGs/SVGs en `~/Desktop/Digital Brochure/`:

- `Brochures.png` — listado (hero + search bar + tabs por categoría + lista
  vertical de cards con cover + metadata).
- `Brochures – Filter.png` — overlay de search con QWERTY y autocomplete.
- `Brochure Selection – 1.png` — reader del PDF (título + SEND TO EMAIL +
  cover grande + flechas ← → + scrubber con `N/total` + botones zoom/grid).

Motivación: muchos clientes (DMOs, hoteles, municipios) tienen brochures
oficiales (Visitors Guide, Travel Magazine, etc.) que quieren mostrar en el
kiosk y enviárselos al usuario por email para que se los lleve.

**Decisiones del brainstorming:**

1. **Formato**: PDF real con `pdfjs-dist`. El cliente sube los PDFs; el
   reader los renderiza a canvas.
2. **Search**: filtra `title + description` client-side. No full-text.
3. **Icono zoom-out (⊞)**: hace zoom out progresivo. Cuando llega al mínimo
   (fit-to-screen), un click más abre la vista Grid con todas las páginas.
4. **SEND TO EMAIL**: reusa `SendToEmailModal` de listings/events. Captura
   email + muestra toast. El envío real (con link al PDF) es backend v2.
5. **Reader**: ruta `/home/digital-brochure/[slug]` con deep-link.
6. **Arquitectura**: `kind: 'digital-brochure'` en `features.home.modules`
   (simétrico a events/social-wall).

---

## 1. Modelo de datos

### 1.1 Tipo `BrochureItem` (nuevo, `src/lib/config.ts`)

```ts
export interface BrochureItem {
  slug: string;
  title: string; // "St. Louis - Art Bound"
  category: string; // uno de `module.categories`
  cover: string; // URL imagen cover (JPG/PNG)
  description: string; // 2–3 líneas
  publishedLabel: string; // "June, 2025" (human-readable)
  pdfUrl: string; // URL al PDF (mismo origin o CORS)
  pageCount: number; // para el scrubber "N/total" sin esperar al fetch
}
```

### 1.2 Tipo `HomeDigitalBrochureModule`

```ts
export interface HomeDigitalBrochureModule {
  kind: 'digital-brochure';
  label: string; // "Digital Brochures"
  heroImage: string;
  /** Categorías de los tabs (incluye implícito "Select all" al inicio). */
  categories: string[];
  brochures: BrochureItem[];
}
```

### 1.3 Unión `HomeModuleVariant`

Extender: `HomeModule | HomeEventsModule | HomeSocialWallModule | HomeDigitalBrochureModule`.

### 1.4 Config mock `clients/default/config.json`

- `kind: "digital-brochure"`, `label: "Digital Brochures"`.
- `heroImage`: URL Unsplash (magazine/lectura).
- `categories`: `["Guides", "Tours", "Things to Do", "Explore"]`.
- `brochures`: 4 items con PDFs públicos verificables (ej. mozilla/pdf.js
  sample PDFs, o archive.org). Ej:
  - St. Louis Art Bound (Explore)
  - Destination Maryland Travel Magazine (Explore)
  - Fairbanks Visitors Guide (Things to Do)
  - - 1 más tipo Guides/Tours.

---

## 2. Rutas

### 2.1 `/home/[module]/page.tsx`

Añadir switch:

```ts
if (mod?.kind === 'digital-brochure') {
  return <KioskCanvas>
    <BrochuresModule
      moduleKey={module}
      module={mod}
      header={<HomeHeader heroImage={mod.heroImage} showLanguage={false} />}
    />
  </KioskCanvas>;
}
```

### 2.2 `/home/[module]/[slug]/page.tsx`

Añadir caso `kind === 'digital-brochure'`: busca el brochure por slug,
renderiza `BrochureReader` fullscreen (sin el module list detrás — el reader
ocupa todo el canvas).

```ts
if (mod.kind === 'digital-brochure') {
  const brochure = mod.brochures.find(b => b.slug === slug);
  if (!brochure) notFound();
  return <KioskCanvas><BrochureReader brochure={brochure} /></KioskCanvas>;
}
```

---

## 3. Componentes nuevos (`src/components/digital-brochure/`)

### 3.1 `brochures-module.tsx`

Orquestador del listado:

- Header hero (prop).
- `BrochuresHeader` (banda azul "Digital Brochures" + search icon).
- `BrochuresTabs` (Select all + categorías).
- Lista scrollable (`BrochuresList`).
- `FloatingHomeButton`.
- Overlay search (reusa `OnScreenKeyboard` del home).

Estado: `activeCategory: string | 'all'` + `searchOpen: boolean`.

### 3.2 `brochures-header.tsx`

Banda azul `#004f8b` 1080×~95 con:

- Label "Digital Brochures" izquierda (Helvetica 36 white).
- Search icon (lupa) derecha — click abre overlay.

### 3.3 `brochures-tabs.tsx`

Row horizontal scrollable (overflow-x-auto) con:

- "Select all" (text azul underline cuando activo).
- Tabs de categorías (text gris cuando inactivo).
- Font Helvetica 22, letter-spacing 0.01em.
- Underline azul en el tab activo.

### 3.4 `brochures-list.tsx` + `brochure-card.tsx`

Lista vertical de cards horizontales. Cada card ~960×170:

- Cover izquierda 120×160 con `object-cover`.
- Padding right con:
  - Categoría uppercase gris (Helvetica 14).
  - Título Helvetica bold 24 black.
  - Descripción Helvetica 16 gris (3 líneas max, line-clamp).
  - Fecha `publishedLabel` Helvetica 14 gris oscuro.
- Click → `router.push('/home/digital-brochure/{slug}')`.
- Fondo `#f0f0f0`.

### 3.5 `brochures-search-overlay.tsx`

Overlay con:

- Input grande arriba ("What are you looking for?" placeholder).
- Botón SEARCH azul olive `#b9bd39`.
- "Search for: '{query}'" + lista de matches (title/description substring).
- Cada match = card pequeña con cover 36×48 + título.
- Click en match → `router.push('/home/digital-brochure/{slug}')`.
- QWERTY abajo — reusa `OnScreenKeyboard` de `@/components/home/on-screen-keyboard`.

### 3.6 `brochure-reader.tsx`

Viewer fullscreen del PDF:

- `BrochureReaderHeader` (banda azul con título + botón SEND TO EMAIL).
- `BrochureReaderStage`:
  - Fondo oscuro `#28292d`.
  - `BrochurePdfPage` centrado con zoom actual.
  - Flechas ← → grandes (circular azul 80×80) laterales para prev/next page.
- `BrochureReaderControls` bottom:
  - Counter `{current}/{total}` izquierda.
  - Botón ⊞ (grid/zoom-out).
  - Slider horizontal de página (thumb circular, arrastrar = seek).
  - Botones `+` `−` zoom.
- `BackButton` (reusa existente) para volver a `/home/digital-brochure`.

Estado:

- `currentPage: number`
- `zoomLevel: number` (1.0 = fit, 0.5 min → 3.0 max)
- `gridOpen: boolean`

Comportamiento del botón ⊞:

- Si `zoomLevel > MIN_ZOOM` → `zoomLevel -= 0.25`.
- Si ya en `MIN_ZOOM` → abre `BrochureGridOverview`.

### 3.7 `brochure-pdf-page.tsx`

Render de una página con pdf.js:

- Input: `pdf` object (cached) + `pageNumber` + `scale`.
- Output: `<canvas>` con el render.
- Debounce de re-render al cambiar zoom.
- Fallback: spinner mientras render.

### 3.8 `brochure-grid-overview.tsx`

Overlay modal que muestra todas las páginas como thumbnails (4 columnas).

- Cada thumbnail = canvas renderizado a baja resolución (scale 0.25).
- Click → salta a esa página + cierra grid.
- X close top-right.

---

## 4. Dependencias

### 4.1 `pdfjs-dist`

```bash
pnpm add pdfjs-dist
```

- Versión: latest stable (v4.x).
- Worker: copia `pdfjs-dist/build/pdf.worker.min.mjs` a `public/pdfjs/` o
  usa CDN. Setup en `src/lib/pdfjs-setup.ts`:
  ```ts
  import { GlobalWorkerOptions } from 'pdfjs-dist';
  GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
  ```

### 4.2 PDFs mock

URLs de test verificables:

- `https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf`
- `https://arxiv.org/pdf/2106.14834.pdf`
- `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`
- Otros similares para llenar los 4 slots.

---

## 5. Utils nuevos

### 5.1 `src/lib/pdfjs-setup.ts`

Worker setup + helper `loadPdf(url)` con cache por URL (`Map<string, PDFDocumentProxy>`).

### 5.2 `src/lib/brochures-filter.ts`

```ts
export function filterBrochures(
  brochures: readonly BrochureItem[],
  opts: { category?: string | 'all'; query?: string },
): BrochureItem[];
```

Match case-insensitive en `title + description` para query.

---

## 6. Archivos a crear / modificar

### Crear

- `src/lib/pdfjs-setup.ts`
- `src/lib/brochures-filter.ts`
- `src/components/digital-brochure/brochures-module.tsx`
- `src/components/digital-brochure/brochures-header.tsx`
- `src/components/digital-brochure/brochures-tabs.tsx`
- `src/components/digital-brochure/brochures-list.tsx`
- `src/components/digital-brochure/brochure-card.tsx`
- `src/components/digital-brochure/brochures-search-overlay.tsx`
- `src/components/digital-brochure/brochure-reader.tsx`
- `src/components/digital-brochure/brochure-reader-header.tsx`
- `src/components/digital-brochure/brochure-reader-controls.tsx`
- `src/components/digital-brochure/brochure-pdf-page.tsx`
- `src/components/digital-brochure/brochure-grid-overview.tsx`
- `public/pdfjs/pdf.worker.min.mjs` (copiado del paquete)

### Modificar

- `src/lib/config.ts` — añadir `BrochureItem`, `HomeDigitalBrochureModule`,
  extender unión `HomeModuleVariant`.
- `src/app/(kiosk)/home/[module]/page.tsx` — switch `kind === 'digital-brochure'`.
- `src/app/(kiosk)/home/[module]/[slug]/page.tsx` — switch
  `kind === 'digital-brochure'` con `BrochureReader`.
- `clients/default/config.json` — añadir bloque `modules['digital-brochure']`
  con 4 brochures mock.
- `package.json` — dep `pdfjs-dist`.

### Reutilizar (no tocar)

- `SendToEmailModal` (listings) — lo abre el botón SEND TO EMAIL del reader.
- `OnScreenKeyboard` (home) — para el search overlay.
- `FloatingHomeButton`, `BackButton`, `HomeHeader`, `KioskCanvas`.

---

## 7. Diseño pixel-perfect

Protocolo `.planning/PIXEL-PERFECT-PROTOCOL.md`:

1. Inventario de groups del SVG en `.planning/3-6-COVERAGE.md`.
2. Paths verbatim de los iconos (lupa, flechas, zoom, grid).
3. Medidas a extraer del SVG:
   - Altura del hero + banda azul "Digital Brochures".
   - Altura y padding de los tabs.
   - Dimensiones exactas de la card (cover + gaps).
   - Tamaño de las flechas del reader, botones del scrubber.
4. Diff visual `revisor-visual` vs los 3 PNGs.

---

## 8. Verificación end-to-end

1. `pnpm add pdfjs-dist` + worker copiado.
2. `pnpm kiosk:dev` → `/home/digital-brochure`.
3. Lista muestra 4 brochures con sus covers.
4. Click en tab "Guides" → filtra la lista.
5. Click en search icon → overlay con QWERTY, tipea "dest" → aparecen
   brochures con "Destination" en el título.
6. Click en una card → `/home/digital-brochure/{slug}` con reader.
7. Reader: primera página renderizada, flechas funcionan, counter `1/N`.
8. Arrastrar slider → salta de página.
9. Click `+` → zoom in (imagen más grande).
10. Click `⊞` → zoom out; segundo click en el mínimo abre grid overview.
11. Grid overview: click en thumbnail salta a esa página.
12. Click SEND TO EMAIL → abre modal de email con QWERTY; confirmar toast.
13. `pnpm check` limpio.
14. Playwright screenshots de los 3 estados vs SVGs.

---

## 9. Scope excluido (v2)

- Full-text search dentro del PDF (pdf.js `getTextContent`).
- Backend real de envío de PDF por email con adjunto.
- Texto seleccionable dentro del PDF (pdf.js text layer).
- Print / download a USB.
- Anotaciones, bookmarks dentro del PDF.
- Upload de PDF desde el kiosk.
- PDFs protegidos con contraseña.
- Render adaptativo a retina (de-scale).
- i18n de strings ("Digital Brochures", "Select all", "SEND TO EMAIL",
  "Search for", "What are you looking for?", "SEARCH"). TODO en STATE.md.
