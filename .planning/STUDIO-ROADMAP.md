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

## Fase S2 — Módulos tab

**Cubre:** activación + orden + labels.

- [ ] Toggle on/off por cada uno de los 13 módulos.
- [ ] Reordenar tiles del Home (drag&drop con framer-motion `Reorder`).
- [ ] Editar `tile_label_*` por módulo desde la misma vista (input inline).
- [ ] Conditional tabs en el shell: si "Survey" off → tab "Survey content" oculta.

**Verificación:** desactivar Photo Booth → tile desaparece del Home en preview; reordenar listings/events → orden persiste.

---

## Fase S3 — Contenido / Data

- [ ] Editor de listings (CRUD masivo, filtros, subcategorías).
- [ ] Editor de events (week strip, ticketables).
- [ ] Editor de passes / deals / trails / brochures.
- [ ] Bulk import desde CSV/JSON.
- [ ] Asignación de imágenes desde galería del cliente.

---

## Fase S4 — i18n editor

- [ ] Editor side-by-side de los 6 archivos `i18n/{locale}.json`.
- [ ] Detección automática de keys faltantes vs `en` (canónico).
- [ ] Botón "translate with AI" por key faltante (`@anthropic-ai/sdk`).
- [ ] Filtro por sección.

---

## Fase S5 — Ads system

- [ ] Lista de ads con preview thumbnail.
- [ ] Por ad: imagen + tipo (`hero` / `bottom` / `popup`) + paths + ventana de tiempo.
- [ ] Reordenar por path con rotation: `first` / `random` / `weighted`.

---

## Fase S6 — Integraciones

- [ ] Widget clima (OpenWeather API key + ciudad + units).
- [ ] API base URL + Mapbox token + Google Analytics ID.
- [ ] Health-check button por integración.

---

## Fase S7 — Auth + Vercel + GitHub publish (cierre)

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
