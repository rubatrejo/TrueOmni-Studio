# STUDIO-ROADMAP.md — Kiosk Studio

> Milestone separada del kiosk Portrait. El kiosk runtime no se toca; el Studio escribe archivos a `clients/<slug>/` que el runtime sigue leyendo del filesystem.

Plan de referencia completo en `wild-weaving-key.md` (`/Users/rubenramirez/.claude/plans/`). Este archivo es la versión operativa para sesiones de trabajo.

---

## Fase S0 — Shell + clientes + preview + persistencia (MVP) ✅ cerrada (2026-04-28)

**Cubre:** D1, D2, D4 — el chasis sin el cual nada funciona.

- [ ] Subruta `/studio` en App Router con layout propio (no hereda del shell del kiosk).
- [x] Página índice `/studio` con lista de clientes en grid de cards (nombre, slug, fecha última edición, estado de publish) — mock data.
- [ ] Modal "Crear cliente nuevo" (slug + nombre + clonar de `_template`) — pendiente API.
- [ ] Acciones: clonar cliente existente, borrar cliente — pendiente API.
- [x] Página editor `/studio/[slug]` con shell topbar + sidebar tabs + content + iframe live preview.
- [ ] Upstash KV cliente (`@upstash/redis`) en `src/lib/studio/kv.ts` — **bloqueado: requiere credenciales Upstash**.
- [ ] Schema zod `KioskConfig` en `src/lib/studio/schema.ts`.
- [ ] API routes `/api/studio/configs` — pendiente KV.
- [ ] Ruta `/preview/[slug]` standalone — pendiente; hoy el iframe apunta a `/` (Billboard idle del kiosk runtime).
- [x] Hook `use-brand-storage.ts` con `current` + savedSnapshot + dirty-tracking (localStorage por slug).
- [ ] Hook `use-history.ts` con stacks de undo/redo (límite 50, debounce 500 ms).
- [x] Hook `use-preview-bridge.ts` con postMessage debounced 120 ms al iframe.
- [x] Save bar (idle / saving / saved / error) + botón Discard que descarta cambios sin guardar.
- [ ] Toast bar centralizado.
- [x] `<StudioBridge />` montado en el layout `(kiosk)` que escucha postMessage y aplica `setProperty` con `!important` a `:root`.
- [x] `KioskCanvas` detecta `iframe` (lazy init) y renderiza a 1080×1920 reales sin chrome.

**Verificación parcial:** abrir `/studio/default` → mover Secondary → Billboard idle se recolorea en <200 ms en vivo. ✅
**Pendiente verificación:** crear/clonar/borrar cliente, save persistido en cloud (no solo localStorage).

---

## Fase S1 — Branding tab ✅ cerrada (2026-04-28)

**Cubre:** los 3 brand tokens + logos + fonts.

- [x] Editor visual de `--brand-primary` / `--brand-secondary` / `--brand-tertiary` con `<input type="color">` + input HEX (TODO: upgrade a `react-colorful`).
- [ ] `ImageField` para logo (SVG/PNG) + favicon — UI placeholder, sin upload real.
- [ ] Selector de fonts: Montserrat / Open Sans / Noto Sans JP curados + `customFonts[]` con upload `.woff2` — UI placeholder.
- [x] Galería de 6 presets (TrueOmni / Arizona / Hotel Beach / Forest / Mono / Sunset) con apply en un click.
- [x] Live preview reacciona instantáneo a los 3 brand tokens vía postMessage.
- [x] Persistencia local en `localStorage["studio-brand:<slug>"]`. Save real con dirty tracking. Reload restaura.
- [x] Refactor de Billboard 0: hex hardcoded → `hsl(var(--brand-*))` (3 colores tokenizados).

**Verificación:** ✅ cambiar Secondary → Billboard idle se recolorea en <200 ms. Save → reload → state persistido.

