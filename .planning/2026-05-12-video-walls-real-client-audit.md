# Video Walls — auditoría flow "cliente nuevo end-to-end"

**Fecha:** 2026-05-12 · **Sesión paralela:** sí (los otros agentes editan
UI / templates / DD; este agente solo audita endpoints + crea seeds).

---

## Resumen ejecutivo

1. El flow de activación VW para un cliente no-default funciona en la ruta
   feliz (manifest → activate → page con drift recovery), pero **arranca con
   `walls: []` siempre**: los walls del template fs nunca se importan en KV.
2. Hay un bug latente en `loadVideoWallClient`: cuando un cliente recién
   activado **solo** tiene VW (sin signage ni fs propio), el resolver tira
   ZodError porque `events` queda `null` y silenciosamente cae al fs `default`
   — pierde el branding/header ya clonado en `videowall:client:<slug>`.
3. El POST `/api/studio/clients` con `products.videoWalls = true` **no clona**
   el VW client (solo kiosk + signage). El drift recovery del page lo
   compensa, pero deja inconsistencia entre manifest y KV.

Smoke E2E contra prod confirmado solo hasta el sign-in gate (HTTPS auth
redirect funciona y preserva `callbackUrl`). El editor en sí queda fuera de
alcance hasta que el deploy nuevo (post-sesión) esté en producción.

---

## Gaps detectados

### G1 · activate VW hardcodea `walls: []` y descarta el template

**File:** `src/app/api/studio/clients/[slug]/products/[product]/activate/route.ts:288`
**Síntoma:** un cliente nuevo activado para VW arranca con cero walls aunque
`clients-walls/default/walls/lobby-3x2/` exista en fs. El operador tiene que
crear walls manualmente en el dashboard.
**Impacto:** medio. No rompe — el dashboard tiene `NewWallCard`. Pero
contradice la expectativa "demo content lista para mostrar al cliente" y
diverge de cómo signage clone funciona (clones de walls hipotéticos).
**Fix sugerido (no aplicado):** clonar `template.walls[]` y los `wall.json`
asociados desde fs hacia `videowall:wall:<slug>:<wallSlug>`, igual que la
sección kiosk hace `bootstrapStudioFromFs`.

### G2 · `loadVideoWallClient` pierde branding cuando events es null

**File:** `src/lib/video-walls/config.ts:108-129` (rama KV-first)
**Síntoma:** el primer load tras activate ejecuta `kvClient` válido +
`pickRicherEvents(null,null,undefined)` → devuelve `null` → `VideoWallClientResolvedSchema.parse`
falla porque `events: z.array(...)` no acepta null/undefined. Catch
silencioso (línea 131) — cae a la rama fs (línea 137) → fs slug no existe →
fallback `default` (línea 161-178) → devuelve config del default con slug
sobreescrito.
**Resultado:** el branding/header que `activate` acababa de meter en KV
queda invisible. El operador ve los defaults TrueOmni hasta que toque
algún tab que regrabe.
**Fix sugerido:** que `pickRicherEvents` devuelva `[]` cuando todos los
inputs son nulos; o que `VideoWallClientResolvedSchema` declare
`events: z.array(...).default([])`. Igual para `social`/`news` (esos sí
tienen defaults parciales en el código, pero `events` no).

### G3 · POST /api/studio/clients ignora `products.videoWalls`

**File:** `src/app/api/studio/clients/route.ts:174-310`
**Síntoma:** solo clona kiosk + signage. Si el body trae
`products: { videoWalls: true }`, el manifest se persiste con `videoWalls:
true` pero `videowall:client:<slug>` nunca se setea.
**Mitigación existente:** la página `/studio/[slug]/video-walls`
(`page.tsx:50-86`) detecta `manifest.products.videoWalls && !videoWallClient`
y clona en caliente. Funciona, pero es lazy y deja el dashboard `clients`
mostrando "VW activo" antes de que exista nada.
**Fix sugerido:** agregar bloque "clone signage" análogo justo después del
de signage (la lógica ya está en activate VW, factorizable).

### G4 · Conflict check del POST clientes no consulta KV VW

