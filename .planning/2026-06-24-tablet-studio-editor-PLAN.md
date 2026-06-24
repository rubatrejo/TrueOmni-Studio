# Plan de implementación — Editor del producto **Tablet** en el Studio

> **Para workers:** ejecutar tarea por tarea. Formato GSD (CLAUDE.md §5): cada `<task>`
> lleva `<files>`, `<action>`, `<verify>`, `<done>`. Verificación = **visual/E2E**
> (`agent-browser` en dev local, donde el editor no exige auth) + `typecheck`/`lint`.
> Spec aprobado: `.planning/2026-06-24-tablet-studio-editor-design.md`.

**Goal:** Exponer la card "Tablets" (live, espejando la PWA) que abre el editor de la PWA
con el preview en tablet y un toggle Portrait/Landscape.

**Arquitectura:** reuso total del editor PWA (`PwaShell` + datos `features.pwa` + bridge +
publish). El único trabajo real es que `PreviewPanel` soporte `device='tablet'` con tabs de
orientación y URL `/pwa?device=tablet&orientation=…`. Más flips en `products.ts`/`ClientView`
y reemplazar el stub `tablets/page.tsx`.

**Tech stack:** Next.js App Router · React 19 · TS estricto · Studio (`src/app/studio`).

## Global Constraints (verbatim del contrato/spec)

- **Cero código nuevo de datos:** el Tablet reusa `features.pwa`, branding, módulos, publish.
- **No tocar el editor PWA** (queda phone): los cambios en `PwaShell`/`PreviewPanel` van con
  defaults que preservan el comportamiento actual (`device='phone'`).
- **`PreviewPanel` es compartido** (Kiosk/PWA/Signage): cambios gated por `product`/`device`;
  no-regresión de los otros productos.
- **Activación espeja PWA:** la card Tablets es `active = manifest.products.mobilePwa`. Sin
  flag nuevo en el manifest.
- Verificación: `agent-browser` en dev local. `pnpm typecheck` + `lint` limpios; `pnpm build`
  si se tocan tipos de `next/navigation` (no es el caso aquí). **Sin push** hasta cerrar el
  milestone Tablet.

---

## Task 1 — PreviewPanel: soporte `device='tablet'` + tabs de orientación

**Files:**

- Modify: `src/app/studio/_components/PreviewPanel.tsx`

**Action:**

1. Extender el tipo y las dims:

```tsx
type PreviewOrientation =
  | 'portrait'
  | 'landscape'
  | 'mobile-pwa'
  | 'tablet-portrait'
  | 'tablet-landscape';

const ORIENTATION_DIMS: Record<PreviewOrientation, { w: number; h: number }> = {
  portrait: { w: 1080, h: 1920 },
  landscape: { w: 1920, h: 1080 },
  'mobile-pwa': { w: 390, h: 844 },
  'tablet-portrait': { w: 834, h: 1194 },
  'tablet-landscape': { w: 1194, h: 834 },
};
```

2. Añadir prop `device?: 'phone' | 'tablet'` (default `'phone'`) a `PreviewPanel` (junto a
   `product`). Orientation inicial device-aware:

```tsx
const [orientation, setOrientation] = useState<PreviewOrientation>(
  product === 'pwa' ? (device === 'tablet' ? 'tablet-portrait' : 'mobile-pwa') : initialOrientation,
);
```

3. `previewSrc` con params cuando es tablet:

```tsx
const previewSrc =
  product === 'pwa'
    ? device === 'tablet'
      ? `/pwa?device=tablet&orientation=${orientation === 'tablet-landscape' ? 'landscape' : 'portrait'}`
      : '/pwa'
    : orientation === 'mobile-pwa'
      ? '/?viewport=mobile-pwa'
      : '/';
```

4. Tabs: cuando `product==='pwa' && device==='tablet'`, mostrar dos `DeviceTab`
   (Portrait/Landscape) en vez del tab estático "Mobile"; el resto del bloque PWA/kiosk igual:

```tsx
{product === 'pwa' ? (
  device === 'tablet' ? (
    <>
      <DeviceTab
        active={orientation === 'tablet-portrait'}
        onClick={() => setOrientation('tablet-portrait')}
        icon={<MobileGlyph />}
        label="Tablet · 834×1194"
      />
      <DeviceTab
        active={orientation === 'tablet-landscape'}
        onClick={() => setOrientation('tablet-landscape')}
        icon={<LandscapeGlyph />}
        label="Tablet · 1194×834"
      />
    </>
  ) : (
    <DeviceTab active onClick={() => {}} icon={<MobileGlyph />} label="Mobile · 390×844" />
  )
) : (
  /* ...kiosk portrait/landscape igual... */
)}
```

5. El render del frame NO necesita cambios: la guarda `orientation === 'landscape'` que muestra
   `OrientationComingSoon` NO matchea `tablet-*`, así que renderiza el iframe real. El
   `borderRadius` PWA y el default scale (0.4 para tablet) sirven.
6. Default scale tablet: en el effect de scale, `'mobile-pwa' ? 0.8 : 0.4` ya cubre tablet a
   0.4 (no tocar).
7. `FullScreenPreview`: el fallback `pwaSrc = initialSrc ?? '/pwa'` debe respetar el device en
   tablet. Pasar `device` al componente y usar:

```tsx
const pwaSrc =
  initialSrc ??
  (device === 'tablet'
    ? `/pwa?device=tablet&orientation=${orientation === 'tablet-landscape' ? 'landscape' : 'portrait'}`
    : '/pwa');
```

(El `openFullScreen` ya captura `pathname+search` del iframe, que incluye los params; el
fallback solo aplica si la captura same-origin falla.)

**Verify:** `pnpm typecheck` limpio. (Verificación visual en Task 3 cuando el editor monte.)

**Done:** `PreviewPanel` acepta `device='tablet'` y, con `product='pwa'`, muestra tabs
Portrait/Landscape que cargan `/pwa?device=tablet&orientation=…`. `device='phone'` (default) y
kiosk/signage **idénticos**.

---

## Task 2 — PwaShell: props `deviceOverride` + `productLabel`

**Files:**

- Modify: `src/app/studio/[slug]/mobile-pwa/_components/PwaShell.tsx`

**Action:**

1. Añadir al destructuring + tipo de props (con defaults que preservan la PWA):

```tsx
export function PwaShell({
  slug,
  nombre,
  initialPwa,
  initialMeta,
  initialBranding,
  initialUnified,
  kioskSystemModules,
  kioskTileImages,
  kioskTileLabels,
  kioskIdleBackground,
  availableLocales,
  defaultLocale,
  mapboxToken,
  deviceOverride = 'phone',
  productLabel = 'Mobile PWA',
}: {
  /* ...tipos existentes... */
  /** Form-factor del preview. 'tablet' = card Tablets (preview tablet). Default phone. */
  deviceOverride?: 'phone' | 'tablet';
  /** Etiqueta del producto en el TopBar/breadcrumb. Default 'Mobile PWA'. */
  productLabel?: string;
}) {
```

2. Usar `productLabel` donde hoy está hardcodeado `productLabel="Mobile PWA"` (línea ~356).
3. Pasar `device` al `PreviewPanel`:

```tsx
<PreviewPanel
  slug={slug}
  nombre={nombre}
  product="pwa"
  device={deviceOverride}
  reloadKey={previewKey}
  iframeRef={iframeRef}
  onIframeLoad={onIframeLoad}
  onLocaleChange={pushLocale}
/>
```

**Verify:** `pnpm typecheck` limpio. El editor PWA (`/studio/<slug>/mobile-pwa`) sigue
montando con preview phone (defaults).

