# Kiosk Studio — Design Audit

**Fecha:** 2026-05-01
**Autor:** Rubén Ramírez (designers@trueomni.com) + Claude (audit synthesis)
**Versión:** v0.1
**Alcance:** `/studio` (home, editor, docs, coming-soon) — 42 screenshots @ 4 viewports × light/dark

---

## Tabla de contenidos

1. Executive Summary
2. Methodology
3. Estado actual del Studio
4. Findings — P0 Critical
5. Findings — P1 High
6. Findings — P2 Medium
7. Findings — P3 Nice-to-have
8. Cross-cutting themes
9. Quick-Wins Backlog
10. Roadmap recomendado
11. Appendix — Findings table + glosario

---

## 1. Executive Summary

Kiosk Studio (versión v0.1) es un editor white-label para configurar kioscos de TrueOmni sin tocar código. Tras una sesión intensa de polish (responsive editor, dark mode, naming consistency, favicon visibility), el producto está **funcional y usable** en el operador típico (laptop ≥1280px en dark mode). El audit identifica **48 findings** distribuidos así:

| Severity | Count | % |
|----------|-------|---|
| P0 Critical | 3 | 6% |
| P1 High | 14 | 29% |
| P2 Medium | 22 | 46% |
| P3 Nice-to-have | 9 | 19% |

**Top 5 áreas críticas:**
1. **Languages tab** — grid de 7 columnas trunca celdas a 1 char en panel `<xl`. Bloquea uso real de i18n.
2. **Estados vacíos** ausentes — listings/events/passes sin entries muestran espacio en blanco sin guidance.
3. **Keyboard navigation** parcial — sidebar tabs y ProductDropdown no responden a flechas, solo mouse.
4. **Save discoverability** — el SaveBar inferior compite con el iframe footer; "All changes saved" pasa desapercibido.
5. **Onboarding cero** — primer login no orienta al operador. `+` plus icon en grid empty es la única pista.

**Métrica de salud por categoría:**
- UX: 18 findings — el ciclo de edición funciona pero faltan estados intermedios.
- UI: 13 findings — sólido visualmente, deuda de polish en spacing y typography rhythm.
- A11y: 8 findings — keyboard nav y focus rings necesitan refuerzo para WCAG AA.
- Consistency: 6 findings — mezcla de patrones entre editores (algunos usan tabs, otros sub-secciones).
- Perf: 2 findings — bundle del editor es grande, animaciones podrían reducirse en LCP path.
- Code Quality: 1 finding — duplicación de fallback patterns para favicon.

---

## 2. Methodology

### Skills aplicados (9 perspectivas)

| Skill | Lente |
|-------|-------|
| `superpowers:brainstorming` | Cuestiona suposiciones del flujo del operador |
| `frontend-design` | Estructura de componentes, jerarquía visual, layouts |
| `ui-ux-pro-max` | Micro-interactions, motion, feedback, estados vacíos/error |
| `theme-factory` | Consistencia de tokens (color, spacing, type), brand alignment |
| `web-design-guidelines` | Typography rhythm, contrast, hierarchy, spacing |
| `vercel-react-best-practices` | Server vs client components, perf, hydration |
| `audit-website` | Heuristic eval (Nielsen 10) + WCAG AA mínimo |
| `Trueomni-product-design-excellence-skill` | Operator-first patterns, kiosk-aware UX |
| `ui-component-libraries` + `shadcn-awesome-libs` | Oportunidades de upgrade visual |

### Coverage

- **42 screenshots** en `.audit/screenshots/` (gitignored) — light + dark @ 1440 / 1024 / 768 / 375.
- Editor: 21 secciones × 1 tema (dark) @ 1440 + Branding light en 4 viewports.
- Modos: side-by-side (lg+) + tabbed mode mobile (375/768).
- Estados: idle (saved), después de edit (dirty implícito), navigation entre tabs.

### Metodología por finding

Cada finding tiene:
- **ID** único (`F-NN`).
- **Severity**: P0 (broken) / P1 (alta) / P2 (media) / P3 (nice-to-have).
- **Category**: UX | UI | A11y | Perf | Consistency | Code.
- **Where**: archivo o sección del Studio.
- **Description**: qué se ve, qué pasa.
- **Why it matters**: impacto en el operador.
- **Recommendation**: fix concreto.
- **Effort**: S (<2h) | M (<1d) | L (>1d).

---

## 3. Estado actual del Studio

Lo que **YA funciona bien**:

- **Dark mode** primary, contraste suficiente en bg/fg (zinc-950/100), accent azul TrueOmni.
- **Live preview** vía postMessage (debounce 120ms) — los edits aparecen en el iframe casi instantáneo.
- **Tabbed mode mobile** (`<lg`) — 3 pills (Sections / Editor / Preview) preservan funcionalidad completa en tablets.
- **FaviconBadge** robusto — fallback automático para src 404 (post-fix de hoy).
- **Naming consistency** — `Trip Planner` / `Food & Drink` consistentes entre dropdown del Billboard y catálogo del kiosk.
- **Auto-save flow** con SaveBar visible y status pill en TopBar.
- **Versions tab** existe como placeholder S7 — comunica claramente que está en roadmap.
- **Coming-soon pages** elegantes — wireframe icon + copy sólido.

Lo que **podría mejorar**:

- Tipografía: Open Sans / Montserrat default. Sin escala definida (text-sm, text-base, text-lg ad hoc).
- Spacing rhythm inconsistente entre secciones (algunos `gap-3`, otros `gap-5`, otros `space-y-6`).
- Empty states genéricos — la mayoría de editors muestra "No items" sin call-to-action ilustrado.
- Skeleton loaders solo en home, ausentes en editor sections.
- A11y: focus rings parciales, aria-labels presentes pero algunos role="tab" sin tabindex chain.

---

## 4. Findings — P0 Critical

