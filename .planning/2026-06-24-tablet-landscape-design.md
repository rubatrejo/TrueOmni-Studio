# Diseño — Producto Tablet **Landscape** (reflow adaptativo)

> Fecha: 2026-06-24 · Estado: **aprobado por Rubén** (design gate) · Autor: Rubén + Claude
> Sucede a: Tablet **portrait** Fase 1 (`da0108a`) + Fase 2 (`9195fe2`, `90eb904`) ✅
> Metodología: GSD + Boris Cherny. Implementación → `writing-plans` (plan XML atómico).

---

## 1. Objetivo

Adaptar el producto **Tablet** a orientación **landscape** (`1194×834`) con **reflow
adaptativo por pantalla**, aprovechando el ancho y respetando el alto corto. Es la
continuación natural del tablet **portrait** (ya aprobado): mismo runtime, mismas rutas,
mismos datos `features.pwa`; cambia **solo el layout** por orientación.

**Decisiones de encuadre (confirmadas con Rubén):**

- **Estrategia:** _adaptativo por pantalla_ (multi-columna donde aplique). **NO**
  master-detail (no se cambia el modelo de navegación: un tap sigue navegando). **NO**
  letterbox centrado.
- **Sin XD de referencia:** se diseña con **buen criterio** (reflow), igual que el
  tablet portrait. El único pixel-perfect XD es el phone 375; no se toca.
- **Alcance:** _pasada completa_ — TODAS las pantallas, que ninguna se vea rota, con más
  pulido en las de alto tráfico (dashboard, listas, detail, map, events).
- **Detail (baseline):** hero full-width + **contenido en columna centrada con
  `max-width ~840px`**. El pulido "2 columnas bajo el hero" queda como **opción** a evaluar
  visualmente en alto tráfico, no como baseline.

---

## 2. No-objetivos (YAGNI)

- ❌ Master-detail / two-pane (cambiaría el flujo de navegación).
- ❌ Tocar el phone (pixel-perfect XD) ni el tablet **portrait** (ambos ya aprobados).
- ❌ Editor del Studio para Tablet ni activación por cliente (milestones posteriores).
- ❌ Nuevos assets/SVG: es reflow del diseño existente.

---

## 3. Mecanismo

- `device-context` ya expone `orientation`. Se añade azúcar **`isLandscape`**
  (`device === 'tablet' && orientation === 'landscape'`) al `DeviceContextValue` y al
  hook `useDevice()`, para ergonomía (evita repetir la condición en cada pantalla).
- Las pantallas hoy ramifican solo por `isTablet`. Landscape **añade ramas
  `isLandscape`** SOLO donde el alto/ancho lo amerita. Gating estricto:
  - `phone` → sin cambios (pixel-perfect XD).
  - `tablet portrait` → sin cambios (ya aprobado).
  - `tablet landscape` → nuevo reflow.
- `deviceDims('tablet','landscape')` ya devuelve `1194×834`. El chrome compartido
  (header portaleado full-width, bottom-nav, `TABLET_STATUS_INSET`) ya es full-width →
  sirve igual en landscape sin cambios.

---

## 4. Reglas por arquetipo (corazón del reflow)

Las pantallas se agrupan en arquetipos; el reflow se define por arquetipo, no una a una.

| Arquetipo                 | Pantallas                                                           | Regla landscape                                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Listas (filas)**        | restaurants/stay/things/trails `list`, search, notifications, help  | **2 columnas** de filas (hoy 1 fila ancha con hueco muerto).                                                                                               |
| **Grids (cards)**         | categorías (listings-grid), passes, deals, social wall, brochure    | **+1 columna** vs portrait (passes 2→3, categorías 2→3).                                                                                                   |
| **Detail (scroll 1-col)** | restaurants/stay/things/events/trails/pass/tickets detail           | Hero full-width + **contenido en columna centrada `max-width ~840px`**. (Pulido opcional: 2-col bajo el hero en alto tráfico.)                             |
| **Map**                   | `/pwa/map`, tab Map de las listas                                   | El mapa **llena el canvas**. Fix `ResizeObserver`→`map.resize()` al `ListingsMap` (misma causa que el ya arreglado en `MapboxMap`).                        |
| **Modales/overlays**      | survey, Ask AI, ad popup, filtros, sheets                           | Cap **max-width + alto fijo** (patrón ya aplicado en survey) para no quedar enormes/cortados a 834 de alto.                                                |
| **Dashboard**             | dashboard                                                           | Reflow custom a lo ancho (hero más bajo, quick-access en fila, módulos en columnas). Verificación dedicada.                                                |
| **Auth/inmersivas**       | login, welcome, create-account, forgot-password, check-email, photo | El bloque 375×812 centrado mide 844 > 834 de alto → en landscape **escala para caber** (factor < S) o top-align. Ajuste menor en `useImmersiveLayerStyle`. |

**Notas transversales:**

- Conteos de columna exactos se **calibran visualmente** (agent-browser) — la tabla fija
  la dirección, no el número final.
- Cualquier `height: N%` de un overlay que dependa del alto del canvas se revisa (a 834
  el % cambia respecto a portrait 1194).

---

## 5. Inventario → olas de ejecución

- **Ola 1 (alto tráfico):** dashboard · listas (restaurants/stay/things/trails) · detail ·
  map · events.
- **Ola 2 (grids/contenido):** passes · deals · tickets · social wall · brochure ·
  trip planner · scavenger hunt.
- **Ola 3 (secundarias + overlays):** profile · more · connect · help · search ·
  notifications · wayfinding · auth (login/welcome/create/forgot/check-email/photo) ·
  Ask AI · survey · filtros/sheets · ads.

Cada ola: reflow → captura `agent-browser` landscape → ajuste → no-regresión portrait+phone.

---

## 6. White-label / no-regresión

- **Cero hardcoded:** colores por tokens, textos por config, assets por path (sin cambios
  al contrato white-label). El reflow es puramente de layout.
- **No-regresión obligatoria:** tras tocar cualquier componente compartido, verificar
  phone (pixel-perfect XD) y tablet portrait intactos. Todo cambio gated por `isLandscape`.
- **Verificación:** `agent-browser` en `?device=tablet&orientation=landscape` por pantalla
  - capturas portrait y phone de control. `pnpm typecheck` + `lint` + `validate:configs`
    limpios por ola.

---

## 7. Riesgos / consideraciones

- **Alto corto (834):** menos contenido visible por viewport; modales y dashboard son los
  más sensibles. Mitigación: caps de alto + reflow del dashboard con verificación dedicada.
- **Componentes compartidos kiosk/PWA** (`MapboxMap`, `ListingsMap`): extender con ramas
  aditivas (default = comportamiento actual), nunca cambiar firmas. Verificar kiosk.
- **`useImmersiveLayerStyle` en landscape:** el bloque de auth puede exceder 834 de alto;
  clamp/escala para caber sin recortar CTAs.

---

## 8. Entregable de cada ola

- Reflow landscape de las pantallas de la ola, gated por `isLandscape`.
- Capturas de verificación en `.planning/verifications/` (landscape + control portrait/phone).
- Commit temático `feat(tablet): landscape — <ola>` (local; **push** según decisión de
  cierre de fase Tablet, hoy aún sin push hasta completar landscape + Studio + activación).
