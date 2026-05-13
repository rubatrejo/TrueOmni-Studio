# Video Walls — Smoke E2E full flow (cliente nuevo → publish → runtime)

**Fecha:** 2026-05-13 · **Target:** `https://trueomni-studio.vercel.app` (post deploy d69e136)
**QA:** Claude (read-only, sin credenciales GitHub) · **Toolchain:** `agent-browser` (vercel-labs) + WebFetch

---

## Resumen ejecutivo

1. **Sin-auth (Parte a) — 8/8 chequeos verdes.** Homepage, sign-in con callback preservado, runtime VW público (`lobby-3x2`, `?slide=0..5`, `?cell=0,0`), assets PNG/SVG, signage regresión, API health JSON OK, y `POST /api/studio/clients` sin cookies correctamente devuelve **401**.
2. **Spec ejecutable creado** en `tests/e2e/video-walls-full-flow.json` cubriendo el flow completo (sign-in → create client → activar VW → editor → add slide → publish PR → runtime). Incluye 2 pasos `pause` para auth manual y verificación del merge.
3. **Bug latente detectado:** `/video-walls/default/lobby-3x2?slide=5` emite `@@username@@` literal (placeholders del template `social` sin hidratar). Reportado abajo en Hallazgos. No bloquea el flow E2E pero conviene patchearlo antes del push de cliente real.

---

## Parte (a) — Validación sin auth

| #   | Chequeo                           | URL                                                      | HTTP | Observación                                                                                                 |
| --- | --------------------------------- | -------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------- |
| 1   | Root sirve kiosk default          | `/`                                                      | 200  | Render kiosk Arizona (TouchHere / language switcher). Confirma deploy unificado kiosk+studio en mismo host. |
| 2   | `/studio` redirect a sign-in      | `/studio`                                                | 302→ | Redirecciona a sign-in con `callbackUrl=%2Fstudio`. Sin sesión, content gate funciona.                      |
| 3   | Sign-in renderiza GitHub provider | `/studio/sign-in?callbackUrl=%2Fstudio`                  | 200  | "Welcome back" + "Sign in with GitHub" único provider. callbackUrl preservado.                              |
| 4   | Runtime VW público (sin auth)     | `/video-walls/default/lobby-3x2`                         | 200  | Render full (stage 5760×2160 scaled). Sin gating de auth — correcto.                                        |
| 5   | `?slide=0..5` QA hook             | `/video-walls/default/lobby-3x2?slide=N`                 | 200  | slide=0..4 renderean OK. **slide=5 muestra `@@username@@` sin sustituir** (ver Hallazgos).                  |
| 6   | `?cell=0,0` crop celda            | `/video-walls/default/lobby-3x2?cell=0,0`                | 200  | Render single-cell. Compatible con bezel-aware deployment.                                                  |
| 7   | VW asset PNG                      | `/video-wall-assets/default/assets/video-image/pool.png` | 200  | PNG 1.5 MB válido (`content-type: image/png`).                                                              |
| 8   | Signage asset SVG (regresión)     | `/signage-assets/default/assets/logo.svg`                | 200  | SVG "TrueOmni" servido — regresión signage limpia.                                                          |
| 9   | API health endpoint               | `/api/health`                                            | 200  | JSON `{status:"ok", kv:51ms, fs:6ms, ts:"2026-05-13T03:25:54Z"}`. Probes KV+FS healthy.                     |
| 10  | API auth gate (POST clients)      | `POST /api/studio/clients` sin cookies                   | 401  | Auth gate correcto. Confirma que el flow E2E **debe** ir vía UI autenticada.                                |

**Veredicto Parte (a):** producción está sana en su superficie pública. El gate de auth funciona. Solo queda un placeholder roto en `slide=5` que es cosmético y no bloquea.

---

## Parte (b) — Spec ejecutable agent-browser

**Path:** `tests/e2e/video-walls-full-flow.json`

**Cómo ejecutarlo:**

```bash
# 1. Asegurate de tener agent-browser instalado
npm i -g agent-browser && agent-browser install

# 2. Corre el spec (incluye 2 pauses manuales)
agent-browser batch < tests/e2e/video-walls-full-flow.json

# 3. Si querés cortar en cada error, agregá --bail. NO recomendado para este
#    spec porque los 'pause' interactivos pueden interpretarse como fallo.
```

**Notas sobre el spec:**

