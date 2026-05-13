# Smoke E2E Producción — Video Walls

**Fecha:** 2026-05-13
**Target:** https://trueomni-studio.vercel.app (sha 758e358)
**Toolchain:** `agent-browser` (vercel-labs) — read-only, sin auth
**QA:** automatizado vía Claude

---

## Resumen ejecutivo

7 de 8 chequeos pasan (templates 4×2/2×2/2×1/1×2 devuelven 404, comportamiento esperado y documentado). El runtime público de Video Walls está sano: stage 5760×2160 rendea correctamente, los modos QA `?cell=X,Y` y `?slide=N` funcionan tal como define `SignagePlayer.tsx`, el endpoint `/video-wall-assets/` sirve los PNGs en filesystem, y la regresión de signage (`/signage/default/lobby-tv`) sigue verde. Cero console errors detectados.

**Hallazgo notable:** la convención del path del endpoint de assets incluye el prefijo `assets/` literal (`/video-wall-assets/{slug}/assets/{ruta}`). El brief inicial de smoke usaba la versión truncada sin `assets/`, que devuelve "not found" — no es un bug, es la ruta real que el HTML del runtime emite. Documentado abajo.

---

## Tabla de chequeos

| #   | Chequeo                                      | Status              | URL                                                      | Observación                                                                                                                                                                                                                                    |
| --- | -------------------------------------------- | ------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Studio homepage carga + redirect sign-in     | ✅                  | `/studio` → `/studio/sign-in?callbackUrl=%2Fstudio`      | Redirect 302 correcto, título `Kiosk Studio · TrueOmni`.                                                                                                                                                                                       |
| 2   | Sign-in rendea con callback preservado       | ✅                  | `/studio/sign-in?callbackUrl=%2Fstudio`                  | UI "Welcome back" + botón "Sign in with GitHub". `hasCallback=true`.                                                                                                                                                                           |
| 3   | Runtime VW público sin auth, stage 5760×2160 | ✅                  | `/video-walls/default/lobby-3x2`                         | `stageStyle="width:5760px; height:2160px; ... scale(0.222222)"`. Pool.png visible. 26 divs. Cero `<img>` directos (todo background o slides).                                                                                                  |
| 4   | `?cell=0,0` aísla celda 1920×1080            | ✅                  | `/video-walls/default/lobby-3x2?cell=0,0`                | Stage redujo a `width:1920px; height:1080px; scale(0.534259)`. Screenshot muestra solo top-left (header + esquina sup-izq pool).                                                                                                               |
| 5   | `?slide=2` freeze slide N (QA hook)          | ✅                  | `/video-walls/default/lobby-3x2?slide=2`                 | Stage permanece 5760×2160 (correcto — `?slide` no altera dims, solo congela el playlist index vía `manualOverrideRef`). Screenshot muestra slide events con 6 tiles. Confirmado en `SignagePlayer.tsx:158-171`.                                |
| 6   | Assets endpoint sirve PNG                    | ✅ (con corrección) | `/video-wall-assets/default/assets/video-image/pool.png` | **HTTP 200, `content-type: image/png`, 1280×720.** El path correcto incluye el segmento `assets/` literal. La variante sin `assets/` (que aparecía en el brief) devuelve 302→`/signage-assets/default/video-image/pool.png` → "not found".     |
| 7   | Signage runtime regresión                    | ✅                  | `/signage/default/lobby-tv`                              | Rendea con stage propio, header band, events y weather. Display real es `lobby-tv` (no `landscape`). Cero console errors.                                                                                                                      |
| 8   | Templates 4×2/2×2/2×1/1×2                    | ⚠️ esperado 404     | `/video-walls/default/test-{slug}`                       | Los 4 devuelven `404 Page not found`. **Comportamiento esperado** — el seed `clients-walls/default/walls/` solo contiene `lobby-3x2/wall.json`. Los 8 templates derivados viven como `templates/` pero no como walls deployables en `default`. |

---

## Hallazgos relevantes

### 1. Convención del endpoint `/video-wall-assets/{slug}/assets/...`

El HTML del runtime emite URLs como `video-wall-assets/default/assets/video-image/pool.png` (doble `assets/`: una en la URL, una en la ruta filesystem `clients-walls/default/assets/video-image/pool.png`).

- ✅ Path correcto → 200 PNG.
- ❌ Path sin el segmento `assets/` → 302 redirect a `/signage-assets/...` → "not found".

**Acción sugerida:** documentar en el README del módulo VW que el endpoint público es `/video-wall-assets/{slug}/{filesystemPath}` y que `filesystemPath` siempre empieza con `assets/`. El redirect a `signage-assets/` cuando se omite es ruido — vale la pena considerar si el redirect es necesario o si conviene 404 directo.

### 2. `?slide=N` no altera dimensiones del stage

A diferencia de `?cell=X,Y` (que reescala a la celda), `?slide=N` solo congela el `currentIdx` del playlist y desactiva auto-advance. El stage sigue siendo 5760×2160. Esto es **intencional** (`manualOverrideRef.current = true` en `SignagePlayer.tsx`) y útil para diff visual de slide específico sin esperar al ciclo. Confirmado en código.

### 3. Sin console errors / sin imágenes rotas

`document.querySelectorAll('img')` devuelve 0 elementos en `lobby-3x2` — los assets se aplican como `background-image` inline o como children dentro de templates. `fetch()` directo a los PNGs del HTML devuelve 200. No hay broken images en ninguna de las 5 vistas chequeadas.

### 4. Regresión signage limpia

El runtime signage (`/signage/default/lobby-tv`) sigue operativo: header band, weather card (95° / WED 102/75 / THU 98/67 / FRI 97/81), events (Yoga Mornings, Chicago Cubs at SF Giants, etc.), reloj `8:07 PM Tue May 12`. No hay regresión del fix G2.

---

## Out-of-scope (validación manual por Rubén)

- `/studio/{slug}/video-walls` editor (requiere GitHub OAuth).
- AddSlideModal, SchedulePopover, SlideRowExpanded — solo dentro de auth.
- Seed `clients-walls/test-real/` — no probado en runtime; solo confirmado que existe el árbol (`events.json`, `tokens.css`, `walls/lobby-3x2/wall.json`, etc.).

---

## Screenshots

- `.planning/verifications/2026-05-13-vw-smoke-2-signin.png`
- `.planning/verifications/2026-05-13-vw-smoke-3-lobby3x2-full.png`
- `.planning/verifications/2026-05-13-vw-smoke-4-cell00.png`
- `.planning/verifications/2026-05-13-vw-smoke-5-slide2.png`
- `.planning/verifications/2026-05-13-vw-smoke-6-asset-ok.png`
- `.planning/verifications/2026-05-13-vw-smoke-7-signage-lobbytv.png`
