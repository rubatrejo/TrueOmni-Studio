# STATE.md — Memoria del proyecto

Este archivo es la memoria persistente entre sesiones. Cada `/terminar` añade una entrada aquí.

---

## Estado actual

**Fase activa:** Milestone Studio — **S3.7 cerrada + UX-1..5 + 3 fixes + rename Trip Planner** (2026-04-29). Content tab CRUD masivo entregado para los 5 catálogos (Listings, Events, Tickets, Passes, Trails) más Listing modules **dinámicos** (add/duplicate/delete/rename/toggle desde tab Modules) con sync bidireccional con `modules.tiles[]`.

**Última fase cerrada:** Studio S3.7 + iteraciones UX (2026-04-29). Antes: S3.1–S3.6 (2026-04-29). S1/S2 (2026-04-28). S0 cloud (2026-04-28).

**Siguiente acción concreta:** **Studio S3.8 — Bulk import CSV/JSON** (diseño aprobado por Rubén el 2026-04-29). 3 tareas atómicas planeadas: (1) `import-helpers.ts` core con parseJson/parseCsv/diff/apply, (2) `ImportModal.tsx` UI + `CatalogToolbar` prop `onImport?`, (3) wire en 4 editores (ListingsEditor por entry activo, EventsEditor, PassesEditor, TrailsEditor) + smoke E2E. Tickets queda fuera (derivado).

**Bloqueos:**
- **`pnpm build` falla en SSG `/404`** con `<Html> outside pages/_document` — issue interno de Next 15 inalcanzable desde repo. Bloqueante para Vercel deploy (S7); no bloquea desarrollo. Fixes intentados sin éxito: `not-found.tsx` + `global-error.tsx` + `force-dynamic` en root layout. Issue rastreable como TODO independiente, ver commit `36093fa` para detalles.
- `alwaysShowWelcome={true}` del MapModule **resuelto** (commit `1ad640e`).

**TODO de QA pendiente:**

- Fase 3.15 Ask AI: **LLM real** (Fase 5+) — reemplazar typewriter mock por endpoint `/api/ai` con Anthropic Claude usando `clients/{slug}/config.json` como system prompt.
- Fase 3.15 Ask AI: **voice lang dinámico** — `recognition.lang = 'en-US'` hardcoded en `ai-modal.tsx:87`; debería leer de `config.client.locale` o `askAi.voiceLang`.
- Fase 3.15 Ask AI: **fallback response configurable** — string `'I can help with that!...'` en `ai-store.ts:56` mover a `config.textos.ai_fallback_response`.
- Fase 3.15 Ask AI: añadir bloque `home.askAi` a `_template` y `demo-cliente-a` cuando estos clientes tengan `features.home` configurado (hoy muestran placeholder de "no home").
- `alwaysShowWelcome={true}` en map.
- Fase 3.11 Tickets: auditor white-label ejecutado — reporte en `.planning/3-11-SUMMARY.md`.
- Fase 3.12 Deals: auditor ejecutado — solo fallbacks `??` defensivos (patrón idéntico a Tickets/Passes). Reporte en `.planning/3-12-SUMMARY.md`.
- Fase 3.12 Deals: verificación visual con `KIOSK_CLIENT=demo-cliente-a` pendiente (requiere reiniciar dev server). Los textos `deals_*` están traducidos al español en `demo-cliente-a/config.json`.
- Fase 3.12 Deals: cover Sephora (URL Unsplash `photo-1522335789203-aaa95c1cb28a`) puede estar 404; fallback gradient azul activo via `onError`. Verificar y reemplazar URL si persiste.
- Fase 3.13 Trails: **map aggregator integration pendiente** — `src/lib/map-aggregator.ts` no incluye trails como source. Añadir chip `trails` con color propio (propuesta: verde oliva `#b9bd39` o verde bosque). Detalles en `.planning/3-13-SUMMARY.md`.
- Fase 3.13 Trails: **GET DIRECTIONS del TrailMapTabs** usa `window.open(maps.google.com)` como fallback v1. Integrar `DirectionsModal` con turn-by-turn de Mapbox en v2 (requiere exponer callback del modal encapsulado en `ListingDetail`).
- Fase 3.13 Trails: auditor no ejecutado — strings defensivos `??` (mismo patrón tolerado en Tickets/Passes/Deals). Los hex (`#1796d6` del layer, `#004f8b` del pin, `#004f8b` de iconos Considerations) pertenecen al design system global.

**TODO i18n deuda compartida filter-overlay** (aplazado a Fase 5 — pasada de tokenización de strings):

- `events-filter-overlay.tsx` + `tickets-filter-overlay.tsx` + `map-filter-overlay.tsx`: "FILTERS" (título), "Features"/"Category"/"Venue"/"Price" (section titles), "Free" (price label), "CLEAR ALL", "APPLY", aria-label "Cerrar filtros". Auditor Fase 3.11 los detectó en Tickets; son heredados idénticos de los otros overlays. Tokenizar a `textos.filters_*` de una vez (afecta 3 overlays).
- `qr-purchase-modal.tsx`: aria-label "Cerrar" del botón X (heredado Passes 3.10).
- `[slug]/page.tsx` rama events: `"GET TICKETS"` legacy del `secondaryCta` cuando event tiene `ticketsUrl` pero no `.ticket`. Tokenizar a `textos.events_get_tickets_cta`.

**TODO de i18n (aplazado a Fase 5 — validador zod + migración a config.textos):**

- `src/app/(kiosk)/home/[module]/page.tsx:52` `"Coming soon"` (stub genérico).
- `src/app/(kiosk)/home/[module]/page.tsx:59` `"Back to Home"` (link del stub).
- `src/components/listings/send-to-phone-modal.tsx:90` `"USA (+1)"` — pendiente `config.client.country_code`. El módulo Passes hereda este TODO (textos.passes_share_country = "USA (+1)" igualmente fijo).
- Strings del SharingRow del detail + toolbar del módulo de Listings ("WEBSITE", "RESERVE NOW", "SEND TO EMAIL/PHONE", "ADD TO FAVORITES", "FILTERS", "SORT BY", "CLOSE", "CANCEL", "SEND", "DESCRIPTION", "GET DIRECTIONS") vienen del SVG; se migran a `config.textos` cuando se internacionalice.
- Activity-row del módulo Passes: el botón "View Website" usa `textos.passes_view_website` ✅ ya migrado.

**Deps añadidas:** `qrcode.react@4.2` (Passes share modal — QR escaneable level H con logo TrueOmni centrado). `zustand@5.0`, `framer-motion@12.38`, `gsap@3.15`, `@gsap/react@2.1` (Fase 3.15 Ask AI module — store, animaciones modal/chips, mic rings).

**Tokens nuevos:** `--survey-success: 120 61% 50%` (lime `#32CD32` para checks de Survey thank-you y Passes sent-confirmation) — añadido a los 3 `tokens.css` (template, default, demo-cliente-a) en sesión 2026-04-22. **Fase 3.15:** 8 tokens `--ai-*` añadidos a los 3 `tokens.css`: `--ai-surface`, `--ai-text`, `--ai-text-soft`, `--ai-accent-from`, `--ai-accent-to`, `--ai-keyboard-bg`, `--ai-trigger-shadow`, `--ai-input-bg`.

**Decisiones globales vigentes:**

- Stack: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui.
- White label = tokens CSS + config JSON, combinados.
- Inputs del diseño: SVG exportados de Adobe XD.
- Idioma de comunicación: español.
- Metodología: GSD (fases + XML atómico) + Boris Cherny (plan mode + CLAUDE.md vivo + slash commands + verify).

---

## Historial de sesiones

<!--
  Cada /terminar añade una entrada aquí, más reciente ABAJO del todo.
  Formato estándar: ver plantilla al final del archivo.
  Primera entrada real se creará cuando se ejecute /terminar por primera vez
  (después del primer commit de Fase 0).
-->

### Sesión 2026-04-19 — Bootstrap (Fase 0) + scaffolding Fase 1 completo

**Hecho:**

- Fase 0 cerrada: `git init`, identity del repo a `designers@trueomni.com`,
  primer commit del bootstrap (`8e5a3e5`), housekeeping `.vscode/settings.json`
  trackeado (`5cb82cc`).
- Fase 1 planificada en `.planning/1-{1,2,3}-PLAN.md` + `1-ORCHESTRATOR.md`
  (`42ab975`).
- Plan 1-1 ejecutado: Next.js 15 + React 19 + TS estricto, App Router,
  Tailwind v3 cableado a tokens del template via `hsl(var(--...))`,
  cargador `getClientSlug()` con fallback `default`, canvas 1080×1920,
  página de prueba con placeholder aislado en `src/lib/kiosk-placeholder.ts`.
  Script `pnpm kiosk:dev` con `cross-env`. Commit `04464ce`.
- Plan 1-2 ejecutado: ESLint estricto (`next/core-web-vitals` + TS + a11y +
  `no-restricted-imports` forzando uso de wrappers) + Prettier 100 cols +
  plugin tailwindcss. Scripts `check`, `clean`, `format`, `format:check`,
  `lint`, `lint:fix`. Commit `59718e1`.
- Plan 1-3 ejecutado: shadcn/ui inicializado manualmente (components.json +
  cn()), 5 componentes base generados (button, card, dialog, input, badge)
  en `src/components/ui/`, wrappers en `src/components/`, `index.ts` como
  punto único de importación. Tokens `--card`/`--popover` añadidos al
  template. Plugin `tailwindcss-animate` registrado. Commit `172dc42`.

**Verificado:**

- `pnpm check` (typecheck + lint + format:check) pasa limpio.
- `pnpm kiosk:dev` levanta en 3000 con HTTP 200, render contiene el canvas
  1080×1920, los 3 textos del placeholder y `Cliente activo: default`.
- `grep -REn "#[0-9a-fA-F]{3,8}" src/` sin resultados.
- `grep -REn "from '@/components/ui/" src/app src/components/*.tsx` solo
  aparece en los 5 wrappers (la regla ESLint bloquea el resto).

**Pendiente / siguiente:**

- Abrir Fase 2: cargador `src/lib/config.ts` tipado, `clients/default/`
  como clon del template, `clients/demo-cliente-a/` con tokens alternos
  para probar que cambiar tokens.css = cambia UI sin tocar `.tsx`.
- Borrar `src/lib/kiosk-placeholder.ts` cuando exista el cargador de
  config (está marcado explícitamente `[FASE 1 PLACEHOLDER]`).
- Un archivo `Untitled` quedó sin trackear en raíz (27 bytes con texto
  "Sigamos todo en esta sesion"); parece un paste accidental en el
  editor. Pendiente borrar o mover.
- Cuando Rubén entregue los SVGs del XD, activar Fase 3 (una subfase
  por pantalla).

**Decisiones:**

- Next.js 15 + React 19 en lugar de Next 14. Razón: React 19 es estable,
  no hay incompatibilidad con shadcn.
- Tailwind v3 en lugar de v4. Razón: compatibilidad probada con shadcn/ui
  y con el flujo `config-based` que usamos. v4 queda como tech debt si
  emerge una razón concreta.
- `cross-env` como devDep estándar (decisión del orquestador).
- Tokens `--card`/`--popover` añadidos al `tokens.css` del template en
  el mismo commit del 1-3 (decisión del orquestador: añadir, no diferir).
- `shadcn init` NO se ejecutó; `components.json` y `utils.ts` se crearon
  manualmente para evitar que shadcn sobrescribiese `tailwind.config.ts`
  y `globals.css`, que ya estaban configurados contra nuestros tokens.
- ESLint override para `src/components/ui/**` relaja `import/order` y
  `@typescript-eslint/no-explicit-any` porque los archivos son
  generados y NO se editan a mano (CLAUDE.md §9).

**Fase:** 1 — Scaffolding Next.js + Tailwind + shadcn/ui.

### Sesión 2026-04-19 — Fase 2 completa (sistema white-label funcional)

**Hecho:**

- Cargadores tipados: `src/lib/tokens.ts` (catálogo de nombres de token),
  `src/lib/config.ts` con `getConfig()` cacheado y fallback a `default`,
  `src/lib/client-tokens.ts` con `getClientTokensCss()` para inyectar
  tokens.css. Dep `server-only` añadida. Commit `7bc72ef`.
- Clientes reales: `clients/default/` (clon del template, slug "default",
  nombre "Kiosk por defecto") y `clients/demo-cliente-a/` (primary
  naranja 25 95% 55%, accent verde menta 160 72% 45%, radios más
  redondeados, font-serif Fraunces, textos alternativos). Commit `5b44b63`.
- Cableado UI: `src/app/layout.tsx` pasa a async, inyecta tokens del
  cliente activo como `<style data-kiosk-tokens>` en `<head>`, setea
  `lang` y title desde config. `src/app/(kiosk)/page.tsx` consume
  `config.textos`. `src/styles/globals.css` deja de hacer `@import`
  del template (los tokens entran solo por inyección).
- `src/lib/kiosk-placeholder.ts` borrado. Cero referencias en el repo.
- `clients/_template/README.md` documenta la creación de cliente nuevo
  y qué archivo controla qué.
- Archivo `Untitled` accidental borrado.

**Verificado:**

- `KIOSK_CLIENT=default` → `--primary: 221 83% 53%` (azul), título
  "Bienvenido", slug `default`, metadata title "Kiosk por defecto".
- `KIOSK_CLIENT=demo-cliente-a` → `--primary: 25 95% 55%` (naranja),
  `--accent: 160 72% 45%` (verde), título "Bienvenido a Demo A",
  label "Estás viendo:", metadata title "Demo Cliente A".
- Cambio entre clientes sin tocar ni un `.tsx`.
- `pnpm check` (typecheck + lint + format:check) limpio.
- `grep -R "KIOSK_PHASE_1_PLACEHOLDER\|kiosk-placeholder" src/` vacío.
- `grep -n "@import" src/styles/globals.css` vacío (tokens solo por
  inyección).

**Pendiente / siguiente:**

- Fase 3: esperar los SVGs del XD. Por cada pantalla, depositar
  `designs/NN-nombre.{svg,md}`, crear plan XML, cargar skills Tier 1
  y construir pixel-perfect.
- Evaluar si conviene un fallback más defensivo en `getConfig()` si
  el JSON del cliente está malformado (ahora propaga el error).
  Probablemente suficiente hasta Fase 5 (validador zod).

**Decisiones:**

- Inyección de tokens via `<style dangerouslySetInnerHTML>` en layout,
  no via `@import` estático en `globals.css`. Razón: permite switch
  por `KIOSK_CLIENT` en cada render, sin rebuild.
- `React.cache()` para `getConfig` y `getClientTokensCss` — evita
  doble lectura de fichero cuando layout + page consumen lo mismo.
- Schema `config.schema.json` se duplica en cada cliente (copia, no
  symlink). Razón: portabilidad y el `$schema` relativo funciona.
- Dep `server-only` mantiene los cargadores fuera del bundle cliente.

**Fase:** 2 — Sistema de tokens + cargador de cliente.

### Sesión 2026-04-20 — Pulido Billboards + Fase 3.2 Home completa + Fase 3.3 Ola 1-2

**Hecho:**

- **Billboards B1-B4 pixel-perfect** contra SVGs en `designs/TNT/Billboard/`:
  coords/tamaños verbatim, weather widget alineado, iconos reales (wheelchair
  ISA, Itinerary, Photo Booth camera), 5 variantes alineadas en 540×475.
- **Dev-nav eliminado** de todo el kiosk (era solo para dev).
- **Fase 3.2 — Main Dashboard (Home) completa** (7 olas):
  - Layout sticky header + search + grid scrollable + wayfinding banner.
  - `HomeHeader` con clock + fecha + weather LIVE desde **Open-Meteo**
    (timezone America/Phoenix, locale en-US). Coords Phoenix (33.4484, -112.074).
  - `WeatherPopup` verbatim SVG: cabecera azul rounded-bottom 576×510 con
    cloud icon grande + 92° + date + time, forecast 5 días con iconos
    dinámicos por weatherCode, OK button.
  - `LanguageDropdown`: 244×80 olive con globe + ENGLISH + chevron up,
    abre hacia arriba 5 idiomas dentro del frame.
  - `SearchOverlay` + `OnScreenKeyboard`: modal fijo dentro del canvas,
    teclado QWERTY verbatim SVG (posiciones exactas de cada tecla).
  - `CategoryGrid` 2-col tiles 460×460 + `WayfindingBanner` 950×460.
  - 17 rutas stub en `/home/[module]` para módulos future.
  - Scrollbars ocultos, gradient blanco scroll-hint al fondo.
- **Fase 3.3 Ola 1-2 — Listings module scaffolding + main screen**:
  - Tipos `HomeModule` + `Listing` + `mapbox_token` en config.
  - 90 listings (30 × restaurants/things-to-do/stay) con URLs Unsplash reales,
    popularity, features, coords Phoenix metro, hours, website, opentable.
  - `mapbox-gl` + `@types/mapbox-gl` instalados; token en `.env.local`
    y `config.integraciones.mapbox_token`.
  - `ListingsModule` + `ListingsToolbar` (4 cells verbatim SVG) + `ListingsGrid`
    (infinite scroll 12→30) + `ListingCard` (293×268 con heart + dark footer)
    - `FloatingHomeButton`.
  - Ruta `/home/[module]` ahora detecta si hay módulo en config y renderiza
    ListingsModule; si no, cae al stub "Coming soon".
- **Referencias XD depositadas** en `designs/Home/`, `designs/Listings/`,
  `designs/TNT/Billboard/`.

**Verificado:**

- Playwright screenshots de: / (landing), /home, /home popup weather,
  /home language dropdown open, /home search modal, /home/restaurants.
- `pnpm check` (typecheck + lint + format) limpio.
- 90 listings renderean con fotos Unsplash reales en /home/restaurants,
  /home/things-to-do, /home/stay, cada uno con data distinta.

**Pendiente / siguiente:**

- **Fase 3.3 Olas 3-8** (próxima sesión, contexto fresco):
  - Ola 3: Detail screen + Mapbox (nueva ruta `/home/[module]/[slug]`).
  - Ola 4: Favoritos sessionStorage (hook `useFavorites`, heart toggle).
  - Ola 5: Filter + Sort overlay (features/open-now/price + sort options).
  - Ola 6: Send to Email / Phone modales (reusa OnScreenKeyboard + nuevo
    NumericKeypad).
  - Ola 7: Get Directions modal (Mapbox route + turn-by-turn) + Threshold
    360 iframe modal.
  - Ola 8: Verificación visual (revisor-visual vs SVGs, auditor-white-label).
- Plan detallado: `~/.claude/plans/b-tambien-nifty-island.md`.
- Tasks registradas: IDs 10-15.

**Decisiones:**

- Patrón **"modal dentro del frame"**: `fixed inset-0` dentro del
  `KioskCanvas` (que tiene `transform: scale`) hace que el modal se contenga
  al canvas, no al viewport. Aplicado a Weather Popup, Search Overlay,
  Language Dropdown. Próximos modales deben seguir el mismo patrón (nada
  de `createPortal` a `document.body`).
- **Listings module** = **1 componente parametrizado**, no 3 archivos. La
  ruta `/home/[module]` resuelve runtime contra `config.features.home.modules`.
  Cada cliente renombra ("Food & Drink" → "Dine") y puebla listings sólo
  tocando JSON.
- **Favoritos en sessionStorage** (no localStorage) — se borra al cerrar
  sesión. Itinerary Builder (fase posterior) leerá el mismo storage.
- **Weather Popup icons**: usan el mismo `WeatherIcon` (shared) con código
  WMO del Open-Meteo — header y popup SIEMPRE muestran el mismo símbolo
  para el clima actual.
- **Layout del Home**: `home/layout.tsx` es passthrough. Cada page wrappea
  su propio `KioskCanvas` + shell, porque los módulos tienen hero+toolbar
  distinto al Dashboard.

**Fase:** 3.2 cerrada, 3.3 Ola 1-2 completa. Siguen Olas 3-8.

### Sesión 2026-04-20 — Fase 3.3 Olas 3-8 (listings module completo)

**Hecho:**

- **Ola 3 — Detail screen + Mapbox:**
  - `src/app/(kiosk)/home/[module]/[slug]/page.tsx` server component resuelve listing por slug, 404 si no existe.
  - `src/components/listings/listing-detail.tsx` verbatim SVG (`Food & Drink – Detail`): header azul 899×312 con SUBCATEGORY + TITLE + X, hero 899×369 con SEE 360 badge condicional, action row (Time/phone + WEBSITE blue + RESERVE NOW red outline con logo OpenTable), sharing row 3 cells (EMAIL/PHONE/FAVORITES), Mapbox section + address + GET DIRECTIONS con icon pin+flag paths verbatim del SVG, DESCRIPTION + lorem.
  - `src/components/listings/mapbox-map.tsx` wrapper client con marker teardrop azul + fallback "Map unavailable" si no hay token.
  - `.planning/3-3-3-COVERAGE.md` checklist de los 10 groups del SVG.
- **Ola 4 — Favoritos:**
  - `src/lib/favorites.ts` hook `useFavorites()` con `useSyncExternalStore` + `sessionStorage` (`kiosk_favorites`). API `{ favorites, isFavorited, toggle, clear }`.
  - `ListingsModule` + `ListingDetail` sharing cell cablean hook; label cambia "ADD"/"ADDED TO FAVORITES" + heart outline/solid olive.
  - Fix heart del `ListingCard`: strokeWidth 2.4 → 1.6, size 32 → 38, `strokeLinecap/join: round`, `strokeWidth=0` cuando filled. Era ilusión óptica por stroke demasiado grueso sobre path pequeño.
- **Ola 5 — Filter + Sort overlays:**
  - `src/lib/listings-sort.ts` (`SortOrder`, `SORT_OPTIONS`, `sortListings`, `haversineMi`).
  - `src/lib/listings-filter.ts` (`FilterState`, `EMPTY_FILTER`, `applyFilters` — AND por features).
  - `FilterOverlay` verbatim SVG (título FILTERS, pills features outline → solid white activa, CLEAR ALL olive + APPLY blue). El SVG solo muestra features; OpenNow + Price quedan fuera de scope.
  - `SortOverlay` propio (no hay SVG): overlay dark + radio options (Most Popular / A-Z / Distance / Price). Distance se deshabilita si no hay `client.coords`.
  - `use-escape-to-close.ts` hook compartido para cerrar overlays con Escape.
- **Ola 6 — Send to Email / Phone modales:**
  - `Toast` con auto-dismiss 2s ("Sent!").
  - `NumericKeypad` 4×4 (7-8-9-/, 4-5-6-$, 1-2-3-⌨, .-0-Send) mismo estilo que `OnScreenKeyboard`.
  - `send-modal-chrome.tsx` con `SendModalChrome` + `TermsCheckbox` + `CancelSendButtons` reutilizables.
  - `SendToEmailModal` (reusa `OnScreenKeyboard` del Home) — validación regex email + terms.
  - `SendToPhoneModal` (NumericKeypad) — validación ≥10 dígitos + terms + country select USA (+1) stub.
  - v1: validación client-side + toast. Backend en fase posterior.
- **Ola 7 — Get Directions + Threshold 360:**
  - `DirectionsModal` verbatim SVG `Get Directions`: Mapbox centrado entre client y listing, tabs "by car"/"by walking", `Directions to {title}` + Current Location + lista turn-by-turn del `listing.directions` (icon + distance + instruction), address + phone, SEND TO EMAIL (olive) + SEND TO PHONE (blue), CLOSE footer.
  - `Threshold360Modal` iframe con sandbox `allow-scripts allow-same-origin` + X close. Solo si `listing.threshold360Url`.
  - `ListingDetail` centraliza state de todos los modales (email, phone, toast, directions, 360) y conecta SharingRow + SEE 360 badge + GET DIRECTIONS button.
  - Directions → SEND TO EMAIL/PHONE reusa los mismos modales de Ola 6 (cerrando directions primero).

**Verificado:**

- `pnpm check` (typecheck + lint + format) limpio.
- Playwright screenshots por flujo en `.planning/verifications/`:
  - `3-3-3-detail-v2.png` detail verbatim SVG.
  - `3-3-4-grid-hearts-outline.png` + `-toggled.png` + `-after-detail-untoggle.png` — favoritos sincronizados grid↔detail via sessionStorage.
  - `3-3-4-detail-favorited.png` — cell "ADDED TO FAVORITES" solid olive.
  - `3-3-5-filter-overlay.png` + `-wifi-selected.png` + `-grid-wifi-filtered.png` — features AND filter funciona.
  - `3-3-5-sort-overlay.png` + `-grid-sorted-alpha.png` — sort A-Z reordena.
  - `3-3-6-email-modal.png` + `-toast.png` — envío email con QWERTY.
  - `3-3-6-phone-modal.png` — envío phone con NumericKeypad.
  - `3-3-7-directions-modal.png` — mapa + tabs + turn-by-turn del listing.
  - `3-3-7-threshold360.png` — iframe del tour 360.
- Auditor white-label: sin violaciones críticas. Reportó 3 strings "Coming soon", "Back to Home", "USA (+1)" (TODOs de i18n aplazados a Fase 5) y colores grises del SVG (dentro de la excepción declarada del design system Listings).

**Pendiente / siguiente:**

- Fase 4 — primer cliente real con branding + Lighthouse en producción.
- O continuar con nuevas pantallas del XD cuando Rubén las entregue.
- TODO i18n detallado en sección "Estado actual" arriba.

**Decisiones:**

- **Scope del FilterOverlay ajustado al SVG real**: el XD solo muestra features pills + CLEAR/APPLY. OpenNow + PriceRange + Sort (que el plan original anticipaba dentro del mismo overlay) no existen en el SVG. Decisión: implementar solo features verbatim SVG + Sort como overlay separado con diseño propio coherente. OpenNow + Price quedan para v2 si el cliente los pide.
- **`useSyncExternalStore` para favoritos** en lugar de Context: el store global vive en módulo y todos los consumidores (card del grid, cell del detail, futuro itinerary builder) ven el mismo estado sin Provider wrapping.
- **Modales "dentro del canvas"** consistente: `absolute inset-0 z-{40|30}` dentro del `KioskCanvas`. No portal a document.body. Patrón validado desde Fase 3.2 (Weather/Search/Language) y extendido a Filter/Sort/Email/Phone/Directions/360.
- **Backdrop como `<button>` invisible** detrás del contenido en lugar de `onClick` en div — satisface `jsx-a11y` sin eslint-disable.
- **Heart fill del card**: strokeWidth debe ser <=1.6 sobre path SVG 24×24 renderizado a 38×38 para que la diferencia outline↔solid sea visible. Anotar para futuros iconos outline.
- **Distance sort**: se usa el `client.coords` del config (no geolocation del browser) — el kiosk está físicamente fijo, no hace falta geolocation API.
- **OpenTable logo simplificado** a 3 círculos rojos (`<svg>` inline con 1 círculo hollow y 2 filled); el logo completo con letras "opentable" del SVG no se replicó (demasiados paths). Revisar en QA si el cliente lo pide exacto.

**Fase:** 3.3 Olas 3-8 completa. Fase 3.3 cerrada a falta de commit.

### Sesión 2026-04-20 (noche) — Fase 3.3 pulido V1 (14 fixes) + V2 (5 fixes)

**Contexto:** tras entregar las olas 3-8, Rubén revisó visualmente y pidió 14
correcciones en una ronda y 5 más en una segunda ronda. Todo integrado.

**V1 — 14 fixes:**

- **#1 Imágenes rotas**: `<ListingImage>` (card) + `<HeroImage>` (detail) con
  `onError` → fallback gradient azul con el título del listing.
- **#2 Botones Home/Back SVG**: assets `button-home.svg` + `button-back.svg`
  copiados a `clients/{default,_template}/assets/`. `FloatingHomeButton`
  reemplazado con shape CSS (pill azul `#004f8b` con esquina derecha redondeada
  radius 116, shadow drop-right) + icono home SVG inline blanco. Nuevo
  `BackButton` con misma forma + flecha ←.