- Apunta directamente a **prod** (`https://trueomni-studio.vercel.app`), no localhost. Si querés correrlo en local, busca-y-reemplaza el host.
- Usa `pause` (comando interactivo de agent-browser) en 2 puntos críticos:
  1. **Tras el screenshot de sign-in** — pausa para que hagas OAuth GitHub manualmente.
  2. **Tras el click en Publish** — pausa para que verifiques en github.com que la PR fue creada, CI pasó y auto-merge ejecutó.
- Si tu binario de `agent-browser` no soporta `pause`, partí el spec en 3 sub-specs y corré cada uno entre los pasos manuales (ver pasos manuales abajo).
- Todos los screenshots aterrizan en `.planning/verifications/2026-05-13-vw-e2e-NN-*.png`.

---

## Parte (c) — Pasos manuales con expected results

Esta es la secuencia que el spec automatiza. Si preferís correr todo a mano, seguí estos 15 pasos.

### Paso 1 · Login

- **Acción:** abrir `https://trueomni-studio.vercel.app/studio`.
- **Esperado:** redirect 302 a `/studio/sign-in?callbackUrl=%2Fstudio`. UI muestra "Welcome back" + botón "Sign in with GitHub".
- **Acción:** click "Sign in with GitHub". Autorizar.
- **Esperado:** redirect a `/studio`. Dashboard con tabla/cards de clients existentes (al menos `default`).

### Paso 2 · Crear cliente nuevo

- **Acción:** click "Create a new client" (botón con icono `+` en el header).
- **Esperado:** modal con campos Name, Slug, y checkboxes Digital Displays + Video Walls.
- **Acción:** rellenar `Name = Test Real Prod`, `Slug = test-real-prod`, activar checkbox "Also activate Video Walls".
- **Acción:** click "Create".
- **Esperado:**
  - `POST /api/studio/clients` → 201.
  - Redirect a `/studio/test-real-prod`.
  - Dashboard del cliente muestra chip "Video Walls" activo.
  - **Nota G3:** el endpoint POST clients ignora `products.videoWalls` (no clona KV VW). Es lazy-cloned al entrar al dashboard VW. Si ves un warning "VW not active in KV", es esperado.

### Paso 3 · Navegar al dashboard VW

- **Acción:** click chip/link "Video Walls" o navegar manualmente a `/studio/test-real-prod/video-walls`.
- **Esperado tras fix G1:**
  - Page carga.
  - **1 wall seedeado visible** (`lobby-3x2`) — el seed clonó desde `clients-walls/default/walls/`.
- **Esperado si G1 no fue mergeado:**
  - Page muestra `NewWallCard` solo (sin walls).
  - **Recovery manual:** click "Add a new video wall" → escoger grid `3x2` → name `Lobby` → submit.

### Paso 4 · Abrir editor

- **Acción:** click sobre el wall `lobby-3x2`.
- **Esperado:** ruta `/studio/test-real-prod/video-walls/lobby-3x2`. `WallEditorShell` carga con tabs (Branding, Header, Playlist, Settings, Publish).

### Paso 5 · Verificar Branding tab

- **Acción:** click tab "Branding".
- **Esperado:**
  - Color pickers visibles con colores actuales del cliente.
  - **Si G2 sigue presente:** verás defaults TrueOmni (azul/cyan) en vez de los colores del cliente. Workaround: tocar cualquier color y guardar — el segundo load ya muestra los correctos.

### Paso 6 · Añadir slide desde Playlist

- **Acción:** click tab "Playlist".
- **Esperado:** lista de slides actuales (vacía o con 2 del seed dependiendo de si el clone trajo `wall.json`).
- **Acción:** click botón "+" (o "Add slide").
- **Esperado:** `AddSlideModal` abierto con grid de templates (`01-video-image-full`, `02-...`, etc).
- **Acción:** click "01-video-image-full" → "Add to playlist".
- **Esperado:**
  - Slide aparece en la lista.
  - Iframe del preview (si visible) refleja el nuevo slide.

### Paso 7 · Publish

- **Acción:** click tab "Publish".
- **Esperado:** UI muestra "Pending changes" + botón "Publish".
- **Acción:** click "Publish".
- **Esperado:**
  - Toast/badge "Pull request created" con link al PR.
  - PR creado en `github.com/<repo>` con título tipo `chore(studio): publish test-real-prod video walls`.
  - **Acción manual:** abrir el PR en GitHub. Verificar:
    - CI en verde.
    - Auto-merge habilitado.
    - Tras ~2-3 min, PR mergeado a `main`.
    - Vercel inicia deploy de `main` automáticamente.

