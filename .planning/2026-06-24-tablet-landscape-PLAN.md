# Plan de implementación — Tablet **Landscape** (reflow adaptativo)

> **Para workers:** ejecutar tarea por tarea. Formato GSD del proyecto (CLAUDE.md §5):
> cada `<task>` lleva `<files>`, `<action>`, `<verify>`, `<done>`. La verificación es
> **visual** (`agent-browser`), no unit tests — es reflow de layout (CLAUDE.md §6).
> Spec de diseño aprobado: `.planning/2026-06-24-tablet-landscape-design.md`.

**Goal:** Adaptar TODAS las pantallas del producto Tablet a landscape (1194×834) con
reflow adaptativo, gated por `isLandscape`, sin tocar phone ni tablet portrait.

**Arquitectura:** azúcar `isLandscape` en `device-context`; cada pantalla añade una rama
`isLandscape` solo donde el alto/ancho lo amerita. Reflow por arquetipos (listas 2-col,
grids +1col, detail centrado, map full, modales capados, dashboard custom, auth escalado).

**Tech stack:** Next.js App Router · React 19 · Tailwind · `useDevice()` (device-context).

## Global Constraints (verbatim del contrato/spec)

- **Cero hardcoded** (CLAUDE.md §7): color→token, texto→config, asset→path. El reflow es solo layout.
- **Gating estricto:** `phone` y `tablet portrait` quedan **idénticos**; todo cambio bajo `isLandscape`.
- **Componentes compartidos kiosk/PWA:** extender con ramas aditivas (default = comportamiento actual),
  nunca cambiar firmas. Verificar no-regresión del kiosk al tocarlos (CLAUDE.md §8).
- **Verificación por tarea:** `agent-browser` en `?device=tablet&orientation=landscape` +
  control portrait y phone. `pnpm typecheck` + `lint` + `validate:configs` limpios.
- **Sin push** hasta cerrar la fase Tablet (landscape + Studio + activación). Commits locales.
- Capturas en `.planning/verifications/ls-<pantalla>-*.png`.

---

## Task 0 — Fundación: `isLandscape` en device-context

**Files:**

- Modify: `src/components/pwa/device-context.tsx` (DeviceContextValue + value + useDevice)

**Action:** Añadir `isLandscape: boolean` al `DeviceContextValue` (= `device==='tablet' &&
orientation==='landscape'`), poblarlo en el `setValue` del effect y en el default (`false`).
Azúcar para que las pantallas no repitan la condición.

**Verify:** `pnpm typecheck` limpio. `agent-browser eval` en una ruta tablet landscape:
`useDevice().isLandscape === true`; en portrait `=== false`; en phone `=== false`.

**Done:** `useDevice()` expone `isLandscape` correcto en los 3 modos. Cero cambios visuales.

---

# OLA 1 — alto tráfico

## Task 1 — Listas en 2 columnas (landscape)

**Files:**

- Modify: `src/components/pwa/listings-list-screen.tsx` (contenedor de filas)
- Revisar: `src/components/pwa/listing-row.tsx` (la fila no debe asumir ancho 100%)
- Aplica a: restaurants/stay/things/trails `list` (todas usan `listings-list-screen`)

**Action:** Cuando `isLandscape`, envolver las filas en `grid grid-cols-2 gap-x-4` (en vez
de la columna 1-wide). Patrón:

```tsx
const { isLandscape } = useDevice();
<div className={isLandscape ? 'grid grid-cols-2 gap-x-4' : ''}>
  {items.map((it) => <ListingRow key={it.slug} ... />)}
</div>
```

Verificar que `ListingRow` se ve bien a ~570px de ancho (foto, título, distancia, corazón
sin encimarse). Calibrar `gap`/paddings visualmente.

**Verify:** `agent-browser` `/pwa/restaurants/list?device=tablet&orientation=landscape` →
2 columnas sin hueco muerto. Control portrait (1-col intacto) y phone (intacto).

**Done:** las 4 listas en 2-col en landscape; portrait/phone sin cambio.

## Task 2 — Detail centrado con max-width (landscape)

**Files:**

- Modify: `src/components/pwa/listings-detail-screen.tsx`
- Aplica también a: `pass-detail-screen.tsx`, `tickets-detail-screen-live.tsx`,
  `events-detail-screen-live.tsx` (revisar cada uno; mismo patrón)

**Action:** En `isLandscape`, hero sigue full-width; el **contenido scrolleable** (todo lo
de debajo del hero: barra de acciones, horario, mapa, dirección, descripción) se centra en
una columna con `max-width ~840px` (`mx-auto`) para que el texto no se estire. La barra de
acciones y el hero quedan full-width. Patrón:

```tsx
// dentro del cuerpo scroll, envolver el bloque post-hero:
<div className={isLandscape ? 'mx-auto w-full max-w-[840px]' : ''}>...</div>
```

(Baseline; NO 2-col-bajo-hero salvo que Rubén lo pida en pulido.)

**Verify:** `agent-browser` detail landscape (restaurants, pass, tickets, events) → contenido
legible centrado, hero/acciones full-width, mapa full-width (Task 3). Control portrait/phone.