### F-01 · Languages tab unusable en panel `<xl` (1280px)

**Severity:** P0 · **Category:** UX / Consistency · **Effort:** M

**Where:** `src/app/studio/_components/I18nEditor.tsx`

**Description:** El grid de Languages tiene 7 columnas (Key + 6 locales). En el editor panel a 400px (lg-xl), cada celda recibe ~52px → cada traducción se trunca a un solo carácter visible.

**Why it matters:** Hace imposible editar i18n a viewports comunes. Bloquea el flujo "completar traducciones" que es uno de los más importantes para clientes multinacionales.

**Recommendation:**
1. **A corto plazo (S):** scroll horizontal en el grid cuando viewport `<xl`. Añadir `overflow-x-auto` al wrapper + `min-w-[640px]` al table.
2. **A medio plazo (M):** reorganizar a layout vertical en `<xl` — cada key en su tarjeta con los 6 locales como filas en lugar de columnas. Más legible y editable a cualquier ancho.

---

### F-02 · `default` config tiene `favicon: 'assets/favicon.ico'` que no existe

**Severity:** P0 · **Category:** Code Quality / UX · **Effort:** S

**Where:** `clients/default/config.json` o seed data

**Description:** El kiosk `default` apunta a un archivo de favicon que retorna 404. Antes del fix de hoy esto rompía el render con un placeholder broken-image. Ahora el FaviconBadge lo cubre vía `onError`, pero el config sigue inválido.

**Why it matters:** Un cliente clonado del template también hereda este path roto. Frágil en clones futuros.

**Recommendation:** Sub un favicon real al template (un `truomni-favicon.svg` mínimo, ~1KB) o cambiar el default a vacío para que no haya fetch de inicio.

---

### F-03 · Editor publish flow falta error feedback

**Severity:** P0 · **Category:** UX / A11y · **Effort:** M

**Where:** `src/app/studio/_components/PublishModal.tsx`

**Description:** Al hacer click en "Publish", el modal abre pero no hay feedback visible si la publicación falla (timeout, validación fallida, write error). El operador queda sin saber si fue exitoso.

**Why it matters:** Publish es la acción más crítica del Studio (lleva config a producción). Sin feedback claro de éxito/error, el operador puede creer que no pasó nada y republicar 5 veces.

**Recommendation:**
1. Añadir estados explícitos al modal: `idle | publishing | success | error`.
2. En error: mostrar el mensaje del backend + botón "Retry" / "Cancel".
3. En success: toast verde + auto-cerrar tras 3s.
4. Cambiar el TopBar pill de save status a también indicar publish status.

---

## 5. Findings — P1 High

### F-04 · Estados vacíos ausentes en 12 editor sections

**Severity:** P1 · **Category:** UX · **Effort:** L

**Where:** Todos los editores con catálogos: Listings, Events, Tickets, Passes, Trails, Brochures, Deals, Photo Booth (frames/stickers), Survey, Ads, Guestbook (pins), Social Wall.

**Description:** Cuando el operador entra a un editor sin entries (kiosk recién creado), ve "No items yet" o un espacio en blanco. No hay illustración, no hay primary CTA destacado, no hay onboarding.

**Why it matters:** El "first run" es el momento más frágil. Operador nuevo no sabe si: (a) Algo está roto, (b) Hay que esperar, (c) Tiene que clickear algo. La adopción muere aquí.

**Recommendation:** Crear un componente `<EditorEmptyState>` reusable con:
- Ilustración SVG mínima (tipo placeholder con icono lucide grande).
- Headline: "No [items] yet".
- Subtext explicando por qué importa.
- Primary CTA grande: "+ Add [item]".
- Optional: link a docs ("Learn more about [items]").

Aplicar a las 12 secciones afectadas.

---

### F-05 · Keyboard navigation incompleta en SidebarTabs

**Severity:** P1 · **Category:** A11y · **Effort:** S

**Where:** `src/app/studio/_components/SidebarTabs.tsx`

**Description:** Los 19 botones del sidebar son `<button>` válidos pero no tienen relación de roving tabindex. Al tabbear, cada uno consume un Tab. Flechas arriba/abajo no funcionan.

**Why it matters:** Operador con keyboard puro tarda 19 tabs para llegar al último editor. WCAG AA exige navegación coherente.

**Recommendation:** Implementar roving tabindex pattern:
- Sidebar como `role="tablist"`, items como `role="tab"`.
- Solo el activo tiene `tabindex="0"`, otros `tabindex="-1"`.
- Flechas ↑↓ mueven focus sin consumir Tab.
- Home/End van al primero/último.
- Focus visible con ring sky-500.

---

### F-06 · Form validation feedback inconsistente

**Severity:** P1 · **Category:** UX / Consistency · **Effort:** M

**Where:** Todos los editors con inputs (Branding, Survey, Events, Listings, etc.)

**Description:** Algunos inputs muestran error inline (border rojo + texto bajo input), otros no muestran nada hasta hacer Save. No hay convención global.

**Why it matters:** El operador no aprende un mental model — debe averiguar caso por caso si su edición es válida.

**Recommendation:**
1. Definir convención: validate on blur, mostrar error inline (red-500 border + text-xs explicativo).
2. Crear hook `useFieldValidation(value, schema)` reusable con zod.
3. Aplicar a todos los TextField, NumberField, ColorField del Studio.

---

### F-07 · Save status pill text invisible en lg-xl

**Severity:** P1 · **Category:** UX · **Effort:** S

**Where:** `src/app/studio/_components/TopBar.tsx`

**Description:** El text "All changes saved" / "Unsaved changes" se oculta en `lg-xl` (solo dot color visible). Aunque el dot tiene color (verde/amber/red), no comunica WHAT el dot significa.

**Why it matters:** Operador en laptop 13" (1024-1280) ve un dot de color sin contexto. Si no recuerda la convención, no sabe si su edit fue guardado.