**File:** `src/app/api/studio/clients/route.ts:177-184`
**Síntoma:** el chequeo de slug existente lee `loadClientManifest`,
`kv.get(kvKeys.cfg(slug))`, `kv.get(kSignageClient(slug))` — falta
`kv.get(kVideoWallClient(slug))`. Si un cliente legacy solo VW existe sin
manifest, podría re-crearse y sobrescribir el KV VW vía la sección 1
(kiosk).
**Impacto:** bajo (clientes legacy solo-VW no existen aún en producción).

### G5 · saveTheme del wall editor escribe en signage KV aunque DD no esté activo

**Files:**

- `src/app/studio/digital-displays/_lib/save-theme.ts:18` (cliente)
- `src/app/api/studio/signage/clients/[client]/route.ts:44-105` (servidor)

**Síntoma:** `BrandingTab`/`HeaderTab` del editor VW persisten al endpoint
PUT signage. Ese endpoint hace upsert sin chequear `manifest.products.digitalDisplays`,
así que crea `signage:client:<slug>` aunque el cliente solo tenga VW activo.
Funciona para reflejar branding en VW (`loadVideoWallClient` lo lee), pero
ahora el dashboard signage muestra al cliente como si tuviera DD.
**Impacto:** medio. Cosmético en dashboard pero confunde el estado del
manifest.
**Fix sugerido:** el endpoint PUT signage debería **(a)** verificar
manifest y rechazar si DD inactivo + VW inactivo, o **(b)** que el editor
VW use un endpoint propio `/api/studio/video-walls/clients/<slug>` (no
existe hoy — los walls del cliente solo se editan vía `kvVideoWallClient.set`
indirecto desde POST/DELETE wall).

### G6 · No hay endpoint client-level para VW

**Files:** `src/app/api/studio/video-walls/walls/[client]/...`
**Síntoma:** No existe `GET/PUT /api/studio/video-walls/clients/<slug>`
(análogo a signage). Los únicos endpoints VW son los del array `walls/`.
Para mutar el VW client (header local, settings cliente-level) no hay
camino directo — se rebota por signage (ver G5).
**Impacto:** bajo si el modelo "branding/header compartido con signage"
es deliberado; alto si en algún momento VW quiere divergir.

### G7 · Asset endpoint fallback puede redirigir a 404 signage

**File:** `src/app/video-wall-assets/[client]/[...path]/route.ts:57-63`
**Síntoma:** si `clients-walls/<slug>/<path>` y `clients-walls/default/<path>`
no existen, redirige a `/signage-assets/<slug>/<path>`. Si tampoco existe ahí,
el browser ve un 404 después de un 302. Para cliente nuevo sin assets locales
ni en signage el preview muestra placeholders rotos.
**Impacto:** bajo cosmético; el cliente nuevo `test-real` que dejé apunta a
`assets/video-image/pool.png` que existe en `clients-walls/test-real/assets/`
clonado del `_template` (logo) **pero no incluye `video-image/`**. El
fallback a `clients-walls/default/assets/video-image/pool.png` sí lo
sirve, así que el seed se ve bien — pero está validando justo este path.

### G8 · Validación de slug en POST wall, no en el [client] del URL

**Files:**

- `src/app/api/studio/video-walls/walls/[client]/route.ts:59-64` (valida `slug` del body con regex)
- `src/app/api/studio/video-walls/walls/[client]/[wall]/route.ts` (no valida `client`/`wall` del URL)

**Síntoma:** los segments dinámicos `[client]` y `[wall]` se concatenan a
keys KV sin sanitizar. Como son segments URL Next ya rechaza `..` en path,
pero permite caracteres exóticos (`:`, `%`, espacios) que podrían colisionar
keys. No es path traversal del fs (no se usa para fs aquí), pero podría
generar colisiones de key.
**Impacto:** muy bajo. Documentar como nota.

---

## Seed creado

**Path:** `clients-walls/test-real/`

Clon de `clients-walls/_template/` con:

- `client.json` → `slug: "test-real"`, `name: "Test Real (VW seed)"`,
  `walls: ["lobby-3x2"]`.
- `walls/lobby-3x2/wall.json` (renombrado desde `_blank`) con 2 slides
  reales referenciando templates 3×2 existentes:
  - slide-01: `01-video-image-full` + módulo video-image.
  - slide-02: `03-video-image-events` + módulos video-image + events.
