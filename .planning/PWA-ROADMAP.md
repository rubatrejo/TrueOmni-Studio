# PWA-ROADMAP.md — Mobile PWA

Fases ordenadas del milestone PWA Mobile. Cada fase es atómica y verificable.
Visión y alcance en `PWA-PROJECT.md`. Protocolo por pantalla: `PIXEL-PERFECT-PROTOCOL.md`.

**Canvas de referencia:** 390×844 (adaptado desde artboards XD 375×812, ≈1.04× uniforme).
**Ruta de servido:** `/pwa` · **Cliente activo:** `KIOSK_CLIENT`.

---

## P0 — Bootstrap del runtime PWA ⏳

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

## P1 — Flujo de arranque (Welcome → Login → Dashboard) ⏳

**Cubre:** las 3 primeras pantallas pixel-perfect. **Arranca primero** (decisión del operador).

- [ ] **Welcome Screen** pixel-perfect vs `designs/mobile-pwa/NN-welcome.svg`.
- [ ] **Login Screen** (mock passwordless — UI sin backend) vs su SVG.
- [ ] **Dashboard** mobile pixel-perfect vs su SVG.
- [ ] Navegación Welcome → Login → Dashboard funcional.

**Verify:** diff visual ±2px por pantalla (`revisor-visual`), audit `auditor-white-label` sin hallazgos.
**Done:** las 3 pantallas idénticas al XD; el flujo navega; reacciona a tokens/config.

> Requiere los SVG de XD del operador depositados en `designs/mobile-pwa/`.

---

## P2…Pn — Módulos reutilizados (bajo demanda) ⏳

**Cubre:** módulos del kiosk con diseño mobile propio, **uno a la vez según indique el operador**.

Candidatos: Listings (Restaurants / Things to Do / Stay) + detalle · Events · Map · Deals · Passes ·
Tickets · Trails · Digital Brochure · Ask AI · Itinerary/Favoritos.

Cada pantalla: SVG + spec → componente mobile → diff visual ±2px → audit white-label → commit.
Reutiliza la **data layer** del kiosk (`getConfig`, tipos de `src/lib/config.ts`); rehace solo el diseño.

---

## Px — Módulos PWA-only ⏳

**Cubre:** pantallas nuevas que no existen en el kiosk.

- [ ] Profile / Account
- [ ] Notifications (lista, opt-in mock)
- [ ] More Module
- [ ] Scavenger Hunt
- [ ] _(las que se vayan definiendo)_

---

## Py — Transversales mobile ⏳

**Cubre:** i18n mobile (selector + cambio de idioma) + Ads mobile (sobre overlays).

---

## Pz — Integración al Studio ⏳ (última, tras aprobación visual)

**Cubre:** que "Mobile PWA" deje de ser stub y sea un producto gestionable.

- [ ] Editor PWA real (reemplaza `src/app/studio/[slug]/mobile-pwa/page.tsx`).
- [ ] Clone en `POST /api/studio/clients/route.ts` (rama `if (products.mobilePwa)`).
- [ ] Prefijos PWA en `src/lib/studio/purge-client.ts`.
- [ ] `bootstrap-from-fs` para PWA.
- [ ] `client-branding-sync` propaga branding a PWA.
- [ ] Publish PR + preview bridge 390×844 (el `PreviewPanel` ya define la orientación).

**Verify:** activar "Mobile PWA" en el Studio clona el cliente y lo previsualiza en el iframe 390×844.

---

## Dependencias

```
P0 → P1 → (P2…Pn / Px / Py en cualquier orden, bajo demanda) → Pz
```