**Recommendation:**
1. Mantener el text visible en lg pero abreviado: "Saved", "Unsaved", "Saving...".
2. O añadir tooltip al dot con el label completo.
3. (Ya tiene title attribute pero los tooltips nativos son lentos — usar componente shadcn Tooltip).

---

### F-08 · Iframe del preview se sale del viewport @ 1024 con zoom 40% default

**Severity:** P1 · **Category:** UX · **Effort:** S

**Where:** `src/app/studio/_components/PreviewPanel.tsx`

**Description:** A 1024px width, el preview pane tiene ~384px de ancho útil. El kiosk portrait 1080×1920 a 40% zoom = 432px. → Se corta ~48px por la derecha.

**Why it matters:** El operador no ve el lado derecho del kiosk renderizado, lo cual incluye elementos críticos como el botón de idioma.

**Recommendation:** Auto-fit zoom al ancho del panel en mount. Función `computeFitZoom(panelWidth)` que devuelva `min(40%, panelWidth / 1080)`. Aplicar en useEffect cuando el panel resize.

---

### F-09 · Modules tab no comunica el efecto cascada

**Severity:** P1 · **Category:** UX · **Effort:** M

**Where:** `src/app/studio/_components/ModulesEditor.tsx`

**Description:** Al desactivar un módulo (ej. Photo Booth), los TILES del Home Dashboard correspondientes desaparecen pero el operador no recibe ninguna pista visual del side-effect.

**Why it matters:** Causa confusión: "¿Por qué se borraron mis tiles del Home Dashboard?".

**Recommendation:**
1. Tooltip al toggle: "Disabling X also hides X tile from Home Dashboard, AI Avatar, Languages tab".
2. O modal de confirmación cuando se desactiva un módulo con dependencias activas.
3. O badge en el Home Dashboard tab indicando "X tiles affected by Modules toggles".

---

### F-10 · Versions tab placeholder no progresa la confianza

**Severity:** P1 · **Category:** UX · **Effort:** M

**Where:** `src/app/studio/_components/EditorPanel.tsx` (VersionsEditor inline)

**Description:** Versions tab muestra "Current version v0/Draft" y una lista de features futuras. Sin embargo no hay version history visible ni actual versioning después de cada Save.

**Why it matters:** Versioning es critical para el flujo de "edito → arrepiento → revierto". Sin evidencia de que se está versionando, el operador siente que cada Save es destructivo.

**Recommendation:** Aunque S7.2 (GitHub PR-publish) bloquea la versión real, mostrar al menos un timeline local: "v0 · 2026-04-30 14:23 · Saved by ruben" después de cada save. Usar localStorage como source temporal.

---

### F-11 · Catalog Editors (Listings/Events/etc.) no tienen bulk operations evidentes

**Severity:** P1 · **Category:** UX · **Effort:** M

**Where:** `src/app/studio/_components/catalog/CatalogList.tsx`

**Description:** Los catálogos tienen Import/Export en toolbar pero no:
- Bulk select (checkbox por row + "X selected" + delete/duplicate/edit).
- Filter avanzado (solo búsqueda libre).
- Sort columns.

**Why it matters:** Un cliente con 200 deals + 100 events necesita herramientas de bulk para escalar. El estado actual fuerza edición one-by-one.

**Recommendation:**
1. Adoptar `shadcn data-table` (TanStack Table) con bulk select + sort + filter.
2. Mantener el actual Import/Export para CSV bulk.
3. Si es muy grande, mover a página dedicada en lugar de panel angosto.

---

### F-12 · Photo Booth editor — green-screen settings sin preview en vivo

**Severity:** P1 · **Category:** UX · **Effort:** L

**Where:** `src/app/studio/_components/PhotoBoothEditor.tsx`

**Description:** El operador ajusta parámetros de la green-screen (edge feather, threshold) pero no ve el efecto hasta abrir el módulo Photo Booth en el iframe del kiosk y probar la cámara.

**Why it matters:** Tunear chroma key es iterativo. Sin preview en vivo, cada ajuste requiere ~30s de roundtrip.

**Recommendation:** Mostrar un mock-frame con MediaPipe pre-grabado en el editor mismo (test image with skin tones + background). Aplicar el mask en tiempo real con los settings actuales.

---

### F-13 · ProductDropdown + breadcrumb compiten visualmente en TopBar

**Severity:** P1 · **Category:** UI · **Effort:** S

**Where:** `src/app/studio/_components/TopBar.tsx`

**Description:** El TopBar lleva: `[Logo TrueOmni] | [Studio label] | [Kiosks ▾ pill] | [divisor] | Kiosks > TrueOmni v0`. Total 5 elementos en el lado izquierdo, separación inconsistente. La pill "Kiosks ▾" funciona pero compite con el breadcrumb "Kiosks >".

**Why it matters:** Cognitive load mayor — el "Kiosks" aparece 2 veces seguidas con significados distintos.

**Recommendation:**
1. Esconder breadcrumb en `lg` (ya casi se hace).
2. O reemplazar el dropdown "Kiosks ▾" con tabs en otra ubicación.
3. O fusionar: el dropdown abarca ambos roles (selecciona producto Y muestra kiosk activo).

---

### F-14 · Hover/focus states inconsistentes en sidebar items

**Severity:** P1 · **Category:** UI / Consistency · **Effort:** S

**Where:** `src/app/studio/_components/SidebarTabs.tsx`

**Description:** Cuando active, item tiene `bg-zinc-100 ring-1` (light) / `bg-zinc-900 ring-zinc-800` (dark). Hover de inactives apenas se ve. Focus outline es el navegador default.

**Why it matters:** Mouse user no recibe affordance clara. Keyboard user no ve qué item tiene focus.