**Done:** `PwaShell` acepta `deviceOverride`/`productLabel`; sin ellos = comportamiento PWA
actual intacto.

---

## Task 3 — Página del editor Tablet (reemplaza el stub Coming Soon)

**Files:**

- Modify (reemplazar contenido): `src/app/studio/[slug]/tablets/page.tsx`

**Action:** Clonar el data-loading de `src/app/studio/[slug]/mobile-pwa/page.tsx` y montar
`PwaShell` con `deviceOverride="tablet" productLabel="Tablets"`. La compuerta de slice usa
`manifest.products.mobilePwa` (Tablet espeja PWA). `metadata.title = 'Tablets · TrueOmni Studio'`.
Importar `PwaShell` desde `../mobile-pwa/_components/PwaShell`. El cuerpo es **idéntico** al de
`mobile-pwa/page.tsx` salvo: el import del shell (ruta relativa `../mobile-pwa/_components/PwaShell`),
el title, y el `<PwaShell … deviceOverride="tablet" productLabel="Tablets" />` final.

**Verify (E2E dev local):**

```bash
pnpm kiosk:dev   # ya corriendo; el Studio vive en /studio
agent-browser open "http://localhost:3000/studio/default/tablets"
agent-browser screenshot .planning/verifications/studio-tablet-editor.png
```

Esperado: monta el editor (sidebar + editor panel + preview), el preview muestra el marco
**tablet portrait** con tabs **Portrait/Landscape**; tocar Landscape recarga el iframe a
1194×834. Cambiar branding/idioma se refleja en el preview tablet (bridge). (Si el dev local
exige auth, QA por Rubén; documentar en STATE.)

**Done:** `/studio/<slug>/tablets` abre el editor real (no el stub) con preview tablet
funcional en ambas orientaciones.

---

## Task 4 — Activar la card: products.ts `live` + ClientView espeja PWA

**Files:**

- Modify: `src/app/studio/_lib/products.ts`
- Modify: `src/app/studio/[slug]/_components/ClientView.tsx`

**Action:**

1. `products.ts` — el item `tablets`: `status: 'soon'` → `status: 'live'`; eliminar
   `comingSoonCopy`. (El comentario de cabecera que dice "(coming soon)" para tablets puede
   actualizarse a "(live)".)
2. `ClientView.tsx` — la `<ProductCard segment="tablets" …>` (línea ~279):
   - `status="soon"` → `status="live"`,
   - quitar `soonTimeline="Exploring · 2027"`,
   - `active={initialManifest.products.tablets}` → `active={initialManifest.products.mobilePwa}`
     (espeja PWA),
   - actualizar `description` a algo fiel, p. ej.:
     `"Tu app móvil en formato tablet (portrait + landscape). Mismo contenido que la PWA."`

**Verify (E2E dev local):**

```bash
agent-browser open "http://localhost:3000/studio/default"
agent-browser screenshot .planning/verifications/studio-dashboard-tablet-live.png
```

Esperado: la card **Tablets** aparece **live y clickeable** (porque `default` tiene PWA),
sin badge "Coming Soon"/"Exploring 2027"; al clickearla navega a `/studio/default/tablets`
(Task 3). Un cliente sin PWA mostraría la card inactiva.

**Done:** la card Tablets es live y entra al editor; el dashboard ya no la marca como soon.

---

## Cierre

- No-regresión: abrir el editor **PWA** (`/studio/default/mobile-pwa`) y confirmar preview
  phone (tab "Mobile · 390×844", sin params) intacto; abrir un editor **Kiosk** y confirmar
  sus tabs Portrait/Landscape intactos.
- `pnpm typecheck` + `lint` + `validate:configs` limpios.
- Commit `feat(studio): editor del producto Tablet (reusa PWA + preview tablet)`.
- Actualizar `.planning/STATE.md` en `/terminar`. **Sin push** (milestone Tablet abierto:
  falta la activación a nivel dispositivo).
