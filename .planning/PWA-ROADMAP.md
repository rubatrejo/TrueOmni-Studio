# PWA-ROADMAP.md — Mobile PWA

Fases ordenadas del milestone PWA Mobile. Cada fase es atómica y verificable.
Visión y alcance en `PWA-PROJECT.md`. Protocolo por pantalla: `PIXEL-PERFECT-PROTOCOL.md`.

**Canvas de referencia:** 390×844 (adaptado desde artboards XD 375×812, ≈1.04× uniforme).
**Ruta de servido:** `/pwa` · **Cliente activo:** `KIOSK_CLIENT`.

---

## ✅ MILESTONE CERRADO (2026-06-08)

Todas las fases **P0 → Pz** completadas: runtime PWA, flujo de arranque, todos los
módulos reutilizados y PWA-only, transversales (i18n + ads mobile) e integración al
Studio (editor, clone, branding-sync, publish, preview bridge 390×844). Las
traducciones reales de los 518 textos de UI a los 5 idiomas (es/fr/de/pt/ja) viven
en `clients/default/features.pwa.i18n` y se heredan por todo cliente clonado.

**Fuera de alcance de este milestone (no bloquean el cierre):**

- Render en vivo del avatar Tavus (cámara/mic en navegador) — verificado a nivel
  backend; el render live queda del lado del operador.
- Backend real (login / sync / push / wallet / offline) — **milestone aparte**.
- Auto-translate en prod para clientes ya existentes en KV — acción manual en Vercel
  (necesita deploy + API keys); los clientes nuevos heredan las traducciones de `default`.

> El detalle de cada fase se conserva abajo como registro histórico.

---

## P0 — Bootstrap del runtime PWA ✅ (cerrada 2026-06-08)

**Cubre:** infraestructura del producto.

```xml
<task type="auto">
  <name>Bootstrap del route group (pwa)</name>
  <files>
    src/app/(pwa)/layout.tsx, src/app/(pwa)/pwa/page.tsx,
    src/components/pwa/mobile-canvas.tsx, src/components/pwa/bottom-nav.tsx,
    src/app/manifest.ts, designs/mobile-pwa/_template.md
  </files>
  <action>
    Route group (pwa) con layout que reusa getConfig + loadAllLocales (I18nProvider).
    Canvas mobile 390×844 (MobileCanvas) análogo a KioskCanvas: embedded (iframe) + dev-view escalado.
    Bottom Nav shell (tabs placeholder leídos de config/i18n, cero hardcoded).
    Pantalla esqueleto en /pwa que monte canvas + bottom nav.
    viewport mobile (width=device-width, viewport-fit=cover) + manifest webmanifest dinámico.
    Crear designs/mobile-pwa/ con _template.md (canvas 390×844).
  </action>
  <verify>
    pnpm kiosk:dev arranca limpio; GET /pwa responde 200 con canvas 390×844 + bottom nav.
    Kiosk / sin regresión (screenshot agent-browser).
    pnpm typecheck && pnpm lint && pnpm format:check limpios.
  </verify>
  <done>
    /pwa renderiza el shell mobile escalado al viewport, kiosk intacto, check verde.
  </done>
</task>
```

---

## P1 — Flujo de arranque (Welcome → Login → Dashboard) ✅ (cerrada)

**Cubre:** las 3 primeras pantallas pixel-perfect. **Arranca primero** (decisión del operador).

- [x] **Welcome Screen** pixel-perfect vs `designs/mobile-pwa/NN-welcome.svg`.
- [x] **Login Screen** (mock passwordless — UI sin backend) vs su SVG.
- [x] **Dashboard** mobile pixel-perfect vs su SVG.
- [x] Navegación Welcome → Login → Dashboard funcional.

**Verify:** diff visual ±2px por pantalla (`revisor-visual`), audit `auditor-white-label` sin hallazgos.
**Done:** las 3 pantallas idénticas al XD; el flujo navega; reacciona a tokens/config.

> Requiere los SVG de XD del operador depositados en `designs/mobile-pwa/`.

---

## P2…Pn — Módulos reutilizados (bajo demanda) ✅ (cerrada)

> Entregados: Listings (Restaurants / Things to Do / Stay) + detalle · Events · Map ·
> Deals · Passes · Tickets · Trails · Digital Brochure · Social Wall · Ask AI · Trip Planner.

**Cubre:** módulos del kiosk con diseño mobile propio, **uno a la vez según indique el operador**.

Candidatos: Listings (Restaurants / Things to Do / Stay) + detalle · Events · Map · Deals · Passes ·
Tickets · Trails · Digital Brochure · Ask AI · Itinerary/Favoritos.

Cada pantalla: SVG + spec → componente mobile → diff visual ±2px → audit white-label → commit.
Reutiliza la **data layer** del kiosk (`getConfig`, tipos de `src/lib/config.ts`); rehace solo el diseño.

---

## Px — Módulos PWA-only ✅ (cerrada)

**Cubre:** pantallas nuevas que no existen en el kiosk.

- [x] Profile / Account (+ Edit Profile, Change Password, Settings, Delete flow)
- [x] Notifications (lista + detalle, opt-in mock)
- [x] More Module
- [x] Scavenger Hunt
- [x] Wayfinding
- [x] Connect With Us · Help · Search · Create Account · Forgot Password

---

## Py — Transversales mobile ✅ (cerrada)

**Cubre:** i18n mobile (selector + cambio de idioma) + Ads mobile (sobre overlays).

- [x] i18n PWA: cookie `pwa_locale` → `resolvePwaForLocale` → bridge; selector de idioma;
      518 textos traducidos a es/fr/de/pt/ja en `clients/default/features.pwa.i18n`.
- [x] Ads mobile: slot propio `features.pwa.ads` (hero / bottom / popup) con rutas `/pwa/*`.

---

## Pz — Integración al Studio ✅ (cerrada 2026-06-08)

**Cubre:** que "Mobile PWA" deje de ser stub y sea un producto gestionable.

- [x] Editor PWA real (reemplaza `src/app/studio/[slug]/mobile-pwa/page.tsx`).
- [x] Clone en `POST /api/studio/clients/route.ts` (rama `if (products.mobilePwa)` → `ensurePwaSlice`).
- [x] Prefijos PWA (`pwa:${slug}`) en `src/lib/studio/purge-client.ts`.
- [x] `bootstrap-from-fs` para PWA (`loadPwaSlice` → KV → config.json → template `default`).
- [x] `client-branding-sync` propaga branding a PWA.
- [x] Publish PR + preview bridge 390×844.

**Verify:** activar "Mobile PWA" en el Studio clona el cliente y lo previsualiza en el iframe 390×844. ✓

---

## Dependencias

```
P0 → P1 → (P2…Pn / Px / Py en cualquier orden, bajo demanda) → Pz
```