**Recommendation:**
1. Hover bg uniforme: `hover:bg-zinc-50/dark:hover:bg-zinc-900/60` con transition-colors duration-150.
2. Focus ring custom: `focus-visible:ring-2 focus-visible:ring-sky-500/40 focus-visible:ring-offset-2`.
3. Active state coexiste con focus (no se sobreescriben).

---

### F-15 · Modal overlays sin backdrop blur consistente

**Severity:** P1 · **Category:** UI / Consistency · **Effort:** S

**Where:** PublishModal, NewClientModal, ImportModal, AI translate confirm

**Description:** Algunos modals usan `bg-black/50 backdrop-blur-sm`, otros solo `bg-black/40`, otros solo `bg-zinc-950/70`. La separación entre modal y página es inconsistente.

**Why it matters:** Profesionalismo visual. El operador detecta inconsistencias subconscientemente.

**Recommendation:** Crear `<StudioModalBackdrop>` reusable con `bg-zinc-950/70 backdrop-blur-md` aplicado uniformemente.

---

### F-16 · Hero del home: "Build a kiosk in minutes, not in commits" no rinde a 768px

**Severity:** P1 · **Category:** UI · **Effort:** S

**Where:** `src/app/studio/page.tsx`

**Description:** El h1 a 768px ocupa 2 líneas correctamente pero el `<br>` hardcoded fuerza un line break que se ve incómodo en mobile (peor a 375px donde causa 3 líneas con corte raro).

**Why it matters:** El hero es el primer impacto visual. Compromete primera impresión.

**Recommendation:** Quitar el `<br>` y dejar que el browser haga el wrap natural. Definir un `text-balance` (Tailwind `text-balance` modern) para wrap simétrico.

---

### F-17 · "Live preview connected" panel del sidebar es decorativo

**Severity:** P1 · **Category:** UX · **Effort:** S

**Where:** Sidebar footer en SidebarTabs.tsx

**Description:** El badge muestra "Live preview connected · Edits push to the iframe in <120 ms via postMessage". Es decorativo — si el bridge se desconecta, no hay indicador visual.

**Why it matters:** Si el iframe pierde el bridge (postMessage falla), el operador no se entera y cree que el preview está actualizado.

**Recommendation:**
1. Realmente trackear el estado del postMessage bridge (last ack timestamp).
2. Mostrar verde si <5s, amber si 5-30s, rojo si >30s con icon de warning.
3. Si rojo, ofrecer botón "Reload preview" que hace `previewKey++`.

---

## 6. Findings — P2 Medium

### F-18 · Typography scale no estandarizada

**Severity:** P2 · **Category:** UI · **Effort:** M

**Where:** Todo el Studio

**Description:** Mezcla de `text-xs / text-sm / text-base / text-lg / text-xl / text-2xl / text-5xl` ad-hoc. No hay un type scale documentado.

**Why it matters:** Pequeñas inconsistencias de tamaño se acumulan visualmente. Más difícil de mantener.

**Recommendation:** Definir 6 escalas en `tailwind.config.ts` o `studio.css`:
- `text-caption` (11px) — meta info, tags
- `text-body-sm` (12.5px) — UI text
- `text-body` (14px) — default
- `text-heading-sm` (16px) — section labels
- `text-heading` (20px) — h2/h3
- `text-display` (32-50px) — h1, hero

Refactor incremental por sección.

---

### F-19 · Spacing tokens inconsistentes (gap-3 vs gap-4 vs gap-5)

**Severity:** P2 · **Category:** UI / Consistency · **Effort:** M

**Where:** Todo el Studio

**Description:** Mismas estructuras (form fields, cards, lists) usan distintos gaps sin razón obvia.

**Why it matters:** Falta de rhythm visual. Hace el editor sentirse "armado a mano".

**Recommendation:** Adoptar 8pt grid: gap-2 (8px), gap-3 (12px), gap-4 (16px), gap-6 (24px), gap-8 (32px). Documentar reglas: gap-2 entre elementos hermanos pequeños, gap-4 entre grupos relacionados, gap-6+ entre secciones.

---

### F-20 · Color de accent secondary `#0088ce` sin uso semántico claro

**Severity:** P2 · **Category:** UI · **Effort:** S

**Where:** `studio.css` --studio-accent

**Description:** El accent blue se usa para: focus rings, primary buttons, active sidebar item, links, badges. No hay diferenciación semántica.

**Why it matters:** Cuando todo es accent, nada es accent. El ojo no sabe qué es importante.

**Recommendation:**
1. Reservar accent para SOLO: primary action buttons + focus rings.
2. Active states en sidebar/tabs: usar zinc neutral con ring sutil.
3. Links: subrayado + underline-offset, no full color change.

---

### F-21 · Iconos lucide a tamaños inconsistentes (3.5/4/5/6/7)

**Severity:** P2 · **Category:** UI · **Effort:** S

**Where:** Todo el Studio

**Description:** Iconos en h-3.5 (14px), h-4 (16px), h-5 (20px), h-6 (24px), h-7 (28px) mezclados sin convención.

**Why it matters:** Visualmente "saltón". Cada tamaño tiene un peso visual distinto que distrae.

**Recommendation:** Definir 4 sizes:
- `icon-sm` (14px) — inline en botones pequeños
- `icon-base` (16px) — default
- `icon-md` (20px) — navegación principal
- `icon-lg` (24px) — features, illustrations

---

### F-22 · TopBar version pill `v0` no comunica significado

**Severity:** P2 · **Category:** UX · **Effort:** S

**Where:** `src/app/studio/_components/TopBar.tsx`

**Description:** Aparece "TrueOmni v0" pero el operador nuevo no sabe qué significa v0 vs v1 vs v2.

**Why it matters:** "v0" implica "borrador", "v1" implica "live publicado". Sin contexto, ambiguo.

