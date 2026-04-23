# STATE.md — Memoria del proyecto

Este archivo es la memoria persistente entre sesiones. Cada `/terminar` añade una entrada aquí.

---

## Estado actual

**Fase activa:** Fase 3.14 (Guestbook) **aprobada por Rubén** tras una sesión larga de refactor visual + fixes funcionales (form layout, map screen rebuild, drag-and-drop).

**Última fase cerrada:** Fase 3.14 — Guestbook module completo + refactor sesión 2026-04-23. Antes: Fase 3.13 Trails, 3.12 Deals, 3.11 Tickets.

**Siguiente acción concreta:** Fase 3.15 — Itinerary Builder (candidato natural) o Fase 4 (primer cliente real).

**Bloqueos:** ninguno. `alwaysShowWelcome={true}` del MapModule sigue hardcoded para QA — apagarlo antes de Fase 4 / producción (`[module]/page.tsx` rama `map`).

**TODO de QA pendiente:**

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

**Deps añadidas:** `qrcode.react@4.2` (Passes share modal — QR escaneable level H con logo TrueOmni centrado).

**Tokens nuevos:** `--survey-success: 120 61% 50%` (lime `#32CD32` para checks de Survey thank-you y Passes sent-confirmation) — añadido a los 3 `tokens.css` (template, default, demo-cliente-a) en sesión 2026-04-22.

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
