# Diseño — Editor del producto **Tablet** en el Studio

> Fecha: 2026-06-24 · Estado: **aprobado por Rubén** (design gate) · Autor: Rubén + Claude
> Sucede a: Tablet **portrait** ✅ + **landscape** ✅ (runtime aprobado).
> Metodología: GSD + Boris Cherny. Implementación → `writing-plans` (plan XML atómico).

---

## 1. Objetivo

Exponer el producto **Tablet** en el Studio como producto de primera clase (su card en
el dashboard del cliente), reutilizando **al 100%** el editor de la PWA, con el **preview en
tablet** y un toggle **Portrait / Landscape**.

**Premisa central:** el Tablet **comparte TODO el dato con la PWA** (`features.pwa`, branding,
módulos heredados). Editar Tablet = editar la PWA (misma app, otro form-factor). Lo único
propio del Tablet es **su card** y que **el preview se ve en dims de tablet**.

**Decisiones de encuadre (confirmadas con Rubén):**

- **Editor:** card propia de Tablets que abre el MISMO `PwaShell` con preview tablet
  (no un editor nuevo, no datos propios).
- **Activación:** la Tablet **espeja a la PWA** — si el cliente tiene `mobilePwa` activo, la
  card Tablets es clickeable. **Sin flag nuevo** en el manifest.
- **Cambio de orientación:** **toggle segmentado de 2 tabs** (Portrait / Landscape) en el
  panel de preview, mismo patrón que el Kiosk ya tiene. Default **Portrait**.

---

## 2. No-objetivos (YAGNI / piezas separadas)

- ❌ **Activación a nivel dispositivo** (cómo arranca el hardware en `device=tablet` sin el
  query param) — es la otra pieza del milestone Tablet, en sesión aparte.
- ❌ Slice de datos propio del Tablet (comparte `features.pwa`).
- ❌ Setting de "orientación por defecto del cliente" (el preview solo permite VER ambas).
- ❌ Tocar el editor PWA (queda phone-only; el Tablet es su propia card).
- ❌ Endpoints API nuevos ni publish nuevo (reusa los de la PWA).

---

## 3. Arquitectura (reuso, casi cero código nuevo)

| Pieza                                               | Hoy                                                     | Cambio                                                                                                                                         |
| --------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/studio/_lib/products.ts`                   | `tablets: status 'soon'`                                | → **`'live'`** (quitar copy "Coming Soon").                                                                                                    |
| `ClientView.tsx` (dashboard)                        | card Tablets `soon`                                     | card **`active` = `manifest.products.mobilePwa`** (espeja PWA), `status: 'live'`.                                                              |
| `/studio/[slug]/tablets/page.tsx`                   | stub Coming Soon                                        | carga los **mismos datos que `mobile-pwa/page.tsx`** y monta `<PwaShell … deviceOverride="tablet" productLabel="Tablets" />`.                  |
| `mobile-pwa/_components/PwaShell.tsx`               | phone-only                                              | acepta `deviceOverride?: 'phone'\|'tablet'` (default `'phone'`) + `productLabel?`; los pasa al `PreviewPanel`. El editor PWA actual NO cambia. |
| `studio/_components/PreviewPanel.tsx`               | `product='pwa'` → `/pwa` sin params, único tab "Mobile" | **trabajo real** (ver §4).                                                                                                                     |
| `use-pwa-preview-bridge.ts` + runtime `useDevice()` | reflow por device                                       | **sin cambios** (ya reflowean por el `?device`/`?orientation`).                                                                                |
| Publish / Clone                                     | PWA publica `features.pwa`; clone duplica productos     | **sin cambios** (el Publish del Tablet ES el de la PWA).                                                                                       |

---

## 4. PreviewPanel — el trabajo real

Cuando `product='pwa'` **y** `device='tablet'`:

- **Iframe src** con params: `/pwa?device=tablet&orientation=portrait|landscape`
  (hoy hardcodea `/pwa` sin params).
- **Tabs Portrait / Landscape** en lugar del único "Mobile · 390×844":
  - Portrait → dims **834×1194**.
  - Landscape → dims **1194×834**.
- Añadir esas dims a `ORIENTATION_DIMS` (`tablet-portrait`, `tablet-landscape`) y al tipo
  `PreviewOrientation`.
- Default **Portrait**. El toggle solo cambia `?orientation=` + las dims del marco; el bridge
  y el runtime ya reflowean.

`product='pwa'` con `device='phone'` (el editor PWA) **queda idéntico** (un solo tab Mobile,
src `/pwa`). `product='kiosk'`/`signage` intactos.

---

## 5. Flujo de datos (idéntico a la PWA)

`tablets/page.tsx` (server) carga en paralelo lo mismo que la PWA: `loadPwaSlice(slug)`,
branding unificado, módulos/imágenes/idle heredados del Kiosk, locales, mapbox token → monta
`PwaShell`. El editor escribe vía los **mismos** PATCH (`patchPwaSlice`, `patchClientBranding`)
y publica con el **mismo** `PublishModal product="pwa"`. El bridge `usePwaPreviewBridge` envía
los mismos `studio:pwa-update` / `studio:branding-update` al iframe, que ahora corre en tablet.

---

## 6. Verificación

- **E2E `agent-browser`** (spec scriptable si el flujo se repite): `/studio/[slug]` → card
  Tablets **activa** (cliente con PWA) → editor monta → preview tablet con tabs
  **Portrait/Landscape** → cambiar branding/idioma y ver el preview reflejar en tablet (bridge)
  en ambas orientaciones → Publish reusa el flujo PWA.
- **No-regresión:** editor **PWA** sigue phone-only (un tab Mobile, sin params); editores
  Kiosk/Signage intactos; runtime PWA/Tablet sin cambios.
- `pnpm typecheck` + `lint` + `validate:configs` limpios. `pnpm build` si se tocan tipos de
  `next/navigation` (regla del CLAUDE.md).

---

## 7. Riesgos / consideraciones

- **Dos cards (PWA + Tablet) editan el mismo `features.pwa`:** es intencional (misma app, dos
  form-factors). No hay divergencia de datos; el Publish de cualquiera publica lo mismo.
- **`PreviewPanel` es compartido** por Kiosk/PWA/Signage: los cambios van **gated** por
  `product`/`device`; verificar no-regresión de los otros productos.
- **Auth del Studio:** el editor requiere login GitHub; `agent-browser` no entra al editor
  protegido en prod → QA del editor en local (dev sin AUTH) o por Rubén en prod.

---

## 8. Entregable

- Card Tablets `live` y clickeable (espejando PWA) + editor Tablet (PwaShell + preview tablet
  con toggle Portrait/Landscape) + publish reutilizado.
- Capturas de verificación en `.planning/verifications/`.
- Commit `feat(studio): editor del producto Tablet (reusa PWA + preview tablet)`.
- **Sin push** hasta cerrar el milestone Tablet (este editor + activación a nivel dispositivo),
  salvo que Rubén lo pida.