- **#3 Search toolbar**: wire a `SearchOverlay` del home, scoped al módulo
  activo (mapea `Listing → HomeListing`).
- **#4 + #15 Hero universal**: `HomeHeader` acepta `heroImage?` + `showLanguage?`.
  Se renderiza server y se pasa como prop a `ListingsModule`. 620px fijo.
  Gradient azul `rgba(0,79,139,*)` fijado **top→bottom** (0.9 top → 0
  bottom al 70%) para que logo/hora/clima se lean sobre cualquier foto.
- **#5 Filter overlay full**: 4 secciones Features / Category / Price /
  Availability + CLEAR/APPLY (inicialmente full canvas, luego V2 lo reduce).
- **#6 Detail sobre grid**: ruta detail renderiza `<ListingsModule>` +
  `<ListingDetail>` como overlay `rgba(0,0,0,0.7)`. El grid queda visible
  atenuado detrás.
- **#7 Click propagation cells**: cada `ShareCell` tiene `left+width` específicos
  por celda (antes `inset:0` los solapaba y favorites capturaba todos los clicks).
- **#8 Gradient scroll-hint**: fixed bottom 140px dentro del módulo para
  indicar más contenido abajo.
- **#10 DirectionsModal rediseñado**: same size que detail (898×1589).
  Mapbox Directions API real con polyline azul origen→destino. Sin emojis
  (iconos `CarIcon` / `WalkIcon` SVG custom). Turn arrows SVG limpios
  (right / left / u-turn / straight). Address + phone bajo mapa.
- **#11 NumericKeypad white bg**: wrapper 1080×398 con fondo blanco.
- **#12 ConfirmationPopup**: `SendConfirmationPopup` card grande centrada con
  gradient olive→blue top band, check animado, destination pill, progress
  bar 5s, auto-redirect `/home`. Reemplaza el toast "Sent!" simple.
- **#13 FavoriteToast**: toast interactivo con heart olive + "Added to Itinerary"
  - contador + CTA pill al builder. Disparado por `CustomEvent kiosk:favorite-added`.
- **#14 SEE 360 font + funcional**: font `OctinCollegeFree` → Helvetica Bold.
  Iframe con permisos extendidos + URLs demo cambiadas a YouTube 360 embed.

**V2 — 5 fixes tras segunda revisión:**

- **#1 Toast más compacto y llamativo**: rediseño pill con gradient olive→blue,
  heart rojo en círculo blanco, "Added to Itinerary" + "N items saved",
  CTA pill blanca "View →", X close, `zIndex: 70` + `top: 44px` para quedar
  encima del listing-detail. Animación bounce-in.
- **#2 Walking directions dinámicas + botones abajo**: `DirectionsModal`
  fetchea Mapbox `steps=true` y extrae instrucciones por modo. Footer
  CLOSE eliminado; SEND TO EMAIL/PHONE movidos al bottom. Walking muestra
  distancias en FT, driving en MI.
- **#3 Home button azul correcto**: shape CSS en vez de SVG filter-blur
  (antes se veía blanco por el fallback del filter). Pill azul sólido.
- **#4 Things to Do tile 2 renglones**: label en `config.default` cambiado
  a `"Things\nto Do"` con `white-space: pre-line` del `CategoryTile`.
- **#5 FilterOverlay solo encima del grid**: cambio `inset-0` a
  `top: 738px` (debajo del hero 620 + toolbar 118). Hero y toolbar siguen
  visibles arriba para contexto.

**Archivos nuevos/modificados clave:**

- `src/components/home/header.tsx` — acepta props `heroImage` + `showLanguage`
  - gradient fijo top.
- `src/components/listings/floating-home-button.tsx` — pill azul CSS + icono.
- `src/components/listings/back-button.tsx` — nuevo.
- `src/components/listings/favorite-added-toast.tsx` — nuevo, gradient pill
  con CTA y contador.
- `src/components/listings/send-confirmation-popup.tsx` — nuevo, card elegante
  con check animado + auto-redirect.
- `src/components/listings/directions-modal.tsx` — rediseño completo +
  steps dinámicos por modo.
- `src/components/listings/directions-map-with-route.tsx` — nuevo, recibe
  `geometry` del parent para pintar polyline.
- `src/lib/listings-filter.ts` — `FilterState` extendido con subcategories,
  priceRanges, openNow.
- `src/lib/favorites.ts` — `toggle()` retorna `'added' | 'removed'` + dispatch
  `CustomEvent kiosk:favorite-added` con contador.
- `src/components/listings/filter-overlay.tsx` — 4 secciones, posicionado
  solo sobre el grid.
- `src/components/listings/listing-card.tsx` — fallback imagen.
- `src/app/(kiosk)/home/[module]/[slug]/page.tsx` — renderiza módulo como
  fondo + detail como overlay.
- `clients/default/config.json` — tile Things to Do con `\n`, 24 URLs
  threshold360 actualizadas a YouTube 360 embed.
- `clients/{default,_template}/assets/button-home.svg` + `button-back.svg`.
- `src/components/listings/toast.tsx` — **eliminado** (reemplazado por
  SendConfirmationPopup + FavoriteAddedToast).

**Verificado:** `pnpm check` limpio. Screenshots de cada flujo en
`.planning/verifications/fixes-*.png` y `v2-*.png` (detail, filter, sort,
email modal + confirm popup, phone modal + numeric keypad, directions
driving/walking, SEE 360 funcional, favorite toast).

**Pendiente / siguiente:**

- Fase 4 — primer cliente real con branding + Lighthouse en producción.
- Posible próxima pantalla: Itinerary Builder (los favoritos ya están
  conectados en sessionStorage; el toast invita al usuario a visitarlo).
- TODO i18n documentado arriba.

**Decisiones:**

- Button shapes como CSS + icon SVG en lugar de SVG complejo del XD con
  filter-blur. El filter produce artefactos en algunos browsers. Diseño
  visualmente idéntico.
- FavoriteToast vive **en ambos** ListingsModule y ListingDetail para que
  aparezca encima del overlay del detail (z-index 70).
- DirectionsModal con fetch en el modal (no en el map) — single source of
  truth: el modal resuelve steps + geometry y pasa sólo geometry al map.
  Reduce duplicación y permite extraer steps para la lista.
- URLs Threshold360 mock apuntan a YouTube 360 embed — funcionan en
  localhost sin X-Frame-Options. En producción el cliente pondrá sus URLs
  reales.
- Gradient hero fijo **top→bottom** decreasing opacity. La versión inicial
  tenía el gradient invertido (oscuro abajo donde está el toolbar, claro
  arriba donde está el logo) — corregido.

**Fase:** 3.3 cerrada con pulido V1 + V2 completo.

---

### Sesión 2026-04-21 — Fases 3.4 Events + 3.5 Social Wall + 3.6 Digital Brochure

**Hecho:**