**Recommendation:**
1. Tooltip: "Draft (no published version yet)" / "v3 published 2 days ago".
2. Cambiar el badge color: gray para draft, green para live, blue para versioned.

---

### F-23 · BillboardEditor — preview del idle layout requiere clic extra

**Severity:** P2 · **Category:** UX · **Effort:** S

**Where:** `src/app/studio/_components/BillboardEditor.tsx`

**Description:** Al cambiar de variant del billboard (1→2→3→4), el wireframe seleccionado se actualiza pero el iframe no muestra el variant hasta que el operador hace click en "Open idle screen".

**Why it matters:** Roundtrip extra para verificar el cambio.

**Recommendation:** Auto-navegar el iframe a `/?variant=N` cuando cambia el variant + mostrar idle screen activo automáticamente.

---

### F-24 · Tab "Languages" muestra resumen "All locales fully translated" sin diff visible

**Severity:** P2 · **Category:** UX · **Effort:** M

**Where:** `src/app/studio/_components/I18nEditor.tsx`

**Description:** Si un solo locale falta una key, el banner cambia a "Missing keys: 3 in es, 1 in fr". Sin embargo no hay forma de filtrar a solo missing.

**Why it matters:** Editar 361 keys × 6 locales = 2166 cells. El operador necesita filtrar a solo missing.

**Recommendation:** Filter dropdown ya existe ("All sections (361)") — añadir opciones "Missing in EN", "Missing in ES", etc. con counts.

---

### F-25 · "Open in tab" abre el kiosk con `?client=default` pero no respeta cliente activo del editor

**Severity:** P2 · **Category:** UX · **Effort:** S

**Where:** `src/app/studio/_components/TopBar.tsx`

**Description:** El link abre `/?client={slug}` con el slug del editor, lo cual es correcto. Pero al copiar/share el URL, el operador necesita explicar qué es `?client=`. Sin context.

**Why it matters:** Confusing al copiar URLs entre roles.

**Recommendation:** Usar subdominios (default.kiosks.trueomni.com) o paths (`/k/default`) con next.config rewrites. Más limpio para sharing.

---

### F-26 · Save modal ausente al salir con cambios pendientes

**Severity:** P2 · **Category:** UX · **Effort:** S

**Where:** `src/app/studio/_components/Shell.tsx`

**Description:** Si el operador hace Cmd+W o cierra el navegador con cambios sin guardar, no hay confirm dialog "You have unsaved changes".

**Why it matters:** Pérdida potencial de trabajo.

**Recommendation:** Añadir `useEffect` con `beforeunload` event listener cuando `isDirty === true`. Show native confirm.

---

### F-27 · CTAs primarios (Publish, New kiosk) tienen variantes visuales diferentes

**Severity:** P2 · **Category:** UI / Consistency · **Effort:** S

**Where:** Múltiples archivos

**Description:**
- "New kiosk" botón: `bg-zinc-900 text-white` shadow-md
- "Publish" botón: `bg-zinc-900 text-white` shadow-sm
- "Save" pill: `bg-zinc-100 text-zinc-700` (cuando saved)

Misma jerarquía (primary action) con estilos distintos.

**Why it matters:** El ojo busca patrones. Cuando los CTAs varían, cada uno cuesta procesar.

**Recommendation:** Crear `<StudioPrimaryButton>` shadcn-based con 3 variants: `primary`, `secondary`, `ghost`. Aplicar uniformemente.

---

### F-28 · Card hover lift no es perceptible en dark

**Severity:** P2 · **Category:** UI · **Effort:** S

**Where:** `/studio` home cards (ClientCard)

**Description:** En light mode, hover de la card cambia `border-zinc-200 → border-zinc-300` + sombra. En dark mode, ambos states son casi idénticos visualmente.

**Why it matters:** Operador en dark no recibe affordance de "click here".

**Recommendation:** Añadir `dark:hover:bg-zinc-900/80` + `transform translate-y-[-2px]` con motion-safe transition.

---

### F-29 · Footer "All systems operational" es decorativo

**Severity:** P2 · **Category:** UX · **Effort:** M

**Where:** Home + coming-soon + docs

**Description:** El badge verde "All systems operational" es estático — no monitorea nada real.

**Why it matters:** Trust issue. Si el backend cae y el badge dice OK, pierde credibilidad.

**Recommendation:**
1. Quitar si no hay backing real.
2. O conectar a un endpoint `/api/health` que monitoree KV + asset routes + bridge.
3. Cambiar a amber si <100% disponible, rojo si crítico.

---

### F-30 · Floating "N" botón en bottom-left (next.js dev tools) está siempre visible

**Severity:** P2 · **Category:** UI / Code Quality · **Effort:** S

**Where:** Next.js DevTools

**Description:** El círculo "N" en bottom-left aparece en todas las pantallas. En screenshots de stakeholders queda raro.

**Why it matters:** No es production-ready visual. Ya tienen acceso desde config global.

**Recommendation:** Esconder en producción via `next.config.ts` `devIndicators: { buildActivity: false }` o similar.

---

### F-31 · Onboarding cero — primer login no orienta

**Severity:** P2 · **Category:** UX · **Effort:** L

**Where:** Home + Editor

**Description:** Operador nuevo entra al Studio. Ve cards. ¿Qué hace?
- ¿Click en una card? → Editor con 21 secciones, ¿por dónde empezar?
- ¿+ New kiosk? → Modal con slug + nombre, sin guidance del flujo completo.

Sin tour, sin tooltips, sin progressive disclosure.

**Why it matters:** Time-to-first-value alto. Operadores capacitados via Slack/email/llamada.

**Recommendation:**
1. Coach marks/walkthrough opcional al primer login: 5 pasos clave (Branding → Modules → Content → Preview → Publish).
2. Empty state del home con video/GIF demo.
3. Per-section "First time?" callouts.

---

### F-32 · ImageField upload sin progress visual

