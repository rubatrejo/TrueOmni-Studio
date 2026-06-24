# Plan de implementación — Activación a nivel dispositivo (auto-detección tablet)

> **Para workers:** GSD (CLAUDE.md §5). Verificación = `agent-browser` (emular viewport +
> standalone) + `typecheck`/`lint`. Spec aprobado:
> `.planning/2026-06-24-tablet-device-activation-design.md`.

**Goal:** Que el dispositivo desplegado (PWA instalada / standalone) arranque solo en
phone/tablet-portrait/tablet-landscape detectándolo del viewport, y siga la rotación en vivo,
sin el `?device=` manual.

**Arquitectura:** `device-context.tsx` resuelve en orden **param → standalone auto-detect →
phone** y, cuando auto-detecta, re-evalúa en `resize`/`orientationchange`. La detección de
standalone se extrae a un helper compartido que `MobileCanvas` también consume.

**Tech stack:** Next.js App Router · React 19 · TS estricto.

## Global Constraints (verbatim del spec)

- **Param gana siempre** (`?device=`/`?orientation=`): preview del Studio, tests y dev-view
  intactos.
- **Auto-detección solo en standalone** (PWA instalada). Pestaña normal / dev-view sin param =
  **phone** (comportamiento actual).
- **Form factor:** `min(innerWidth, innerHeight) >= 600` → tablet. **Orientación tablet:**
  `innerWidth >= innerHeight` → landscape, si no portrait. Phone = siempre portrait.
- **Hydration-safe:** SSR/primer render = phone; resolver real en effect post-montaje.
- No-regresión: kiosk no usa device-context; `MobileCanvas` sin cambio de comportamiento.
- `pnpm typecheck` + `lint` + `validate:configs` limpios. **Sin push** (cierra el milestone
  Tablet; el push se decide con Rubén).

---

## Task 1 — Helper `isStandalone()` compartido (refactor sin cambio de comportamiento)

**Files:**

- Create: `src/components/pwa/runtime-detect.ts`
- Modify: `src/components/pwa/mobile-canvas.tsx` (usar el helper)

**Action:**

1. Crear el módulo con el criterio que hoy vive inline en `MobileCanvas.detectStandalone()`:

```ts
/**
 * Detección de runtime de la PWA, compartida por `MobileCanvas` y `DeviceProvider`
 * (una sola fuente de verdad).
 */

/** PWA instalada (añadida a inicio): el SO la lanza full-screen sin chrome del navegador. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  // iOS Safari expone `navigator.standalone`; el resto, el media query estándar.
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches;
}
```

2. En `mobile-canvas.tsx`: importar `isStandalone` desde `./runtime-detect`, borrar la función
   local `detectStandalone()` y usar `isStandalone()` en su lugar (en el `useEffect` que hace
   `setStandalone(detectStandalone())`). `detectEmbedded()` se queda como está (solo lo usa
   MobileCanvas).

**Verify:** `pnpm typecheck` limpio. `agent-browser open /pwa` (dev-view) → render idéntico
(la app sigue en dev-view phone). No cambia ningún comportamiento.

**Done:** `isStandalone()` existe en `runtime-detect.ts` y `MobileCanvas` lo consume; cero
cambio visual/funcional.

---

## Task 2 — device-context: resolución param→standalone-autodetect→phone + resize en vivo

**Files:**

- Modify: `src/components/pwa/device-context.tsx`

**Interfaces:**

- Consumes: `isStandalone()` de `./runtime-detect` (Task 1).

**Action:** Reemplazar el `useEffect` del `DeviceProvider` por la resolución en orden + listener.
El default del `useState` y el resto del archivo (tipos, `useDevice`, `deviceDims`,
`TABLET_STATUS_INSET`) **no cambian**.

```tsx
import { isStandalone } from './runtime-detect';

// ...dentro de DeviceProvider, reemplazar SOLO el useEffect:
useEffect(() => {
  // 1) Param explícito (preview del Studio, tests, dev-view) → fijo, gana siempre.
  let fixed: { device: Device; orientation: Orientation } | null = null;
  try {
    const params = new URLSearchParams(window.location.search);
    const dParam = params.get('device');
    const oParam = params.get('orientation');
    if (dParam !== null || oParam !== null) {
      const device: Device = dParam === 'tablet' ? 'tablet' : 'phone';
      const orientation: Orientation = oParam === 'landscape' ? 'landscape' : 'portrait';
      fixed = { device, orientation };
    }
  } catch {
    /* sin window/params → cae a la resolución por defecto */
  }

  // 2) Standalone (dispositivo real) → auto-detección por viewport. 3) Si no → phone.
  const resolve = (): { device: Device; orientation: Orientation } => {
    if (fixed) return fixed;
    if (isStandalone()) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const device: Device = Math.min(w, h) >= 600 ? 'tablet' : 'phone';
      const orientation: Orientation = device === 'tablet' && w >= h ? 'landscape' : 'portrait';
      return { device, orientation };
    }
    return { device: 'phone', orientation: 'portrait' };
  };

  const apply = () => {
    const { device, orientation } = resolve();
    setValue({
      device,
      orientation,
      isTablet: device === 'tablet',
      isLandscape: device === 'tablet' && orientation === 'landscape',
    });
  };
  apply();

  // Rotación / resize en vivo SOLO cuando auto-detectamos (con param el valor es fijo:
  // el preview del Studio no debe cambiar al redimensionar la ventana del editor).
  if (!fixed) {
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
    return () => {
      window.removeEventListener('resize', apply);
      window.removeEventListener('orientationchange', apply);
    };
  }
}, []);
```

**Verify (agent-browser, dev local):**

1. **No-regresión dev-view sin param:**

```bash
agent-browser open "http://localhost:3000/pwa"
agent-browser eval "JSON.stringify((()=>{const e=document.querySelector('[data-pwa-canvas]');return {canvasW:e&&e.getBoundingClientRect().width};})())"
```

Esperado: phone (canvas 390) — como hoy.

2. **No-regresión param (Studio/preview):**

```bash
agent-browser open "http://localhost:3000/pwa?device=tablet&orientation=landscape"
# canvas 1194 (tablet landscape) — el param gana, igual que ahora.
```

3. **Auto-detección standalone** — forzar `display-mode: standalone` y un viewport tablet, y
   leer el resultado del helper de resolución vía `eval` (Chromium emula standalone con
   `--app`/emulation; si no, validar la LÓGICA con un eval que replique `resolve()` sobre
   `innerWidth/innerHeight` + `matchMedia`). Esperado: 834×1194 → tablet/portrait; 1194×834 →
   tablet/landscape; 390×844 → phone; y que al pasar de uno a otro (resize) cambie en vivo.

**Done:** sin param + standalone, `useDevice()` devuelve el form-factor/orientación del viewport
y rota en vivo; con param o sin standalone, comportamiento actual intacto.

---

## Cierre

- `pnpm typecheck` + `lint` + `validate:configs` limpios.
- Commit `feat(pwa): activación a nivel dispositivo — auto-detección tablet por viewport`.
- **Cierra el milestone Tablet.** Actualizar `.planning/STATE.md` en `/terminar`; el **push**
  del milestone completo se decide con Rubén.