- **Fase 3.4 Events** cerrada: `HomeEventsModule` (kind='events'), `EventItem` con date/time/venue/price, utils `events-date/filter/sort`, `EventsModule` con `WeekPicker` (pill "hoy" preseleccionada filtrando por día, flechas cambian semana), `EventsList` + `EventCard` horizontal con cover A4, `EventsFilterOverlay` 4 dims (Category/Venue/Price/Features), `SortOverlay` generalizado con `options` prop. `ListingDetail` adaptado para reusar (eventMeta + secondaryCta + favoritesKind). `favorites.ts` refactor a factoría: `useFavorites` + `useEventFavorites`. 46 eventos mock en 3 semanas.
- **Fase 3.5 Social Wall**: `HomeSocialWallModule` con `SocialPost` (image/video/text/gallery) + 6 sources + `SocialAuthor` + `SocialHighlight`. Utils `social-date` (timeAgo) + `social-sources`. `SocialWallModule` con banner gradient (Highlights + #hashtag sticky en hero), tabs por red (solo los handles configurados), masonry CSS columns 3-col, `seededShuffle` para variar orden en cada repetición (48 posts mínimo). `SocialPostCard` con gradient overlay dark-bottom→transparent-top sobre la media, badge de red, play icon en video, counter en gallery. 4 modales centrados con X estilo listings-detail: Image, Video (autoplay muted loop con toggle pause/play + workaround React muted bug), Text, Gallery (carrousel con arrows). 22 posts mock + 3 highlights + 4 handles.
- **Fase 3.6 Digital Brochure**: `HomeDigitalBrochureModule` con `BrochureItem` (pdfUrl + cover A4 + metadata). `pdfjs-dist@3.11.174` (downgrade desde v5 que rompe con Next 15 webpack). Worker en `public/pdfjs/pdf.worker.min.js`. `next.config.mjs` con alias `canvas: false` para skip del native. Utils `pdfjs-setup` (`loadPdf` cached + onProgress) + `brochures-filter`. `BrochuresModule` con toolbar style listings (label + search only), tabs grandes, `BrochureCard` 880×300 con cover 212×300 (ratio A4), `BrochuresSearchOverlay` con QWERTY + autocomplete. `BrochureReader` con header azul (title + SEND TO EMAIL/PHONE), controles arriba (counter 132px + grid + slider + zoom), flechas laterales top 35%, `BrochurePdfPage` render canvas, `BrochureGridOverview` 4-col thumbs, `LoadingState` con barra de progreso, `ErrorState` con fallback link, `BackButton` flotante. 4 brochures mock (St. Louis usando `stlvg26_compressed.pdf` 9.8MB local).
- **Pulido Listings** post-3.3: filter overlay centrado vertical + gap antes de CLEAR/APPLY; directions map flex-shrink:0 (no encoge en walking); X top-right consistente detail+directions; NumericKeypad fondo ajustado al ancho; SendTo modals auto-height; mapa detail zoom 15 + pin 48×68; `ActionRow` centrado vertical cuando no hay reserveUrl; phone en 2ª línea del detail cuando hay eventMeta; tipografía detail unificada 22px medium + rowGap 12.
- **Pulido Events** post-V1: cards 880×300 con padding-left 140 (no tapa home button), week header 34px bold 800 azul claro #1e88c6, venues/features sin Waterfront/Free Parking, ordenamiento consistente.
- **Fix 22 URLs rotas**: 17 Unsplash 404 (listings + events + social wall) reemplazadas por IDs verificadas. 5 videos del gtv-videos-bucket Google (403) → MDN + samplelib.
- Commit único `2b7d557` con los 3 módulos + pulidos + URL fixes.

**Verificado:**

- `pnpm check` (typecheck + lint + format) limpio en cada checkpoint.
- Carga del PDF real (stlvg26_compressed 9.8MB) en el reader funciona tras downgrade a pdfjs v3 + `canvas: false` en webpack alias.
- Playwright/browser manual por el usuario en `/home/events`, `/home/social-wall`, `/home/digital-brochure`, `/home/digital-brochure/st-louis-art-bound`.
- 164 URLs del config.json verificadas con HEAD requests (0 rotas).

**Pendiente / siguiente:**

- Fase 4 — primer cliente real con branding, Lighthouse en producción, handoff.
- Cuando Rubén mande: Itinerary Builder (consumirá `kiosk_favorites` + `kiosk_event_favorites` buckets).
- Posible pulido adicional del Social Wall si el diff visual vs SVG no convence (v2 de cards con avatar más grande, o refinar el overlay gradient).
- El PDF original de 54MB (`stlvg26.pdf`) quedó en `public/brochures/` por si se quiere usar; borrar si no se usa para no pesar en el repo.
- Los archivos muertos del pre-iframe intento (`brochure-pdf-page.tsx`, controls, grid, pdfjs-setup) se rehicieron — ahora todos en uso.
- Testing automatizado: quedan los `react-hooks/exhaustive-deps` warnings pre-existentes en `directions-map-with-route.tsx` y `directions-modal.tsx` (deliberados por refs inestables).

**Decisiones:**

- **pdfjs-dist v3 en lugar de v5**: v5 dispara `Object.defineProperty called on non-object` con el webpack/ESM handler de Next 15. v3 es CJS-compatible y funciona sin `transpilePackages`. Worker en `.js` (no `.mjs`). Si Next 16 llega con mejor ESM handling, reconsiderar upgrade.
- **`canvas: false` en webpack alias**: pdfjs declara `canvas` (native Node) como dep opcional. En browser no aplica pero webpack lo busca. Alias a false skipea sin break.
- **Reader custom con pdf.js canvas render** en lugar de iframe nativo. El viewer nativo muestra toolbar con descargar/imprimir/compartir/3-dots que no aplican al kiosk público. Con canvas tenemos control total.
- **Controls arriba del stage** (no bottom como era el patrón inicial). Rubén pidió moverlos para que no chocaran con el área del BackButton flotante. Flechas laterales quedan en `top: 35%` (arriba del BackButton que va de y=1000 a y=1232).
- **Kind discriminator en modules** extendido: `'listings' | 'events' | 'social-wall' | 'digital-brochure'`. La unión `HomeModuleVariant` crece por fase. Cada ruta `/home/[module]` + `/home/[module]/[slug]` hace switch explícito.
- **Favoritos factorizados**: `createFavoritesStore(storageKey, kind)` permite buckets independientes. Events y Listings no se mezclan aunque ambos suman al toast "Added to itinerary".
- **ListingDetail como componente compartido**: event detail reusa el shell del listing detail con props `eventMeta` (2 líneas: date+time / phone) + `secondaryCta` (GET TICKETS si hay ticketsUrl) + `favoritesKind`. Evita duplicar 500 líneas.

**Fase:** Fases 3.4, 3.5 y 3.6 cerradas. Lista para Fase 4.

---

### Sesión 2026-04-21 — Fase 3.7 Map + Fase 3.8 Advertisement

**Hecho:**

- **Fase 3.7 Map** (brainstorming → plan → 6 olas → pulido):
  - Tipos `HomeMapModule` + `MapSource` + `MapItem` en `config.ts`.
  - Data layer: `map-aggregator.ts` (agrega listings+events, auto-detect 4 sources, events window 7 días, jitter determinístico por source + slug porque el seed data comparte coords entre módulos), `map-filter.ts`, `map-walking-eta.ts` (haversine /5 km/h), `map-open-today.ts`, `map-detail-lookup.ts`.
  - `MapCanvas` con Mapbox GL interactivo + clustering nativo (clusterRadius 18 / clusterMaxZoom 15) + pins verbatim del SVG por categoría con 4 iconos distintos (tenedor / ferris wheel / cama / calendario). Clusters azul oscuro `#004f8b` (antes coral). Selected pin 156×210 conserva color + icono + drop-shadow.
  - `MapTopCarousel` + `MapTopCard` estilo `ListingCard` (293×269, active ×1.18 con lift −10 + borde azul, sin shadow). Primera card con padding izquierdo 65px alineado al logo.
  - `MapChips` con "Select All" + colores que matchean los pins (Play `#004f8b`, Eat `#1796d6`, Stay `#b9bd39`, Events `#f16651`). Inactivos outline difuminado opacity 0.55.
  - `MapToolbar` estilo `ListingsToolbar` con "Explore {client} Map" (template interpolado server-side) + search + filter.
  - `MapPinBubble` verbatim `Map-Small-Detail.svg` — 540×278 (10% más grande), tipografía 28 bold / 16 medium / 17 mi-away, gradient dark-to-transparent bottom→top, X blanca. SEE MORE INFO abre `ListingDetail` **in-place** encima del mapa (nuevo prop `onClose` en `ListingDetail`) y cierra la bubble. ADD TO ITINERARY usa `useFavorites`/`useEventFavorites` según source.
  - `MapWelcomePopup` (900×auto, gate por `sessionStorage kiosk_map_welcome_seen`, `alwaysShowWelcome` temporal para QA), `MapFilterOverlay` estilo `FilterOverlay` de listings (full-canvas dark, pills outline, CLEAR ALL olive + APPLY blue, pool recortado a la mitad para no saturar), `SearchOverlay` del home reutilizado con pool combinado.
  - Hero 620px full: carrusel + chips dentro del hero (top:140→620), toolbar 118 por debajo del hero → total área azul 738 igual que los demás módulos. Gradient overlay del header sin imagen ahora fade-to-transparent-bottom (0.9→0).
  - Cliente default `nombre` pasó a "Arizona" para ver el template funcionando.
- **Fase 3.8 Advertisement**:
  - Tipos `Ad` + `AdKind` (`popup|hero|bottom`) + `AdvertisementsConfig` + `AdTheme`.
  - `src/lib/ads.ts`: `matchesRoute(pattern, path)` con wildcards `/*`, `getAdsForRoute`, `getAdsFromConfig`.
  - `useAds(ads)` con `useSyncExternalStore` + `sessionStorage[kiosk_ads_dismissed]` gate (un ad cerrado no vuelve a salir en la sesión).
  - `useImageCornerTheme(url)`: samplea canvas offscreen el cuadrante superior-derecho (25%×25%), calcula luminancia Rec.601, umbral 160 → `light`/`dark`. Cachea por URL. `ad.theme` del config sigue como override opcional.
  - `AdCloseButton`: X con `filter: drop-shadow` dual-layer, color según theme (blanca con sombra oscura / negra con sombra clara). Sin background circular — flotante.
  - `AdPopup` z-60 (bloqueante, tamaño nativo del asset, max 1000×1700), `AdHero` z-20 (1080×620 con `objectFit: fill` + inset:0 + bg `#000` para eliminar subpixel-gap), `AdBottom` z-30 (1080×185).
  - `AdsSlot` orquestador se monta como sibling del módulo en `/home`, `/home/[module]` (todas las ramas del switch: listings/events/social-wall/digital-brochure/map) y `/home/[module]/[slug]` (listings/events/brochure detail).
  - Config default con 4 ads de prueba: Lola's Lunch (popup → `/home/restaurants`), History of Art (hero → `/home` + `/home/things-to-do`), Uber Eats NFL (bottom dark → `/home` + `/home/restaurants`), Uber Eats $5 Off (bottom light → `/home/events`). Assets copiados a `clients/default/assets/ads/`.

**Verificado:**

- `pnpm check` (typecheck + lint + format:check) limpio.
- Playwright MCP: `/home/map` con welcome + mapa + burbuja + 4 categorías de pins visibles (tras jitter).
- Playwright MCP: `/home/restaurants` muestra popup Lola's + bottom Uber NFL, `/home/things-to-do` muestra hero Art (con hero del módulo oculto correctamente), `/home/events` muestra bottom Uber $5 Off con **X negra auto-detectada** por fondo blanco.
- Cerrar un ad con la X lo deja oculto en la sesión (sessionStorage verificado).
- Sin regresiones en los 5 módulos preexistentes (listings/events/social/brochure/map).

**Pendiente / siguiente:**

- Desactivar `alwaysShowWelcome` del Map antes de Fase 4 (prop temporal para QA del welcome popup).
- `client.nombre = "Arizona"` queda como nombre del cliente default (confirmado por Rubén — el sistema siempre usa `client.nombre` para el template `{client}` del Map).
- Fase 4 — primer cliente real con branding + Lighthouse + handoff.
- O Itinerary Builder (ya hay buckets `kiosk_favorites` + `kiosk_event_favorites`).
- Screenshots de verificación viven en `map-v*.png` / `ads-*.png` en la raíz del repo (NO .planning/verifications/); si se quieren archivar mover.

**Decisiones:**

- **Agregador con jitter determinístico por source+slug**: el seed data del config comparte coords entre los 3 módulos de listings (cada punto geográfico tiene 1 restaurant + 1 thing-to-do + 1 stay en el mismo lat/lng). Sin jitter los pins se apilan y el mapa se ve vacío. Amp 0.0025° + bias direccional por categoría (NW/NE/S) da dispersión visible sin "saltar" a otra colonia.
- **Selected pin conserva color e icono de su categoría** (×1.28 base pin) en lugar de ser genérico coral con flecha — usuario decidió que sea reconocible por categoría también en estado seleccionado.
- **Hero con `objectFit: fill`** en vez de `cover`: el ratio del asset (1098×638) es casi 1080×620 (1.72 vs 1.74). Con `fill` estira ~2% de distorsión imperceptible pero garantiza 100% cobertura sin cropping.
- **Ads como sibling del módulo dentro del KioskCanvas**, no como Provider global. Cada page server carga `ads = getAdsFromConfig(config)` y pasa el array. Zero Context, zero prop drilling de módulos existentes (los módulos no saben que existen ads).
- **Auto-detect del theme de X con canvas sampling** en lugar de forzar al cliente a declarar light/dark. El mismo origin-asset route handler evita CORS. `ad.theme` del config sigue siendo override manual si el detector falla.
- **Popup bloquea, hero + bottom coexisten**: el popup tiene z-60 y cubre todo el canvas. Hero + bottom son siblings en la misma pantalla cuando el popup no aplica.
- **Commit único para las 2 fases** (`8015777`): precedente `2b7d557` agrupaba 3.4-3.6. Los archivos compartidos (config.ts, `[module]/page.tsx`) tienen cambios en ambas fases que no se pueden separar sin edit-por-hunk interactivo.

**Fase:** 3.7 Map + 3.8 Ads cerradas. Lista para Fase 4.

---

### Sesión 2026-04-22 — Sweepstakes removal + Wayfinding tile + Fase 3.9 Survey overlay (V1→V8) + Fase 3.10 Passes module

**Hecho:**

- **Cleanup home grid**: removido tile Sweepstakes del config + asset; Wayfinding consolidado como tile del grid (no banner full-width). Resultado: 16 tiles en grid 2×8 perfecto, sin huecos.
- **Fase 3.9 Survey overlay** completa con 8 iteraciones de pulido:
  - V1: implementación inicial (5 question types: NPS · rating · single · multi · text + contact step opcional · thank-you con auto-close · confirm-exit · CustomEvent dispatch).
  - V2 (cinematic): rediseño con skills Tier 1 cargados — backdrop blur 6px + card 960×1440 con gradient radial + glow + shadow 2xl + stagger entrance CSS + halo expand en thank-you check + question como H1 display 64px.
  - V3-V6: ajustes de feedback iterativos — card 768×1152→768×806, dots al footer entre BACK/NEXT, "We value your feedback" eliminado, título arriba, NPS/rating/pills color azul oscuro (color-mix primary 45%+black 55%) en lugar de olive, subtítulos +20px medium, keyboard del text question movido fuera del card al bottom del canvas.
  - V7: subtítulo de interests sin em dash, 4 opciones en vez de 5, thank-you check stroke blanco + bar azul oscuro.
  - V8: thank-you círculo blanco + check verde lime `#32CD32` con nuevo token `--survey-success` añadido a los 3 tokens.css.
  - Arquitectura final: SurveyHost a nivel KioskCanvas via `CustomEvent('kiosk:survey-open')` para z-index sobre AdsSlot.
- **Fase 3.10 Passes module** brainstormeada + spec + plan atómico + ejecutada en una sesión:
  - Brainstorming → spec en `docs/superpowers/specs/2026-04-22-passes-module-design.md` → plan atómico XML en `.planning/3-10-1-PLAN.md` (15 tasks en 4 olas).
  - Ola 1: tipos `HomePassesModule`/`PassItem`/`PassActivity` + seed 3 passes×4 activities + 13 strings `passes_*` + `lib/passes.ts` (validación + dispatch v1) + `pnpm add qrcode.react@4.2`.
  - Ola 2: `PassCard` 898×400 cover+overlay+title + `PassesGrid` vertical + `PassesToolbar` con search + `PassesModule` (compose) + rama `passes` en `[module]/page.tsx`.
  - Olas 3+4 fundidos en un commit: `ActivityRow` + `PassDetail` overlay con CTA GET YOURS + `PassDetailWithShare` wrapper + `PassShareModal` (reusa SendModalChrome + NumericKeypad + TermsCheckbox + CancelSendButtons + QRCodeSVG con logo) + `PassSentConfirmation` (check lime) + `PassShareHost` orquestador via `CustomEvent('kiosk:pass-share-open')` + rama `passes` en `[slug]/page.tsx`.
- 13 commits totales en la sesión (cleanup + 8× survey iteraciones + 4× passes implementación + spec/plan).

**Verificado:**

- `pnpm check` (typecheck + lint + format) limpio en cada checkpoint del survey y al cierre del passes.
- Survey verificado visualmente con Playwright MCP en cada iteración V1→V8 (screenshots en `.planning/verifications/3-9-survey-*.png`).
- Passes: code-complete pero **sin verificación visual con Playwright** (saltada por context limit a 84%). Pendiente para próxima sesión.

**Pendiente / siguiente:**

- **Verificación visual Passes** con Playwright MCP (6 screenshots: listing · detail · share · sent · search · branding demo-cliente-a).
- **`.planning/3-10-SUMMARY.md`** escribir con cierre formal de fase 3.10.
- **Auditor white-label** sobre `src/components/passes/` — el QR usa `#0a1e3a` y `#ffffff` fijos, share-modal hereda grises del send-modal-chrome ya existentes; documentar excepciones si reporta hallazgos.
- Siguiente módulo del home (Tickets, Guestbook, Deals, Photo Booth, Trails, Itinerary Builder) o Fase 4 (primer cliente real con branding + Lighthouse + handoff).

**Decisiones:**

- **Color-mix con black 55%** (CSS color-mix in oklch) usado consistentemente para "azul oscuro" del primary (NPS selected, rating filled, pills selected, progress bar del thank-you). Evita añadir token `--primary-deep` y respeta white-label.
- **Token `--survey-success: 120 61% 50%`** (lime `#32CD32`) añadido a los 3 tokens.css. Reusado en `PassSentConfirmation` para el check verde — consistencia entre módulos.
- **CustomEvent para orquestación cross-component** en Survey y Passes: `kiosk:survey-open` y `kiosk:pass-share-open` permiten que el host del overlay viva a nivel KioskCanvas (sibling de AdsSlot) sin pasar funciones desde Server Components al cliente.
- **No reuso de `ListingDetail` para Passes**: estructura distinta (CTA sticky en hero, sin map/directions, lista de activities en vez de description). Componente nuevo `PassDetail` específico — más mantenible.
- **QR con `qrcode.react@4.2`** (named export `QRCodeSVG`, no default `QRCode` como decía el plan inicial — ajuste durante ejecución). Level H + logo `imageSettings.src='/assets/logo.svg'` con `excavate: true`.
- **Phone input del Passes con tap-to-backspace** (el NumericKeypad no emite BACKSPACE). Affordance típica de kiosko táctil.
- **PassShareModal y PassSentConfirmation usan colores fijos** del chrome del send-modal-chrome (`#9a9a9a`, `#d0d0d0`) — consistente con la excepción ya aceptada en send-to-phone-modal.

**Fase:** 3.9 Survey + 3.10 Passes cerradas (Passes con QA visual pendiente).

---

### Sesión 2026-04-22 — Passes QA cierre + Fase 3.11 Tickets completa (4 olas)

**Hecho:**

- **Passes Fase 3.10 QA/fixes/commit** (`e16365d`): toolbar idéntica a Things to Do (`#004f8b` + font-sans 36px + search 56×56 filled + divider), PassCard banner 80% width centrado, GET YOURS h76/paddingX56/fs22, 3 passes más (Adventure/Wellness/Family → 6 total con 42 activities), 48/48 URLs verificadas HTTP 200 (7 reemplazos), PassShareModal rediseñado con chrome propio.
- **Fase 3.11 Tickets completa** en 4 olas:
  - **Ola 1** (`741687e`): tipos + refactor QR a `src/components/shared/` + 10 events ticketables distribuidos + textos + tile + modules.tickets.
  - **Ola 2** (`4826f73`): `src/lib/tickets.ts` + `TicketCard` con badge pill precio + `TicketsList` + `TicketsFilterOverlay` + `TicketsModule` + ruta listing.
  - **Ola 3** (`ba6577a`): `SecondaryCta.onClick` opcional + `TicketDetailWithBuy` + rama `tickets` en `[slug]/page.tsx` + Events con `.ticket` reusa el mismo QR modal.
  - **Ola 4** (TBD commit cierre): 5 screenshots Playwright + auditor white-label + SUMMARY + STATE.

**Verificado:**

- `pnpm check` (typecheck + lint + format) limpio tras cada ola.
- Playwright MCP smoke end-to-end: `/home/tickets` listing, `/home/tickets/jazz-in-the-park` detail con BUY TICKET, QR modal con precio `$20–35`, sent confirmation `Link sent!`, `/home/events/jazz-in-the-park` reutiliza el mismo flow. Passes regresión validada: QR modal idéntico al pre-refactor.
- Auditor white-label sobre `src/components/tickets/` + `src/components/shared/qr-*.tsx` + ramas modificadas: 8 strings literales (FILTERS, Features/Category/Venue/Price, Free, CLEAR ALL, APPLY, aria-labels) — TODOS heredados de Events/Passes pre-existentes. Documentados como deuda compartida en STATE TODO i18n para pasada futura.
- Fetch HEAD sobre 11 URLs nuevas (hero tickets + 10 covers): 0 rotas.

**Pendiente / siguiente:**

- Siguiente módulo del home (Guestbook, Deals, Photo Booth, Trails, Itinerary Builder) o Fase 4 (primer cliente real).
- Tokenización estricta de strings del filter-overlay (3 módulos afectados) + aria "Cerrar" del QR modal + "GET TICKETS" legacy en rama events — deuda documentada en sección TODO i18n.

**Decisiones:**

- **Tickets ⊂ Events filtered** — `modules.tickets` sin `events[]` propio; el pool se lee de `modules.events.events[]` y filtra por `ticket != null`.
- **Extract QR flow a `shared/`** — `QrPurchaseModal` + `QrPurchaseHost` + `SentConfirmation` reutilizados por Passes y Tickets. Cada consumidor mapea sus propias keys (`passes_share_*` / `tickets_share_*`) al shape genérico `qr_*`.
- **`PassQrHost` wrapper client** — necesario porque el `onSent` callback (telemetría `buildShareResult`/`dispatchShareResult`) no cruza Server→Client en Next 15. Tickets no necesita wrapper análogo porque no ejecuta telemetría en v1.
- **Events con `.ticket` también usa QR popup** — consistencia UX. `ticketsUrl` legacy queda solo si no hay `.ticket`.
- **Favoritos bucket compartido `kiosk_event_favorites`** — un event con ticket = mismo estado de favorito en ambos módulos.
- **Catálogo del filter-overlay derivado del pool visible** — evita categorías/venues sin tickets activos.
- **Badge de precio pill blanco sobre cover** (no banda `priceBand`) — `priceDisplay` string flexible (`$25`, `$15–30`, `From $10`, `$150`). `priceBand` se mantiene para el filtro de price.
- **`ListingsToolbar` reusada para Tickets** (no archivo nuevo) — el chrome es idéntico a Events.

**Fase:** 3.10 Passes cerrada con QA + 3.11 Tickets completa.

---

### Sesión 2026-04-23 — Guestbook pulidos visuales (14 commits post-inicial)

**Hecho:**

- Validación del form relajada temporalmente a "solo zip" para QA (`guestbook-form-screen.tsx` con TODO). Restaurar Name+Email+Zip+Privacy al cierre de QA.
- Pins oficiales del XD (`Pin-1..5.png`) copiados a `clients/default/assets/guestbook/pins/`, config actualizado. Globe canvas recibe `overlayPins` prop con sus coords y las renderea como `mapboxgl.Marker` que giran con el planeta.
- Globe con **rotación continua** tipo Framer: `setInterval` vía `moveend` + `easeTo(lng -= 360/60s)`. 60s por vuelta. Se apaga automáticamente al submit para no competir con `flyTo`.
- Estilo del globe cambiado a `mapbox://styles/mapbox/standard` con `setConfigProperty('basemap','showPlaceLabels',false)` (+ road/POI/transit) para ocultar etiquetas. Fog sin galaxia: `space-color: rgb(248,248,248)` + `star-intensity: 0`.
- Layout **media-luna**: globo con `top: 1220px, height: 1600px, left: -200, right: -200` en phase start — solo asoma la parte superior del planeta. Zoom inicial 1.6→3.0, center `(lat:15, lng:-90)` para ver USA/Mexico/Central America de frente.
- `FloatingHomeButton` añadido a Start y Form screens.
- Subtítulo de Start: 22px→28px, lineHeight 32→40, maxWidth 820→900.
- 16 coords decorativas globales (`GLOBE_DECORATIVE_COORDS`) para los pins que giran con el globo: NY, LA, Miami, CDMX, Lima, Rio, París, Roma, Moscú, El Cairo, Nairobi, Johannesburg, New Delhi, Tokyo, Singapur, Sydney. Separadas ≥1500 km. Reemplaza los seedPins Miami-only durante phase start/form.
- **Pseudo-3D**: `transform: perspective(520px) rotateX(12deg); transform-origin: 50% 100%` en cada pin + sombra elíptica proyectada (radial-gradient con `rotateX(75deg)`) para simular contacto con la superficie. Final: rotateX 12° (menos aplastado) + height 132px del img.
- **Smooth fade al horizonte**: `occludedOpacity: 0` en Marker options + `transition: opacity 0.6s ease-out` en el element → al cruzar el terminator los pins se desvanecen gradualmente.

**Verificado:**

- `pnpm typecheck` limpio tras cada commit.
- Browser manual: globe standard sin labels girando, 16 pins distribuidos visibles al rotar, pseudo-3D con sombra, fade smooth al desaparecer.

**Pendiente / siguiente:**

- Restaurar validación completa del form (Name+Email+Zip+Privacy) tras QA.
- Hero ballerinas aún con URL Unsplash — reemplazar con asset oficial.
- Testing end-to-end del flujo completo (bloqueado por 40+ taps QWERTY).
- **Pins 3D reales** (GLB models o Three.js custom layer) pospuestos. Opción 2 (GLB) requiere assets de un diseñador 3D (~2h); opción 3 (Three.js) requiere +500KB de bundle y ~3-4h. El pseudo-3D actual se consideró suficiente.
- Auditor white-label sobre `src/components/guestbook/`.
- Backend real en Fase 5+.

**Decisiones:**

- **Pseudo-3D vs real 3D**: descartadas opciones GLB y Three.js por costo. El perspective+rotateX+ground-shadow logra el look deseado sin deps ni assets extra.
- **Pins decorativos distribuidos** (coords globales) en vez de seedPins literales para phase start/form. Razón: los 15 seedPins están todos en Miami (lat 25.76, lng -80.19) — al girar el globo solo se verían pins en un cluster chico. Los seedPins reales siguen usándose en phase=map filtrados por proximidad al zip del user.
- **`occludedOpacity: 0`** en lugar del default 0.2. Con `transition: opacity` en el element el fade del Marker se ve smooth y el pin "desaparece" limpio detrás del globo en lugar de mostrarse fantasma detrás de la superficie.
- **60s/vuelta** (vs 120s inicial) — Rubén pidió "un poquito más rápido".
- **Aspect ratio natural** con `height: fixed + width: auto` en todos los pins (globe, rail, map markers) — antes con w×h fijos los PNGs se comprimían.

**Fase:** 3.14 Guestbook cerrada con pulido visual aprobado.

---

### Sesión 2026-04-23 — Fase 3.14 Guestbook module (5 olas en un pase)

**Hecho:**

- Brainstorming aprobado en plan mode con 4 preguntas críticas: persistencia (seed + sessionStorage v1, backend v2), geocoding (Mapbox API real con fallback), animación (projection globe + flyTo), drag&drop (pointer events + unproject).
- Spec en `docs/superpowers/specs/2026-04-23-guestbook-module-design.md`. Plan XML en `.planning/3-14-1-PLAN.md`.
- **Ola 1 (data):** Tipos `Guestbook*` en config.ts + union. `guestbook-geo.ts` (Mapbox Geocoding v5 con timeout 5s + null fallback). `guestbook-bbox.ts` (filter by proximity usando bbox lat/lng). `guestbook-store.ts` (sessionStorage bucket `kiosk_guestbook_user_pins`). 22 textos + 5 pinCatalog + 20 countries + 15 seedPins con avatars Unsplash + comentarios mock. 5 SVGs inline para pins (star-blue, avatar-man, avatar-woman, usa-flag, x-olive).
- **Ola 2 (Start + Form):** `GuestbookModule` con máquina de estados `start|form|transition|map`. `GuestbookStartScreen` (hero + CTA + globe crop). `GuestbookFormScreen` con fields grid 2-row + QWERTY (OnScreenKeyboard reusado) + NumericKeypad para zip + CountryDropdown overlay. Validación Name+Email+Zip+Privacy. Rama `case 'guestbook'` en [module]/page.tsx + guard notFound en [slug]/page.tsx.
- **Ola 3 (Globe canvas):** `GuestbookGlobeCanvas` forwardRef con imperative `flyToZip(coords)`. Un solo MapboxMap que persiste entre phases con `projection: 'globe'` + satellite-streets-v12. Al completar flyTo: switch a streets-v12 + atmosphere setFog con star-intensity 0.6.
- **Ola 4 (Map + drag&drop):** `GuestbookMapScreen` renderea seedPins como `mapboxgl.Marker` DOM (avatar circular + stem azul). `GuestbookPinRail` con pointer events capture + clone visual fijo mientras drag. `onPointerUp` → `map.unproject()` → coord. Comment modal con QWERTY. FINISH olive button tras confirm.
- **Ola 5 (QA + docs):** Playwright MCP screenshots `3-14-guestbook-start-v3.png` + `3-14-guestbook-form.png` con globo projection globe visible (atmosphere + star field). SUMMARY + COVERAGE + spec + STATE + ROADMAP. `pnpm typecheck` + `pnpm format:check` limpios.

**Verificado:**

- Start screen: hero ballerinas + título + CTA + globo Mapbox con projection globe visible abajo (atmosphere glow, star field).
- Form screen: fields + checkboxes + QWERTY + globo entre form y teclado.
- Globo renderea correctamente con `projection: 'globe'` y style `satellite-streets-v12`.
- Fallback placeholder cuando token no disponible ("Globe unavailable").
- `pnpm typecheck` limpio, `pnpm format:check` limpio.
- Flujo end-to-end (transition + map + drag + modal) testeable manualmente — no se automatizó porque requiere 40+ taps QWERTY.

**Pendiente / siguiente:**

- **Assets custom del XD**: los 5 pin SVGs son placeholders simples. Reemplazar con assets oficiales si Rubén los entrega como PNGs/SVGs separados.
- **Hero ballerinas**: URL Unsplash. Reemplazar con asset del XD.
- **Testing end-to-end** con Playwright MCP del flujo completo (bloqueado por 40+ taps QWERTY).
- **Auditor white-label** sobre `src/components/guestbook/` (expected: fallbacks `??` defensivos, colores del design system).
- Siguiente módulo (Photo Booth, Itinerary Builder) o Fase 4.

**Decisiones:**

- **Un solo MapboxMap que persiste** entre phases (vs montar/desmontar). Razón: evita reinicialización de WebGL context y mantiene state de globe. El canvas está en el component padre con `position: absolute` cambiando coords según phase.
- **Projection globe + satellite inicial → streets-v12 al llegar** (no 2 mapas separados). Razón: `setStyle()` preserva markers si no se remueven. Smooth transition visual.
- **Pointer events (no HTML5 drag&drop)**. Razón: HTML5 drag API no funciona bien en kiosks táctiles + no tiene API para obtener clientX/Y durante drop. Pointer events con `setPointerCapture` es más fiable.
- **Validación en el form screen** (no en el módulo padre). Razón: encapsular lógica cerca del UI; el `doSubmit` del Form invoca `onSubmit` del padre.
- **`ENTER` en comment modal = newline** (no submit). Razón: el user puede dejar mensajes multi-línea.
- **`useRef` + `forwardRef` + `useImperativeHandle`** para el globe. Razón: el parent necesita llamar `flyToZip` imperativamente al submit; con un callback regular se perdería al re-render.
- **Seed + sessionStorage v1** en vez de backend ahora. Razón: kiosk offline-friendly, sin depender de API externa para un feature visual. Backend diferido a Fase 5+ cuando haya infraestructura.

**Fase:** 3.14 Guestbook cerrada (con testing manual pendiente del flujo completo por Rubén).

---

### Sesión 2026-04-23 — Fase 3.13 Trails module (4 olas en un pase)

**Hecho:**

- Brainstorming aprobado en plan mode: `kind: 'trails'` discriminado + considerations rich (6 campos) + tabs horizontales Default/Trail + GeoJSON embed + card reusa ListingCard + filter 3 secciones + bucket favoritos propio + 15 trails seed.
- Spec formal en `docs/superpowers/specs/2026-04-23-trails-module-design.md`. Plan XML en `.planning/3-13-1-PLAN.md`.
- **Ola 1 (config + tipos):** `Trail`, `TrailConsiderations`, `TrailDifficulty`, `TrailType`, `HomeTrailsModule` añadidos a `src/lib/config.ts` + union. `src/lib/trails.ts` con `TrailFilterState`, `EMPTY_TRAILS_FILTER`, `applyTrailsFilter` (AND features + OR difficulty + OR type), `searchTrails`, `trailToListing` adapter. `useTrailFavorites` exportado desde `favorites.ts` (bucket `kiosk_trail_favorites`). 15 trails seed (Arizona classics: Camelback, Piestewa, South Mountain, Tom's Thumb, Pinnacle Peak, Hidden Valley, Papago Butte, McDowell Sonoran, Lost Dog Wash, Wind Cave, Gateway Loop, Black Mountain, Waterfall, Sunrise, Dreamy Draw) con GeoJSON LineString embed (~10-15 puntos) + considerations completas. 21 textos `trails_*` en los 3 clientes (default EN, \_template EN, demo-cliente-a ES).
- **Ola 2 (UI listing):** `TrailsModule` (compose) + `TrailsFilterOverlay` (3 secciones Features AND + Difficulty OR + Trail Type OR) en `src/components/trails/`. Reusa `ListingsGrid` + `ListingCard` vía `trailToListing`. Rama `case 'trails'` en `[module]/page.tsx`.
- **Ola 3 (detail):** Extendido `ListingDetail` con props `mapSlot?: ReactNode` y `cardHeight?: number`, y aceptar `favoritesKind='trail'` en el SharingRow (llamando `useTrailFavorites`). Nuevos en `src/components/trails/`: `TrailMapTabs` (tabs horizontales + un solo MapboxMap con source/layer GeoJSON controlado por visibility + fit bounds al activar trail), `ConsiderationsPanel` (grid 2-col de 6 rows con iconos SVG — solo rendera campos definidos), `TrailDetail` wrapper que inyecta mapSlot + extraDetails + cardHeight=1780. Rama `kind === 'trails'` en `[slug]/page.tsx`.
- **Ola 4 (QA + cierre):** `pnpm check` limpio. 4 Playwright screenshots: listing, detail default-tab, detail trail-tab (polyline + fit bounds), detail full con 6 considerations.

**Verificado:**

- `pnpm check` (typecheck + lint + format:check) limpio en cada checkpoint.
- Playwright MCP: `/home/trails` con 15 cards ordenadas por popularity. Detail de Camelback muestra tabs; Trail Map activo dibuja la polyline azul #1796d6 con fit bounds. 6 considerations renderean correctamente (Distance 2.4 mi, Difficulty Hard, Duration 2-3 hours, Elevation 1,280 ft, Trail Type Out & Back, Dog Friendly No).

**Pendiente / siguiente:**

- **Map aggregator integration** — añadir source `trails` al `src/lib/map-aggregator.ts` con chip propio (propuesta color olive o verde bosque). El Map module actualmente no muestra trails.
- **GET DIRECTIONS del TrailMapTabs** — v1 abre `maps.google.com` externo. v2 integrar `DirectionsModal` con turn-by-turn (requiere exponer callback desde `ListingDetail`).
- Verificación visual con `KIOSK_CLIENT=demo-cliente-a` (textos ES listos).
- Siguiente módulo del home (Guestbook, Photo Booth, Itinerary Builder) o Fase 4.

**Decisiones:**

- **`kind: 'trails'` discriminado** en vez de `HomeModule` genérico. Razón: shape `Trail` con considerations + trailMap embebido, no contamina `Listing`. Costo: rama propia en el switch del routing.
- **Reuso masivo via adapter `trailToListing`** en vez de crear `TrailCard`/`TrailsGrid` propios. Evita duplicar ~500 líneas de card + grid + favorites. Pierde especificidad menor (priceRange neutro que no afecta).
- **`ListingDetail` extendido con `mapSlot?` + `cardHeight?`** en vez de componente nuevo `TrailDetail` independiente. Un `TrailDetail` wrapper de 70 líneas vs duplicar 900 líneas del shell. Props estrictamente aditivas, retrocompat.
- **Tabs horizontales encima del mapa** (no segmented pill, no toggle button). Más convencional + espacio suficiente en el slot 384px.
- **GeoJSON embed en config** (no URL externa). Sin fetch runtime, sin cache invalidation, payload razonable (~2-3 KB/trail).
- **Sort reusa `SORT_OPTIONS`** de listings. Distance funciona con clientCoords. Price se muestra pero no aplica (priceRange=1 neutro en el adapter — el cliente no ve ordenamiento útil por precio, se puede ocultar en v2 si molesta).
- **3 buckets de favoritos separados** (`listing`, `event`, `trail`). Trade-off: 3 hooks en el SharingRow llamados siempre vs complejidad de un bucket único polimórfico. useSyncExternalStore es barato; hooks separados son más claros.

**Fase:** 3.13 Trails cerrada (con map aggregator integration pendiente).

---

### Sesión 2026-04-23 — Fase 3.12 Deals module (4 olas en un pase)

**Hecho:**

- Brainstorming aprobado en plan mode: flujo `listing → tap card → modal redeem (QR + 2 botones SEND) → SendToPhone/Email modals → SendConfirmationPopup`. Sin detail fullscreen, sin favoritos, con AdsSlot. 20 deals seed.
- Spec formal en `docs/superpowers/specs/2026-04-23-deals-module-design.md`. Plan XML en `.planning/3-12-1-PLAN.md`.
- **Ola 1 (config + tipos):** `Deal` + `HomeDealsModule` añadidos a `HomeModuleVariant` en `src/lib/config.ts`. `src/lib/deals.ts` con `DEAL_SORT_OPTIONS`, `filterActiveDeals`, `applyDealsFilter`, `sortDeals`, `searchDeals`, `formatDealExpiry`, `todayISO`. 20 deals seed en `clients/default/config.json` (Fashion/Food/Entertainment/Gym/Tech/Family/Beauty/Retail). 15 textos `deals_*` en los 3 clients (default en inglés, demo-cliente-a traducido al español).
- **Ola 2 (UI listing):** Componentes en `src/components/deals/` — `DealsModule` compose, `DealsGrid` 3-col, `DealCard` (cover + title + shortDescription + expiry + originalPrice tachado condicional), `DealsFilterOverlay` (1 sección Features AND). Reusa `ListingsToolbar`, `SearchOverlay`, `SortOverlay`, `FloatingHomeButton`, `HomeHeader`, `AdsSlot`. Rama `case 'deals'` en `[module]/page.tsx`. Guard `notFound()` en `[slug]/page.tsx` (deals no tiene detail).
- **Ola 3 (modal redeem):** `DealRedeemModal` verbatim SVG — cover con title+expiry overlay, headline, subtitle, longDescription, promo code pill opcional, QR 240×240 con logo normalizado (`resolveAssetPath` helper), 2 botones SEND side-by-side, CANCEL link. `DealRedeemHost` máquina de estados `closed | redeem | send-phone | send-email | sent` escuchando `CustomEvent('kiosk:deal-redeem-open')`. Delega a `SendToPhoneModal` / `SendToEmailModal` / `SendConfirmationPopup` de listings.
- **Ola 4 (QA + cierre):** Playwright MCP screenshots — `3-12-ola2-deals-listing.png`, `3-12-ola2-filter-overlay.png`, `3-12-ola3-redeem-modal.png`, `3-12-ola3-send-phone.png`. Auditor white-label limpio (solo fallbacks `??`). Spec + SUMMARY + COVERAGE escritos.
- `DealsSearchAdapter` wrapper del `SearchOverlay`: intercepta el click del Link (que iría a `/home/deals/{slug}` inexistente) y dispara CustomEvent en su lugar.

**Verificado:**

- `pnpm check` (typecheck + lint + format) limpio.
- Playwright MCP: `/home/deals` con 20 cards en grid 3-col sorted ascending por expiresAt (sort default 'expiring-soon').
- Tap card → modal redeem con data correcta (ejemplo: Chipotle Free Guac con headline, promo code `FREEGUAC`, QR escaneable).
- SEND TO MY PHONE → `SendToPhoneModal` con `NumericKeypad` + input USA (+1).
- Filter overlay: pills features `Fashion / Food / Entertainment / Gym / Tech / Family / Beauty / Retail` + CLEAR ALL olive + APPLY blue.
- Auditor white-label: 0 colores hex nuevos (todos heredados del chrome). Strings literales son fallbacks `??` defensivos (mismo patrón que Tickets/Passes).

**Pendiente / siguiente:**

- Verificación visual con `KIOSK_CLIENT=demo-cliente-a` (reiniciar dev server con env var). Los textos en español están listos.
- Cover Sephora puede ser 404 de Unsplash — el fallback gradient azul se activa, pero idealmente reemplazar URL.
- Siguiente módulo (Guestbook, Photo Booth, Trails, Itinerary Builder) o Fase 4.

**Decisiones:**

- **Modal redeem custom** (no reusa `QrPurchaseModal`) — el shape es distinto: QR + 2 botones SEND simultáneos + cover con overlay del title + sin telemetría (v1). Componente dedicado en `src/components/deals/` mantiene separación de concerns.
- **Sin detail fullscreen** — `[slug]/page.tsx` responde 404 para `kind === 'deals'`. La interacción es listing → modal directo, como confirmó Rubén en el brainstorming.
- **Auto-filter de expirados primero** en el pipeline (`filterActiveDeals`). Los deals expirados no llegan al filter/sort/search. El operador del cliente mantiene el config al día.
- **Sort custom** con 4 opciones propias (`expiring-soon` default, `recent`, `a-z`, `best-discount`). No reusa `SORT_OPTIONS` porque los criterios son distintos (no hay Distance ni Most Popular útil para cupones).
- **Sin bucket de favoritos** — los deals caducan; `useDealFavorites` no aplica. Si el cliente lo pide en v2 se añade con `createFavoritesStore`.
- **CustomEvent `kiosk:deal-redeem-open`** siguiendo el patrón de Survey/Passes/Tickets. Payload `{ dealSlug }` resuelto contra `deals[]` en el host.
- **`DealsSearchAdapter`** en vez de modificar `SearchOverlay`. El overlay del Home usa `Link` para navegar; en Deals capturamos el click a nivel document antes de que navegue. Evita un prop drilling cross-módulo del `SearchOverlay`.
- **`resolveAssetPath` helper** normaliza `qrLogo` relativo (`"assets/logo.svg"`) a absoluto (`"/assets/logo.svg"`). Documentado — replicable a `PassShareModal` si vemos 404 en los logs.

**Fase:** 3.12 Deals cerrada.

---

### Sesión 2026-04-22 — Fase 3.11 Tickets iteraciones v2-v9 + pill precio en Events

**Hecho:**

- 8 iteraciones de pulido post-cierre en Tickets + propagación a Events:
  - v2 (`55c8198`): 10 tickets más, badge reubicado al text panel, BUY TICKET full-width, event info block.
  - v3 (`25baa7c`): fix amontonamiento event info, BUY TICKET full-width del card, pill listing grande top-right.
  - v4 (`4ead5d0`): pill de vuelta al text panel top-right + BUY TICKET sobre hero + 3 tickets más (total 23 ticketables).
  - v5 (`c36a7f4`): card height uniforme 1589, BUY TICKET gradient 50% width, pill listing blanco sin shadow, texto azul oscuro.
  - v6 (`a6e71b1`): fecha/hora/teléfono SOBRE el hero con gradient oscuro→transparente, BUY TICKET vuelve al slot secondaryCta alineado con WEBSITE, ActionRow oculta columna meta cuando `hideMetaCol`.
  - v7 (`335b429`): texto hero más grande (30px/24px), gradient más pronunciado (240px), WEBSITE/BUY side-by-side, BUY color olive `#b9bd39`.
  - v8 (`690e4fd`): invertidos — BUY left, WEBSITE right. Phone a 30px bold. Gradient 310px height.
  - v9 (`5d61972`): botones centrados al medio de la sección (top 632 en vez de 665).
- Pill precio en `EventCard` (`bd2ccae`): si `event.ticket` presente, muestra pill blanco con precio azul oscuro top-right del text panel — consistencia entre módulos Events y Tickets.

**Verificado:**

- `pnpm check` limpio en cada iteración.
- Playwright MCP screenshots en `.planning/verifications/3-11-v{2..6}-{listing,detail,qr-modal}.png`.
- Regresión Passes sin cambios (flow QR idéntico al pre-refactor).

**Pendiente / siguiente:**

- Apagar `alwaysShowWelcome={true}` del MapModule antes de Fase 4.
- TODO i18n deuda compartida filter-overlay (8 strings heredados de Events/Passes) — ya documentada.
- Siguiente módulo del home (Guestbook, Deals, Photo Booth, Trails, Itinerary Builder) o Fase 4 (primer cliente real).

**Decisiones:**

- **Texto date/time/phone sobre hero con gradient** — más inmersivo que ActionRow izquierda tradicional. Solo para tickets via `eventMetaOnHero` prop.
- **BUY TICKET color olive** — verde consistente con iconos SEND TO EMAIL/PHONE del send-modal-chrome. Priceinclude integrado en el label: `"BUY TICKET  $20–35"`.
- **ListingDetail ahora acepta `leftOverride`/`topOverride` en SecondaryCtaButton** — permite reposicionar el CTA sin cambiar layout default de Listings/Events. Mantiene retrocompat.
- **`EventCard` detecta `event.ticket`** para mostrar pill — sin cambio de tipo (ticket ya es opcional). Events sin venta siguen igual.

**Fase:** 3.11 Tickets cerrada con pulido visual aprobado por Rubén.

---

### Sesión 2026-04-23 — Guestbook refactor sesión larga (form + map + drag&drop)

**Hecho:**

- **Start screen**: bloque `Sign our Guestbook!` bajado 75px (paddingTop 116→191); fondo `#f8f8f8 → #ffffff` para quitar división visible con el módulo.
- **Form screen**: mismo título+subtítulo del start (ya no "Start your Guestbook!"); globo subido a `top: 800` con +5% zoom; pins decorativos reactivados; 2 gradients (top fade form→globo, bottom fade globo→teclado) pegados al keyboard en CSS y=1521; inputs 58→72, checkbox 24→30, NEXT 260×68 → 320×76; **`GuestbookFloatingBackButton`** nuevo usando el path SVG oficial de `clients/default/assets/button-back.svg` (no el chevron custom que había hecho).
- **HomeHeader** nueva prop `gradientExtra?: number` que extiende el gradient N px por debajo del box (sin empujar layout); `overflow-hidden` solo si hay heroImage. Form/map headers pasan `gradientExtra={80}`.
- **Map screen rebuild**: pin rail movido de bottom a `top: 210` (debajo del gradient extra del hero); pin rail +grande (paddings 20/28→44/56, title 22→32, subtitle 15→21, pin height 90→120, columnGap 24→56); shadow removido. Globe container en map phase `top: 550, bottom: 0`. `GuestbookFloatingBackButton` sobre el mapa. Header con logo+clock+weather arriba. FINISH button (420×92 olive rounded + shadow) movido al `finishSlot` del rail (debajo de los pins) — mapa ocupa full bottom.
- **Pin assets**: 5 nuevos `pin-N-circle.png` copiados a `clients/default/assets/guestbook/pins/`. `GuestbookPinOption` gana campo opcional `circleImage`. pinCatalog del config cada uno con su `circleImage`.
- **Seed pins**: usan el pin completo del catálogo (ciclado por índice), aspect ratio natural (113×183 → `height:120, width:auto`). Click seed → modal recibe `circleImage` matching (Pin-N-Circle.png) centrado con `object-fit: contain` sin border duplicado. 6 seed pins redistribuidos por Miami.
- **Placed pin**: `height: 160, width: auto` + glow olive pulsante animado (`@keyframes gbPulse`) + drop-shadow fuerte → se distingue claramente de los seed.
- **Modal comment**: `items-start + paddingTop 360 → items-center` (vertical centrado). Overlay oscurecido `0.35 → 0.55`.
- **Drag-and-drop — fix definitivo del "starting point diferente"**: root cause era que `position: fixed` + ancestro con `transform: scale()` = containing block es el kiosk (no viewport). Clone se posicionaba en coords viewport dentro del sistema CSS del kiosk → offset visual grande. Fix: convertir cursor viewport → kiosk CSS coords (`(drag.x - kioskRect.left) / scale`), usar width/height en CSS (el kiosk los escala). **Verificado con test automatizado: tip del clone offset (0, 0) respecto al cursor.**
- **handleDrop**: usa `canvas.offsetWidth/getBoundingClientRect` para calcular scale y convertir viewport → canvas-internal antes de `unproject` → pin se coloca exactamente donde el usuario soltó.
- **`seedMarkers` useEffect**: `cancelled` flag contra race de React strict mode + async import (evita markers duplicados).
- **Exit confirm modal** cuando tapa back en map phase: card blanca centrada con overlay oscuro, botones Cancel/Exit, redirect a `/home` al confirmar.
- **Thank You popup tras FINISH**: card con check animado olive en círculo, gradient top + mensaje agradecimiento + auto-redirect a `/home` en 4s.
- **Module wrapper bg**: `#f8f8f8 → #ffffff` uniforme en start/form/map.

**Verificado:**

- `pnpm typecheck` limpio en cada cambio (≥15 typechecks durante la sesión).
- Playwright MCP: drag synthetic → modal abre → CONFIRM → pin queda en mapa con glow + FINISH aparece. DOM query confirma `.mapboxgl-marker` con `<img src="pin-1.png">` al placed coord.
- Test final del drag: cursor viewport (500, 900) → clone tip bottom-center (500, 900). Offset 0,0.

**Pendiente / siguiente:**

- Fase 3.15 Itinerary Builder o Fase 4 primer cliente real.
- `alwaysShowWelcome={true}` del MapModule sigue hardcoded (TODO pre-Fase 4).
- TODOs i18n filter-overlay heredados (aplazados a Fase 5).

**Decisiones:**

- **`position: fixed` en kiosk escalado**: siempre convertir viewport→CSS coords antes de posicionar. Patrón replicable para cualquier futuro drag overlay dentro del kiosk.
- **Pin tip = cursor exacto**: sin offsets a la "posición original del pin en el rail". Se siente más natural y evita saltos visuales. El pin se "levanta" desde el finger.
- **Seed pins en catalog style** + **placed pin con glow distinct**: resuelve la ambigüedad "¿cuál es mi pin?" sin duplicar assets.
- **`circleImage` opcional en pinCatalog**: permite que el popup muestre solo el círculo del pin (sin pointer) matching visualmente con el pin del mapa.
- **Gradient `gradientExtra` en HomeHeader**: prop retrocompatible que no afecta a otros usos del header (default 0).

**Fase:** 3.14 Guestbook aprobada por Rubén (refactor completo + drag&drop funcional).

---

### Sesión 2026-04-23 — Fase 3.15 Ask AI module (instalación full white-label desde paquete portable)

**Hecho:**

- Brainstorming aprobado en plan mode (3 preguntas — modelo de integración, alcance del trigger, nivel white-label): A + A + C (overlay flotante global solo en Home, fully white-label con UI idéntica al paquete).
- Plan en `~/.claude/plans/tambien-nos-falta-el-snappy-willow.md`. Spec equivalente en `.planning/3-15-SUMMARY.md`.
- **Ola 1 (config + tipos + tokens + assets + deps):** 2 interfaces nuevas en `config.ts` (`AskAiSuggestedQuestion`, `AskAiConfig`) + campo `features.home.askAi?`. 8 tokens `--ai-*` añadidos a los 3 `tokens.css`. 8 textos `ai_*` (EN para default/_template, ES para demo-cliente-a). Bloque `home.askAi` completo en `default/config.json` (greeting + 8 suggested questions San Diego). Assets `avatar.png` (4.5 MB) + `hero-video.mp4` (52 MB) copiados desde `_packaged/ask-ai-module/public/` a `clients/default/assets/ai/`. Deps instaladas vía pnpm: `zustand@5.0`, `framer-motion@12.38`, `gsap@3.15`, `@gsap/react@2.1`.
- **Ola 2 (componentes core):** `src/lib/ask-ai.ts` (helper `getAskAiConfig` + `resolveAiAssetPath`), `src/stores/ai-store.ts` (zustand con `hydrate` action server-driven), `src/components/ai/{ai-modal,ai-modal-host,ask-ai-trigger,suggested-questions}.tsx`. Modal usa OnScreenKeyboard del kiosk (no el del paquete con drag+voice). Voice movido al botón mic del hero (Web Speech API). Adapter `handleKey` traduce `KeyboardKey` del kiosk a operaciones sobre input string (mismo patrón que SearchOverlay/SendToEmailModal/GuestbookFormScreen).
- **Ola 3 (integración):** `src/app/(kiosk)/home/page.tsx` lee `home.askAi`, monta `<AskAiTrigger />` y `<AiModalHost />` como hermanos de HomeShell/AdsSlot/SurveyHost. Si `enabled === false` no renderiza nada.
- **Ola 4 (QA):** typecheck + lint + format limpios. Auditor white-label encontró un único hardcoded (`#FFFFFF` en input bg) → resuelto con token nuevo `--ai-input-bg`. Playwright verificó: trigger visible bottom-right, modal slide-up, hero Tavus video, mic gradient azul-teal, greeting + 8 chips, typewriter al tap chip (Harbor Grill), input + OnScreenKeyboard subiendo, escritura con tecla `a` → input mostró carácter + apareció Send button.

**Verificado:**

- `pnpm typecheck` limpio en 4 checkpoints.
- `pnpm lint` y `pnpm format:check` limpios en archivos AI (errores residuales son pre-existentes del Guestbook).
- Auditor white-label sin hallazgos en `src/components/ai/` tras añadir token `--ai-input-bg`.
- Playwright MCP: 5 screenshots capturadas en `.planning/verifications/3-15-*.png` (home con trigger, modal abierto, typewriter, keyboard, typing).
- Console error único = `favicon.ico` 404 (pre-existente, no relacionado).

**Pendiente / siguiente:**

- LLM real (Fase 5+): endpoint `/api/ai` con Anthropic Claude usando `clients/{slug}/config.json` como system prompt — reemplaza el typewriter mock de `ai-store.askQuestion`.
- Voice lang dinámico en `ai-modal.tsx:87` (`recognition.lang = 'en-US'` hardcoded).
- Fallback response configurable: mover string de `ai-store.ts:56` a `config.textos.ai_fallback_response`.
- Bloque `home.askAi` para `_template` y `demo-cliente-a` cuando estos clientes tengan `features.home` configurado.
- Photo Booth, Itinerary Builder o Fase 4 (primer cliente real).

**Decisiones:**

- **Overlay flotante global, no tile** (P1=A) — Ask AI es un asistente transversal, no encaja como uno más de los 14 tiles del Home. No tiene URL `/home/ask-ai`.
- **Solo en Home en v1** (P2=A) — el modal queda mounted globally a futuro pero el trigger solo en `home/page.tsx`. Si en v2 se quiere en otras pantallas, basta añadir `<AskAiTrigger />` en esos `[module]/page.tsx`.
- **Fully white-label preservando UI idéntica** (P3=C) — los hex del paquete se convirtieron a HSL y se añadieron como tokens `--ai-*`. UI y transiciones son verbatim del paquete; solo cambia que ahora son customizables por cliente.
- **OnScreenKeyboard del kiosk vs VirtualKeyboard del paquete** — usamos el del kiosk (consistencia con Search, Guestbook, Survey, Tickets). Pierdes drag y voice en el keyboard, pero voice se mueve al mic del hero (igualmente accesible).
- **`askAi` como sibling de `modules`, no como `HomeModuleVariant`** — evita que se cree ruta automática `/home/ask-ai` (no la queremos) y permite que el shape sea libre (no obliga a tener `label`/`heroImage` como un module).
- **Hidratación del store via `useEffect` en `<AiModalHost>`** — el server component pasa `greeting`/`suggestedQuestions` como prop; el host lo inyecta al store en mount. Server-driven, sin fetch client-side, cero hydration mismatch.
- **Mock typewriter `setInterval(15ms)` verbatim del paquete** — preserva el feel original. Se reemplazará por streaming response cuando se conecte a Claude.

**Fase:** 3.15 Ask AI cerrada (UI idéntica al paquete original, fully white-label, voice integrada en mic del hero).

---

### Sesión 2026-04-23 — Fase 3.15 Ask AI iteración visual (10 fixes post-cierre, módulo aprobado por Rubén)

**Hecho:**

- **Trigger swap (8204a0e + 7b8054c + 0202243):** avatar circular original `82×82` reemplazado por **pastilla SVG "Ask anything"** (`Group 6623.svg` con icono mic + texto + sombra embebida). Tamaño iterado: 280×106 → 504×191 (+80%) → 428×162 (-15% final). `AskAiTrigger` extendido con props `width`/`height` (legacy `size` mantiene compat para triggers cuadrados/circulares); `position` en config.json acepta `width`/`height` opcionales. Cuando `isCircular = false` se descarta el `overflow:hidden rounded-full` y el shadow extra (el SVG trae los suyos).
- **Hero video real (416fdd7):** `avatar-tavus.mp4` 17 MB (vs 52 MB original) commiteado directo, sin necesidad de Git LFS. Servido desde `/assets/ai/hero-video.mp4` por el route handler.
- **X icon (975e6f6):** del lucide-react `X` a SVG path nuestro (mismo `d="M6 6l12 12M18 6L6 18"` que `AdCloseButton`), reposicionado de `top-3 left-3` a `top-3 right-3`. Backdrop circular oscuro con blur preservado.
- **Escalado kiosk (a6343f1):** todas las dimensiones del modal multiplicadas ~2.5× para corresponder a 1080×1920. Title 16→44, subtitle 11→26, body/greeting/input 13→30, chip 11→24. Close X 32→80, mic 44→110, ring border 2→5, input height 44→100, send icon 20→44, cursor 14→32, modal radius 24→60, paddings/gaps proporcionales. Box-shadow modal -8/40 → -20/100, accent ring 3→8.
- **Interpolación cliente (1802845):** `textos.ai_subtitle` y `home.askAi.greeting` ahora son templates con `{client_name}` reemplazado por `config.client.nombre` en `home/page.tsx`. Default (Arizona) → "Your personal Arizona guide" + "Hi! I'm your guide to Arizona…". Token `--ai-surface` cambiado de cream `#F9F6F0` a blanco puro `#FFFFFF` en los 3 `tokens.css`. Body del modal con `[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden`.
- **Slide-down (7179d9b):** modal desliza desde el TOP hacia abajo (no bottom→up). Anchor `bottom-0` → `top-0`, animación Framer `y:'100%'` → `y:'-100%'`, border radius `borderTopLeft/Right` → `borderBottomLeft/Right`, box-shadow direction inverso.
- **Triple-fix del gap hero→body (0202243 + 3e4d240 + 2d936db):** 3 culpables apilados:
  1. CSS keyword `transparent` (= `rgba(0,0,0,0)` negro) blendeaba mal a blanco → `hsl(var(--ai-surface) / 0)` (white(0) → white(1) limpio).
  2. `aspectRatio:'16/9'` → `height: 608` explícito (1080 × 9/16 redondeado, sin fracción).
  3. `marginBottom: -10` (overlap más generoso) + `backgroundColor: hsl(var(--ai-surface))` explícito en el hero como respaldo.

**Verificado:**

- `pnpm typecheck` limpio en cada checkpoint (~6 typechecks durante la iteración).
- `pnpm lint` y `pnpm format:check` limpios en archivos AI; auditor white-label sin hallazgos en `src/components/ai/`.
- 13 screenshots Playwright en `.planning/verifications/3-15-*.png` cubriendo: pill smaller, modal-from-top, gap fix v1/v2/v3/v4, modal con Arizona, modal sin gap definitivo.
- DOM measurement post-fix: heroBottom 367.37 / bodyTop 366.37 → overlap real -1px en pantalla escalada (sin gap perceptible).

**Pendiente / siguiente:**

- **LLM real** (Fase 5+) sigue pendiente.
- **Reescribir contenido de las 8 suggested questions con lugares reales de Arizona** — todavía mencionan Harbor Grill, La Jolla, USS Midway, Gaslamp Quarter, etc. (lugares de San Diego). Default cliente (Arizona) muestra contenido geográficamente incoherente; necesita pasada de contenido para Camelback Mountain, Old Town Scottsdale, Phoenix Art Museum, etc.
- **Voice lang dinámico** (`recognition.lang = 'en-US'` hardcoded en `ai-modal.tsx:87`).
- **Bloque `home.askAi`** para `_template` y `demo-cliente-a` cuando estos clientes tengan `features.home` configurado.
- Photo Booth, Itinerary Builder o Fase 4 (primer cliente real).

**Decisiones:**

- **Pastilla SVG vs avatar circular**: la pastilla con texto + icono comunica mejor la affordance ("Ask anything"). Trigger refactorizado para soportar ambos modos (cuadrado/circular vs rectangular) sin breaking change.
- **Slide desde top en vez de bottom**: contraintuitivo (trigger está abajo) pero deja la pastilla visible al abrir el modal — el usuario mantiene contexto de dónde tocó.
- **Templates `{client_name}` en strings**: patrón replicable para cualquier futuro string que necesite el nombre del cliente. La interpolación se hace server-side en `home/page.tsx` (no client-side) para mantener el modelo "config + textos pasan crudos a componentes".
- **Triple-fix del gap**: aprendizaje clave — `transparent` en CSS gradients es **negro** transparente, no white transparente. Hay que usar `hsl(var(--token) / 0)` cuando se quiere fade limpio a un color sólido. Footgun documentado.
- **Hardcodear "San Diego" en seed content** fue un bug de white-label que pasó el primer auditor (porque las strings vivían en config.json no en JSX). El auditor solo detecta strings en JSX, no semánticos. Lección: revisar también el contenido del config para placeholders geográficos cuando el default cliente es de otra región.
- **`marginBottom: -10` y `backgroundColor` explícito en hero** son defensivos contra subpíxel rendering del `transform: scale()` del KioskCanvas — patrón replicable para cualquier modal con hero que tenga gradient-to-bg.

**Fase:** 3.15 Ask AI cerrada y aprobada por Rubén tras iteración visual.

---

### Sesión 2026-04-24 — Fase 3.16 Photo Booth module (5 olas, green-screen ML + editor + share)

**Hecho:**

- **Brainstorming aprobado en plan mode** (4 decisiones clave): green-screen post-captura (no live), share UI mock v1 (backend Fase 5+), stickers posicionables drag&drop en v1, single shot no burst. Plan en `~/.claude/plans/ok-ahara-vamos-a-validated-hedgehog.md`.
- **Ola 1 — Setup (commit `8b3bc60`):** dep `@mediapipe/tasks-vision@0.10.34`, interfaces `PhotoBoothBackground/Frame/Filter/Sticker/TimerConfig/Config` en `config.ts` + `features.home.photoBooth?`. Tokens `--photo-*` en los 3 `tokens.css`. Bloque completo en `default/config.json` (3 bgs seed desde billboard heroes, 5 frames del Desktop, 6 filtros CSS, 6 stickers SVG creados, timer {3/5/10s}, shareUrlTemplate placeholder, social handles). Helper `src/lib/photo-booth.ts`. Asset logo default creado para resolver 404 pre-existente.
- **Ola 2 — Captura pixel-perfect (commit `8b3bc60`):** ruta `/home/photo-booth`, phase machine (`'live' → 'countdown' → 'capturing' → 'editing' → 'sharing'`). Hooks `use-camera` (getUserMedia + fallback mock via `?mock=1` URL param o `NEXT_PUBLIC_KIOSK_PHOTO_MOCK=1` env o auto-fallback si dev falla), `use-countdown`. `CameraFeed` con mock image default. `PermissionGate` para denial. `KioskHeader` compartido (paths verbatim gradient + logo + weather+clock). `StartScreen` verbatim del SVG `0-Photo_Booth-Start`: overlay gradient bottom, home semicircle izq, carrusel 6 satélites + START central con camera icon, TIMER pill con clock icon, EXPERIENCE pill. `CountdownOverlay` verbatim con 2 círculos concéntricos + número Montserrat 140px animado con framer-motion.
- **Ola 3 — Procesamiento (commit `fa0e9c2`):** `photo-booth-segment.ts` con MediaPipe SelfieSegmenter singleton lazy + warmupSegmenter(). Modelo desde `storage.googleapis.com`, WASM desde jsDelivr. `photo-booth-compose.ts` con pipeline canvas 1080×1920: bg → cutout (mask + feather blur 3px, `destination-in`) → frame → stickers → CSS filter (cocido). OffscreenCanvas con fallback. `use-photo-session` con blob-URL lifecycle. EditorScreen stub integrado para validar flujo. ImageBitmap cacheado en `captureRef` para re-compose sin re-captura.
- **Ola 4 — Editor pantalla 4 pixel-perfect (commit `a2999fa`):** `editor-tabs.tsx` verbatim SVG (rect 1080×90 #1796d6, active rect 317×58 #004f8b). `options-carousel.tsx` horizontal scrollable con círculos 212×212 stroke blanco, selected glow accent. `stickers-row.tsx` horizontal scrollable. `sticker-layer.tsx` drag DOM con pointer events + setPointerCapture, compensa scale del KioskCanvas, double-click elimina. `share-sidebar.tsx` con QR icon paths verbatim. `editor-screen.tsx` con layout verbatim (top panel 446px, stickers y=455, tabs y=605, foto x=227 y=747 w=626 h=1114, share x=921 y=903, back button x=0 y=1163). Re-compose on-change de background (otros cambios son CSS preview hasta Share).
- **Ola 5 — Share pantalla 5 + cierre (este commit):** `share-screen.tsx` con: foto blurred backdrop, gradient top, título "SHARE YOUR MEMORIES" (57px Titillium Web Bold), photo card 788×1353 rx=42 blanco con branding logo y foto inside, QR card separate sibling (para renderizar sobre Follow us pill) con `QRCodeSVG` nivel H, "Follow us" pill con X/Facebook/Instagram SVG icons inline (visible solo si config.social tiene el handle), EMAIL y TEXT CTAs verbatim (rect 247×86 rx=13 border 5px), home button semicircle. Sent! confirmation overlay con check icon + auto-return a `/home` tras 4.5s. Composición final con frame + filter + stickers cocidos al entrar a phase `'sharing'`.

**Verificado:**

- `pnpm typecheck` limpio en checkpoints de cada ola.
- Playwright con `?mock=1`: flujo completo Start → TIMER off → EXPERIENCE → capturing spinner → MediaPipe segmenta → editor con tabs + carrusel + stickers → Share button → Share screen con QR + Email/Text visibles. Screenshots en `.planning/verifications/3-16-{start-final,editor-v1,share-final-v2}.png`.
- Auditor white-label sin hallazgos tras corregir: mover strings `12:00 PM`/`50°`/fallback a `textos.photo_booth_*`, tokenizar `#004f8b` como `--photo-home-btn-bg` y `#fff` divider como `--photo-header-fg`. Usar `new Date()` real con locale+timezone del cliente.

**Pendiente / siguiente:**

- **LLM mock real para share** — backend en Fase 5+ (endpoint upload + QR real + SMTP/SMS).
- **OnScreenKeyboard integration en email/text modals** — v1 solo muestra confirmación "Sent!". Implementar input real con `OnScreenKeyboard` + `KeyboardKey` adapter (patrón Ask AI, Guestbook).
- **Assets reales de backgrounds** — cliente debe subir PNGs/JPGs 1080×1920. Los 3 placeholder (billboard heroes + header-bg) son útiles para testing pero no representativos.
- **Emoji stickers reales** — los 6 SVGs creados son básicos. Podría mejorarse con Twemoji rendered o sticker PNG por cliente.
- **Pixel-perfect iteración final del Share** — el SVG original tiene QR en posición específica que puede diferir ligeramente. Rubén debe validar visualmente y aprobar.
- **Itinerary Builder module**, Fase 4 (primer cliente real), o LLM real para Ask AI.
- **Bloque `home.photoBooth` en `_template` y `demo-cliente-a`** (ninguno tiene `features.home` configurado).

**Decisiones:**

- **Green-screen POST-captura** vs live preview (P1=A): 1 inferencia ML por foto, no 30-60 fps. Viable en hardware de kiosk sin GPU. MediaPipe SelfieSegmenter 200-600 ms por imagen.
- **Share UI mock v1** (P2=A): consistente con Ask AI mock typewriter. QR con URL placeholder tokenizada. EMAIL/TEXT → "Sent!" confirmación sin envío real. Fase 5+ conecta backend.
- **Stickers posicionables drag&drop v1** (P3=A): patrón de `guestbook-pin-rail` reutilizado. Scale/rotate diferidos a v1.1.
- **Stickers como capa DOM** (no canvas) hasta Share: evita re-composiciones en cada mousemove. Se cuecen al final cuando user tapea Share.
- **MediaPipe desde CDN** (storage.googleapis + jsDelivr WASM): evita bundlear 8 MB de `.tflite`. Cache-control permite reuso entre sesiones.
- **`captureRef` con ImageBitmap + mask cacheados**: permite cambiar background en el editor sin re-capturar ni re-segmentar.
- **Fallback mock en dev automático**: si `getUserMedia` falla en dev (Playwright, localhost sin cámara), cae a `permission='mock'` sirviendo una imagen estática. En prod falla a `'denied'` → `PermissionGate`.
- **HTTPS requerido en prod** para `getUserMedia` — documentado en `3-16-CONTEXT.md`.
- **QR card como sibling del photo card** (no inside): para renderizar sobre Follow us pill sin ser clippeado por overflow:hidden. Coords verbatim del SVG.
- **SCAN ME** como texto separado del `qr_instruction` largo: pixel-perfect con SVG original ("SCAN ME" literal en el badge).

**Fase:** 3.16 Photo Booth cerrada — módulo funcional con green-screen MediaPipe, editor con tabs + stickers DnD, share mock con QR + social + email/text. Pixel-close al SVG en las 4 pantallas principales (Start, Countdown, Editor, Share).

---

### Sesión 2026-04-24 (tarde) — Fase 3.16 iteraciones de pulido (11 commits incrementales)

**Hecho (en orden cronológico):**

- **Fix Ask AI (commit `074e3dc`):** ads (hero/bottom/popup) z-index a 70-80, por encima del pill Ask AI (45). Inversión de la decisión previa — los ads tienen prioridad visual máxima sobre cualquier overlay del Home. Memoria guardada en `feedback_ads_z_index.md`.
- **Fix headers + frames + permisos (commit `87d92e4`):** KioskHeader del Photo Booth ahora usa `TrueOmniLogo` + `WeatherClock` estándar del kiosk con weather real (fetchWeather server-side, locale + timezone del cliente). Carrusel del Start cambia de backgrounds a frames con thumbnails (`Photo_Booth-Thumbnail_Frame_*.png`) + preview live del frame sobre la cámara. `useCamera` quita auto-fallback a mock en dev — ahora pide permisos reales de Chrome; mock solo si `?mock=1`.
- **None frame + carrusel scrollable (commit `6347102`):** entry "none" como primer frame con thumbnail Photo_Booth-Thumbnail_Frame_None.png. Default seleccionado. Skip overlay si `image === ''`. Carrusel pasa de 6 posiciones absolutas fijas a flex horizontal scrollable con scrollLeft inicial centrado.
- **Home button + TAKE PHOTO scroll (commit `fc84337`):** home/back en los 3 sub-screens del Photo Booth a `top:1000` matching `FloatingHomeButton` del resto del kiosk. START → "TAKE PHOTO" 2 líneas, dentro del scroll (item más, no fixed). Tamaño 260×260 vs 212×212 thumbnails.
- **Countdown ring animado + editor pulido + frame cocido (commit `57d54bd`):** ring del countdown anima strokeDashoffset linealmente (1s/tick). Editor con 5 backgrounds, popup back warning estilo Guestbook ("Are you sure" en 2 líneas + CTA Cancel/Leave), KioskHeader visible en editor. Frame seleccionado **cocido en el blob** (recompose on-change). Editor ya no renderiza frame como overlay DOM separado.
- **Barra dark + 8 filtros + thumbs 200 + ring verde (commit `a8f910f`):** `--photo-tabs-bg` 0088ce → 004f8b dark. Frames tab usa `f.resolvedThumbnail`. Popup título 2 líneas Photo Booth + Guestbook. Countdown ring color olive `#b9bd39` (del Send-to-Phone). 2 filtros añadidos (Punchy + Dramatic = 8 total). Thumbs 212→200 → 4.5 visibles.
- **Stickers bar + countdown verde + Coming Next + Share rehecho + USA bgs (commit `aed2a21`):** stickers bar `#1796d6`. Countdown backdrop circle negro 50% + número y track ring verde olive. EXPERIENCE pill abre popup cinematic "Coming Next" con kicker, gradient title, body interpolado client_name, CTA back. Share button del editor: arrows DOWN apuntando al botón, "Share Photo" 2 líneas, icono universal Share. Share screen: fondo blanco, banda azul, título "SHARE YOUR MEMORIES", QR integrado en Follow us pill. Backgrounds Unsplash USA iconic (Statue Liberty, Grand Canyon, Golden Gate, Times Square, Yellowstone).
- **Timer 3s + frame shadow + share rehecho con bg + iconos sociales oficiales (commit `230f00b`):** timer default 10→3s. Frame seleccionado en Start con shadow doble (ring sólido + glow blur 32px). `loadImage` tolerante (resolve null en error). Share button arrow-out-of-box icon, flechas DOWN, texto NEGRO. Stickers row fondo BLANCO. Share screen con `shareBackground` config-driven (foto `joseph-corl-OUtu8i12Nyo` que mandó Rubén). Iconos sociales OFICIALES (X verbatim, Facebook #1877F2 + f, Instagram gradient radial real). EMAIL/TEXT outline blanco bg negro 35%.
- **None bg + share rename + confirm en home + foto contain (commit `15698ce`):** entry 'none' en backgrounds (default seleccionado) → composeFinal con `keepOriginalBackground: true` salta green-screen y usa foto cruda. Buttons rename "Send to Email" / "Send to Phone" sin iconos internos, estilo pill outline. Home button del share dispara confirm popup. `handleRetake` distingue por `phase` (sharing→home, editing→live).
- **Bgs Arizona + photo aspect 9:16 + buttons olive/blue (commit `0f2f470`):** bandera India → Antelope Canyon AZ + NYC → Monument Valley AZ. Photo card 540×960 (aspect 9:16 exacto) con `objectFit:cover`. Buttons solid pills: Email olive `#b9bd39`, Phone azul `#1796d6` matching CLEAR ALL/APPLY del filter overlay.
- **Quita glow buttons + Follow us / QR como 2 cards (commit `94fe031`):** `boxShadow: none` en buttons (quita el halo color). Follow us + QR rediseñado como **dos tarjetas blancas independientes lado a lado** (600×200 + 300×200, gap 20px, balanceadas) en y=1380. Sin overflow, esquinas redondeadas consistentes.

**Verificado:**

- 11 commits incrementales, todos con typecheck limpio.
- Screenshots de verificación en `.planning/verifications/3-16-*.png` para cada cambio mayor.
- Flujo end-to-end probado con Playwright (?mock=1): Start → frame select → TAKE PHOTO → countdown verde → segmenta → editor con 5 bgs/8 filters/stickers → Share button con arrows → share screen → CTAs.

**Pendiente para próxima sesión:**

- **Fix CRÍTICO:** wire up real de `SendToEmailModal` + `SendToPhoneModal` + `SentConfirmationPopup` (existentes en `src/components/listings/`) para los CTAs Send to Email/Phone. Actualmente solo muestran un overlay mock "Sent!". Rubén pidió flujo completo con keyboard + popup confirmación como en listings (screenshots de la sesión anterior muestran el patrón exacto: input + numeric keypad / on-screen keyboard + send button → popup verde "Sent to your phone" con check + auto-redirect home).
- Backgrounds: algunos URLs Unsplash pueden 404. `loadImage` tolera el error pero idealmente verificar URLs estables o pre-descargar para producción. Actualmente: Antelope Canyon AZ, Grand Canyon, Monument Valley AZ, Yosemite, Statue of Liberty + None.
- Bloque `home.photoBooth` para `_template` y `demo-cliente-a` cuando estos clientes tengan `features.home` configurado.
- LLM real para Ask AI (Fase 5+).
- Itinerary Builder, Photo Booth real-camera testing en kiosk físico.

**Decisiones clave consolidadas en memoria** (`feedback_photo_booth_iterations.md`):

- Header consistente: TrueOmniLogo + WeatherClock estándar.
- FloatingHomeButton coords (top:1000, 116×232, #004f8b).
- Popup 2 líneas con `whiteSpace: pre-line`.
- Carrusel scrollable horizontal con scrollLeft centrado.
- Shutter como item del scroll, no fixed.
- None option pattern (image vacío + thumbnail dedicado).
- Aspect 9:16 EXACTO en photo cards.
- Iconos sociales oficiales (X/FB/IG verbatim).
- Buttons sin glow colorido.
- Cards balanceadas lado a lado (no overflow pills).
- Permisos cámara reales en dev (sin auto-mock).
- `loadImage` tolerante a fallos.

**Fase:** 3.16 Photo Booth — pulido pendiente de Fix CRÍTICO de Send to Email/Phone modal real. Resto del módulo estable y aprobado visualmente.

---

### Sesión 2026-04-27 — Fase 3.16 Photo Booth pulido final + módulo aprobado

**Hecho (en orden lógico):**

- **Fix CRÍTICO Send to Email/Phone modales reales:** quitado el overlay mock "Sent!" del Photo Booth. Cableados los 3 componentes existentes del patrón listings: `SendToEmailModal` (input + on-screen QWERTY keyboard), `SendToPhoneModal` (input + numpad + USA(+1) + cross-switch a keyboard) y `SendConfirmationPopup` (check verde olive + chip destination + barra 5s + auto-redirect a `/home`). Patrón idéntico al de listings/deals/brochure.
- **Mensajes del popup específicos Photo Booth:** `SendConfirmationPopup` ahora acepta props opcionales `title?` / `body?` (backwards-compatible). Strings tokenizados nuevos en `config.json`: `photo_booth_sent_email_title` ("Your photo is on its way!") + `photo_booth_sent_email_body` ("Check your inbox to view and share your Photo Booth memory.") y equivalentes para phone. Quitados los obsoletos `sent_title/body`.
- **Share screen rediseñada:** overlay negro 50% sólido sobre el background (sustituyó el gradient), eliminada la card "Follow us" con socials, dejada solo la card SCAN ME centrada con QR grande y diseño limpio.
- **Card SCAN ME final:** ajustada a 252×252 con paddings simétricos (24px en los 4 lados). Título "Scan to Save" arriba 28px navy, QR 170×170 con corner brackets viewfinder en azul brand (5px stroke), sombra rica + ring olive sutil. Strings tokenizados (`scan_kicker`).
- **Botón izquierdo del Share:** cambiado de home (con warning) a back con la flecha aprobada del editor (SVG verbatim de `editor-screen.tsx:239-244`). Click regresa al editor sin warning, sesión y stickers/frame/filter intactos.
- **Set de 8 stickers PNG 3D reales:** reemplazados los SVGs por los PNGs del usuario: `rock-on`, `heart-bubble`, `fire`, `hundred`, `sunglasses`, `crown`, `heart-100`, `heart-yellow`. Antes pasamos por dos sets intermedios (geometric flat + travel SW USA con outline) que el usuario rechazó.
- **Drag&drop estilo Guestbook:** `stickers-row.tsx` reescrito con patrón verbatim de `guestbook-pin-rail.tsx` — pointerdown empieza drag con clone visible 200×200 que sigue al cursor con drop-shadow, window-level listeners + estado en `useRef` (sin stale closures), `pointerup` reporta `(sticker, clientX, clientY)`. El `editor-screen.tsx` convierte coords viewport → coords del photo area (0..626 × 0..1114) compensando scale del kiosk-canvas via `getBoundingClientRect()`. Drop fuera del photo area → ignorado.
- **Edit interactions completas en sticker-layer:** rediseñado `sticker-layer.tsx` con state `selectedId` y dos handles visibles cuando hay selección — botón rojo `[×]` top-right (delete con `onRemove`) y botón azul `[⤡]` bottom-right (resize manteniendo aspect-ratio, min 80px / max 600px, cálculo por distancia del centro al cursor / diagonal inicial). Tap en el body → selecciona, drag del body → mueve, tap fuera → deselecciona. Atributo `data-photo-stickers-container` en el photo div del editor para que el layer encuentre el padre y compense el scale.
- **`onAddSticker(sticker, x, y)` en photo-booth-module:** ya no agrega al centro fijo (313, 557) sino en las coords exactas del drop. `PlacedSticker.x/y` siguen siendo el centro en photoRect coords.

**Verificado:**

- 14 screenshots en `.planning/verifications/3-16-fix-modals-*` y `3-16-stickers-*` cubriendo: start, editor, share rediseñada, email modal, phone modal, popup email/phone con texto Photo Booth, back-to-editor, card balanceada, set 3D dragged, set PNG con handles, sticker resized, sticker eliminado.
- Flow end-to-end con Playwright `?mock=1`: take photo → editor → drag&drop sticker → tap select → resize handle → delete → share → SEND TO EMAIL → keyboard → SEND → popup "Your photo is on its way!" + chip → auto-redirect home.
- Typecheck limpio en cada iteración. Lint sin errores nuevos (el de `hasTouchedBackground` es pre-existente de la sesión 2026-04-24).
- Skills de diseño Tier 1 cargados (frontend-design + ui-ux-pro-max) en el rediseño de SCAN ME.

**Pendiente / siguiente:**

- **Itinerary Builder** (módulo no implementado, sub-fase candidata 3.17).
- **Fase 4 — primer cliente real** (config + tokens + assets reales + Lighthouse en producción).
- **LLM real Ask AI** (Fase 5+) — endpoint `/api/ai` con Anthropic Claude.
- **Photo Booth en hardware kiosk físico** — testear con cámara real, no mock.
- **Photo Booth Backend real para share** — hoy mocked: el QR apunta a una URL placeholder, los CTAs Email/Phone solo muestran popup mock. Fase 5+ conecta upload a S3/CDN + SMS/SMTP real.
- **Bloque `home.photoBooth`** en `_template` y `demo-cliente-a` (ninguno tiene `features.home` configurado).

**Decisiones clave:**

- `SendConfirmationPopup` con props `title?`/`body?` opcionales (backwards-compatible) — patrón cleanest que duplicar el componente solo para Photo Booth.
- Stickers PNG en lugar de SVG — el usuario aprobó las imágenes 3D reales, dos intentos previos (geometric flat + emoji 3D outline) rechazados.
- Drag&drop window-level listeners + ref-based state (patrón Guestbook) — única forma de evitar stale closures en gestos largos.
- Resize handles aparecen solo en selección (no permanentemente visibles) — UX más limpia, descubierta via tap.
- Back en lugar de Home en Share screen — vuelve al editor sin perder la sesión, mejora de UX sobre el original que disparaba warning.

**Fase:** 3.16 Photo Booth module **cerrada y aprobada por Rubén** (2026-04-27). Modulo completo y listo para producción cuando se conecte backend real (Fase 5+).

---

### Sesión 2026-04-27 (tarde) — Fase 3.17 Itinerary Builder construida end-to-end (14 commits)

**Hecho (en orden de sub-fases atómicas):**

- **3.17-1 (`b8d515b`):** Tipos `ItineraryConfig` + `LocalListingItinerary` + `AiQuestion` + `ItineraryStopRef` en `src/lib/config.ts`. Bloque `features.home.itinerary` en `clients/default/config.json` con las 4 preguntas AI default (Duration / Travel / Activities / Dining). 51 tokens nuevos `itinerary_*` en `textos`. Ruta `/home/itinerary-builder/page.tsx` shell + `ItineraryBuilderModule` placeholder. HTTP 200.
- **3.17-2 (`b3377a8`):** `src/lib/itinerary-favorites.ts` con `useItineraryRail()` que combina los 3 buckets de favoritos (`useFavorites` + `useEventFavorites` + `useTrailFavorites`) en lista ordenada. Persistencia de orden en `sessionStorage kiosk_itinerary_order`. API: stops, count, has, add, remove, reorder, clear. add/remove idempotentes.
- **3.17-3 (`65e207a`):** WelcomePopup con mapa estático Mapbox + 4 pins de categoría + card central blanca (kicker / intro / título uppercase con `{client_name}` interp / body / 2 CTAs olive+azul / X close). State machine en módulo con phases `welcome → manual / ai-popup`, `welcome_always_visible` flag del config para forzar el popup en cada entrada mientras está en review. Tokens `--itinerary-*` añadidos a los 3 clientes (default, _template, demo-cliente-a).
- **3.17-4 (`c517c93`):** ItineraryHeader (logo + weather/clock + title + searchbar). CategoryTabsRow dinámicos del config (excluye `places-to-stay`, antepone `Local Listings` cuando hay pre-built itineraries). ListingsColumn scrollable con collapse/expand handle. ItineraryListingCard horizontal 360×170 con thumbnail + título + distance + heart toggle. Helpers `src/lib/itinerary-tabs.ts` y `src/lib/itinerary-catalog.ts` (Listings + Events + Trails normalizados a `ItineraryCatalogItem`).
- **3.17-5 (`ab55f6b`):** ItineraryMap standalone (Mapbox GL) con pins por kind + stop markers numerados grandes + GeoJSON LineString conectando stops. AiItineraryFloatingCard top-right. MapToolbar bottom bar (Remove All / Show Driving / Hide Markers / Share). StopsRail con StopSlot por slot (thumbnail + Stop N + heart rojo de delete). Bug detectado: Mapbox sobrescribe `position:absolute` a `relative` rompiendo top/bottom inset → wrapper externo con `width/height: 100%`. Bug detectado: markers no se renderizan en primer effect (load async) → convertí `readyRef` a state con dependency en effects.
- **3.17-6 (`d0dc0b8`):** `src/lib/use-itinerary-dnd.ts` hook con state machine + listeners pointermove/pointerup registrados en window al iniciar el drag (no via useEffect, para no perder eventos entre setState y next render). Drop targets identificados con `data-itinerary-rail` y `data-itinerary-slot={index}`. Card → drop en rail = `rail.add()`. Stop → drop en otro slot = `rail.reorder(from, to)`. DragGhost en Portal al body.
- **3.17-7 (`657db10`):** EventsWeekStrip dinámico con date range + chevrons < > + 7 chips SUN-SAT (Intl.DateTimeFormat). `getWeekStart`, `shiftWeek`, `isoDate` helpers. Filtra catálogo cuando isEventsTab por `item.date === targetIso`.
- **3.17-8 (`87dd169`):** Tab Local Listings con LocalListingsColumn (cards de itinerarios pre-armados). LocalListingPreview bottom sheet full-height con hero + título + stops numerados + CTA "Use this itinerary" que llama `rail.clear()` + `rail.add()` por stop. 2 itinerarios demo seed: "Phoenix Foodie Trail" (4 stops) y "Downtown Day Out" (2 stops).
- **3.17-9 (`4f60c18`):** AiPopup con 2 cards (AI ITINERARY · sparkle azul · Start / TOP SUGGESTIONS · heart olive · Let's Go). Mismo flujo, doble entrada estilística como confirmó Rubén. AiWizard config-driven que orquesta los pasos (state local de step + answers, dispara onFinish(answers) en último Next). AiQuestionScreen con hero image + kicker + título + opciones (single radio / multi checkbox), ProgressDots, footer con back+next/finish, botón floating back izquierda. Heros AI temporales con placeholders Unsplash hasta que el cliente provea.
- **3.17-10 (`ffae546`):** `src/lib/ai-itinerary.ts` con interfaz tipada `generateItinerary(opts) → GeneratedItinerary`. v1 mockeada cliente-side con delay 2.4s. Algoritmo: days resueltos del Duration (0/1/3), slot meals breakfast/activity/lunch/event/dinner por día con scoring popularity + tag matches contra preferences, eventos top en tab EVENTS, phrasing variado. Cuando llegue Fase 5+ con LLM real, swap del archivo manteniendo la interfaz. AiLoadingScreen con background fullscreen + spinner SVG animado + título + body. AiResultScreen con header azul + título + tabs EVENTS/DAY 1/2/3 + AiResultTimeline (bullets azules + kind label + descripción) + slider mock con play button + carousel horizontal de cards + Start Over (olive) / Finish (azul).
- **3.17-11 (`2f3818a`):** LeaveAiWarningPopup estilo Photo Booth (card 640px con título + body + Cancel/Leave). Se dispara al pulsar Start Over; al confirmar resetea aiResult/aiAnswers y vuelve a `phase=ai-popup`. ItineraryFinishedPopup estilo Survey thank-you (card 640px con check verde olive + título + body + barra de progreso del auto-close 4s). Se dispara al pulsar Finish, después de mergear las entries del aiResult al rail (`rail.add()` por cada día/entry). Al cerrar pasa a `phase=manual` con el rail pre-llenado.
- **3.17-12 (`ce2c968`):** ShareItineraryModal pixel-close al SVG: card 760px con título "You made it!" + body + QR (qrcode.react) sobre fondo azul primary con badge SCAN ME + "Powered by [TrueOmni logo]" + 2 CTAs SEND TO PHONE (olive) / SEND TO EMAIL (azul). Wire-up con SendToEmailModal / SendToPhoneModal / SendConfirmationPopup existentes (reuso del patrón de listings/photo-booth).
- **3.17-13 fixes (`3319e4b` + `5786ccc`):** Pulido E2E con 8 screenshots de verificación en `.planning/verifications/3-17-*`. Bugs E2E detectados y corregidos:
  - `{client_name}` no se interpolaba en title de las preguntas AI → añadido prop `templateVars` al AiWizard.
  - `logoSrc` llegaba sin leading slash → aplicar `resolveItineraryAsset()` en la page.
  - Auditor white-label encontró ~30 violaciones (heart rojo `#e02020`, pin colors `#f5a623/#0e8c7e/#0088ce`, `#bdbdbd`, `#1f2227`, `#d8d8d8/#4a4a4a`, strings UI `Stop`, `Start/Stop`, `mi away`, `stops`, KIND_LABEL, DAY_LABELS, MONTHS, `Map unavailable`). Corregidos:
    - 11 tokens nuevos `--itinerary-*` (heart, heart-empty, pin-listing/event/trail, drag-ghost-bg, map-fallback-bg/fg) en los 3 clientes.
    - 16 strings nuevos `itinerary_*` en `textos` (stop_label, stops_count, distance_away, no_search_results, no_local_listings, map_unavailable, kind_breakfast/lunch/dinner/activity/event, ai_result_slider_start/stop, ai_day_label_template, ai_plan_label, ai_duration_fallback).
    - DAY_LABELS y MONTHS reemplazados por `Intl.DateTimeFormat(locale)` para i18n del cliente.
    - `MEAL_PHRASES`, `dayLabelTemplate`, `planLabel`, `durationFallback` movidos a params opcionales de `generateItinerary` con defaults.
    - Mapbox no resuelve `var()`, así que el route-line layer lee `--itinerary-route-line` del CSS root en runtime — sigue siendo white-label.

**Verificado:**

- 14 commits incrementales, todos con `pnpm typecheck` limpio. `pnpm lint` sin errores nuevos del módulo.
- 8 screenshots E2E del flujo completo: welcome → ai-popup → wizard Q1-Q4 (Arizona's Town interpolado correctamente) → loading → final result (DAY 1 + EVENTS, timeline con descripciones que mencionan listings reales del catálogo, slider mock, carousel) → finish (popup confirmación auto-cerrado 4s) → manual screen con 5 stops mergeados del AI + línea de ruta azul + 5 markers numerados grandes + thumbnails en el rail → share modal (You made it! con QR + Send to Phone/Email).
- Drag & drop verificado E2E: dispatch sintético de pointerdown sobre primera card + pointermove + pointerup sobre rail → filledStops sube de 0 a 1.
- Auditor white-label corrió 2 veces: la 1ra reportó ~30 violaciones, la 2da (post-fixes) limpio.

**Pendiente / siguiente:**

- Pixel-perfect afino fino contra los SVGs (las pantallas son cercanas pero no verbatim — alguna padding y font-size puede diferir). Decidir si hace falta otra ronda o se aprueba como está.
- Assets reales del cliente para los heros AI (`q-duration`, `q-travel`, `q-activities`, `q-dining`) y `loading-bg`. Hoy son placeholders Unsplash.
- LLM real para `generateItinerary` (Fase 5+) — endpoint `/api/itinerary` con Anthropic Claude.
- Backend real para share del itinerario (QR + email + phone) — hoy mock.
- Mapbox Directions API para "Show Driving" toggle (hoy = línea recta entre stops). Detrás de feature flag.
- Bloque `home.itinerary` en `_template` y `demo-cliente-a` cuando estos clientes tengan `features.home` configurado.
- Photo Booth pendientes (ver entrada anterior): backend share, hardware testing, etc.

**Decisiones clave consolidadas:**

- Rail unificado sobre 3 buckets de favoritos con orden persistido en sessionStorage (los Sets no preservan orden). Heart filled en card = está en el rail = mismo store que likes globales.
- Tabs dinámicos por categoría del cliente excluyendo `places-to-stay`. Tab fijo Local Listings sólo cuando `local_listings.length > 0`.
- Modo manual = 1 día. Modo AI = 0 (lista) / 1 / 3 días según Duration.
- AI Popup: dos paths (Start / Let's Go) → mismo wizard → mismo Final Result. Doble entrada estilística.
- ai-itinerary.ts: interfaz tipada que se mantiene cuando llegue LLM real (swap de implementación, no refactor de consumidores).
- Drag & drop: listeners en window al iniciar drag (no useEffect) para no perder eventos en sintéticos. Patrón Photo Booth verbatim.
- ItineraryMap standalone con Mapbox GL, no extiende el MapCanvas del módulo Map (evita acoplamiento). Wrapper externo absolute para no romper inset cuando Mapbox fuerza relative al container.
- White-label estricto: 11 tokens CSS + 67 keys de textos cubren todo. Cambiar `KIOSK_CLIENT=demo-cliente-a` recolorea pins listings (naranja) y trails (menta) sin tocar `.tsx`.
- Welcome popup: `welcome_always_visible: true` mientras está en review. Pasarlo a `false` en producción para que persista por sessionStorage (primera vez por sesión).

**Fase:** 3.17 Itinerary Builder **completa y funcional E2E** (2026-04-27). Pendiente aprobación visual final de Rubén; al aprobar pasar a Fase 4 (primer cliente real).

---

### Sesión 2026-04-27 (noche) — Fase 3.17 pulido masivo (~25 rondas feedback) + 2 result screens nuevas

**Hecho (commit `eac9273`):**

- **AI Result Screen** rehecho pixel-close al SVG `Finish AI Itinerary`: header estándar kiosk (TrueOmniLogo + WeatherClock + gradient), título 44px, tabs EVENTS·DAY1·DAY2·DAY3 (h:64 px:8 font:22), timeline con 5 entries por día (Breakfast/Activity/Lunch/Event/Dinner) con bullets primary y descripciones (24/18→29/23 +5pt), pills row Start/Stop N alineados con cards 290×163 (16:9), connector lines pill-to-pill, scroll horizontal sincronizado pills+cards, scrollbar oculto, floating BackButton aprobado.
- **TopSuggestionsScreen** (NUEVO `top-suggestions-screen.tsx`) pixel-close al SVG `Top Suggestions`: header igual + título 51px + subtítulo 28px + QR 124px + scan label 28px + tabs underline-style (Things to do · Events · Restaurants) + grid 2-cols con cards estilo `ListingCard` aprobado (image+footer dark, subcategory+title+distance+open hours, heart top-right) + click → `ListingDetail` in-place.
- **Routing por aiPath**: state `aiPath: 'ai' | 'top-suggestions'` en módulo. AiPopup.onStart → 'ai', onTopSuggestions → 'top-suggestions'. Render condicional en phase 'ai-result'.
- **Auto-like** en TopSuggestions: useEffect añade todos los items curados al rail al entrar al screen. Heart toggle quita el like.
- **AI Question Screen** con header estándar kiosk (TrueOmniLogo + WeatherClock + gradient azul 397px), body max-w-720 centrado, options h:78 22px, footer Back+Next `rounded-xl` h:76 px:14 22px, **floating BackButton SIEMPRE dispara LeaveAiWarningPopup** → confirma → main dashboard. Backbutton del footer (sin icono) solo retrocede pregunta.
- **AI Loading Screen**: TrueOmniLogo inline + spinner 140×140 + título 78px + body 34px con `\n` para 2 líneas.
- **AiPopup**: card 880, título 40px, path cards bigger (icons 80×80), CTAs 22px h:68.
- **ShareItineraryModal**: card 820, título 52px, body 22px más conciso, TrueOmniLogo SVG inline h-38 primary blue (reemplaza Image broken), botones h:64 mt-12.
- **Smart Route** (nuevo): nearest-neighbor TSP greedy en módulo. Botón en `MapToolbar` h:86 (antes 56) con todos los controles agrandados (pills h:12 px:6 16px, toggles 28×50 22×22 16px). Si la ruta ya está óptima → popup verde olive "You already have the best route!" con `\n` en body.
- **Bubble switch limpio**: MapCanvas attach `move/zoom/resize` listeners DESPUÉS de `moveend`, `flyToPadding` memoizado, ease 450ms cubic-bezier ease-out. Sin flashes ni pin-chasing. `setSelectedSlug` wrapper que limpia `pinPos` en el mismo tick.
- **ListingDetail z-60 wrapper**: detail + backdrop encima de toda la pantalla del Itinerary (bypass FloatingHomeButton z-30, MapToolbar z-25, etc).
- **OnScreenKeyboard**: tap en search bar abre QWERTY al fondo del canvas con backdrop oscuro.
- **EmptySearchState** (nuevo): cuando search no encuentra resultados, render del icono folder rojo + "Ooops! Try again" + body 4 líneas, pixel-close al SVG.
- **Drag&drop con threshold 6px** en `use-itinerary-dnd.ts`: tap vs drag distintos, scroll del sidebar funciona normal, drop reorder de stops entre slots, Photo Booth pattern verbatim.
- **Map fitBounds** cuando rail tiene ≥2 stops para encuadrar la ruta completa con padding configurable.
- **Events tab**: listings cargan con fallback (todos los eventos si no hay del día), week strip estilo módulo Events (`#1e88c6`, height 180, 7 pills 118×64 verbatim `WeekPicker`), strip movido a top:350 (gap con tabs en y=330), sidebar/AI button bajan a y=540 cuando events activo.
- **AI generation bumped**: few-hours=3 days, day-trip=4, few-nights=6. Event garantizado en cada día (no solo el primero).
- **Tabs labels** del Itinerary heredan de `features.home.tiles[].label` para consistencia con dashboard (con `\n`→space para una línea).
- **Mapbox HSL parser fix**: `hsl(H S% L%)` → `hsl(H, S%, L%)` con comas (`map-canvas.tsx`).
- **Toolbar chevron eliminado** (a la derecha del Share Itinerary).
- **Sidebar listings**: COLUMN_WIDTH 400→360, padding 30/30 simétrico (paddingRight reemplaza pr-3), gradient azul oscuro→transparente bottom-up tokenizado, limited al ancho de las cards.
- **Sub-modal share fix**: ShareItineraryModal se desmonta cuando shareSubModal!='none' o sentDest activo (evita amontonamiento).

**White-label:**

- 8 tokens nuevos `--itinerary-slot-*` (border, connector, pill bg/text/circle, helper text, empty circle, empty icon) en 3 clients.
- Strings nuevos: `itinerary_slot_start_label/stop_word/remove_aria`, `itinerary_top_*` (8 keys), `itinerary_smart_route_*` (4 keys), `itinerary_empty_search_*` (2 keys), reformateo de `itinerary_caption_drag_more` con `\n`.

**Verificado:**

- 14+ screenshots en `.planning/verifications/3-17-iter*` cubriendo cada ronda de feedback.
- Drag&drop E2E con dispatch sintético de pointerdown/move/up: card → rail = filled.
- Bubble switch E2E sin flash visual.
- Smart Route reordena stops correctamente y dispara popup cuando ya óptima.
- pnpm typecheck limpio en cada iteración.

**Pendiente / siguiente:**

- Aprobación visual final de Rubén sobre las 2 result screens y el Smart Route popup.
- Validar el flujo completo en hardware kiosk físico.
- Conectar `/api/itinerary` con LLM real (Anthropic) cuando llegue Fase 5+.
- Backend real de share del itinerario (QR + email + phone) y Mapbox Directions API para "Show Driving" (Fase 5+).

**Decisiones clave:**

- Tabs del Itinerary heredan de `features.home.tiles[].label` (no `mod.label` que usa labels marketing largos) para consistencia con el dashboard.
- Smart Route con nearest-neighbor en client-side (no Mapbox Directions optimization API) — suficiente para v1 y sin dependencia externa.
- TopSuggestionsScreen como componente NUEVO en lugar de variante de AiResultScreen — el layout es muy diferente (grid 2-cols vs timeline+slider+carousel) y separar es más mantenible.
- `setSelectedSlug` wrapper que limpia `pinPos` en mismo tick (React 18 batching) — única forma de eliminar el "flash" de bubble con contenido nuevo en posición vieja.
- `MapCanvas` listeners `move/zoom/resize` se attachan AFTER `moveend` (no al inicio) para que el bubble no se anime ni persiga el pin durante el ease programático. Pans manuales del usuario después del settle siguen funcionando porque los listeners ya quedaron attachados.
- Floating BackButton del wizard SIEMPRE dispara warning (no toggle entre back/cancel según step) — UX más predecible.
- Auto-like en TopSuggestions porque la pantalla es "esto te recomendamos, ya lo guardamos al rail; quita lo que no te gusta" — UX inversa al manual.

**Fase:** 3.17 Itinerary Builder **pulido pixel-perfect intensivo cerrado** (2026-04-27 noche, ~25 rondas de feedback en una misma sesión). Listo para aprobación final de Rubén → Fase 4 (primer cliente real).

---

### Sesión 2026-04-28 — Multi-idioma 6 idiomas + teclado iOS + seed data refresh (commit `b201a51`)

> **Nota:** Itinerary Builder 3.17 **aprobado por Rubén** (confirmado 2026-04-28 al iniciar esta sesión). Fase 3 cerrada en su totalidad.

**Hecho (commit `b201a51`):**

- **Infraestructura i18n completa** (anticipa lo que era Fase 6 v2; entra ya en v1 como pre-requisito de Fase 4):
  - `src/lib/i18n.ts` (client-safe) y `src/lib/i18n-server.ts` (loader fs).
  - `src/stores/locale-store.ts` con zustand sessionStorage (`kiosk_active_locale`).
  - `src/components/i18n-provider.tsx` con Context + hooks `useTextos`, `useTextosMap`, `useCurrentLocale`, `useAvailableLocales`, `useModuleLabel`, `useSubcategoryLabel`.
  - `src/app/(kiosk)/layout.tsx`: pre-load server-side de TODOS los locales para evitar flash al cambiar idioma.
  - `LanguageDropdown` reescrito con label nativo (incluye 日本語).
  - Noto Sans JP via `next/font/google` + fallback en `--font-sans`/`--font-display` para soportar japonés sin romper el resto.
- **6 idiomas activos:** `en` (canónico), `es`, `fr`, `de`, `pt`, `ja`. Schema `features.languages { enabled, available[], default }` en los 3 clientes. Eliminado `idioma_secundario` legacy.
- **Archivos i18n por cliente:** `clients/{slug}/i18n/{en,es,fr,de,pt,ja}.json` con ~330 keys (252 UI base + 16 `tile_label_*` + 12 `module_label_*` + 24 `subcategory_*` + 11 `filters_*` + `events_get_tickets` + 27 `ai_question_*` + extras). en/es manuales, fr/de/pt/ja con contexto Arizona/tourism. Script `scripts/translate-i18n.mjs` para regenerar.
- **Refactor masivo de consumers (~30+ archivos):** prop `textos: Record<string,string>` reemplazada por `useTextosMap()` en TODOS los modules (Listings/Events/Tickets/Passes/Deals/Trails/Guestbook/Itinerary/Survey/Brochures/Map/PhotoBooth/AskAI). `CategoryTile`, `ListingCard`, `ListingDetail`, `MapTopCard`, `MapPinBubble` migran a hooks reactivos. Filter overlays leen `filters_*` desde `useTextos`. AI wizard usa `<QField>` para resolver kicker/title/subtitle/options dinámicamente con fallback al config.
- **Teclado iOS-style + Drag&Drop:**
  - `OnScreenKeyboard` reescrito en 3 capas (letters/numbers/symbols) tipo iOS. Toggles `123`/`ABC`/`#+=` internos. Shift internalizado.
  - API limpia: solo `BACKSPACE`/`ENTER`/`SPACE`/string. Eliminadas `SYMBOLS`/`AT`/`DOT_COM`/`CLOSE`/`SHIFT` del consumer.
  - `DraggableKeyboard` wrapper con botón redondo flotante (lucide `Move`) en esquina superior derecha. Bounded al canvas, persistido en sessionStorage, doble-click resetea.
  - Aplicado en search-overlay, itinerary, survey, brochures-search, send-to-email/phone, qr-purchase, guestbook-form/pin (vía `send-modal-chrome` con `keyboardWidth/Height/storageKey`).
  - Tokens nuevos: `--keyboard-bg`, `--keyboard-key-bg`, `--keyboard-key-special`, `--keyboard-submit-bg`, `--keyboard-handle-bg/fg` en los 3 `tokens.css`.
- **Seed data refresh:**
  - `scripts/shift-event-dates.mjs`: +18d para que los 69 events partan de hoy.
  - `scripts/seed-tickets-today.mjs`: 9 events ticketables en today.
  - `scripts/replace-lorem-descriptions.mjs`: 90 descripciones Lorem Ipsum reemplazadas con texto contextual por subcategoría.
  - 3 ads reubicados: lolas-lunch (popup) `/home`, history-of-art (hero) `/home/restaurants`, uber-eats-nfl (bottom) `/home/things-to-do`.

**Verificado:**

- 87 archivos tocados, +9.915 / -1.896 líneas. `pnpm typecheck` limpio.
- Switch de idioma funciona en runtime sin reload (zustand sessionStorage + Context).
- Pre-load server-side de los 6 locales evita flash al cambiar.
- Noto Sans JP renderiza japonés sin romper el resto de tipografías.
- White-label intacto: 5 tokens nuevos de teclado en los 3 clientes; seed data en `clients/default/config.json` solamente.

**Pendiente / siguiente:**

- **Fase 4 (primer cliente real):** crear `clients/{cliente-real}/` con tokens + config + assets reales + Lighthouse > 95.
- **Aprobación visual** del teclado iOS y del flujo de cambio de idioma en hardware kiosk físico (en runtime parece OK).
- Listings (Gallo Blanco, Welcome Diner, etc.) quedan en inglés por decisión de Rubén — no se traducen sus nombres ni pies de menú.
- AI modal subtitle conserva interpolación SSR de `{client_name}` (no migrado al hook).
- Photo Booth: 24 textos override vía `useTextosMap`; `experienceTeaserBody` conserva interpolación SSR.

**Decisiones clave:**

- **Multi-idioma adelantado de Fase 6 (v2) a v1**: Rubén lo necesita disponible antes del primer cliente real, así que entra como pre-requisito de Fase 4.
- **Pre-load de TODOS los locales server-side** (no lazy) para que el switch sea instantáneo. Costo aceptable: ~6 × 330 keys ≈ ~2KB gzip por cliente.
- **`useTextosMap()` como sustituto de `prop textos`** para que los componentes sean reactivos al cambio de idioma sin re-renderizar el árbol entero desde el host.
- **Teclado iOS de 3 capas** (no QWERTY plano) para soportar números/símbolos sin overlay extra; coincide con expectativa móvil del usuario tocando una pantalla retrato.
- **`DraggableKeyboard` con sessionStorage + doble-click reset**: el usuario puede recolocarlo si tapa el input, pero no se persiste entre sesiones (cada visita arranca posición default).
- **`module_label_restaurants` = "Restaurants"** (no "Food & Drink") para que tile y label del módulo sean idénticos.
- **Listings en inglés**: nombres propios (Gallo Blanco, Welcome Diner, etc.) NO se traducen — se mantienen verbatim como marca; subcategorías + descripciones SÍ siguen el sistema i18n.

**Fase:** Fase 3 **cerrada en su totalidad** (3.1–3.17 aprobadas). Multi-idioma + teclado iOS + seed refresh entregados como pre-requisitos de Fase 4. **Siguiente: Fase 4 — primer cliente real** (`clients/{cliente-real}/` + Lighthouse + handoff).

---

### Sesión 2026-04-28 (tarde) — Arranque del Kiosk Studio + Fase S1 Branding (live preview funcional)

**Hecho:**

- **Brainstorming + plan aprobado** (`/Users/rubenramirez/.claude/plans/wild-weaving-key.md`): Studio = subruta `/studio` en mismo repo, storage híbrido (Upstash KV en runtime + publish a `clients/<slug>/`), arrancar local sin auth → Vercel + Google OAuth + GitHub PR-publish con approval gate de `ruben@trueomni.com`, versionado completo + changelog, 7 fases (S0-S7).
- **Documentación**: `.planning/STUDIO-PROJECT.md` (visión) + `.planning/STUDIO-ROADMAP.md` (fases formales) + entrada en `.planning/ROADMAP.md` con la milestone Studio.
- **Mockup visual completo del Studio (`/studio` + `/studio/[slug]`)**: shell con TopBar + SidebarTabs (8 secciones) + EditorPanel + LivePreview iframe + SaveBar; tema dark+light con toggle persistente (`StudioThemeProvider`); animaciones con framer-motion (active tab con `layoutId`, fade tabs); logo TrueOmni real reusado del kiosk; cards de clientes en grid con gradient hero + logo centrado.
- **Live preview funcional E2E** (Fase S1 mínima cerrada):
  - `usePreviewBridge` host-side: iframeRef + state global del brand + postMessage debounced 120 ms + listener `studio:ready` con resend del state al handshake.
  - `<StudioBridge />` montado en `src/app/(kiosk)/layout.tsx`: escucha mensajes y aplica `document.documentElement.style.setProperty('--brand-*', value, 'important')` al recibir `studio:brand-update`. Anuncia `studio:ready` con retry (0/50/250/800ms) para cubrir race host-iframe.
  - `hexToHsl` utility (`src/lib/studio/hex-to-hsl.ts`) convierte `#RRGGBB` → `H S% L%` (formato del kiosk).
  - **Refactor de Billboard 0**: 3 colores hardcoded (`#b4bd01`, `#1796d6`, `#004f8b`) → `hsl(var(--brand-tertiary/secondary/primary))`. Viola la regla "cero hardcoded" si no se hace.
  - **`KioskCanvas` detecta iframe** (lazy init useState con `window.parent !== window`): en modo embedded renderea kiosk a 1080×1920 reales sin padding/scale/shadow del dev-view. Sin doble escala.
  - **Persistencia local**: `useBrandStorage(slug, initial)` guarda en `localStorage["studio-brand:<slug>"]`. Save real con UX completa (dirty / saving / saved / error states), Discard descarta cambios sin guardar.
- **`tailwind.config.ts`**: cambio `darkMode: ['selector', '[data-contrast="high"]']` → `'class'` (estándar). Las variantes `dark:` solo se activaban con `[data-contrast="high"]` antes (selector custom no documentado mal). El kiosk usa `[data-contrast="high"]` solo en `tokens.css` para CSS vars, no para Tailwind variants, así que no afecta.
- **`StudioThemeProvider` anidado en 2 divs**: el ancestor solo aplica clase `dark`, el inner aplica las clases con `dark:` variants. Tailwind con `darkMode: 'class'` requiere `.dark` como ANCESTOR (no en el mismo elemento). Antes light mode quedaba bien pero dark "se veía raro" porque las dark: variants del wrapper no aplicaban.

**Verificado (manual, sin tests automáticos):**

- `pnpm typecheck` limpio en cada iteración.
- `/studio` lista cliente "TrueOmni Default" con card de gradient + logo TrueOmni centrado + 3 brand swatches.
- `/studio/default`: editor con Branding tab abierto. Mover Secondary → Billboard idle del iframe se recolorea (botón ENGLISH olive + Back_Tab azul medio + Front_Tab azul oscuro).
- Aplicar preset "Sunset" → los 3 colores cambian de golpe → Billboard se recolorea entero.
- Save → reload `/studio/default` → brand persistido aparece (no el del mock).
- Toggle dark/light desde topbar funciona en homepage + editor. localStorage `studio-theme`.
- Toggle Kiosk ↔ Landscape (1080×1920 ↔ 1920×1080): el iframe re-monta con dimensiones correctas y el handshake reenvía el state actual.

**Pendiente / siguiente:**

- **Fase S0 cloud (bloqueado por credenciales Upstash):** `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` para arrancar `@upstash/redis` + API routes `/api/studio/configs/*` + schema zod + create/clone/delete real + ruta `/preview/[slug]` (hoy el iframe apunta a `/` directo del runtime).
- **Fase S1 completa:** logos upload real (placeholder hoy), font selector real, react-colorful (color picker más pro que `<input type="color">`), audit/tokenize de Billboards 1-4 si otros clientes los usan.
- **Fase S7 (Vercel + Auth):** NextAuth + Google OAuth + dominio whitelist `@trueomni.com` + GitHub App para PRs automáticos + approval queue para `ruben@trueomni.com` + Resend para notificaciones de approval. Bloqueado por: cuenta Vercel + Google OAuth client ID/secret + GitHub App credentials.
- **Fases S2-S6**: Modules, Content/Data, i18n, Ads, Integrations. Cada una ~1-2 semanas.

**Decisiones clave:**

- **Storage híbrido D1**: KV durante edición (live preview con postMessage) + "publish" exporta a `clients/<slug>/` files. Production runtime sigue leyendo filesystem (igual que hoy, sin refactor). Mientras llega Upstash, persistencia es localStorage.
- **`darkMode: 'class'` standard**: la sintaxis array `['selector', custom]` no genera selectores válidos para múltiples activaciones. Cambiar a 'class' (default `.dark`) garantiza que las variantes funcionen. El `[data-contrast="high"]` del kiosk es independiente porque solo afecta CSS variables, no clases Tailwind.
- **`KioskCanvas` con detección de iframe**: sin esta detección, el canvas aplica padding 80+64+180 + scale interno → doble escala (canvas + iframe Studio) → margen gris alrededor del frame. Detectar iframe + render a tamaño real elimina el problema sin tocar el dev-view.
- **`<StudioBridge />` con re-anuncio múltiple del `studio:ready`**: race condition entre host (que monta listener tras hidratar Shell) y iframe (que monta StudioBridge tras hidratar layout `(kiosk)`). Re-anunciamos a 0/50/250/800ms para cubrir cualquier orden de mounting.
- **Refactor de Billboard 0 antes de S1 funcional**: el bridge no podía mostrar nada visual mientras Billboard 0 tuviera `#004f8b` etc. hardcoded. Tokenizarlo desbloqueó la demo del live preview.

**Fase:** Studio Fase S1 **funcional E2E con persistencia local** (2026-04-28). Bloqueado para Fase S0 cloud → necesito credenciales Upstash de Rubén para continuar.

---

### Sesión 2026-04-28 (noche-extra) — Studio S0 cloud + S1 Branding completa + i18n masivo + idle timeout

**Hecho:**

- **Vercel KV (Upstash) integrado.** Credenciales en `.env.local` (`KV_REST_API_URL`, `KV_REST_API_TOKEN`, etc.). Cuenta `unified-bengal-108723` región Washington D.C., plan free.
- **Studio Fase S0 cloud cerrada:**
  - `src/lib/studio/kv.ts` — wrapper sobre `@vercel/kv` con auto-detect + fallback in-memory para dev sin credenciales. Schema de claves `cfg:<slug>`, `cfg:<slug>:meta`, `clients:list`, `pub:queue`, `changelog:<slug>`.
  - `src/lib/studio/schema.ts` — schemas zod (`KioskConfigSchema`, `BrandingSchema`, `ConfigMetaSchema`) + `STUDIO_GOOGLE_FONTS` (12 Google Fonts curadas).
  - **API routes** validadas con zod:
    - `GET/POST /api/studio/configs` — listar + crear cliente nuevo.
    - `GET/PATCH/DELETE /api/studio/configs/[slug]` — leer / actualizar branding / borrar.
    - `POST /api/studio/configs/[slug]/clone` — clonar cliente existente.
    - `POST /api/studio/seed` — crea `default` (TrueOmni) idempotente al primer arranque.
  - `src/app/studio/_lib/api-client.ts` — cliente HTTP centralizado.
  - **Editor `/studio/[slug]`** ahora server component que carga config + meta del KV directamente (sin HTTP roundtrip server→server). 404 si el slug no existe.
  - **Modal "New kiosk"** funcional con validación slug + auto-suggest desde Name + AnimatePresence focus trap.
  - **Botón delete flotante** (on-hover, excepto `default`) con confirm.
  - **Skeleton loading states** mientras llega el list().
  - **Auto-seed** del `default` en el primer load si KV está vacío.
- **Studio Fase S1 completa (Branding):**
  - 3 brand colors con color picker + 6 presets + live preview <120 ms (tokens en CSS).
  - **Logo + Favicon upload real** (`ImageField` con drag&drop, file picker, auto-compresión Canvas 200KB/100KB, SVG verbatim, preview thumbnail, botón X). Persistido como data URL en KV.
  - **Font selector real** (`FontSelector`) con dropdown de 12 Google Fonts. Cada opción se previsualiza en su tipografía. Display + Body separados.
  - **Live preview de fonts**: `<StudioBridge>` inyecta `<link>` Google Fonts + override `--font-display` / `--font-sans` con `!important`. Live preview de favicon: actualiza `<link rel="icon">`.
  - Bridge expandido a `studio:branding-update` (compat legacy `studio:brand-update` solo-colores). `pushBranding(branding)` debounced 120 ms.
  - **Save real al API** con `PATCH /api/studio/configs/<slug>` (body: `branding`). Dirty tracking comparando `current` vs `savedSnapshot`. Cmd+S keyboard shortcut.
  - **Idle timeout overlay** (`src/hooks/use-idle-reset.ts` + `src/components/home/idle-timeout-overlay.tsx`):
    - Lee `config.features.inactividad_reset_seg` (60s default).
    - Tras 60s sin interacción → modal con countdown ring 10s + 4 keys i18n (`idle_warning_*`).
    - Cualquier toque → dismiss + reinicia timer.
    - Si countdown llega a 0 → `sessionStorage.clear()` + `setLocale(defaultLocale)` + `router.push('/')`.
    - Montado en `(kiosk)/home/layout.tsx` para todas las pantallas dentro de /home.
- **Refactor masivo de dark mode del Studio:**
  - `tailwind.config.ts`: `darkMode: ['selector', '[data-contrast="high"]']` (sintaxis no estándar) → `darkMode: 'class'`. Las dark: variants ahora se generan correctamente con selector `.dark`.
  - `StudioThemeProvider` anidado en 2 divs (ancestor con `.dark`, inner con `bg-zinc-50 dark:bg-zinc-950`). Tailwind requiere `.dark` ANCESTOR, no en el mismo elemento.
  - Toggle dark/light en homepage + topbar del editor con `<ThemeToggle />` + sun/moon icons + AnimatePresence.
  - Persistencia en `localStorage["studio-theme"]`.
- **Mockup visual final del Studio:**
  - Logo TrueOmni real reusado del kiosk en homepage + editor breadcrumb.
  - Cards de clientes en grid con hero gradient + logo centrado + 3 brand swatches + slug pill + skeleton.
  - "+ New kiosk" card con misma altura que ClientCard (h-40 hero + p-5 footer) con grid pattern de fondo.
  - Sidebar tabs con active layoutId animado spring + footer "Live preview connected".
  - SaveBar con dirty / saving / saved / error states + Discard.
  - PreviewPanel con auto-fit del 1080×1920 + toggle Kiosk/Landscape (1080×1920 ↔ 1920×1080) + zoom controls.
  - Headers de sections con `01 · Phase S1` en bold.
  - "01 · Phase Sx" labels en bold (era light).
- **Iframe del live preview (`PreviewPanel`):**
  - Apunta a `/` (Billboard idle del kiosk runtime).
  - Sandbox quitado (interfería con event.source en cross-frame).
  - `KioskCanvas` detecta iframe (lazy init `useState`) y renderea kiosk a 1080×1920 reales sin chrome (sin padding 64+180+80, sin scale interno, sin shadow). Sin doble escala = sin marco gris.
  - Refactor de Billboard 0: 3 colores hardcoded (`#b4bd01`, `#1796d6`, `#004f8b`) → `hsl(var(--brand-tertiary/secondary/primary))`. Cumple regla "cero hardcoded".
- **i18n masivo del kiosk:**
  - Billboard 0/1/2/3 convertidos a `'use client'` + `useTextosMap`. Strings hardcoded "TOUCH HERE" / "Touch to start" / "Powered by" → keys `billboard_touch_here`, `billboard_touch_to_start`, `billboard_powered_by` (3 keys × 6 idiomas × 3 clientes = 54 entradas).
  - **AI Avatar** (Ask Anything) i18n completo:
    - `ai_subtitle` ahora es reactivo al locale: `AiModalHost` recibe `clientName` separado y la interpolación `{client_name}` se hace cliente-side sobre `t('ai_subtitle')`.
    - `ai_greeting` con interpolación cliente-side.
    - **8 suggested questions** traducidas por id (`ai_suggested_q_<id>_text`) en EN/ES/FR/DE/PT/JA — 48 keys nuevas. Responses dejan fallback al config (contenido editorial del cliente, no UI).
    - `useAiStore.hydrate` actualiza `displayedText` cuando NO hay conversación en curso, así el greeting cambia al instante con el locale.
  - `LanguageDropdown` con `e.preventDefault()` + `e.stopPropagation()` en click + mousedown del wrapper, trigger button e items. Causa raíz: `<Link href="/home">` envuelve todo el Billboard y la navegación nativa del `<a>` requería `preventDefault`, no solo `stopPropagation`. También `aria-label` traducido.
  - `BillboardLink` (nuevo client component) envuelve Billboard con `onClick` que `preventDefault` cuando el click viene de elementos con `data-billboard-no-link`.
- **Studio en inglés:** traducidas las 8 descriptions de `STUDIO_SECTIONS` y la metadata del layout.

**Verificado:**

- `pnpm typecheck` limpio en cada iteración (50+ ediciones esta sesión).
- `pnpm lint` solo errores pre-existentes del kiosk (photo-booth-module, directions-modal); archivos del Studio limpios después de fix de import-order.
- E2E manual:
  - `/studio` → auto-seedea `default`, lista carga del KV → card visible.
  - Crear "test-1" desde modal → POST /api/studio/configs → aparece nueva card.
  - Editar branding → live preview <200 ms → Save → reload → persiste.
  - Cambiar font Display a Playfair Display → kiosk re-renderiza con la nueva tipografía.
  - Subir logo SVG → preview se ve en el ImageField.
  - Toggle dark/light en homepage Y editor — funciona en ambos.
  - Cambiar idioma en Billboard idle → "TOUCH HERE" → "TOCA AQUÍ" → entras al Home → modal IA con greeting + chips traducidos.
  - Sin actividad 60s en /home → popup countdown 10s → si dejas pasar → vuelve a Billboard en inglés.

**Pendiente / siguiente:**

- **Fase S2 — Modules tab:** toggle on/off de los 13 módulos + reorder Home tiles + edit labels. Bridge mensaje `studio:modules-update`.
- **Fase S3 — Content/Data:** CRUD masivo de listings/events/tickets/passes/deals/trails/brochures.
- **Fase S4 — i18n editor:** side-by-side de los 6 idiomas + detección keys faltantes + AI translate (Anthropic SDK).
- **Fase S5 — Ads system:** subir, calendarizar, emplazar.
- **Fase S6 — Integrations:** weather, Mapbox, Analytics.
- **Fase S7 — Auth + Vercel + GitHub PR-publish:** NextAuth + Google OAuth + Octokit + approval queue (`ruben@trueomni.com`) + Resend notifications.
- **Cosas menores aplazadas:** color picker pro (react-colorful en lugar de native), audit/tokenize de Billboards 1-4, font upload custom (.woff2 además de Google Fonts).
- **Vercel Blob para uploads** (cuando los data URLs en KV crezcan o haya muchos clientes con assets pesados).

**Decisiones clave:**

- **Vercel KV elegido sobre Upstash directo**: misma tecnología (Vercel KV es Upstash internamente) pero credenciales centralizadas en cuenta Vercel para el deploy futuro.
- **Logos/favicons como data URLs en KV**: pragmático para MVP. Cuando crezca, migrar a Vercel Blob (`@vercel/blob`).
- **Fonts via Google Fonts dynamic loading**: `<link>` injection desde `<StudioBridge>`. No requiere subir archivos. Custom .woff2 queda como follow-up.
- **`darkMode: 'class'` standard**: la sintaxis `['selector', custom]` no genera selectores CSS válidos para múltiples activaciones. El `[data-contrast="high"]` del kiosk es independiente porque solo afecta CSS variables en `tokens.css`, no clases Tailwind `dark:`.
- **`KioskCanvas` con detección de iframe**: sin esta detección, doble escala (canvas + iframe) → margen gris. Detectar iframe + render a tamaño real elimina el problema sin tocar el dev-view standalone.
- **Idle timeout en `(kiosk)/home/layout.tsx`** (no en cada page): un solo timer global cubre TODAS las rutas dentro de /home. Si cambias de /home a /home/restaurants, el timer NO se reinicia (correcto: actividad ya hubo).
- **AI greeting + suggested questions como i18n con fallback al config**: backwards compat con clientes que no traduzcan, y deja la opción de agregar keys más tarde sin tocar código (Fase S4 i18n editor).
- **`<a>` navigation: preventDefault, no stopPropagation**: la navegación nativa del browser para `<a href>` requiere preventDefault explícito. stopPropagation solo detiene event bubble, no comportamiento default. Lección general que aplica a otros nested-link cases.

**Fase:** Studio S0 cloud + S1 completa (2026-04-28). Siguiente arranque debe ser **Fase S2 (Modules tab)**.

---

### Sesión 2026-04-29 — Studio S2 cerrada

**Hecho:**

- **Sidebar restructurado** (17 secciones): Branding · Modules · Billboard · Home Dashboard · AI Avatar · Survey · Deals · Photo Booth · Digital Brochure · Social Wall · Guestbook · Content · Languages · Ads · Integrations · Versions · Publish.
- **Modules tab** con 19 master switches (16 home tiles + Ads + Languages + AI Avatar). Iconos Lucide consistentes.
- **Billboard tab**: variant selector visual (4 cards con preview gradient + check) + slider idle timeout 15-300s.
- **Home Dashboard tab**: drag&drop framer Reorder + toggle visibility + rename inline. Filtra por toggles activos en Modules.
- **AI Avatar tab**: avatar/heroVideo upload, greeting con `{client_name}`, suggested questions add/remove, modelo Anthropic + API key (server-side only).
- **Branding tab**: 4 ImageField compact (Default/Idle/Footer/Favicon), CustomFontField drag&drop `.woff2/.woff/.ttf/.otf` con `@font-face` runtime injection, botón "Suggest a palette from a logo" funcional con histograma RGB cuantizado en buckets de 32 niveles.
- **TrueOmniLogo**: `slot="default"|"idle"|"footer"|"brand"` con cache global `window.__kioskLogos` para sobrevivir re-mounts en cambios de ruta del iframe.
- **BillboardLiveSwitcher**: client wrapper que cambia el variant en vivo desde el editor sin recargar.
- **Disabled state en sidebar**: si toggle de Module está OFF → tab gris con Lock icon, no clickable, salto auto a Modules si la activa se desactiva.
- **Backfill defensivo**: GET /api/studio/configs/[slug] y página server-side rellenan billboard/aiAvatar/modules con defaults para clientes pre-S2 + merge de systemModules legacy.
- **Bridge ampliado**: `studio:branding-update` (logos/fonts/custom) + `studio:modules-update` (tiles + systemModules) + `studio:billboard-update` + `studio:ai-avatar-update`. Re-emit en handshake `studio:ready`.
- **Fixes runtime**: idle popup ahora con grid centering (evita conflicto translate%+motion+iframe-scale), Touch Here del Billboard 0 con `font-display`, Billboards 1-4 con `LanguageDropdown` funcional (antes `EnglishButton` decorativo).
- **API PATCH `[slug]`** acepta `branding | modules | billboard | aiAvatar` independientes con validación zod por sección.

**Verificado:**

- `pnpm typecheck` limpio.
- `pnpm lint` solo errores pre-existentes del kiosk (photo-booth, itinerary, language-dropdown, directions-modal). Cero errores en archivos del Studio S2.
- E2E manual:
  - Cambiar variant 0→3 en Billboard → iframe cambia layout en <300ms.
  - Toggle Survey OFF en Modules → tab Survey del sidebar gris + Home Dashboard ya no muestra Survey + grid del Home iframe oculta el tile.
  - Subir logo PNG en Idle/Billboard → centro del Billboard renderiza la imagen.
  - Custom font `.woff2` drag&drop en Display → kiosk re-renderiza tipografía.
  - Cmd+S → PATCH manda solo secciones sucias → reload conserva.
  - Cliente nuevo → seed completo con defaults.

**Pendiente / siguiente:**

- **Fase S3 — Content/Data por módulo:** S3.1 Survey editor → S3.2 Deals → S3.3 Photo Booth → S3.4 Digital Brochure → S3.5 Social Wall → S3.6 Guestbook → S3.7 Listings/Events/Tickets/Passes/Trails.
- **Color picker pro** (`react-colorful`) en lugar de `<input type="color">` nativo.
- **Vercel Blob** cuando logos/fonts data URLs crezcan (cap KV ~512KB/value, custom font puede ocupar 600KB).
- **StudioBridge `getCachedLogoOverride`** ahora soporta 3 slots; verificar sin regresiones cuando se persistan custom fonts en KV con clientes que tengan ambos slots.

**Decisiones:**

- **TrueOmniLogo client + slot prop**: convertir el SVG inline en client component permite escuchar `kiosk:logo-override` y reemplazar por `<img>` cuando hay override. `slot="brand"` queda inmutable (Powered by TrueOmni — marca propia). Cache global `window.__kioskLogos` resuelve race conditions en re-mounts.
- **systemModules con shape extendido (19 fields)**: master switches por cada módulo. El Home Dashboard filtra por estos toggles antes de mostrar. Doble nivel: Module enabled (vendido al cliente) + Tile enabled (visible en grid). Backfill mergea shapes legacy.
- **BillboardLiveSwitcher**: el page idle es server component pero se delega el switching a un client wrapper que escucha el override sin recargar. Mantiene KioskCanvas a tamaño real dentro del iframe.
- **Logos diferenciados (default/idle/footer)**: cliente real necesita 3 versiones del logo (header pequeño, idle grande centrado, footer pequeño en la banda). Antes era 1 solo, ahora son 3 separados con slot prop.
- **CustomFont @font-face runtime**: drag&drop genera data URL → bridge inyecta `<style>` con `@font-face` en el iframe. CSS vars `--font-display`/`--font-sans` apuntan al custom name. Persistencia en KV (provisional hasta migrar a Vercel Blob).
- **Sidebar disabled = gris + Lock + no clickable**: comunicar visualmente "este módulo no está vendido al cliente". Click muestra tooltip "Turn X on in the Modules tab to edit it". Si la tab activa se desactiva, salto auto a Modules.

**Fase:** Studio S2 cerrada (2026-04-29). Siguiente arranque: **S3.1 Survey editor**.

---

### Sesión 2026-04-29 (cont.) — Studio S3.1–S3.6 cerradas (6 editores de módulo)

**Hecho — patrón uniforme aplicado a 6 módulos** (Survey · Deals · Photo Booth · Digital Brochure · Social Wall · Guestbook):

Para cada uno se entregó:

1. **Schema zod completo** en `src/lib/studio/schema.ts` (replica fiel del schema del kiosk, con discriminated unions donde aplica, IDs únicos, refinamientos por sub-tipo).
2. **API PATCH** acepta el sub-key con validación zod + checks de unicidad de IDs/slugs + checks cruzados (ej. `survey.questions[].id` único, `deals[].slug` único, `brochures[].category ∈ categories`, `photoBooth.timer.default ∈ timer.options`, `guestbook` IDs únicos por sub-lista, `country.code` únicos).
3. **Backfill defensivo** en `GET /api/studio/configs/[slug]` y en la página server-side `studio/[slug]/page.tsx`: clientes pre-S3 reciben defaults para cada nuevo sub-key.
4. **Bridge ampliado** en `use-preview-bridge.ts`: `pushX` debounced 120-200 ms + `openXPreview` que navega el iframe a `/home/<modulo>` + re-emit en handshake `studio:ready`.
5. **StudioBridge kiosk** (`studio-bridge.tsx`) escucha `studio:<modulo>-update` y `studio:<modulo>-open-preview`, dispatcha `kiosk:<modulo>-override` event, navega cuando es preview.
6. **Module kiosk runtime** (cada uno: `survey-host.tsx`, `deals-module.tsx`, `photo-booth-module.tsx`, `brochures-module.tsx`, `social-wall-module.tsx`, `guestbook-module.tsx`) con override en vivo via `useState<X | null>` + `useEffect` listener. Reemplaza props originales sin recargar. Casos especiales:
   - **SurveyHost**: re-monta el overlay con `key` cuando cambia el set de preguntas.
   - **DealsModule**: filtra activos por expiración (filterActiveDeals) sigue funcionando.
   - **PhotoBoothModule**: re-genera `resolvedBackgrounds/Frames/Stickers` con `useMemo` aplicando `resolvePhotoBoothAsset` (que ahora también pasa-thru `data:`/`blob:` URLs).
   - **BrochuresModule**: si la categoría activa se borra del catálogo, fallback a 'all'.
   - **SocialWallModule**: si la source activa pierde su handle, fallback a 'all'.
7. **Editor UI** completo en `src/app/studio/_components/<X>Editor.tsx` con drag&drop framer Reorder, accordion expandible, asset uploads (compact ImageField), botón "Preview" en cabecera, dirty tracking.
8. **Shell** acumula state `<x>`/`saved<X>`/`<x>Dirty` + push debounced + save independiente que solo manda secciones sucias en un PATCH.

**Componentes nuevos en `src/app/studio/_components/`:**

- `SurveyEditor.tsx` — discriminated union 5 tipos (nps/rating/single-choice/multi-choice/text), add/remove options inline, contact capture, thank-you.
- `DealsEditor.tsx` — list drag&drop, expira con badge rojo "Expired Xd ago", clone, FeatureChips multi-select, TagsEditor del catalog.
- `PhotoBoothEditor.tsx` — 5 sub-tabs (Settings · Backgrounds · Frames · Filters · Stickers), Filter presets visuales con CSS filter live preview ("Aa"), TimerOptionsEditor con default marker.
- `BrochuresEditor.tsx` — categories chips drag&drop horizontal con re-asignación automática de orphans, list de brochures con PdfField.
- `PdfField.tsx` (nuevo helper) — drag&drop `.pdf` max 8MB, **auto-detecta page count** parseando `/Type /Page` en binario.
- `SocialWallEditor.tsx` — 6 sources (X/Instagram/Pinterest/YouTube/Facebook/TikTok), handles connector con icono iluminado, highlights drag&drop, posts con campos type-specific (image/video/text/gallery), add post buttons solo para sources con handle.
- `GuestbookEditor.tsx` — 4 sub-tabs (Module · Pin catalog · Seed pins · Countries), earthStart center+zoom, drag&drop reorder, validación de country codes ISO.

**Schemas/defaults en `schema.ts`:**

- `SurveySchema`, `DealSchema` + `DealsModuleSchema`, `PhotoBoothSchema` + 5 sub-schemas, `BrochureItemSchema` + `BrochuresModuleSchema`, `SocialPostSchema` + `SocialWallSchema`, `GuestbookSchema` + sub-schemas.
- `DEFAULT_SURVEY` (3 questions seed), `DEFAULT_DEALS` (vacío con 4 categorías), `DEFAULT_PHOTO_BOOTH` (1 background, 3 filtros, timer 5s), `DEFAULT_BROCHURES` (4 categorías), `DEFAULT_SOCIAL_WALL` (vacío), `DEFAULT_GUESTBOOK` (1 pin + 10 countries comunes + earth view).
- Helpers `newSurveyQuestionId`, `newDealSlug`/`makeBlankDeal`, `newPhotoBoothId`, `newBrochureSlug`/`makeBlankBrochure`, `newSocialId`/`makeBlankSocialPost`, `newGuestbookId`/`makeBlankSeedPin`/`makeBlankPinOption`.

**Verificado:**

- `pnpm typecheck` limpio en cada iteración (~80 ediciones).
- E2E manual de cada módulo: editar → live preview <300 ms → save → reload → cambios persisten.

**Pendiente / siguiente:**

- **S3.7 — Content tab**: CRUD masivo de listings/events/tickets/passes/trails (los 5 módulos con catálogos grandes que aún no tienen editor). Reusa el patrón establecido en S3.1–S3.6.
- **S4 — i18n editor** side-by-side de los 6 idiomas + AI translate.
- **S5 — Ads system** (subir + calendarizar + emplazar).
- **S6 — Integraciones** (weather + Mapbox + Analytics).
- **S7 — Auth + Vercel + GitHub PR-publish** con approval gate.
- **Vercel Blob** cuando los uploads pesados (PDFs 8MB, fonts 600KB, fotos) crezcan en KV.

**Decisiones:**

- **Bridge debounced por sub-key**: cada módulo tiene su propio debounce timer (80–200 ms según peso del payload). Re-emit en `studio:ready` cubre re-mounts del iframe sin perder state.
- **Override por evento window CustomEvent**: en lugar de un context provider global, cada módulo client del kiosk se suscribe a su evento (`kiosk:<module>-override`) y mantiene state local con `useState<X | null>`. El override SUSTITUYE props originales (no merge), simple y predecible.
- **JSON.stringify para deep equality del dirty tracking**: simpler que escribir comparadores estructurales para 6 schemas distintos. El cost es aceptable porque solo corre en useMemo con dependencies.
- **Auto page count del PDF**: heurística parseando `/Type /Page` en el binario evita dependencia de `pdf.js` en el Studio. Funciona para >95% de PDFs no-encriptados.
- **PhotoBooth `resolvePhotoBoothAsset` ampliado** con `data:` y `blob:` pass-thru: las imágenes subidas al Studio entran como data URLs y deben funcionar tanto en preview como en futuro publish.
- **Brochures categories drag&drop con re-asignación de orphans**: si borras una categoría, las brochures con esa categoría se re-asignan auto a la primera disponible. Evita estados inválidos sin requerir confirmación del usuario.
- **Social handles habilitan tabs**: solo aparecen botones "Add post" para sources con handle conectado. Si no hay handles, warning amber.

**Fase:** Studio S3.6 Guestbook cerrada (2026-04-29). Siguiente arranque: **S3.7 Content (Listings/Events/Tickets/Passes/Trails)**.

---

### Sesión 2026-04-29 — S3.7 Content tab + UX masivo + Listing modules dinámicos

**Hecho:**

- **Spec + plan S3.7** (`44f125e`, `1168398`) — `docs/superpowers/specs/2026-04-29-studio-s3-7-content-tab-design.md` + `.planning/S3-7-PLAN.md` con 12 tareas atómicas.
- **S3.7 tasks 1-12** (`7e27a6b`..`a151ce7`): schemas zod 5 catálogos, API PATCH/GET + backfill + cap 480KB, bridge con 5 message types, listeners decentralizados en 5 módulos kiosk, 7 catalog primitives (CatalogList/Toolbar/ItemForm/ItemPanel/TaxonomyEditor/ImageUrlField/LatLngField), 5 editores (Listings 3 sub-tabs, Events con PricePaidFields, Tickets wrapper derivado, Passes con activities, Trails con considerations + GeoJSON), 5 tabs nuevas en sidebar + wiring Shell.
- **Build fixes** (`36093fa`, `1ad640e`): extraído `photo-booth-asset.ts` puro fuera de server-only + 7 lint errors pre-existing limpiados + `not-found.tsx` + `global-error.tsx` + `force-dynamic` en root layout + `alwaysShowWelcome={true}` hardcoded eliminado.
- **UX-1**: sidebar sin "01·S1" labels + "Billboard" → "Idle / Billboard" (`2466ed2`).
- **UX-2**: Versions movido del sidebar al TopBar como botón con icono History (`7423ccd`).
- **UX-3**: Modules tab con 3 secciones (Listing/Home/Global) — Trails movido a Listing modules como system catalog (`06d1137` + `4dcc0e6`).
- **UX-4**: light mode pass en 7 catalog primitives + per-item edit panel (full-screen takeover dentro del editor pane, reemplaza inline accordion). Add item → entra a edit directo (`d06b0e8`).
- **UX-5a/b/c**: **Listing modules dinámicos**. Schema cambió de `{restaurants, thingsToDo, stay}` fijo a `array` de `ListingsCatalogEntry` con `key/label/iconKey/enabled/catalog`. `migrateListings()` defensiva para clientes pre-cambio. ModulesEditor con Add/Duplicate/Delete/Toggle/Rename + sync bidireccional con `modules.tiles[]`. ListingsEditor sub-tabs dinámicos. Kiosk ListingsModule consume payload array (`6ebc4d2` + `de4bfb2`).
- **3 fixes UX**: headers duplicados quitados de los 5 editores, EventsEditor 3-col→2-col, Trails reubicado en Listing modules section, GuestbookPinOptionSchema.image relax `min(1)` → resuelve "Invalid config" 400 al crear cliente nuevo (`4dcc0e6`).
- **Rename Trip Planner**: 25 archivos, 42 líneas — todas las ocurrencias de "Itinerary Builder" → "Trip Planner". Slugs internos (URL `itinerary-builder`, schema key `itineraryBuilder`) **conservados** (`ab67200`).

**Verificado:**

- `pnpm typecheck` y `pnpm lint` limpios después de cada commit.
- Smoke E2E con Playwright: `/studio/default` carga 200, las 21 tabs del sidebar visibles, navegación a Listings carga editor, "Add listing" entra a edit panel, light/dark mode con buen contraste, Modules tab muestra Listing modules section con Add/Duplicate/Delete/Toggle, "Add Shopping" crea entry + sub-tab + tile sincronizado, POST `/api/studio/configs` para crear cliente nuevo responde 201.
- `pnpm kiosk:dev` arranca en `localhost:3000` sin errores.
- ⚠️ `pnpm build` falla en SSG `/404` con error interno Next 15 (pre-existing, no introducido en sesión).

**Pendiente / siguiente:**

- **Arrancar S3.8 — Bulk import CSV/JSON** (diseño aprobado, plan listo, no empezado por límite de contexto). 3 tareas: (1) `import-helpers.ts` core, (2) `ImportModal.tsx` + `CatalogToolbar` prop, (3) wire en 4 editores + smoke E2E. Estimado 1 sesión.
- **Galería de imágenes por cliente** (S3 también, complementa al Bulk import).
- **Build SSG `/404`** debugging dedicado — bloqueante para Vercel deploy en S7.
- **TODOs colaterales**: LLM real Ask AI (`/api/ai` con Anthropic SDK), voice lang dinámico, Map aggregator para trails source.
- **Fases siguientes**: S4 i18n editor → S5 Ads → S6 Integraciones → S7 Auth + Publish.

**Decisiones:**

- **Schema dinámico de Listings via array de entries** (en lugar de keys fijos camelCase) — permite Shopping/Beaches/etc. sin tocar runtime. La migración `migrateListings(raw)` detecta el shape viejo y convierte idempotente. El kiosk runtime busca por `entry.key === moduleKey` en lugar del mapping `MODULE_KEY_TO_LISTINGS_CATALOG` viejo.
- **Sync bidireccional Listing modules ↔ tiles[]**: cuando se crea/borra/renombra/togglea un listing module, también se actualiza el tile correspondiente en `modules.tiles[]`. Single source of truth implícito (listings array es fuente para listing-style; tiles[] mantiene orden general del Home grid).
- **HomeShell del kiosk acepta tiles override que no existen en server**: si llega un tile via `kiosk:modules-override` con key desconocido (módulo nuevo del Studio), renderiza con HomeTile placeholder. Permite preview live de modules dinámicos.
- **Per-item edit es full-screen takeover dentro del editor pane** (no modal ni split). Mantiene live preview iframe visible a la derecha mientras editás.
- **CSV import será secundario a JSON**: JSON es export → re-import roundtrip perfecto; CSV soportará campos top-level con `;`-separated arrays + `lat,lng` coords. Subobjetos complejos (event.ticket, trail.considerations) skip en CSV → quedan defaults.
- **Slugs internos `itinerary-builder` y `itineraryBuilder` conservados** al renombrar visible a "Trip Planner" — cambiar la URL rompería favoritos guardados con slug viejo + redirects + tile keys del schema.

**Fase:** Studio S3.7 cerrada + iteraciones UX masivas (2026-04-29). Siguiente arranque: **S3.8 Bulk import CSV/JSON**.

---

### Sesión 2026-04-29 (cont.) — Studio S3.8 cerrada — Bulk import CSV/JSON con export roundtrip y toast

**Hecho:**

- **Spec + plan S3.8** — `docs/superpowers/specs/2026-04-29-studio-s3-8-bulk-import-design.md` + `.planning/S3-8-PLAN.md` con 3 tareas atómicas (importar 4 catálogos: Listings/Events/Passes/Trails; Tickets queda fuera por ser derivado).
- **T1 — `src/app/studio/_lib/import-helpers.ts`**: parser CSV RFC 4180 (quoted fields, `\r\n`, double-quote escape), 4 specs por kind (`listings`/`events`/`passes`/`trails`) con coercers `string|number|bool|array|coords`, auto-slug desde title, dedupe por slug, `normalizeImport()` con stats `{added,updated,skipped,errors,total}`, `detectFormat()` por extensión + content sniff. Tipos `ImportKind`/`ImportMode`/`ImportItem<K>`/`ImportResult<K>`/`ImportRowError`/`ImportStats` exportados.
- **T2 — `ImportModal.tsx`**: drop zone full-screen con drag&drop + click, preview de hasta 10 filas, stats con tone (valid/added·updated/errors), errores por fila colapsables (5 + "show more"), modo radio merge/replace, descarga template CSV. Esc cierra. Cambio `onImport` para pasar también `stats`. `CatalogToolbar` gana props opcionales `onImport`/`onExport`/`exportEnabled`.
- **T3 — Wiring en 4 editores** (`Events|Passes|Trails|ListingsEditor`): state `importOpen` + `lastImport` por editor, `handleImport(items, mode, stats)` con upsert por slug en merge / replace clean, `mergeTaxonomy()` recolecta tags/categories/venues/subcategories vacíos desde los items importados (max 100 entries de 64 chars), `handleExport(format)` que descarga `<entry|kind>-YYYY-MM-DD.{csv,json}`. ListingsEditor opera sobre la entry activa (`catalog.listings`).
- **Pulido S3.8.1** — `import-helpers.ts` ganó `serializeCsv`/`serializeJson`/`serializeCatalog` (RFC4180 escape, columnas idénticas a las del import → roundtrip simétrico). Nuevos: `ImportToast.tsx` (banner verde con `role=status`, autodescarte 4s, framer-motion fade), `export-utils.ts` (`downloadCatalog()` genera blob + dispara click). `CatalogToolbar` ganó `ExportButton` con dropdown CSV/JSON cerrable por click-fuera y Esc.
- **Helpers compartidos** — `import-utils.ts` con `upsertBySlug<T>` (mantiene orden de existentes, appendea nuevos al final) + `mergeTaxonomy()` que solo recolecta si `current` está vacío.

**Verificado:**

- `pnpm typecheck` y `pnpm lint` limpios (sólo warnings preexistentes de `react-hooks/exhaustive-deps` en kiosk).
- E2E completo con Playwright en `localhost:3001/studio/default`:
  - Tab Events → click Import → drop CSV con 3 filas (2 válidas + 1 con `bad-date`) → modal muestra "VALID 2 · ADDED·UPDATED 2·0 · ERRORS 1" + "row 4: date must be YYYY-MM-DD" en lista de errores → preview 2 filas → click "Import 2 events" → modal cierra, items "Luna Festival"/"Downtown Art Walk" aparecen en CatalogList.
  - Toast verde "2 events imported (2 added · 0 updated)" con `role=status`.
  - Botón Export aparece habilitado tras tener items.
  - **Roundtrip JSON**: click Export → Download JSON → blob capturado vía override de `URL.createObjectURL` → JSON parseado correctamente con shape `{events: [...]}`. Re-importar ese JSON en modo `replace` → toast "2 events imported (0 added · 2 updated)" → titles iguales.
  - Listings/Passes/Trails muestran botón Import. Tickets no (correcto — derivado).

**Pendiente / siguiente:**

- **`pnpm build` SSG `/404`** — bloqueante para Vercel/S7. Requiere aprobación explícita para correr build (CLAUDE.md). Sesión dedicada.
- **S4 — i18n editor side-by-side** con AI translate (`@anthropic-ai/sdk`). Siguiente fase del roadmap. Sesión fresca.
- **Galería de imágenes por cliente** — complemento natural del Bulk Import; bloqueado por Vercel Blob (S5/S6).
- **TODOs colaterales sin tocar**: LLM real Ask AI, voice lang dinámico, Map aggregator para trails.

**Decisiones:**

- **Un único commit `feat` para S3.8 + S3.8.1** en lugar de splittear: ambos son la misma sub-fase y los cambios en editores/toolbar están intermezclados; CLAUDE.md prohíbe mezclar **fases** (no subfases). Se mantiene atomicidad real.
- **Export columnas idénticas a las de Import** (mismo `csvSpecs` por kind): roundtrip simétrico garantizado. Para JSON el shape `{[kind]: [...]}` admite también arrays sueltos `[...]` y `{items: [...]}` en `extractJsonArray()`.
- **Override de `onImport` con stats** (en vez de prop `onComplete` separada): un solo punto de entrada al editor, simpler. El editor decide qué hacer con los stats (toast ahora, log futuro).
- **Tickets fuera del bulk import**: es wrapper derivado de Events sin catálogo propio. Re-derivación automática vía postMessage del listener kiosk sigue funcionando tras cada import a Events.
- **mergeTaxonomy idempotente sólo si current vacío**: evita pisar configuraciones del operador. Si quieren rebuild full, primero limpian taxonomies y luego re-importan.
- **Auto-slug desde title** en CSV cuando falta `slug` (kebab-case + recorte 64): permite hojas Excel sin columna slug, requisito común de clientes reales.
- **Descarga blob roundtrip** preservó el `URL.createObjectURL` y `a.click()` reales: la única manera fiable de iniciar una descarga desde el cliente sin librerías.

**Fase:** Studio S3.8 cerrada (2026-04-29). Siguiente arranque candidatos: **build SSG fix** (corto, bloqueante deploy) o **S4 i18n editor** (siguiente fase del roadmap).

---

### Sesión 2026-04-29 (cont. 2) — Studio S4 base cerrada — i18n editor side-by-side

**Hecho:**

- **Spec + plan S4** — `docs/superpowers/specs/2026-04-29-studio-s4-i18n-design.md` + `.planning/S4-PLAN.md` con 3 tareas atómicas. AI translate explícitamente fuera de scope → S4.1 en sesión nueva (requiere `pnpm add @anthropic-ai/sdk` + `ANTHROPIC_API_KEY`).
- **T1 — Schema + endpoint i18n** — añadidos a `src/lib/studio/schema.ts`: `LOCALES = ['en','es','fr','de','pt','ja']`, `Locale`, `LocaleStrings`, `I18nBundleSchema`, `defaultI18nBundle()`. Nueva `kvKeys.i18n(slug)` en `kv.ts`. Endpoint `/api/studio/i18n/[slug]/route.ts` con GET (con bootstrap desde filesystem usando `loadLocale` + fallback a `_template`) y PATCH (acepta `{bundle}` o `{patch}` con merge profundo, valida zod, cap 480KB).
- **T2 — `I18nEditor.tsx`** — toolbar (search + filtro de secciones derivadas del prefijo antes del primer `_` con count + Add key), banner de missing translations por locale (verde si todo OK / ámbar con counters por columna si hay missing), tabla con header sticky de 7 columnas (Key + 6 locales), `I18nRow` por key con `I18nCell` por locale. La celda es un textarea controlado con draft local que solo commitea en blur (evita firefox-de-renders mientras el usuario escribe). EN marcada con estrella (⭐ canónico). Celdas faltantes con borde ámbar + placeholder "missing". Auto-grow rows entre 1-6.
- **T3 — Wiring + smoke** — `api-client.ts` con `getI18n(slug)` + `patchI18n(slug, bundle)`. `Shell.tsx` añade state `i18nBundle`/`savedI18nBundle`/`i18nLoaded`, useEffect inicial que carga vía `getI18n` (no bloquea UI; default vacío hasta que llega), `i18nDirty` solo cuenta si `i18nLoaded`, `handleSave` despacha `patchI18n` en paralelo con `patchConfig` (Promise.all), `handleDiscard` resetea bundle al saved. `EditorPanel.tsx` añade props `i18nBundle`/`onI18nBundleChange` + branch para `sectionKey === 'i18n'` → `<I18nEditor />`. La tab Languages (key `i18n`, sección 17) ya estaba registrada en `sections.ts`.

**Verificado:**

- `pnpm typecheck` y `pnpm lint` limpios (sólo warnings preexistentes de `react-hooks/exhaustive-deps` en kiosk).
- E2E con Playwright en `localhost:3001/studio/default`:
  - Click Languages → tabla con **361 keys** y **24 secciones** detectadas (`ai (44)`, `billboard (3)`, `cta (2)`, `deals (15)`, etc.).
  - Search "tile_label_restaurants" filtra a 1 fila.
  - Editar celda ES → "Restaurantes (test S4)", blur → SaveBar pasa de "Saved" → "Save" → Cmd+S → "Saving…" → 200 OK.
  - GET `/api/studio/i18n/default` confirma `bundle.es.tile_label_restaurants === "Restaurantes (test S4)"`.
  - Reload página + navegar a Languages → valor persiste tras refresh.
  - Restaurado a "Restaurantes" via PATCH `{patch: {es: {tile_label_restaurants: "Restaurantes"}}}` → 200 OK.

**Pendiente / siguiente:**

- **S4.1 — AI translate** (siguiente sub-fase): instalar `@anthropic-ai/sdk`, añadir `ANTHROPIC_API_KEY` a `.env.local`, endpoint `POST /api/studio/i18n/translate` con `claude-haiku-4-5` y prompt caching, botón ✨ en cada celda missing.
- **Build SSG `/404`** sigue pendiente (gated por aprobación explícita de `pnpm build`).
- **S5 Ads system**, **S6 Integraciones**, **S7 Auth + Publish** (siguientes fases del Studio).
- **Galería de imágenes por cliente** (bloqueado por Vercel Blob → S5/S6).

**Decisiones:**

- **Storage separado en KV (`i18n:<slug>`)** en vez de meterlo en `KioskConfig`: evita inflar el JSON principal, mantiene los PATCH bajo el cap 480KB, y simplifica el bridge (no re-bota todo el config cada vez que cambia una traducción). El bundle pesa ~65KB con 363 keys × 6 locales.
- **Bootstrap defensivo desde filesystem**: GET sin valor en KV lee `clients/<slug>/i18n/*.json` y fallback a `clients/_template/i18n/*.json`. Idempotente; cliente legacy ve sus traducciones desde el primer fetch sin perder data.
- **PATCH acepta full `bundle` o `patch` parcial**: API flexible — el editor manda el bundle entero (simple), pero el patch parcial está disponible para futuro AI translate (1 celda) o restore (como hicimos en el smoke).
- **Draft local en `I18nCell` con commit en blur**: textareas controladas con re-render por celda × 6 columnas × 360 filas serían lentas en cada keystroke. Draft local + commit on blur mantiene el editor responsive.
- **No live-preview kiosk override por evento**: scope reducido. El kiosk runtime hoy lee i18n del filesystem en SSR; el live preview de cambios desde el Studio queda como mejora opcional (S4.2 si pide). El editor funciona perfectamente sin ello para el caso real (editar → save → preview iframe se refresca al "publish" del flow normal).
- **AI translate fuera de scope**: requiere instalar SDK + secret en .env. Decisión consciente para mantener S4 base entregable en una sesión sin pausas.

**Fase:** Studio S4 base cerrada (2026-04-29). Siguiente arranque: **S4.1 AI translate** o **S5 Ads system**.

---

### Sesión 2026-04-29 (cont. 3) — Studio S4.1 cerrada — AI translate con Anthropic SDK

**Hecho:**

- **`pnpm add @anthropic-ai/sdk@0.91.1`** — SDK oficial añadido a dependencies.
- **Endpoint `POST /api/studio/i18n/translate`** — usa `claude-haiku-4-5` (modelo más rápido + barato para traducción UI), `max_tokens: 256`. System prompt cacheado con `cache_control: { type: 'ephemeral' }` (cuts costo en >90% tras la 2ª llamada). Reglas explícitas en el prompt: solo output, conserva `{placeholders}` y `\n`, tono UI conciso, polite-modern para JA, formal Sie/vous para DE/FR. Guard claro: si falta `ANTHROPIC_API_KEY`, responde 503 con mensaje "Add it to .env.local and restart…". Validación de `fromLocale`/`toLocale` ∈ LOCALES; si son iguales, devuelve el texto sin llamar al modelo.
- **`api-client.translateI18nText(input)`** — wrapper de fetch.
- **Botón ✨ en `I18nCell`** — Sparkles icon (Lucide) en absolute top-1 right-1 dentro de un `<div relative>` que envuelve el textarea. Aparece SOLO si la celda es missing y existe `enValue` para esa key. Loading spinner (Loader2 animate-spin) durante el request. Tras éxito, `setDraft(translation)` + `onCommit(translation)`. Disabled mientras traduce.
- **Banner de error** en el editor — `role="alert"` rojo con mensaje del backend ("Translate failed: …") + botón "Dismiss". Se setea desde el cell vía prop `onTranslateError`.
- **`.env.example`** — añadida sección documentando `ANTHROPIC_API_KEY` (comentado por defecto).

**Verificado:**

- `pnpm typecheck` y `pnpm lint` limpios.
- E2E con Playwright sin API key configurada:
  - Borrar valor ES de `tile_label_restaurants` desde la UI (focus → blur con value vacío).
  - Botón ✨ con `aria-label="Translate to es with AI"` aparece tras commit.
  - Click → endpoint responde **503** con mensaje "ANTHROPIC_API_KEY not set. Add it to .env.local and restart the dev server to enable AI translate."
  - Banner rojo "Translate failed: 503 Service Unavailable — …" visible con Dismiss.
- El path feliz (con API key real) NO se ejecutó porque la key no está en `.env.local`. La verificación queda al usuario tras añadirla. El comportamiento del modelo y el prompt están definidos arriba.

**Pendiente / siguiente:**

- **Verificar el path feliz** cuando Rubén añada `ANTHROPIC_API_KEY` a `.env.local` y reinicie. La vuelta a `.env.local` no requiere cambios de código.
- **S5 Ads system** (siguiente fase).
- **S6 Integraciones**, **S7 Auth + Publish**.
- **Build SSG `/404`** (gated por `pnpm build` aprobación).
- **Galería de imágenes por cliente** (bloqueado por Vercel Blob → S5/S6).

**Decisiones:**

- **`claude-haiku-4-5` en vez de Sonnet/Opus**: traducción UI de 1-3 palabras es trivial, Haiku es ~3x más rápido y >5x más barato. Si Rubén nota calidad insuficiente, switch trivial al modelo en el endpoint (1 string).
- **Prompt caching del system prompt**: el system prompt es ~700 tokens y se reutiliza en cada llamada → con `cache_control: ephemeral` se beneficia del cache de 5 min de Anthropic. Si un usuario traduce 30 celdas seguidas, el costo se desploma desde la 2ª.
- **Endpoint server-side, no SDK en el cliente**: la API key es secret. Nunca tocar Anthropic SDK desde Client Components.
- **503 vs 500 si falta key**: 503 (Service Unavailable) es semánticamente correcto — el servicio existe pero no está configurado. Permite al frontend distinguir "config issue" de "real error".
- **Botón en celda missing solo (no en celdas con valor)**: evita destruir traducciones humanas existentes. Si quieres re-traducir algo, vacía la celda primero.
- **Commit automático tras éxito** (no espera blur del usuario): la traducción es la respuesta autoritativa del modelo; persistirla inmediatamente reduce fricción.

**Fase:** Studio S4.1 cerrada (2026-04-29). Siguiente arranque: **S5 Ads system** (o validar path feliz S4.1 cuando Rubén añada la key).

---

### Sesión 2026-04-29 (cont. 4) — Studio S5 base cerrada — Ads system editor

**Hecho:**

- **Plan S5** — `.planning/S5-PLAN.md` con 3 tareas atómicas. Bulk import + bridge live preview explícitamente fuera de S5 (S5.1 si se pide).
- **T1 — Schema + endpoint** — añadidos a `src/lib/studio/schema.ts`: `AD_KINDS = ['popup','hero','bottom']`, `AD_THEMES`, `AdSchema`, `AdsModuleSchema` (con `uniqueById` superRefine), `defaultAds()`, `makeBlankAd(kind?)`. `KioskConfigSchema` ahora tiene `ads: AdsModuleSchema.optional()`. `makeBlankConfig` incluye `ads: defaultAds()`. Endpoint `/api/studio/configs/[slug]/route.ts` actualiza `hydrateConfig` con `cfg.ads ?? defaultAds()`, body schema gana `ads?`, branch PATCH valida con `AdsModuleSchema.safeParse`.
- **T2 — `AdsEditor.tsx`** — toolbar (search por id/alt/route + filtro por kind con counts + Add ad), lista con thumbnail 48×48 contain, KindBadge color-coded (popup amber, hero sky, bottom emerald), iconos hover por fila (toggle eye/Eye, duplicate, delete), per-item edit panel con campos: ID (kebab editable), Kind (select), Image (ImageUrlField), Alt text, Routes (textarea multi-line con hint sobre `/home/*` prefix matching), Theme (select dark/light), Enabled (checkbox). Empty state con icono Megaphone.
- **T3 — Wiring + smoke** — `Shell` añade state `ads`/`savedAds`/`adsDirty`, payload save, discard, deps. `EditorPanel` añade props + branch `sectionKey === 'ads'` → `<AdsEditor />`. La tab Ads (key `ads`, sección 18) ya estaba registrada.
- **`image` opcional** + filter en `getAdsForRoute` — `AdSchema.image` cambió de `z.string().min(1)` a `z.string().max(2048).default('')`. `src/lib/ads.ts` `getAdsForRoute` ahora filtra `if (!ad.image) continue;` para que ads incompletos NO renderen un `<img src="">` roto. Permite el flow real: crear ad → configurar routes/theme → subir imagen al final.

**Verificado:**

- `pnpm typecheck` y `pnpm lint` limpios.
- E2E con Playwright en `localhost:3001/studio/default`:
  - Tab Ads aparece en sidebar.
  - Lista vacía con empty state "No ads yet" (cliente legacy sin `ads` en KV).
  - Click "Add ad" → entra al edit panel con ID auto-generado (`ad-{Date.now()}`).
  - Rellenar routes (`/home`, `/home/restaurants/*`).
  - Cmd+S → SaveBar pasa a "Saved" → API responde 200.
  - GET `/api/studio/configs/default` confirma el ad en `config.ads.ads[0]` con shape correcto.
  - Cleanup tras smoke: PATCH `{ads: {ads: []}}` deja el cliente limpio.

**Pendiente / siguiente:**

- **S5.1 — bridge live preview de ads** (override por `kiosk:ads-override` event en `useAds`).
- **S5.2 — bulk import CSV/JSON** (reusa el patrón S3.8 — crear AdSchema en csvSpecs + wirear ImportModal).
- **Migración legacy `config.features.advertisements.ads` → `config.ads`**: clientes existentes con ads en filesystem necesitarán que el publish flow (S7) escriba al nuevo path. Por ahora ambos coexisten — el kiosk lee `config.features.advertisements.ads` (legacy), el Studio edita `config.ads`. La conciliación va en S7.
- **S6 Integraciones** y **S7 Auth + Publish** (siguientes fases).

**Decisiones:**

- **`ads` en KioskConfig al mismo nivel que events/listings**, no en `features.advertisements`: el Studio modela los ads como un módulo CRUD igual que el resto. Mantiene el editor consistente. La traducción a `features.advertisements.ads` (donde el kiosk runtime lo lee) la hará el publish flow en S7.
- **`image` opcional en schema + filter en runtime**: balance UX vs strictness. El operador puede crear el ad y configurar todo antes de subir el asset; el kiosk runtime lo omite si está incompleto (no rompe). Coherente con cómo se manejan items incompletos en otros catálogos.
- **`uniqueById` en lugar de `uniqueBySlug`**: ads usan `id` no `slug` (decisión heredada de `Ad` en `src/lib/config.ts` que ya estaba estandarizada en el codebase).
- **No drag&drop reorder en MVP**: ads son pocos por cliente típicamente; un orden visual suficiente con la lista vertical. Si crece la cantidad, S5.1 puede añadir reorder igual que otros catálogos.
- **Color por kind**: popup amber, hero sky, bottom emerald. Coherente con el resto del Studio (sky para acción primaria, amber para warnings/missing) y diferenciable de un vistazo en la lista.

**Fase:** Studio S5 base cerrada (2026-04-29). Siguiente arranque: **S6 Integraciones** o **S5.1 bridge** o **S5.2 bulk import**.

---

### Sesión 2026-04-29 (cont. 5) — Studio S6 cerrada — Integraciones editor + health checks

**Hecho:**

- **Plan S6** — `.planning/S6-PLAN.md` con 3 tareas atómicas.
- **T1 — Schema + endpoint** — `IntegrationsConfigSchema` con sub-objetos `api`/`mapbox`/`analytics`/`weather` (provider radio open-meteo|openweather + apiKey + city + units metric|imperial). `defaultIntegrations()`. Integrado en `KioskConfigSchema` y `makeBlankConfig`. Endpoint `[slug]/route.ts` con backfill defensivo + branch PATCH `body.integrations`. Endpoint dedicado `POST /api/studio/integrations/check` con discriminated union por kind (`mapbox`/`api`/`analytics`/`openweather`), timeout 5s vía AbortController. Mapbox check vía `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=…` → 200 ok / 401 invalid. API check fetch al baseUrl. Analytics solo regex `^(G-[A-Z0-9]+|UA-\d+-\d+)$`. OpenWeather GET con city+key+units → respuesta incluye `name` + `temp` para feedback informativo.
- **T2 — `IntegrationsEditor.tsx`** — 4 cards apiladas con icono lucide en chip sky-tinted: CloudSun/Globe/Map/BarChart3. Cada card con `<Field>` primitive + `TestRow` que renderiza botón Test (disabled hasta que value no está vacío) + status inline verde/rojo con icono Check/AlertCircle. `SecretInput` para tokens (mapbox + openweather apiKey) con toggle Eye/EyeOff. `ProviderRadio` para weather provider y units. Open-Meteo no muestra Test ni campos adicionales (vive de `cliente.coords`).
- **T3 — Wiring** — `api-client` con `checkIntegration(input)` discriminated. `Shell` añade state integrations + dirty + payload save + discard. `EditorPanel` con prop `integrations`/`onIntegrationsChange` y branch `sectionKey === 'integrations'` → `<IntegrationsEditor />`. La tab Integrations (key `integrations`, sección 19) ya estaba en `sections.ts`.

**Verificado:**

- `pnpm typecheck` y `pnpm lint` limpios.
- E2E con Playwright en `localhost:3001/studio/default`:
  - Tab Integrations → 4 cards visibles con titles `Weather/External API/Mapbox/Google Analytics`.
  - Llenar GA ID `G-ABC123XYZ` → click Test → "Format valid (GA4)." (verde).
  - Cmd+S → API responde 200, `config.integrations.analytics.gaId === "G-ABC123XYZ"` en el GET.
  - Llenar Mapbox token bogus `pk.invalidtoken123` → click Test → "Invalid token (401 from Mapbox)." (rojo) — confirma que el call real a Mapbox API funciona.
  - Cleanup: PATCH dejando integrations en defaults vacíos.

**Pendiente / siguiente:**

- **S7 — Auth + Vercel + GitHub PR-publish** (cierre del milestone Studio): NextAuth con admin gate por `ruben@trueomni.com`, deploy a Vercel, publish flow que escribe `clients/<slug>/` desde KV. Es la fase grande pendiente.
- **Build SSG `/404`** (gated por aprobación de `pnpm build`).
- **S5.1 bridge live preview ads** + **S5.2 bulk import ads** (opcionales).
- **S4.1 path feliz** (validar cuando se añada `ANTHROPIC_API_KEY`).
- **Migración legacy `features.advertisements.ads` y `integraciones` → publish flow S7**.

**Decisiones:**

- **Endpoint dedicado `/api/studio/integrations/check`** en lugar de delegar al cliente: la API key de OpenWeather y el secret token Mapbox NO deben tocar el browser. Server-side mantiene los secrets seguros y permite reutilizar el endpoint para futuro health-check periódico.
- **Discriminated union por `kind`** en lugar de 4 endpoints separados: simplifica el routing y la TS de api-client. El switch interno mantiene cada check aislado.
- **Timeout 5s con AbortController**: protección contra integraciones colgadas (Mapbox down, custom API muy lenta) sin congelar el editor.
- **Open-Meteo sin test button**: no hay key que validar; el provider se prueba en runtime cuando el widget pide datos.
- **Analytics check solo regex (no red call)**: validar un GA ID requiere autenticarse con la API de Google Analytics 4, demasiado costoso. La regex captura ~99% de typos.
- **`integrations` separado de `features.integraciones`** legacy: el config.json filesystem existente sigue usando el path en español. La conciliación va al publish flow (S7).
- **`SecretInput` con toggle Eye/EyeOff** para tokens: estándar UX de campos sensibles. Mapbox tokens públicos (`pk.eyJ`) técnicamente no son secret-secret, pero seguimos el patrón por consistencia.

**Fase:** Studio S6 cerrada (2026-04-29). Siguiente arranque: **S7 Auth + Publish** (cierre del milestone Studio) o consolidar follow-ups.

---

### Sesión 2026-04-29 (cont. 6) — Studio S7.0 cerrada — Local publish skeleton (i18n)

**Hecho:**

- **Endpoint `POST /api/studio/publish/[slug]?dryRun=1`** (`src/app/api/studio/publish/[slug]/route.ts`). Lee el i18n bundle del KV (`kvKeys.i18n(slug)`), valida con `I18nBundleSchema`, computa diff por archivo contra `clients/<slug>/i18n/<locale>.json` actual (action `create|update|unchanged` + sizeBefore/sizeAfter). En modo `dryRun` solo devuelve el diff; en modo real escribe los archivos changed con `fs.writeFile`. Validación de slug regex + verificación de que `clients/<slug>/` existe (evita crear clientes nuevos accidentalmente). Mantiene orden de inserción del bundle (no sortea alfabéticamente — sortear generaría ruido masivo en git diff vs los archivos existentes).
- **`api-client.publishToFilesystem(slug, {dryRun?})`** + tipos `PublishFileChange`/`PublishResult`.
- **`PublishModal.tsx`** con phases preview-loading/preview/publishing/done/error: loading spinner → resumen 3 tone (sky create/amber update/muted unchanged) + lista por archivo (path acortado a partir de `clients/`, action badge, size diff) + botón "Publish N files" deshabilitado si nothing-to-publish. Tras éxito: banner verde con "N files written successfully" + botón Close. Esc cierra. `<details>` colapsable para ver "X unchanged files".
- **TopBar**: botón "Request publish" placeholder reescrito a "Publish" con prop `onPublish`. Mantiene el icono Send y el style.
- **Shell**: state `publishOpen` + render del `<PublishModal>` sibling al `<TopBar>` cuya prop `onPublish={() => setPublishOpen(true)}`.

**Verificado:**

- `pnpm typecheck` y `pnpm lint` limpios.
- E2E con Playwright en `localhost:3001/studio/default`:
  - Click "Publish" en TopBar → modal abre con title "Publish to filesystem".
  - DryRun computed automáticamente: 0 create / 1 update / 5 unchanged.
  - 6 archivos en lista (en/es/fr/de/pt/ja). Solo `es.json` marcado update (cambios menores de smokes anteriores, mismo size 18760 → 18760B).
  - Click "Publish 1 file" → "1 file written successfully".
  - `git status` confirma `M clients/default/i18n/es.json`.
  - `git diff` muestra solo reordenamiento de la key `tile_label_restaurants` (mismo valor "Restaurantes"). Diff mínimo ✓.
  - `git checkout clients/default/i18n/es.json` revierte sin pérdida.

**Pendiente / siguiente:**

- **S7.1 — Publish del config.json completo** (mucho más complejo: requiere reconciliar secciones del Studio con el shape legacy de `clients/<slug>/config.json` que tiene `features.advertisements.ads`, `features.integraciones`, `textos`, `navegacion`, `features.home.modules`, etc.). El Studio NO conoce todos esos campos legacy, así que el merge tiene que ser defensivo: leer config.json actual, sustituir solo las secciones gestionadas por el Studio, escribir back. Sesión dedicada.
- **S7.2 — GitHub PR-publish con approval gate**: wrap S7.0+S7.1 en `gh api` o `@octokit/rest` para crear branch + commit + PR. Requiere GitHub OAuth app o PAT en `.env.local`.
- **S7.3 — NextAuth + admin gate** (`ruben@trueomni.com`). Requiere infra OAuth.
- **S7.4 — Vercel deploy** preview/production. Requiere proyecto Vercel + GitHub integration.
- **Build SSG `/404`** sigue gated por aprobación de `pnpm build`.

**Decisiones:**

- **Sub-fase S7.0 antes de S7 completo**: el publish flow tiene 3 capas independientes (escritura local, GitHub PR, auth/deploy). Hacer S7.0 entrega el roundtrip Studio→repo en local + permite que las siguientes capas (PR + auth) lo envuelvan sin reescribirlo. Cada una se puede iterar por separado.
- **Solo i18n en S7.0**: el config.json publish tiene reconciliación legacy compleja que merece sesión dedicada. i18n es 1:1 con archivos (6 locales → 6 archivos), trivial de mappear.
- **`dryRun` como query param**: estándar HTTP. El modal siempre llama dryRun primero para mostrar el diff, luego un POST real al confirmar. Patrón `preview → commit` clásico.
- **No sortear keys alfabéticamente al escribir**: aunque sería técnicamente "limpio" (deterministic order), generaría un commit gigante reordenando 360 keys × 6 archivos en el primer publish. Mantener insertion order del bundle (que viene del filesystem en bootstrap) garantiza diffs mínimos.
- **Verificar que `clients/<slug>/` existe** antes de escribir: el publish flow no debe crear clientes nuevos accidentalmente (eso es responsabilidad del flujo de creación, no de publish).
- **Reescribí "Request publish" → "Publish"**: el placeholder anterior implicaba un approval gate que sigue pendiente para S7.2. Mantener nombre simple ahora; cuando se añada el gate se renombrará a "Request publish" o similar.

**Fase:** Studio S7.0 cerrada (2026-04-29). Siguiente arranque: **S7.1 config publish** o **S7.2 GitHub PR** (necesita PAT) o **S7.3 NextAuth** (necesita OAuth app).

---

### Sesión 2026-04-29 (cont. 7) — S7.1 narrow — Bootstrap defensivo ads/integrations desde filesystem

**Hecho:**

- **Bootstrap defensivo en `hydrateConfig`** del endpoint `/api/studio/configs/[slug]`:
  - La función ahora es async y recibe el slug como argumento.
  - Si `cfg.ads === undefined` o `cfg.integrations === undefined`, lee `clients/<slug>/config.json` del filesystem.
  - `bootstrapAdsFromFs(fsConfig)` mapea `features.advertisements.ads` → Studio `AdsModule` (validado con `AdsModuleSchema.safeParse`).
  - `bootstrapIntegrationsFromFs(fsConfig)` mapea `integraciones` legacy en español → Studio `IntegrationsConfig` en inglés:
    - `api_base_url` → `api.baseUrl`
    - `analytics_id` → `analytics.gaId`
    - `mapbox_token` → `mapbox.token`
    - `weather` se inicializa con defaults (no existe en legacy).
  - Si zod parse falla → fallback a `defaultAds()` / `defaultIntegrations()`.

**Verificado:**

- `pnpm typecheck` limpio.
- E2E con cliente `default` (que ya tiene ads/integrations en KV de smokes anteriores): GET 200, no se dispara el bootstrap (cfg.ads existe). Confirmado que la nueva lógica no rompe el path normal.
- El path real del bootstrap NO se puede smokear sin manipular el KV directamente (cliente legacy con cfg pero sin ads/integrations). La lógica está aislada y typecheck garantiza el flow. Se activará en clientes futuros que vienen de versiones pre-S5/S6.

**Pendiente / siguiente:**

- **S7.1 wide — Publish del config.json completo**: escribir desde Studio al filesystem `clients/<slug>/config.json` + posiblemente `tokens.css`. Requiere mapping shape Studio↔filesystem para `branding` (Studio: primary/secondary/tertiary/fonts/logos; filesystem: logo.default + favicon en JSON, colors en `tokens.css`), `ads` → `features.advertisements.ads`, `integrations` → `integraciones` (con nombres legacy). Es trabajo de UX + arquitectura, sesión dedicada.
- **S7.2 — GitHub PR-publish**: necesita GitHub PAT en `.env.local`.
- **S7.3 — NextAuth + admin gate**: necesita OAuth app.
- **S7.4 — Vercel deploy**: necesita proyecto Vercel.
- **Build SSG `/404`**: gated por `pnpm build`.

**Decisiones:**

- **Bootstrap solo de ads + integrations** (no de otros módulos): son las dos secciones donde el shape filesystem legacy NO encaja con el Studio shape. El resto (events, listings, photoBooth, etc.) son nuevas en S3+ y nunca tuvieron equivalente legacy en `config.json`.
- **`hydrateConfig` async** con slug parameter: necesario para hacer fs.readFile. Cambio quirúrgico — solo el GET handler lo llama.
- **Fallback a defaults si parse falla**: una entrada `integraciones` corrupta no rompe el GET; solo no aporta data al Studio. Robusto.
- **NO smoke del path bootstrap real**: requeriría manipular el KV directamente (eliminar ads/integrations de un cfg existente). El typecheck + lógica simple bastan; el escenario real (cliente que viene de filesystem y nunca tocó Studio) se activa en producción cuando alguien abra ese cliente por primera vez.
- **No escribimos a filesystem aún en este step**: solo lectura para hidratar Studio. La escritura (publish wide) es S7.1 wide, sesión dedicada.

**Fase:** Studio S7.1 narrow cerrada (2026-04-29). Siguiente arranque: **S7.1 wide config publish** (sesión dedicada con mapping work) o S7.2/3/4 (necesitan infra externa).

---

### Sesión 2026-04-29 (cont. 8) — Build SSG fix + AI translate feature flag + S5.2 ads bulk import

**Hecho:**

- **Fix build SSG `/404` y `/500`** (`af4713f`):
  - Next 15 con App Router auto-genera fallbacks legacy `/_error/_app/_document` que importan `<Html>` desde `next/document`, lo que rompe SSG.
  - Añadido `src/app/error.tsx` (error boundary regular del App Router con `force-dynamic`).
  - Añadidos `src/pages/_document.tsx` y `src/pages/_error.tsx` minimales en `src/pages/` (no en root — para no romper srcDir detection y typed routes resolvers).
  - Añadido `force-dynamic` a `src/app/global-error.tsx` por consistencia.
  - `pnpm build` ahora completa con todas las rutas como `Dynamic ƒ`. Bloqueador para Vercel deploy resuelto.
- **Feature flag AI translate** (`9ee8a4b`): el botón ✨ ahora se oculta cuando no hay `ANTHROPIC_API_KEY` configurada en lugar de mostrar 503 al click. Decisión del usuario (no usar AI por ahora). Implementación:
  - GET `/api/studio/i18n/translate` → `{ available: !!process.env.ANTHROPIC_API_KEY }`.
  - `I18nEditor` consulta el status al montar y guarda en `aiAvailable`. `I18nCell` solo recibe `translateInput` cuando `aiAvailable === true`.
  - Sin key: edición manual normal, celdas missing siguen marcadas en ámbar, cero ruido visual. Con key: comportamiento original (botón ✨ funcional sin tocar nada).
- **S5.2 — Bulk import CSV/JSON de ads**:
  - `'ads'` añadido a `ImportKind` literal type.
  - `PK_FIELD: Record<ImportKind, 'slug' | 'id'>` generaliza la primary key (ads usa `id`, otros usan `slug`).
  - `coerceCatalogRow` solo auto-deriva slug-from-title cuando pk='slug' (ads no tiene title → no auto-deriva).
  - Dedupe + stats added/updated ahora usan `pkOf(item)` genérico vía cast doble `as unknown as Record<string,string>`.
  - `upsertById` añadido al lado de `upsertBySlug` en `import-utils.ts`, ambos delegan a `upsertByKey<T>(existing, incoming, field)`.
  - `KIND_LABELS` y `PreviewTable` del `ImportModal` adaptan cols por kind: ads muestra ID+Kind, otros muestran Slug+Title.
  - `AdsEditor` añade botones Import/Export al toolbar custom + state `importOpen`/`lastImport` + `handleImport(items, mode, stats)` con upsertById + `handleExport(format)` con `downloadCatalog('ads', …)`.
  - CSV columns aceptadas: `id,kind,image,alt,routes,enabled,theme`. Routes con separador `;`.

**Verificado:**

- `pnpm build` completa sin errores (todas las rutas Dynamic ƒ).
- `pnpm typecheck` y `pnpm lint` limpios tras cada commit.
- E2E AI translate feature flag: GET `/api/studio/i18n/translate` retorna `{available:false}`; al borrar valor de celda ES → celda missing visible (borde ámbar) pero **0 botones translate** en el DOM. Con key configurada el botón aparecería sin tocar código.
- E2E S5.2 ads import: drop CSV con 3 ads → preview "3 valid · 3 added · 0 errors" con cols ID + Kind → click "Import 3 ads" → toast "3 ads imported (3 added · 0 updated)" → 3 rows visibles en lista con multi-route correcto ("2 routes · /home/events, /home/passes") → Cmd+S → 3 ads persistidos en KV con IDs `home-special/restaurants-banner/events-strip`. Cleanup tras smoke.

**Pendiente / siguiente:**

- **S7.1 wide — config.json publish** (mapping shape Studio↔filesystem para branding/colors→tokens.css, módulos editables, ads→features.advertisements, integrations→integraciones legacy). Sesión dedicada con decisiones de Rubén.
- **S7.2 — GitHub PR-publish**: necesita GitHub PAT.
- **S7.3 — NextAuth + admin gate**: necesita OAuth app.
- **S7.4 — Vercel deploy**: necesita proyecto Vercel.
- **S5.1 — Bridge live preview ads** (override evento al kiosk `useAds` — pequeño, opcional).
- **AI translate path feliz**: validar cuando se añada `ANTHROPIC_API_KEY` — Rubén decidió no usar por costo.

**Decisiones:**

- **Pages dir en `src/pages/` no en root**: Next 15 detecta srcDir desde `src/app/`; pages en root rompía typed routes (path resolution). Mover a `src/pages/` mantiene el detect consistente.
- **Botón ✨ oculto vs deshabilitado**: el operador no debe ver UI que no funciona. La feature flag server-side garantiza que SOLO se muestra si hay key real.
- **Generalización PK con `Record<string, string>` cast** (no refactor mayor): cambio quirúrgico que no afecta los 4 catálogos existentes. `pkOf(item)` helper hace el dedupe agnóstico. Editores existentes no tocados.
- **Ads sin auto-derive de id**: a diferencia de slug-from-title, no hay un campo natural en `Ad` del que derivar el id. CSV requiere columna `id` explícita; el operador la pone (es estable, parte del schema).
- **Routes en CSV con `;`-separator**: consistente con features y arrays del resto. Un único separador en todo el sistema.

**Fase:** Studio S5.2 cerrada (2026-04-29). Build SSG arreglado. Siguiente arranque: **S7.1 wide** o paramos.

---

## Plantilla de entrada (copiar al cerrar sesión)

```markdown
### Sesión YYYY-MM-DD — [título breve]

**Hecho:**

- [punto 1]

**Verificado:**

- [qué se comprobó y cómo]

**Pendiente / siguiente:**

- [qué retomar]

**Decisiones:**

- [decisión + razón, si aplica]

**Fase:** [nº y nombre]
```