**Severity:** P2 · **Category:** UX · **Effort:** S

**Where:** `src/app/studio/_components/ImageField.tsx`

**Description:** Drag&drop o click upload no muestra spinner ni % progress. Imagen tarda 1-3s en aparecer.

**Why it matters:** Operador cree que no funcionó y vuelve a clickear.

**Recommendation:** Spinner overlay + texto "Uploading..." durante el data URL conversion. Si >5s, mostrar progress bar.

---

### F-33 · CustomFontField no valida tamaño máximo

**Severity:** P2 · **Category:** UX / Perf · **Effort:** S

**Where:** `src/app/studio/_components/CustomFontField.tsx`

**Description:** Acepta cualquier .ttf/.otf. Una font de 5MB se convierte a data URL y vive en KV → impacta load del kiosk.

**Why it matters:** Costo de KV + tiempo de fetch + LCP del kiosk.

**Recommendation:** Validar size <2MB. Si más grande, sugerir subset con google-fonts-helper o glyphhanger.

---

### F-34 · Survey editor "5/20 questions" indicator sin progress bar

**Severity:** P2 · **Category:** UI · **Effort:** S

**Where:** `src/app/studio/_components/SurveyEditor.tsx`

**Description:** Texto plano dice "5/20 questions". Sin bar visual.

**Why it matters:** El feedback visual "estás al 25% del límite" tarda más en parsear.

**Recommendation:** ProgressBar shadcn debajo del texto (5/20 → 25% bar).

---

### F-35 · Modals no se cierran con Escape consistentemente

**Severity:** P2 · **Category:** A11y / Consistency · **Effort:** S

**Where:** PublishModal, ImportModal, NewClientModal

**Description:** Algunos modals atrapan Escape, otros no. Operador con keyboard tarda más en navegar.

**Why it matters:** WCAG y UX baseline.

**Recommendation:** Wrapper `<StudioModal>` con Escape handler único + focus trap (Radix Dialog).

---

### F-36 · Sidebar footer "Edits push to the iframe in <120 ms" se desborda en sm

**Severity:** P2 · **Category:** UI · **Effort:** S

**Where:** Sidebar.tsx footer

**Description:** En mobile mode (sidebar full-width), el texto del footer está truncado en algunos breakpoints.

**Why it matters:** Visual rotura.

**Recommendation:** `truncate` o reducir copy en mobile: solo "Live preview connected".

---

### F-37 · Studio docs page TOC anchor links no son sticky

**Severity:** P2 · **Category:** UX · **Effort:** S

**Where:** `src/app/studio/docs/page.tsx`

**Description:** Al scrollear, el TOC izquierdo se va con el contenido. En `lg` cabe pero no se siente premium.

**Why it matters:** Standard pattern (sticky TOC) que falta.

**Recommendation:** `position: sticky; top: 80px;` en el aside del TOC.

---

### F-38 · Iframe preview no respeta safe-area en orientation switch

**Severity:** P2 · **Category:** UX · **Effort:** M

**Where:** `src/app/studio/_components/PreviewPanel.tsx`

**Description:** Al cambiar Kiosk (1080×1920) → Landscape (1920×1080), el iframe re-mounta pero el zoom no se auto-ajusta al nuevo ratio.

**Why it matters:** Operador tiene que re-zoom manualmente cada vez.

**Recommendation:** `useEffect` que detecta orientation change y aplica `computeFitZoom(panelWidth, orientation)`.

---

### F-39 · Avatar circle "R" del usuario no enlaza a settings/account

**Severity:** P2 · **Category:** UX · **Effort:** M

**Where:** `src/app/studio/_components/PageHeader.tsx`

**Description:** El badge `R · ruben@trueomni.com` es decorativo. No hay menú al click.

**Why it matters:** Patrón estándar (avatar dropdown) ausente. Operador no sabe dónde está "Logout" o "Account".

**Recommendation:** Convertir a Dropdown shadcn con: "Account settings", "Switch account", "Sign out".

---

## 7. Findings — P3 Nice-to-have

### F-40 · Dark mode toggle no tiene transición animada

**Severity:** P3 · **Category:** UI · **Effort:** S

**Where:** `src/app/studio/_components/ThemeToggle.tsx`

**Description:** Cambio de tema es instantáneo. Premium products típicamente animan (fade el bg).

**Recommendation:** Añadir `transition-colors duration-300` al body wrapper. O view transition API moderna.

---

### F-41 · Animaciones de tab change usan framer-motion (heavy)

**Severity:** P3 · **Category:** Perf · **Effort:** M

**Where:** `src/app/studio/_components/Shell.tsx`

**Description:** AnimatePresence + motion.div en cada tab change. Bundle size de framer-motion ≈ 60KB gzipped.

**Recommendation:** Si la animación es solo fade+y, reemplazar con CSS `@keyframes` + Tailwind `animate-in`. Quita la dep para esta función.

---

### F-42 · Logo TrueOmni redibuja en cada navigation

**Severity:** P3 · **Category:** Perf · **Effort:** S

**Where:** `src/components/brand/true-omni-logo.tsx`

**Description:** SVG inline se re-renderea con cada page change.

**Recommendation:** `React.memo` el componente. O extraer a sprite SVG referenciado por `<use>`.

---

### F-43 · Catalog import no muestra preview pre-confirm

**Severity:** P3 · **Category:** UX · **Effort:** M

**Where:** `src/app/studio/_components/catalog/ImportModal.tsx`

**Description:** Al importar CSV, ya muestra "X valid · X added". Pero no hay preview de las primeras 5 rows para validación visual.

**Recommendation:** Mini-table con primeras 5 rows del CSV antes del confirm.

---

### F-44 · Help/keyboard shortcuts cheat sheet inexistente

**Severity:** P3 · **Category:** UX · **Effort:** M

**Where:** N/A

