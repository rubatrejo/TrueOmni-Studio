# Diseño — Activación a nivel dispositivo (auto-detección de form-factor + orientación)

> Fecha: 2026-06-24 · Estado: **aprobado por Rubén** (design gate) · Autor: Rubén + Claude
> Cierra el milestone **Tablet** (portrait ✅ + landscape ✅ + editor Studio ✅ + activación).
> Metodología: GSD + Boris Cherny. Implementación → `writing-plans`.

---

## 1. Objetivo

Que un **dispositivo desplegado** arranque solo en el modo correcto (phone / tablet-portrait /
tablet-landscape) **sin el `?device=`/`?orientation=` manual**, detectándolo del viewport real,
y que **siga la rotación física** en vivo.

**Decisión de encuadre (confirmada con Rubén):** **auto-detección por viewport**, **gated a
modo standalone** (PWA instalada en el dispositivo dedicado). El query param sigue siendo
override para el preview del Studio, tests y dev-view.

---

## 2. Orden de resolución (en `device-context.tsx`)

1. **Param presente** (`?device=` y/o `?orientation=`) → se respeta. _Sin cambios para el
   preview del Studio, los tests y el dev-view que ya usan el param._
2. **Standalone** (PWA instalada / display-mode standalone = dispositivo real) → **auto-detecta
   del viewport**.
3. **Si no** (pestaña de navegador normal / dev-view sin param) → **phone** (comportamiento
   actual; no rompe dev ni testing).

---

## 3. Lógica de auto-detección

- **Form factor:** `Math.min(window.innerWidth, window.innerHeight) >= 600` → `tablet`; si no →
  `phone`. (600 = breakpoint estándar `sw600dp`; iPad 11″ 834×1194 → tablet; phone grande
  430×932 → phone.)
- **Orientación:** `window.innerWidth >= window.innerHeight` → `landscape`; si no → `portrait`.
- Solo aplica cuando `device === 'tablet'`; en phone la orientación es siempre `portrait`
  (consistente con el runtime actual).

---

## 4. Rotación / resize en vivo

Cuando la resolución viene de auto-detección (no de param), un listener de `resize` +
`orientationchange` **re-evalúa** form-factor y orientación y actualiza el contexto. Así girar
físicamente la tablet hace portrait↔landscape al instante (hoy el device-context se lee una sola
vez al montar). Cuando viene de **param**, el valor es fijo (el preview no debe cambiar por
resize de la ventana del Studio).

---

## 5. Detección de standalone

Se reutiliza el criterio que ya usa `MobileCanvas.detectStandalone()`:
`navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches`.
Se extrae a un helper compartido (p. ej. `src/lib/pwa-runtime.ts` o un export desde
`device-context`) para una sola fuente de verdad, y `MobileCanvas` lo consume también (sin
cambiar su comportamiento).

---

## 6. Hydration safety

Igual patrón que hoy: SSR/primer render = `phone` (no conoce `window`); tras montar, el effect
resuelve el valor real (param → standalone auto-detect → phone) y hace `setValue`. El listener
de resize solo se registra en cliente. Esto evita mismatch de hidratación (regla del CLAUDE.md
sobre `usePathname`/SSR).

---

## 7. No-objetivos (YAGNI / aparte)

- ❌ Opt-out por cliente (forzar phone en hardware tablet) — la auto-detección es genérica.
- ❌ Auto-detectar en pestaña de navegador casual (rompería el dev-view sin param); solo
  standalone.
- ❌ Que el canvas llene EXACTAMENTE cualquier resolución de tablet — el runtime usa dims de
  referencia (834×1194 / 1194×834) y centra/escala; refinar el fill real es un follow-up.
- ❌ Env/build flag por dispositivo (descartado en la decisión).

---

## 8. Verificación

- **`agent-browser`** redimensionando el viewport a 834×1194 (tablet portrait) y 1194×834
  (tablet landscape) con `display-mode: standalone` forzado (vía emulación / `matchMedia`
  stub o `eval` del helper) → `useDevice()` devuelve `isTablet`/`isLandscape` correctos y
  **cambia al rotar** (resize). En 390×844 → phone.
- **No-regresión:** dev-view sin param = phone (como hoy); `/pwa?device=tablet&orientation=…`
  (Studio/preview/tests) = exactamente como ahora (param gana); el kiosk **no** usa
  device-context (intacto). `MobileCanvas` standalone/embedded/dev-view sin cambios de comportamiento.
- `pnpm typecheck` + `lint` + `validate:configs` limpios.

---

## 9. Entregable

- `device-context.tsx` con resolución param→standalone-autodetect→phone + listener de resize.
- Helper `isStandalone()` compartido (device-context + MobileCanvas).
- Capturas/notas de verificación en `.planning/verifications/`.
- Commit `feat(pwa): activación a nivel dispositivo — auto-detección tablet por viewport`.
- **Cierra el milestone Tablet.** El **push** del milestone completo (portrait+landscape+editor+
  activación) se decide con Rubén al cerrar (hoy todo local sin push).