> **Pendiente para S1 completa:** logos/fonts upload real, react-colorful (HSL/RGB picker pro), audit & tokenize de Billboards 1-4 si los usan otros clientes, react-colorful no esencial para MVP.

---

## Fase S2 — Módulos + Billboard + AI Avatar + scaffolding S3 ✅ cerrada (2026-04-29)

**Cubre:** activación + orden + labels + Billboard + AI Avatar + branding completo.

Sub-fases entregadas:

- [x] **02 Modules tab** (master switches): 19 toggles — 16 home tiles + Ads + Languages + AI Avatar. Iconos Lucide consistentes con resto del Studio.
- [x] **03 Billboard tab**: selector visual de los 4 variants + slider del idle timeout. Live switch del variant en el iframe vía `BillboardLiveSwitcher` (sin recargar).
- [x] **04 Home Dashboard tab**: drag&drop Reorder, toggle visibility, rename inline. Filtra por toggles activos en Modules (los OFF se ocultan).
- [x] **05 AI Avatar tab**: avatar upload, hero video, greeting con `{client_name}`, suggested questions add/remove, modelo Anthropic + API key (placeholder hasta S6).
- [x] **06–11 secciones** del sidebar con scaffolding (Survey · Deals · Photo Booth · Digital Brochure · Social Wall · Guestbook). Editores reales en S3.
- [x] **Branding completo**: 4 logos diferenciados (default / idle / footer / favicon) con `slot=*` propagado por TrueOmniLogo + cache global window para sobrevivir re-mounts. Custom font drag&drop con `@font-face` runtime injection. Botón "Suggest a palette from a logo" funcional con histograma RGB cuantizado.
- [x] **Bridge ampliado**: `studio:branding-update`, `studio:modules-update`, `studio:billboard-update`, `studio:ai-avatar-update`. Cada uno debounced 80–120 ms con re-emit en handshake `studio:ready`.
- [x] **Disabled state en sidebar**: si Module OFF → tab gris + Lock icon + no clickable. Si la tab activa se desactiva, salto auto a Modules.
- [x] **Backfill defensivo** en GET y en la página server-side: clientes pre-S2 reciben defaults para `billboard`, `aiAvatar`, `modules`, y merge de `systemModules` con shape antiguo (3 fields → 19 fields).
- [x] **Idle popup centrado** dentro del iframe (grid centering reemplaza translate% que peleaba con framer-motion + iframe scale).
- [x] **Touch Here del Billboard 0** ahora `font-display`. Variants 1-4 con LanguageDropdown funcional (antes `EnglishButton` decorativo).
- [x] **API PATCH** acepta `branding | modules | billboard | aiAvatar` en un solo body. Validación zod por sección. Save dispatcha solo lo dirty.

**Verificación E2E:**

- ✅ Cambiar variant 0→3 en Billboard tab → iframe cambia de layout en <300 ms.
- ✅ Toggle Survey OFF en Modules → tab "Survey" del sidebar gris + Home Dashboard ya no muestra Survey + grid del Home iframe oculta el tile.
- ✅ Subir logo PNG en "Idle / Billboard logo" → centro del Billboard renderiza la imagen en lugar del SVG TrueOmni.
- ✅ Custom font `.woff2` drag&drop en Display → kiosk re-renderiza tipografía en <500 ms.
- ✅ Cmd+S → PATCH manda solo secciones sucias → reload conserva cambios.
- ✅ Cliente nuevo → seed completo de billboard/aiAvatar/modules con defaults.

**Pendiente para S3+:**

- Editores reales para Survey/Deals/Photo Booth/Digital Brochure/Social Wall/Guestbook (hoy son placeholders).
- Color picker pro (`react-colorful`) en lugar del native `<input type="color">`.
- Migrar logos/fonts data URLs a Vercel Blob cuando crezca el catálogo (cap KV ~512KB/value).

---

## Fase S3 — Contenido / Data

