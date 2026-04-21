# STATE.md — Memoria del proyecto

Este archivo es la memoria persistente entre sesiones. Cada `/terminar` añade una entrada aquí.

---

## Estado actual

**Fase activa:** Fase 3.3 cerrada con pulido completo (Olas 1-8 + 14 fixes V1 + 5 fixes V2).

**Última fase cerrada:** Fase 3.3 — módulo de Listings (Restaurants / Things to Do / Stay) con Detail + Filter/Sort + Favoritos + Email/Phone + Directions + 360 totalmente funcionales.

**Siguiente acción concreta:** Abrir Fase 4 (primer cliente real) o el siguiente módulo que Rubén decida (Itinerary Builder quizás, ya que los favoritos ya están conectados).

**Bloqueos:** ninguno.

**TODO de i18n (aplazado a Fase 5 — validador zod + migración a config.textos):**

- `src/app/(kiosk)/home/[module]/page.tsx:52` `"Coming soon"` (stub genérico).
- `src/app/(kiosk)/home/[module]/page.tsx:59` `"Back to Home"` (link del stub).
- `src/components/listings/send-to-phone-modal.tsx:90` `"USA (+1)"` — pendiente `config.client.country_code`.
- Strings del SharingRow del detail + toolbar del módulo de Listings ("WEBSITE", "RESERVE NOW", "SEND TO EMAIL/PHONE", "ADD TO FAVORITES", "FILTERS", "SORT BY", "CLOSE", "CANCEL", "SEND", "DESCRIPTION", "GET DIRECTIONS") vienen del SVG; se migran a `config.textos` cuando se internacionalice.

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