- `events.json` / `social.json` / `news.json` / `tokens.css` /
  `assets/logo.svg` heredados del `_template`.
- `README.md` propio explicando la dependencia con `clients-signage/test-real/`
  (no creado — el primer save del editor lo crea vía PUT signage).

### Cómo activar el seed para probar

1. Asegurar manifest del cliente:
   - Si se quiere crear desde el Studio: `POST /api/studio/clients` con
     `{ slug: "test-real", name: "Test Real (VW seed)", products: { videoWalls: true } }`.
   - Alternativa fs-only (sin Studio): copiar la entrada en
     `clients-walls/test-real/` y dejar que `auto-migrate-clients` la
     levante al boot (ver `src/lib/studio/auto-migrate-clients.ts`).

2. `POST /api/studio/clients/test-real/products/video-walls/activate`
   (idempotente — devuelve 200 si ya está activo).

3. Visitar `/studio/test-real/video-walls`. Debería listar el wall
   `lobby-3x2` con 2 slides.

4. Entrar al editor `/studio/test-real/video-walls/lobby-3x2`. El
   `loadVideoWall` lee KV-first; si está vacío, cae al fs y devuelve
   los 2 slides del seed.

---

## Plan smoke E2E post-deploy

Ejecutar manualmente desde el browser (autenticado en Studio prod) o
mediante `agent-browser batch` cuando los tests E2E del Studio VW estén
escritos:

1. **Login.** `https://trueomni-studio.vercel.app/studio` → "Sign in with GitHub"
   → callback resuelve, dashboard `Clients` carga.
2. **Crear cliente nuevo.** Botón "+ New client" o
   `POST /api/studio/clients` body `{ slug: "test-real-prod", name: "Test
Real Prod", products: { videoWalls: true } }`. Confirmar 200/201.
3. **Verificar manifest + KV.** En el dashboard, el cliente aparece con
   chip "Video Walls" activo. Si arroja warning "VW not active in KV",
   eso confirma G3 — el page hará drift recovery al entrar.
4. **Abrir VW dashboard.** `/studio/test-real-prod/video-walls`. Esperado:
   página con `NewWallCard` y cero walls (esperado por G1).
5. **Crear wall.** Picker → grid `3x2` → name `Lobby` → submit. 200 OK,
   wall aparece.
6. **Abrir editor wall.** Esperado: WallEditorShell carga, BrandingTab
   visible. Branding muestra defaults TrueOmni (azul/cyan) — si muestra
   defaults TrueOmni en cliente con branding propio, es G2.
7. **Agregar 1 slide.** PlaylistPanel → "+" → template `01-video-image-full`.
   Autosave dispara `PUT /api/studio/video-walls/walls/test-real-prod/lobby`.
8. **Publish.** `POST /api/studio/video-walls/walls/test-real-prod/lobby/publish`.
   200 + `runtimeUrl`.
9. **Runtime.** Abrir `https://trueomni-studio.vercel.app/video-walls/test-real-prod/lobby`.
   Esperado: slide renderiza con el video/image colocado.

Si cualquier paso 4-9 falla, contrastar con los Gaps G1-G5 antes de
crear bug ticket — varios fallos posibles ya están documentados arriba.

---

## Decisiones tomadas en esta auditoría

- **NO** se crearon `clients-signage/test-real/` ni `i18n/` ni `assets/video-image/`
  ni `assets/events/` adicionales para el seed: el VW seed se apoya en
  fallback a `clients-walls/default/` (G7) y en KV signage que el editor
  crea al primer save. Mantener seed mínimo y dejar que el flow real lo
  rellene es lo más honesto.
- **NO** se intentó login real con GitHub para smoke E2E del editor. El
  gate de auth funciona (sign-in redirect preserva callback URL) y eso es
  suficiente para esta auditoría. Los pasos 4-9 quedan documentados como
  plan para el deploy nuevo (post-sesión).
- **NO** se aplicaron fixes a los gaps G1-G8: zona compartida con los
  otros 2 agentes que están editando templates/\_components/DD. Cualquier
  fix de G1/G2/G3 toca `activate/route.ts` y `config.ts` — territorio
  potencialmente compartido. Documentar en este MD es el entregable.