**Done:** detalles con contenido centrado en landscape; portrait/phone intactos.

## Task 3 — Map full-canvas + fix resize de `ListingsMap`

**Files:**

- Modify: `src/components/pwa/pwa-map-screen.tsx` (alto del mapa en landscape)
- Modify: `src/components/pwa/listings-map.tsx` (tab Map de las listas — resize)

**Action:** (a) En la pantalla Map y el tab Map, el mapa **llena el canvas** en landscape
(alto = espacio disponible, no un valor fijo bajo). (b) Replicar el fix ya aplicado en
`MapboxMap`: si `listings-map.tsx` instancia Mapbox directo, añadir
`ResizeObserver(() => map.resize())`; si reusa `MapboxMap`, ya está cubierto — verificar.

**Verify:** `agent-browser` `/pwa/map?...landscape` y tab Map de una lista → mapa llena el
ancho/alto, sin franja angosta. Control portrait/phone.

**Done:** mapas llenan el canvas en landscape; sin regresión del mapa portrait/phone/kiosk.

## Task 4 — Events (landscape)

**Files:**

- Modify: `src/components/pwa/events-timeline-screen.tsx`

**Action:** El portrait tablet ya agrupa eventos por día en 2 columnas. En landscape, subir
a **3 columnas** por día (o mantener 2 más anchas si 3 aprieta — calibrar). Header full-width
ya resuelto. Patrón: `grid-cols-2` → `isLandscape ? 'grid-cols-3' : 'grid-cols-2'`.

**Verify:** `agent-browser` `/pwa/events?...landscape` → cards en 3-col por día sin
desbordar. Control portrait (2-col) y phone (timeline 1-col).

**Done:** events en landscape aprovecha el ancho; portrait/phone intactos.

## Task 5 — Dashboard (landscape, custom)

**Files:**

- Modify: `src/components/pwa/dashboard-screen-tablet.tsx` (variante tablet ya existe)

**Action:** Reflow custom para 1194×834 (alto corto): hero más bajo, quick-access en **fila**
(no apilado), módulos en **columnas** para que entre el máximo sin scroll excesivo. Calibrar
contra el portrait. Mantener todo config-driven (módulos, labels, orden).

**Verify:** `agent-browser` `/pwa/dashboard?...landscape` → hero + quick-access + módulos
caben y se ven balanceados; nada cortado por el alto 834. Control portrait/phone.

**Done:** dashboard landscape aprovecha el ancho y respeta el alto; portrait/phone intactos.

**Commit Ola 1:** `feat(tablet): landscape — ola 1 (listas, detail, map, events, dashboard)`

---

# OLA 2 — grids / contenido

## Task 6 — Grids +1 columna (categorías, passes, deals)

**Files:**

- Modify: `src/components/pwa/listings-grid-screen.tsx` (categorías; tiles 2→3)
- Modify: `src/components/pwa/passes-grid-screen.tsx` (2→3)
- Modify: `src/components/pwa/deals-grid-screen.tsx` (+1 col)

**Action:** En `isLandscape`, subir una columna respecto a portrait. Patrón (passes ya usa
`grid-cols-2` en portrait):

```tsx
className={`... ${isTablet ? (isLandscape ? 'grid grid-cols-3' : 'grid grid-cols-2') : 'space-y-3'}`}
```

Calibrar alto de card por columna.

**Verify:** `agent-browser` landscape de cada uno → 3-col sin apretar. Control portrait
(2-col) y phone.

**Done:** los 3 grids con +1 col en landscape; portrait/phone intactos.

## Task 7 — Tickets (landscape)

**Files:**

- Modify: `src/components/pwa/tickets-screen.tsx`

**Action:** Aplicar el arquetipo que corresponda (grid de cards → +1 col, o lista → 2-col,
según su layout portrait actual). Calibrar visualmente.

**Verify:** `agent-browser` `/pwa/tickets?...landscape`. Control portrait/phone.

**Done:** tickets aprovecha el ancho en landscape; portrait/phone intactos.

## Task 8 — Social Wall (landscape)

**Files:**

- Modify: `src/components/pwa/social-wall/` (componente de grid del wall)

**Action:** Masonry/grid del social wall: +1 columna en landscape respecto a portrait.

**Verify:** `agent-browser` `/pwa/social-wall?...landscape`. Control portrait/phone.

**Done:** social wall con más columnas en landscape; portrait/phone intactos.

## Task 9 — Digital Brochure (lista + reader)

**Files:**

- Modify: `src/components/pwa/brochures-list-screen.tsx` (grid +1 col)
- Modify: `src/components/pwa/brochure-reader-screen.tsx` (el reader llena el canvas; doble
  página si el ancho lo permite — calibrar, opcional)

**Action:** Lista de brochures: +1 col en landscape. Reader: aprovechar el ancho (página más
grande centrada; evaluar 2-páginas si encaja, si no, 1 centrada).

**Verify:** `agent-browser` lista + reader landscape. Control portrait/phone.

**Done:** brochure aprovecha el ancho; portrait/phone intactos.

## Task 10 — Trip Planner (landscape)

**Files:**