- [x] **S3.1–S3.6** — Editores de Survey, Deals, Photo Booth, Digital Brochure, Social Wall, Guestbook (cerradas 2026-04-29).
- [x] **S3.7 — Content tab CRUD masivo** (cerrada 2026-04-29). Editores para los 5 catálogos (Listings, Events, Tickets wrapper, Passes, Trails) con 7 catalog primitives compartidos + bridge debounced + listeners decentralizados en kiosk runtime + 5 tabs nuevas en sidebar.
- [x] **UX iteraciones masivas** (2026-04-29): light mode, per-item edit panel, Versions al TopBar, Modules tab con 3 secciones, Listing modules **dinámicos** (add/duplicate/delete con sync de tiles[]), schema migration defensiva, "Itinerary Builder" → "Trip Planner".
- [x] **S3.8 — Bulk import desde CSV/JSON** ✅ cerrada 2026-04-29 — `import-helpers.ts` (CSV parser RFC 4180 + 4 specs + serialize), `ImportModal` con drop zone + preview + stats + merge/replace, props `onImport`/`onExport` en `CatalogToolbar`, `ImportToast` con autodescarte 4s, `export-utils` para descarga CSV/JSON. Wireado en Listings/Events/Passes/Trails. JSON roundtrip verificado E2E.
- [ ] Asignación de imágenes desde galería del cliente.

---

## Fase S4 — i18n editor

- [x] **S4 base** ✅ cerrada 2026-04-29 — editor side-by-side de los 6 locales (en/es/fr/de/pt/ja), detección automática de keys faltantes vs `en` canónico (banner ámbar con counter por locale), filtro por sección (prefijo de la key) + search global, edit inline con autosave, "Add key" prompt. Storage en KV separado (`i18n:<slug>`) con bootstrap defensivo desde `clients/<slug>/i18n/*.json` y fallback a `_template`. Endpoint GET/PATCH con cap 480KB.
- [x] **S4.1 — AI translate** ✅ cerrada 2026-04-29 — `@anthropic-ai/sdk@0.91.1` instalado, endpoint `POST /api/studio/i18n/translate` con `claude-haiku-4-5` + prompt caching del system prompt, guard 503 con mensaje legible si falta `ANTHROPIC_API_KEY`. Botón ✨ (Sparkles) en cada celda missing del `I18nEditor` con loading spinner + commit automático tras éxito + banner de error fácil de descartar.

---

## Fase S5 — Ads system

- [x] **S5 base** ✅ cerrada 2026-04-29 — `AdSchema` + `AdsModuleSchema` añadidos al KioskConfig (al lado de events/listings/etc), endpoint `[slug]/route.ts` PATCH soporta `ads` con backfill defensivo en `hydrateConfig`. `AdsEditor` con search + filtro por kind (popup/hero/bottom) + Add/Toggle/Duplicate/Delete inline + per-item edit panel (id, kind, image, alt, routes multi-line, theme, enabled). `getAdsForRoute` filtra ads sin imagen para evitar render incompleto. `image` opcional en schema (permite crear ad → completar después). Wiring completo en Shell/EditorPanel; verificado E2E con persistencia tras Cmd+S.
- [x] **S5.2 — Bulk import CSV/JSON ads** ✅ cerrada 2026-04-29 — `'ads'` añadido a `ImportKind`, `AdsModule` reusa `ImportModal`/`ImportToast`. Generalizada la primary key del helper (`PK_FIELD: 'slug' | 'id'`) sin afectar editores existentes. Nuevo `upsertById` paralelo a `upsertBySlug`. CSV columns: `id,kind,image,alt,routes,enabled,theme` con `;`-separated routes. PreviewTable adapta cols por kind (id+kind para ads, slug+title para el resto). Botones Import/Export añadidos al toolbar de AdsEditor. Verificado E2E: 3 ads importados desde CSV, persistidos en KV.
- [ ] **S5.1 — Bridge live preview ads** (override evento al kiosk runtime — pequeño, opcional).
- [ ] **S5.2 — Rotación weighted/random por path** (v2, no MVP).

