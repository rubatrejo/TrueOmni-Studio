# Smoke E2E del flow Studio → PR → merge → deploy

**Hallazgo #28 del audit · 2026-05-05**

Ejecutar este script paso-a-paso después de cada cambio significativo en el publish flow para garantizar que el operador real puede crear, editar, publicar y deploy un kiosk sin fricciones.

**Pre-requisitos:**

- Node.js + pnpm instalados.
- `.env.local` con: `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `STUDIO_GITHUB_TOKEN`, `STUDIO_GITHUB_OWNER`, `STUDIO_GITHUB_REPO`, `STUDIO_ADMIN_EMAILS`, `NEXTAUTH_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`, `ANTHROPIC_API_KEY`.
- Acceso al GitHub repo del kiosk (push + PR).
- Acceso al Vercel project del Studio.
- Browser moderno (Chrome/Safari) para login OAuth.

---

## 1. Smoke local — `pnpm kiosk:dev`

Verifica que el dev server arranca sin errores antes de tocar nada en producción.

```bash
# Terminal A
pnpm install
pnpm kiosk:dev
# espera "✓ Ready in <Xms>"
```

Browser → `http://localhost:3000`:

- [ ] El kiosk carga (billboard idle visible).
- [ ] No hay errors rojos en la consola.

Browser → `http://localhost:3000/studio`:

- [ ] La pantalla de sign-in aparece (NextAuth redirect).
- [ ] Click "Sign in with GitHub" → vuelve con `/studio` listado.

---

## 2. Crear kiosk nuevo

En `/studio` click el botón **"New kiosk"**.

Datos de prueba:

- **Name:** `Smoke Test 2026-05-05`
- **Slug:** `smoke-test-20260505` (auto-suggested)
- **Website:** `https://example.com`
- **Location:** `Davenport, FL`
- **Orientation:** Portrait
- **Empty mode:** OFF (queremos heredar mock data del template)

Submit:

- [ ] Overlay de loading "Creating Smoke Test..." aparece.
- [ ] Redirige a `/studio/smoke-test-20260505`.
- [ ] El editor abre con sidebar 21 secciones.
- [ ] Iframe preview muestra el kiosk con location "Davenport, FL".
- [ ] Listings/events tienen addresses con "Davenport, FL" (rewrite OK).
- [ ] Trip Planner local_listings: el "Phoenix Foodie Trail" se reescribió a "Davenport Foodie Trail".

**curl recipe alternativo (no UI):**

```bash
curl -X POST http://localhost:3000/api/studio/configs \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "smoke-test-20260505",
    "nombre": "Smoke Test 2026-05-05",
    "orientation": "portrait",
    "website": "https://example.com",
    "location": "Davenport, FL",
    "emptyMode": false
  }' | jq .
```

Esperado: `201` con `{ slug, config, meta }`. Race condition: ejecutar el mismo POST 2× simultáneo → segundo retorna `409 slug already exists` (lock atómico via Upstash NX).

---

## 3. Editar branding y verificar live preview

Sidebar → Branding:

- [ ] Cambiar primary color a `#ff6b35` → iframe se actualiza en <120ms (sin reload).
- [ ] Cambiar logo (drop image) → iframe muestra el nuevo logo.
- [ ] Cambiar font display → iframe usa la fuente nueva.
- [ ] El SaveStatusPill del TopBar pasa a "Unsaved changes" (sky blue dot).

Sidebar → Idle / Billboard:

- [ ] Sección **"Background (shared)"** arriba — sube imagen test → 4 variants la heredan.
- [ ] Sección "Idle settings (Variant N)" — cambiar Touch Here label → preview iframe lo refleja.
- [ ] Variant 2 muestra correctamente sin error 404 (el bug `.png vs .jpg` está fixeado).

Sidebar → Languages:

- [ ] Cambiar `home.welcome` en EN → si `DEEPL_API_KEY` está set, los otros 5 locales se llenan tras 2s.

PreviewPanel toolbar:

- [ ] Locale dropdown (EN/ES/FR/DE/PT/JA) — cambiar a ES → kiosk preview muestra strings en español sin reload.

---

## 4. Save + verificar payload size

Click **Save** en el TopBar:

- [ ] SaveStatusPill pasa a `Saving…` → `Saved`.
- [ ] Si el config supera 60% del KV cap → aparece el `<PayloadSizePill>` amber/orange/red al lado del Save status.
- [ ] Toast top-right NO aparece (success silencioso).

Forzar error:

- [ ] DevTools → Network → throttle "Offline" → click Save → tras 30s aparece toast rojo "Save timed out after 30s" (timeout fallback).

---

## 5. Snapshots + revert (#9)

Sidebar → Versions:

- [ ] Sección "Restore from snapshot" muestra al menos 1 entry tras el último Save.
- [ ] Click "Revert" en una entry → confirm modal.
- [ ] Confirm → reload → editor vuelve al estado anterior.
- [ ] El revert genera otro snapshot (badge amber "before revert") para deshacer.

curl:

```bash
curl http://localhost:3000/api/studio/configs/smoke-test-20260505/snapshots | jq '.entries | length'
# esperado: >=1
```

---

## 6. Diff pre-publish (#8)

Click **Publish** en el TopBar:

- [ ] Modal abre en estado "Computing diff…".
- [ ] Pasa a "preview" mostrando archivos cambiados (verde = create, amber = update).
- [ ] Cada file con `action: 'update'` muestra `<details>` "X JSON keys changed" desplegable con paths exactos (eg. `branding.primary`, `listings.0.title`).
- [ ] Tab `unchanged files` plegado abajo.

**No hacer click en "Publish" todavía si quieres testear sin abrir PR real.** Cancel.