- Modify: `src/components/pwa/trip-planner/` (list-view, cards, welcome popup, wizard)

**Action:** List-view de favoritos en 2-col; menú de categorías y wizard ya tienen prop
`large` en tablet — verificar que en landscape no se corten (hero/popup). Calibrar.

**Verify:** `agent-browser` `/pwa/trip-planner?...landscape` (list + AI wizard + popup).
Control portrait/phone.

**Done:** trip planner usable y balanceado en landscape; portrait/phone intactos.

## Task 11 — Scavenger Hunt (landscape)

**Files:**

- Modify: `src/components/pwa/scavenger-hunt/` (lista de hunts/tasks)

**Action:** Grid de hunts/tasks: +1 col en landscape. Welcome sheet ya capada en portrait —
verificar a 834 de alto.

**Verify:** `agent-browser` scavenger landscape (índice + task + how-it-works).
Control portrait/phone.

**Done:** scavenger hunt aprovecha el ancho; portrait/phone intactos.

**Commit Ola 2:** `feat(tablet): landscape — ola 2 (grids, tickets, social, brochure, trip, scavenger)`

---

# OLA 3 — secundarias + overlays

## Task 12 — Profile + More (landscape)

**Files:**

- Modify: `src/components/pwa/profile-screen-tablet.tsx` (variante tablet existe)
- Modify: `src/components/pwa/more-screen.tsx`

**Action:** Profile tablet: aprovechar el ancho (hero+avatar, secciones, cards en fila).
More: la lista de items en 2-col en landscape.

**Verify:** `agent-browser` `/pwa/profile` y `/pwa/more` landscape. Control portrait/phone.

**Done:** profile y more aprovechan el ancho; portrait/phone intactos.

## Task 13 — Connect + Help + Search + Notifications (landscape)

**Files:**

- Modify: `src/components/pwa/connect-with-us-screen.tsx` (mapa + contenido a lo ancho)
- Modify: `src/components/pwa/help-screen.tsx` (lista de artículos 2-col)
- Modify: `src/components/pwa/search-screen.tsx` (resultados 2-col)
- Modify: `src/components/pwa/notifications-screen.tsx` (lista 2-col)

**Action:** Listas/artículos en 2-col; Connect: mapa más ancho centrado al contenido (el
portrait ya subió el mapa a 360 alto — en landscape ajustar).

**Verify:** `agent-browser` landscape de cada uno. Control portrait/phone.

**Done:** las 4 pantallas aprovechan el ancho; portrait/phone intactos.

## Task 14 — Wayfinding (landscape)

**Files:**

- Modify: `src/components/pwa/wayfinding-screen.tsx`, `wayfinding-directions.tsx`

**Action:** Mapa/route a lo ancho; step-list lateral o bajo el mapa según encaje a 834 alto.

**Verify:** `agent-browser` `/pwa/wayfinding/<slug>?...landscape`. Control portrait/phone.

**Done:** wayfinding usable en landscape; portrait/phone intactos.

## Task 15 — Auth / inmersivas (landscape)

**Files:**

- Modify: `src/components/pwa/mobile-layer.tsx` (`useImmersiveLayerStyle`)

**Action:** El bloque 375×812 centrado mide 844 > 834 de alto en landscape → escalar para
caber (factor `min(S, (834-margen)/812)`) o top-align, sin recortar los CTAs (LOGIN /
CREATE / Skip). Calibrar. Aplica a login/welcome/create/forgot/check-email/photo.

**Verify:** `agent-browser` `/pwa/login` y `/pwa/create-account` landscape → todo el bloque
visible (incl. botones inferiores). Control portrait (centrado) y phone (top-left).

**Done:** auth cabe completo en landscape; portrait/phone intactos.

## Task 16 — Overlays: caps de tamaño (landscape)

**Files:**

- Modify: `src/components/pwa/ask-ai/` (modal), `deal-redeem-popup.tsx`,
  `pwa-filter-overlay.tsx`, `ads/` (popup ad), sheets varios
- (Survey ya capado en `pwa-survey-overlay.tsx` — solo verificar en landscape)

**Action:** Revisar cada overlay con `height: N%` o `width` dependiente del canvas; aplicar
cap `max-width` + alto fijo/`max-height` (patrón survey) para que a 834 de alto no queden
enormes ni cortados. El popup ad ya tiene `width:500` en tablet — verificar a 834 alto.

**Verify:** `agent-browser` disparando cada overlay en landscape (Ask AI, filtros, deal
redeem, ad popup, survey). Control portrait/phone.

**Done:** overlays consistentes y no desbordados en landscape; portrait/phone intactos.

**Commit Ola 3:** `feat(tablet): landscape — ola 3 (profile, more, connect, help, search, notif, wayfinding, auth, overlays)`

---

## Cierre

- Tras las 3 olas: revisión visual final de barrido por todas las pantallas en landscape +
  no-regresión portrait/phone.
- Actualizar `.planning/STATE.md` (entrada de sesión) en `/terminar`.
- **Push** queda pendiente de la decisión de cierre de la fase Tablet (landscape +
  editor Studio + activación) — no pushear solo por cerrar landscape salvo que Rubén lo pida.