---

## Fase S6 — Integraciones

- [x] **S6** ✅ cerrada 2026-04-29 — `IntegrationsConfigSchema` con 4 sub-objetos (api/mapbox/analytics/weather) integrado en KioskConfig. `IntegrationsEditor` con 4 cards (Weather con provider open-meteo/openweather, External API, Mapbox con secret toggle, Google Analytics) y botón "Test" por card. Endpoint dedicado `POST /api/studio/integrations/check` ejecuta health checks server-side con timeout 5s: mapbox (200/401 → ok/invalid), api (HTTP reachability), analytics (regex GA4/UA), openweather (200 con `data.name + temp`). Status verde/rojo inline con autodescarte 8s.

---

## Fase S7 — Auth + Vercel + GitHub publish (cierre)

- [x] **S7.0 — Local publish skeleton** ✅ cerrada 2026-04-29 — endpoint `POST /api/studio/publish/[slug]?dryRun=1` que escribe el bundle i18n del KV a `clients/<slug>/i18n/<locale>.json`. Mantiene orden de inserción del bundle (no sortea keys → diff git mínimo). `PublishModal` con stats create/update/unchanged + diff por archivo (size before/after) + 2 fases (preview dryRun → confirmación → done). Botón "Publish" en TopBar lo dispara. Verificado E2E: 6 archivos detectados, 1 update real (key reordenada en smokes anteriores), publish real escribe correctamente, file revertido tras smoke.
- [x] **S7.1 narrow — Bootstrap defensivo de ads/integrations desde filesystem** ✅ cerrada 2026-04-29 — `hydrateConfig` ahora es async y, si KV no tiene `cfg.ads` o `cfg.integrations` (cliente legacy pre-S5/S6), lee `clients/<slug>/config.json` y bootstrappea desde `features.advertisements.ads` y `integraciones` (mapeando los nombres legacy en español a los del Studio en inglés). Mismo patrón que el bootstrap de i18n. Validación zod defensiva (returns null si shape no encaja → cae a defaults).
- [ ] **S7.1 wide — Publish del config.json completo** (escribir secciones del Studio al filesystem `config.json` + `tokens.css`. Requiere mapping shape Studio↔filesystem para branding, ads, integrations, modules, etc).
- [ ] **S7.2 — GitHub PR-publish con approval gate** (envuelve S7.0+S7.1 en commit + PR via GitHub API).
- [ ] **S7.3 — NextAuth + admin gate** por `ruben@trueomni.com`.
- [ ] **S7.4 — Vercel deploy** (preview por PR + production por merge).

- [ ] NextAuth v5 + Google OAuth + whitelist `@trueomni.com`.
- [ ] Middleware de protección en `/studio/**` y `/api/studio/**`.
- [ ] Octokit GitHub App configurada.
- [ ] Endpoint `/api/studio/publish` con switch local-vs-Vercel.
- [ ] Panel de approvals para `ruben@trueomni.com`.
- [ ] Notificación email a Rubén por nueva request (Resend).
- [ ] Deploy a Vercel + variables de entorno.
- [ ] Smoke test E2E completo (sign-in → editar → request publish → approve → PR en GitHub → merge → producción).

---

## Dependencias

```
S0 → S1 → S2 → S3 → S4 → S5 → S6 → S7
```

S1 y S2 podrían paralelizarse (son tabs independientes en el mismo shell), pero se recomienda secuencial para iterar el visual del Studio en cada paso.

S7 es el último porque sin las features anteriores no hay nada que merezca approval.

---

## Sin tocar (regla crítica)

```
src/components/**       — los 13 módulos del kiosk
clients/_template/      — plantilla canónica
clients/default/        — cliente por defecto en producción
src/app/(kiosk)/home/** — runtime del kiosk
```