---

## 7. Publish → GitHub PR (mode `pr`)

⚠️ Esto crea un PR REAL en `STUDIO_GITHUB_OWNER/STUDIO_GITHUB_REPO`. Si testeas, después cierra el PR + borra la branch.

Click "Publish" → Confirm:

- [ ] Modal pasa a "publishing…" (spinner).
- [ ] Si OK: "Published" + link al PR `#NNN`.
- [ ] Auto-close countdown 3-2-1 → modal se cierra.
- [ ] El PR existe en GitHub con título `[studio] Publish smoke-test-20260505`.
- [ ] PR description tiene `**Files changed:** N` + `<details>` con la lista de paths.

**Si `autoMerge: true` está cableado en options:**

- [ ] PR aparece con badge "Auto-merge enabled" en GitHub.
- [ ] Tras pasar checks de CI, GitHub mergea solo.

curl directo (skip UI):

```bash
# dryRun primero para validar files
curl -X POST "http://localhost:3000/api/studio/publish/smoke-test-20260505?dryRun=1&mode=pr" \
  -H "X-Studio-Admin-Email: ruba.trejo@gmail.com" | jq '.files | length'

# Publicar real
curl -X POST "http://localhost:3000/api/studio/publish/smoke-test-20260505?mode=pr" \
  -H "X-Studio-Admin-Email: ruba.trejo@gmail.com" | jq '.pr'
```

---

## 8. Verificar deploy en Vercel

Tras merge del PR (manual o auto-merge):

- [ ] Vercel detecta el push a `main` y arranca un build.
- [ ] Build pasa sin errores.
- [ ] El production URL del Studio sigue accesible (NextAuth, etc.).
- [ ] El kiosk runtime carga el config nuevo si lo abres como cliente (`/k/smoke-test-20260505` o el subdomain del kiosk).

Vercel CLI alternativo:

```bash
vercel logs <studio-deployment-url> --since 10m | grep -i error
# esperado: vacío
```

---

## 9. Limpieza tras smoke

Después del test:

```bash
# 1. Borrar kiosk del KV (UI o curl)
curl -X DELETE http://localhost:3000/api/studio/configs/smoke-test-20260505 \
  -H "X-Studio-Admin-Email: ruba.trejo@gmail.com"

# 2. Cerrar el PR de GitHub sin mergear (si lo hiciste como test)
gh pr close NNN --delete-branch

# 3. Si el PR mergeó: revertir en GitHub
git checkout main && git pull
git revert <commit-sha>
git push
```

UI alternativa para #1: hover sobre la card del kiosk en `/studio` → click trash icon → confirm.

---

## Troubleshooting

### `403 Forbidden` en POST /api/studio/configs

- Verifica `STUDIO_ADMIN_EMAILS` incluye tu email (case-insensitive desde #6 audit).
- Re-login: el middleware necesita session válida.

### `503 No translation provider configured`

- `DEEPL_API_KEY` no está set Y `ANTHROPIC_API_KEY` tampoco.
- Solución: añade al menos uno a `.env.local` y reinicia dev server.

### `413 Payload too large` en PATCH

- El config superó 950KB cap.
- El `<PayloadSizePill>` debió advertirlo en TopBar antes — si no lo hizo, hay imágenes pesadas como data URLs inline.
- Solución: subir media pesado a Vercel Blob (cuando `BLOB_READ_WRITE_TOKEN` esté set) o usar URLs CDN externas.

### Race condition al crear kiosk: dos POSTs simultáneos

- El segundo retorna `409 slug already exists` (Upstash NX flag, hallazgo #3).
- Comportamiento esperado.

### PATCH no recoge cambios del FS template

- Tras editar `clients/<slug>/config.json` en el repo, el primer GET re-bootstrappea pero PATCHes posteriores estaban stale (#4 audit).
- Fix activo: PATCH ahora re-aplica `bootstrapStudioFromFs` con cache TTL 60s.
- Para forzar re-read inmediato: `POST /api/studio/configs/<slug>/resync?force=true`.

### Diagnostics dice "1 kiosk has FS drift"

- El template del FS cambió desde el último resync (#27 audit).
- Solución: trigger `POST /api/studio/configs/<slug>/resync` (preserva customizaciones) o `?force=true` (reset completo).

### AI Suggest devuelve 0 items

- El JSON parser del backend rechazó el output (`parseAndValidate`).
- Probable causa: temperature alta + el modelo escapó del shape esperado.
- Solución: retry. Si persiste, revisa los logs del endpoint para ver qué devolvió Anthropic.

### Toast no aparece tras error

- `<ToastProvider>` no está montado en la jerarquía.
- Verifica `src/app/studio/layout.tsx` envuelve children con `<ToastProvider>`.

---

## Checklist de salida

Antes de declarar el smoke "verde":

- [ ] Punto 1 — dev server arranca sin errors
- [ ] Punto 2 — crear kiosk OK
- [ ] Punto 3 — branding live preview reactivo
- [ ] Punto 4 — Save + payload pill OK
- [ ] Punto 5 — snapshot + revert OK
- [ ] Punto 6 — diff pre-publish con keys
- [ ] Punto 7 — PR creado en GitHub (si testeaste prod)
- [ ] Punto 8 — Vercel deploy verde (si testeaste prod)
- [ ] Punto 9 — limpieza completa, sin kiosks zombie en KV ni PRs huérfanos

---

## Notas

- Este doc es referencia — no script automatizado. Para CI: extraer los curl recipes a un `tests/smoke.sh` con `set -e` + assertions.
- Si añades un hallazgo nuevo al audit, añade su check correspondiente aquí.
- Última actualización: 2026-05-05 (audit #28 closed).