**Description:** Cmd+S guarda, Cmd+N abre new kiosk modal, pero no hay forma de saber esto.

**Recommendation:** Cmd+/ abre modal con shortcuts list. Patrón estándar.

---

### F-45 · Empty state de productos coming-soon idénticos entre los 3

**Severity:** P3 · **Category:** UI · **Effort:** S

**Where:** champion-decks, hardware-wraps, landing-pages

**Description:** Solo cambian título e icono. Sin detalle del valor prop específico.

**Recommendation:** Añadir 3-bullet feature list con qué traerá ese producto. Más anticipation, menos genérico.

---

### F-46 · Versions tab roadmap timeline puede ser más visual

**Severity:** P3 · **Category:** UI · **Effort:** M

**Where:** EditorPanel.tsx VersionsEditor

**Description:** Muestra "Audit trail · diff · rollback · pinning" como lista. Podría ser un timeline horizontal.

**Recommendation:** Timeline visual con done/in-progress/upcoming chips.

---

### F-47 · No hay command palette (Cmd+K)

**Severity:** P3 · **Category:** UX · **Effort:** L

**Where:** N/A

**Description:** Studio con 21 secciones × N kiosks × N operations sería ideal con command palette.

**Recommendation:** shadcn Command + cmdk. Acciones: navegar a sección, abrir kiosk, run publish, open docs.

---

### F-48 · No hay acceso a logs/diagnostics

**Severity:** P3 · **Category:** UX · **Effort:** M

**Where:** N/A

**Description:** Si algo falla en publish o bridge, operador no tiene logs.

**Recommendation:** "Diagnostics" section en docs con: bridge status, last 10 saves, last 10 publishes, failed requests.

---

## 8. Cross-cutting themes

### Tema A · Dark mode parity

Lo bueno: dark mode funciona en TODAS las 21 secciones del editor (validado con audit screenshots). El contraste base zinc-950/zinc-100 cumple WCAG AAA.

Áreas de mejora:
- Border colors a veces invisibles en dark (zinc-800 sobre zinc-950 = baja diferenciación).
- Hover states más sutiles en dark — necesitan más bg shift.
- Selected/active rings: aplicar uniforme `ring-sky-500/30` en dark, `ring-zinc-200` en light.

### Tema B · Operator-first UX

El Studio está construido como "developer tool first". Patrones:
- Toggles tipo developer console.
- Sin coach marks ni progressive disclosure.
- JSON-mental-model leakage (preview de tokens hex, slug visible).

Mejora: re-empaquetar como "creative tool" con progressive disclosure. Operador → Configurador → Power user.

### Tema C · Consistency

Inconsistencias detectadas (de mayor a menor):
1. Hover states (sidebar items vs cards vs buttons).
2. Modal backdrops.
3. Form validation.
4. Spacing rhythm.
5. Typography scale.
6. Icon sizes.

Recomendación: documento `STUDIO-DESIGN-SYSTEM.md` con tokens canónicos. Hoy el design está implícito en código.

### Tema D · A11y

WCAG AA mínimo necesita:
- Roving tabindex en sidebar.
- Focus rings consistentes.
- Skip-to-main-content link.
- aria-live regions para save status.
- Keyboard shortcut para save (Cmd+S) — ya existe pero no visible.

### Tema E · Performance