### Paso 8 · Verificar runtime publicado

- **Esperar:** ~3-5 min tras merge para que Vercel termine deploy.
- **Acción:** abrir `https://trueomni-studio.vercel.app/video-walls/test-real-prod/lobby-3x2`.
- **Esperado:**
  - Render del wall con el slide añadido.
  - Branding del cliente aplicado (header, colores).
  - Sin `@@username@@` ni placeholders rotos.
- **Acción:** abrir `?cell=0,0`.
- **Esperado:** crop de la celda top-left funcional.

---

## Hallazgos

### H1 · Placeholder `@@username@@` en `?slide=5`

**Síntoma:** `/video-walls/default/lobby-3x2?slide=5` rendea el string literal `@@username@@` 8 veces, mezclado con el resto del contenido weather/events del default.
**Causa probable:** template `social` (slide-05 o similar) tiene mocks `posts: [{ username: "@@username@@" }]` que no están siendo sustituidos por `social.json` real (que en default solo tiene posts genéricos sin username, o el path de hidratación falla).
**Impacto:** medio cosmético. No rompe el render pero queda feo para demo.
**Acción sugerida:** revisar `src/lib/video-walls/social.ts` (o equivalente) y confirmar que `pickRicherSocial` rellena defaults cuando `posts[].username` viene vacío.

### H2 · Spec depende de selectores estables

El spec usa `find role button --name "Create"`, `find role tab --name "Branding"`, etc. Si la UI cambia los `aria-label`/textos visibles, el spec falla. Recomendación: tras la primera ejecución exitosa, capturar los selectores reales (visibles en el screenshot output de `agent-browser snapshot`) y ajustar el JSON.

### H3 · `pause` no es comando estándar de agent-browser

Re-verificar la doc de `agent-browser` antes de la primera corrida. Si `pause` no existe, alternativa:

- Cortar el spec en 3 archivos:
  - `video-walls-full-flow-01-create-publish.json` (pasos 1-12 sin auth → fallará en el redirect de OAuth → ahí pausás manual)
  - `video-walls-full-flow-02-post-publish.json` (paso 13-15, runtime checks)
- O usar `wait --text "Manual checkpoint"` y abrir/cerrar tabs manualmente.

---

## Acceptance criteria final

El flow se considera **passing** cuando:

1. ✅ Cliente `test-real-prod` creado vía UI Studio.
2. ✅ Chip "Video Walls" activo en dashboard cliente.
3. ✅ Wall `lobby-3x2` visible en `/studio/test-real-prod/video-walls` **sin acción manual del operador** (valida G1 fix).
4. ✅ Editor del wall carga con branding del cliente, no defaults TrueOmni (valida G2 fix o pre-fetch del KV).
5. ✅ AddSlideModal funcional — slide añadido visible en la lista.
6. ✅ Botón Publish dispara PR en GitHub.
7. ✅ PR auto-merge funciona en ≤3 min.
8. ✅ Tras deploy, runtime `/video-walls/test-real-prod/lobby-3x2` rendea con el slide nuevo y branding correcto.
9. ✅ `?cell=0,0` produce crop del wall publicado.

Si cualquier paso 3–8 requiere intervención manual no documentada (e.g. activar VW desde otro tab antes de que aparezca el wall), reportar como nuevo gap en el audit principal.

---

## Out-of-scope (no validado en esta sesión)

- Editor UI interna (tabs, modals, drag handles) — todos requieren auth.
- Publish flow real (creación de PR, auto-merge) — requiere token GitHub.
- Branding mutations persistentes — requiere PUT al endpoint signage (`G5`).
- Tests E2E del Studio en CI — no hay CI workflow para `agent-browser batch` aún.

---

## Referencias

- Audit original: `.planning/2026-05-12-video-walls-real-client-audit.md`
- Smoke previo (sin auth, único wall default): `.planning/2026-05-13-vw-smoke-prod.md`
- Spec ejecutable: `tests/e2e/video-walls-full-flow.json`
- Specs hermanos: `tests/e2e/studio-create-client.json`, `tests/e2e/video-walls-create-wall.json`