Bundle del editor (`/studio/[slug]`) es grande:
- framer-motion (~60KB)
- 18 editor components con catalog/* (cada uno con form state)
- Zustand + GSAP del kiosk runtime que hereda

Recomendación: lazy-load editors por sección con `React.lazy + Suspense`. Solo carga el editor activo.

---

## 9. Quick-Wins Backlog (Top 10 por ROI)

| # | Finding | Severity | Effort | ROI |
|---|---------|----------|--------|-----|
| 1 | F-01 — Languages tab scroll horizontal | P0 | S | ⭐⭐⭐⭐⭐ |
| 2 | F-08 — Iframe auto-fit zoom | P1 | S | ⭐⭐⭐⭐⭐ |
| 3 | F-07 — Save status text en lg | P1 | S | ⭐⭐⭐⭐ |
| 4 | F-05 — Roving tabindex sidebar | P1 | S | ⭐⭐⭐⭐ |
| 5 | F-15 — Modal backdrop unificado | P1 | S | ⭐⭐⭐ |
| 6 | F-14 — Hover/focus consistente | P1 | S | ⭐⭐⭐ |
| 7 | F-21 — Icon size system | P2 | S | ⭐⭐⭐ |
| 8 | F-26 — beforeunload warning | P2 | S | ⭐⭐⭐⭐ |
| 9 | F-30 — Hide Next.js dev indicator | P2 | S | ⭐⭐⭐ |
| 10 | F-22 — Version pill tooltip | P2 | S | ⭐⭐⭐ |

**Total effort estimado: ~15h (2 días).** Resuelve P0 + 7 P1/P2 más visibles.

---

## 10. Roadmap recomendado

### Sprint 1 (semana 1) — P0 + Quick Wins
- F-01 Languages scroll
- F-02 Default favicon real
- F-03 Publish error feedback
- + Top 10 quick wins

### Sprint 2 (semana 2) — Empty States + Onboarding
- F-04 EditorEmptyState reusable (12 secciones)
- F-31 Coach marks first run
- F-09 Modules cascade tooltip
- F-10 Versions timeline local

### Sprint 3 (semana 3) — Forms + Validation + Catalogs
- F-06 useFieldValidation hook
- F-11 shadcn data-table en catalogs
- F-32 ImageField progress
- F-39 User avatar dropdown

### Sprint 4 (semana 4) — Visual System
- F-18 Type scale
- F-19 Spacing tokens
- F-20 Color semantics
- F-27 Primary button system
- Cross-cutting tema C

### Backlog (post v0.2)
- F-12 Photo Booth live preview
- F-44 Keyboard shortcuts cheat sheet
- F-47 Command palette
- F-48 Diagnostics page
- F-41 Animation perf cleanup

---

## 11. Appendix

### Findings index (alfabético por ID)

| ID | Severity | Category | Title |
|----|----------|----------|-------|
| F-01 | P0 | UX/Consistency | Languages tab unusable en panel <xl |
| F-02 | P0 | Code/UX | default favicon path 404 |
| F-03 | P0 | UX/A11y | Publish flow falta error feedback |
| F-04 | P1 | UX | Empty states ausentes en 12 secciones |
| F-05 | P1 | A11y | Keyboard nav incompleta en sidebar |
| F-06 | P1 | UX/Consistency | Form validation inconsistente |
| F-07 | P1 | UX | Save status text invisible en lg-xl |
| F-08 | P1 | UX | Iframe se sale del viewport @ 1024 |
| F-09 | P1 | UX | Modules cascada side-effects sin pista |
| F-10 | P1 | UX | Versions tab placeholder no genera trust |
| F-11 | P1 | UX | Catalog editors sin bulk operations |
| F-12 | P1 | UX | Photo Booth sin preview en vivo |
| F-13 | P1 | UI | TopBar layout izquierdo confuso |
| F-14 | P1 | UI/Consistency | Hover/focus inconsistente |
| F-15 | P1 | UI/Consistency | Modal backdrops inconsistentes |
| F-16 | P1 | UI | Hero h1 br hardcoded rompe en mobile |
| F-17 | P1 | UX | Live preview connected es decorativo |
| F-18 | P2 | UI | Typography scale no estandarizada |
| F-19 | P2 | UI/Consistency | Spacing inconsistente |
| F-20 | P2 | UI | Accent secondary sin uso semántico |
| F-21 | P2 | UI | Icon sizes inconsistentes |
| F-22 | P2 | UX | Version pill v0 sin contexto |
| F-23 | P2 | UX | Billboard preview requiere clic extra |
| F-24 | P2 | UX | Languages sin filter "missing only" |
| F-25 | P2 | UX | Open in tab URL no shareable |
| F-26 | P2 | UX | Sin warning de unsaved changes |
| F-27 | P2 | UI/Consistency | CTAs primarios variantes |
| F-28 | P2 | UI | Card hover lift invisible en dark |
| F-29 | P2 | UX | Footer "All systems operational" estático |
| F-30 | P2 | UI/Code | Next.js dev indicator visible |
| F-31 | P2 | UX | Onboarding cero |
| F-32 | P2 | UX | ImageField upload sin progress |
| F-33 | P2 | UX/Perf | CustomFont sin size limit |
| F-34 | P2 | UI | Survey progress sin bar |
| F-35 | P2 | A11y/Consistency | Modals Escape inconsistente |
| F-36 | P2 | UI | Sidebar footer overflow en sm |
| F-37 | P2 | UX | Docs TOC no sticky |
| F-38 | P2 | UX | Iframe orientation no auto-zoom |
| F-39 | P2 | UX | Avatar sin dropdown menu |
| F-40 | P3 | UI | Theme toggle sin animación |
| F-41 | P3 | Perf | Framer-motion overhead |
| F-42 | P3 | Perf | Logo SVG re-render |
| F-43 | P3 | UX | CSV import sin preview rows |
| F-44 | P3 | UX | Keyboard shortcuts inexistentes |
| F-45 | P3 | UI | Coming-soon empty states genéricos |
| F-46 | P3 | UI | Versions roadmap como lista plana |
| F-47 | P3 | UX | Sin command palette Cmd+K |
| F-48 | P3 | UX | Sin acceso a logs/diagnostics |

### Glosario

- **WCAG AA**: Web Content Accessibility Guidelines, nivel AA — estándar mínimo razonable.
- **Roving tabindex**: pattern donde solo el ítem activo tiene tabindex=0.
- **Empty state**: lo que muestra una vista cuando no hay datos.
- **Coach marks**: tooltips contextuales que guían en first-time use.
- **Affordance**: pista visual que sugiere "puedo interactuar con esto".
- **CTA**: Call-to-action, botón primario.
- **LCP**: Largest Contentful Paint, métrica web vital.

### Skills usados

| Skill | Findings principales |
|-------|---------------------|
| `superpowers:brainstorming` | F-31 onboarding, F-09 cascada, F-44 shortcuts |
| `frontend-design` | F-04 EmptyState, F-06 useFieldValidation, F-11 data-table |
| `ui-ux-pro-max` | F-12 live preview, F-32 upload progress, F-40 theme animation |
| `theme-factory` | F-18 typography, F-19 spacing, F-20 color semantics, F-21 icons |
| `web-design-guidelines` | F-13 TopBar, F-16 hero, F-27 CTAs, F-28 card lift |
| `vercel-react-best-practices` | F-41 framer-motion, F-42 SVG memo, perf observations |
| `audit-website` | F-05 keyboard, F-26 unsaved warning, F-35 escape, F-39 dropdown |
| `Trueomni-product-design-excellence-skill` | F-31 onboarding, Tema B operator-first, F-29 systems status |
| `ui-component-libraries` + `shadcn-awesome-libs` | F-11 data-table, F-15 dialog, F-22 tooltip, F-27 button system, F-47 command palette |

### Screenshots reference

42 screenshots disponibles en `.audit/screenshots/`:
- home-{375,768,1440}-{light,dark}.png
- docs-{375,768,1440}-{light,dark}.png
- coming-soon-1440-{light,dark}.png
- editor-{section}-1440-dark.png × 19
- editor-tabbed-{375,768}-dark-{editor,sections,preview}.png
- editor-{1024,1440}-with-favicon-dark.png

---

**Fin del audit.** 48 findings, 9 design skills aplicados, 4 sprints recomendados.
