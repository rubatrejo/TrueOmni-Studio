# Spec — Módulo Passes (Fase 3.10)

**Fecha:** 2026-04-22
**Estado:** Draft para revisión
**Autor:** Claude + Rubén (brainstorming session)
**Input visual:** `~/Desktop/Passes/{Passes, Passes-Selected_Details_List, Passes-Share, Passes-Sent_Confirmation}.{svg,png}`

---

## 1. Contexto y motivación

El kiosk tiene hoy 6 módulos funcionales (listings · events · social-wall · digital-brochure · map · survey overlay) + tile Wayfinding. El tile **Passes** del Home existe pero cae al stub "Coming soon".

Rubén quiere un módulo Passes para conectar **Savings Passes** al estilo [Visit Virginia Beach](https://www.visitvirginiabeach.com/virginia-beach-savings-pass/) / [Bandwango](https://www.bandwango.com/). Un "pass" es un paquete que agrupa múltiples actividades (museos, tours, restaurantes con descuento) y que el cliente suele **regalar** a los visitantes. En producción la data viene del **API de Bandwango**; los covers los sube manualmente el administrador.

v1 mockea la data en `config.json` (mismo patrón que listings/events/map). v2 conecta el API real. Este spec cubre sólo v1.

Los 4 SVG/PNG de referencia son **patrón, no pixel-perfect**. Hay que diseñar coherente con el sistema aplicando skills Tier 1 (`frontend-design`, `ui-ux-pro-max`, `theme-factory`).

## 2. Decisiones cerradas en brainstorming

| Decisión         | Valor                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Data source v1   | Mock en `config.features.home.modules.passes`                                                 |
| Data source v2+  | Fetch a Bandwango API (fuera de alcance)                                                      |
| Covers de passes | Path en config, asset sube manual (mismo patrón que `heroImage` de listings)                  |
| CTA "GET YOURS"  | Siempre visible en el detail                                                                  |
| Flow Share       | Tap GET YOURS → modal QR + phone → SEND → Sent Confirmation                                   |
| Dispatch SEND v1 | `console.log('[kiosk:pass-share]', …)` + `CustomEvent('kiosk:pass-shared', { detail })`       |
| QR contiene      | `pass.bandwangoUrl` (URL mock, escaneable con cualquier app)                                  |
| Librería QR      | `qrcode.react` (~3 KB gzip, nueva dep)                                                        |
| Actividades      | Display-only (title + image + description + `View Website` externo). Sin detail screen propio |
| Features extras  | Sólo **Search**. No favorites, no filter, no sort en v1                                       |
| Country code     | Fijo USA (+1) en v1 (TODO i18n como `send-to-phone-modal`)                                    |
| Typo del SVG     | Corregido: "You are are all set!" → "You are all set!"                                        |

## 3. Arquitectura

### 3.1 Discriminador `kind: 'passes'`

Se añade `HomePassesModule` a la union discriminada `HomeModuleVariant` en `src/lib/config.ts`. Mismo patrón de `HomeEventsModule` / `HomeMapModule` / etc.

### 3.2 Routing

Dos ramas nuevas (antes del default fallback a `ListingsModule`):

- **`src/app/(kiosk)/home/[module]/page.tsx`**: `if (mod?.kind === 'passes') return <PassesModule …/>` + `<AdsSlot ads={ads} />`.
- **`src/app/(kiosk)/home/[module]/[slug]/page.tsx`**: `if (mod.kind === 'passes')` → resolver pass por slug → render `<PassesModule />` como fondo + `<PassDetail />` como overlay in-place (mismo patrón validado en listings-detail).

### 3.3 No se reusa `ListingDetail`

La estructura del detail de un Pass es distinta:

- Hero con CTA sticky "GET YOURS" (el `ListingDetail` tiene ActionRow con WEBSITE/RESERVE, no aplica).
- Sin Map/Directions section.
- Sin reserveUrl/threshold360.
- Lista de activities en vez de description single-text.

Componente nuevo `PassDetail`.

### 3.4 Share modal — reuso

- `SendModalChrome` — chrome visual (header azul + body blanco + footer numpad).
- `TermsCheckbox` — checkbox "I accept details".
- `CancelSendButtons` — el botón SEND.
- `NumericKeypad` — teclado numérico del phone input.
- `useEscapeToClose` — Escape cierra el modal.

Adiciones:

- `QRCode` de `qrcode.react` — top del body, 240×240, nivel H, con logo TrueOmni centrado (prop `imageSettings`).

### 3.5 Sent confirmation — patrón clonado

El `SendConfirmationPopup` actual está acoplado a `destination` de email/phone de listings. Para Passes se **clona el estilo** (check verde + card blanca centrada + countdown) pero sin importar el componente: `PassSentConfirmation` propio, más simple (mensaje fijo sin destination).

### 3.6 Ads

`AdsSlot` ya integrado en las 2 rutas nuevas. Los ads pueden declarar rutas `/home/passes` y `/home/passes/*` en `config.features.advertisements`.

### 3.7 White-label

- Todos los strings del UI en `config.textos.passes_*` (14+ claves).
- Todos los datos en `config.features.home.modules.passes`.
- Covers: path relativo en config; asset en `clients/{slug}/assets/`.
- Colores sólo por tokens (`--primary`, `--primary-foreground`, `--survey-success` del lime check). Cero hex en JSX.
- QR SVG generado dinámicamente desde `bandwangoUrl` — sin imagen fija.

## 4. Config schema

### 4.1 Tipos en `src/lib/config.ts`

```ts
/** Actividad incluida en un pass — display-only (title + image + desc + website). */
export interface PassActivity {
  slug: string;
  title: string;
  /** Path relativo o URL absoluta del thumbnail. */
  image: string;
  description: string;
  /** Link externo que se abre al tap "View Website". */
  website: string;
}

/** Pass individual — paquete de actividades. */
export interface PassItem {
  slug: string;
  title: string;
  /** Cover subido por el admin — path relativo a `clients/{slug}/assets/`. */
  cover: string;
  /** URL al pass en Bandwango. Codificado en el QR del share. */
  bandwangoUrl: string;
  /** Tagline corto opcional para la card y hero del detail. */
  tagline?: string;
  activities: PassActivity[];
}

/** Módulo Passes — kind discriminator 'passes'. */
export interface HomePassesModule {
  kind: 'passes';
  label: string;
  heroImage: string;
  passes: PassItem[];
}

// Añadido a la union:
export type HomeModuleVariant =
  | HomeModule
  | HomeEventsModule
  | HomeSocialWallModule
  | HomeDigitalBrochureModule
  | HomeMapModule
  | HomePassesModule;
```

### 4.2 Seed en `clients/default/config.json`

3 passes de ejemplo con 4-5 activities cada uno y URLs mock en `app.bandwango.com`:

```jsonc
"passes": {
  "kind": "passes",
  "label": "Passes",
  "heroImage": "https://images.unsplash.com/photo-…",
  "passes": [
    {
      "slug": "museum-pass",
      "title": "Museum Pass",
      "cover": "https://images.unsplash.com/photo-…",
      "bandwangoUrl": "https://app.bandwango.com/p/museum-pass",
      "tagline": "Skip the line at 8 iconic museums.",
      "activities": [
        {
          "slug": "cheyenne-depot-museum",
          "title": "Cheyenne Depot Museum",
          "image": "https://images.unsplash.com/photo-…",
          "description": "Designated a National Historic Landmark, this former Union Pacific Depot has been restored to its original glory…",
          "website": "https://example.com/cheyenne-depot"
        }
        // … 3-4 activities más
      ]
    },
    { "slug": "city-tour-pass", "title": "City Tour Pass", … },
    { "slug": "food-drink-pass", "title": "Food & Drink Pass", … }
  ]
}
```

### 4.3 Strings UI en `textos`

```jsonc
"passes_label": "Passes",
"passes_get_yours": "GET YOURS",
"passes_view_website": "View Website",
"passes_share_instruction": "SCAN THIS QR CODE TO HAVE YOUR PASS",
"passes_share_phone_label": "Enter your phone number",
"passes_share_country": "USA (+1)",
"passes_share_phone_placeholder": "000-555-0115",
"passes_share_terms": "I accept details",
"passes_share_send": "SEND",
"passes_share_cancel": "CANCEL",
"passes_sent_title": "You are all set!",
"passes_sent_message": "The email was successfully sent",
"passes_sent_redirect_label": "Returning in {seconds}s…"
```

## 5. Componentes

### 5.1 Nuevos (`src/components/passes/`)

| Archivo                               | Rol                                                                                                                                                                                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `passes-module.tsx` (client)          | Root del listado. `HomeHeader` hero + `PassesToolbar` + `PassesGrid` scrollable + `FloatingHomeButton` + `SearchOverlay`.                                                                                                          |
| `passes-toolbar.tsx`                  | Toolbar 1080×118 estilo `ListingsToolbar`: label del módulo + search icon.                                                                                                                                                         |
| `passes-grid.tsx`                     | Grid vertical 1-col gap 30px dentro del canvas.                                                                                                                                                                                    |
| `pass-card.tsx`                       | Card 950×480 con `<img>` cover fill + overlay azul (`rgba(0,79,139,0.72)`) rounded top + título centrado font-display bold 56px uppercase. Link a `/home/passes/{slug}`.                                                           |
| `pass-detail.tsx` (client)            | Overlay in-place con `onClose`. Hero cover full-bleed + `HomeHeader` + CTA "GET YOURS" sticky + toolbar con título del pass + lista scrollable de activities + `BackButton` floating.                                              |
| `activity-row.tsx`                    | Row 898×~220: image 220×220 izquierda + stack (title h3 + description 3-4 líneas + `View Website` pill) derecha.                                                                                                                   |
| `pass-share-modal.tsx` (client)       | Modal Share. Chrome del `SendModalChrome` pero con QR 240×240 en top del body + "SCAN THIS QR CODE TO HAVE YOUR PASS" + phone input (country fijo + numeric) + TermsCheckbox + SEND (disabled hasta válido). Footer NumericKeypad. |
| `pass-sent-confirmation.tsx` (client) | Card blanca 640×380 centrada. Check verde `hsl(var(--survey-success))` + "You are all set!" (bold 32px) + "The email was successfully sent" (sub 18px). Countdown 5s + auto-close.                                                 |

### 5.2 Lib nueva

| Archivo             | Rol                                                                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/passes.ts` | `isValidPhone(raw): boolean` (10 dígitos mínimo), `buildShareResult(client, passSlug, passTitle, phone, bandwangoUrl)`, `dispatchShareResult(result)` (console + CustomEvent). Tipo `PassShareResult`. |

### 5.3 Reutilización

| Componente                    | Ruta                                               | Uso                                          |
| ----------------------------- | -------------------------------------------------- | -------------------------------------------- |
| `HomeHeader`                  | `src/components/home/header.tsx`                   | Hero de listado y detail                     |
| `SearchOverlay` + `SearchBar` | `src/components/home/`                             | Search con passes mapeados a `HomeListing[]` |
| `SendModalChrome`             | `src/components/listings/send-modal-chrome.tsx`    | Chrome del Share modal                       |
| `TermsCheckbox`               | idem                                               | Checkbox "I accept details"                  |
| `CancelSendButtons`           | idem                                               | SEND button del Share                        |
| `NumericKeypad`               | `src/components/listings/numeric-keypad.tsx`       | Teclado del phone input                      |
| `useEscapeToClose`            | `src/components/listings/use-escape-to-close.ts`   | Escape cierra modales                        |
| `FloatingHomeButton`          | `src/components/listings/floating-home-button.tsx` | Home button en listado                       |
| `BackButton`                  | `src/components/listings/back-button.tsx`          | Back del detail                              |
| `KioskCanvas`                 | `src/components/kiosk-canvas.tsx`                  | Frame 1080×1920                              |
| `AdsSlot`                     | `src/components/ads/ads-slot.tsx`                  | Popup/hero/bottom ads                        |
| Token `--survey-success`      | `clients/*/tokens.css`                             | Verde lime del check del sent-confirmation   |

### 5.4 Nueva dependencia

```bash
pnpm add qrcode.react
```

- `qrcode.react@^3.1`: ~3 KB gzip. API: `<QRCode value={url} size={240} level="H" imageSettings={{ src, width, height }} />`.
- Permite logo TrueOmni en el centro del QR sin afectar escaneabilidad (level H tolera 30% de corrección).

## 6. Flujo completo

```
Home Dashboard
  └─ tap tile "Passes"
      └─ /home/passes
          ├─ Hero (HomeHeader con heroImage del módulo)
          ├─ PassesToolbar (label + search)
          ├─ PassesGrid vertical (3 cards)
          └─ FloatingHomeButton
             └─ tap card "Museum Pass"
                 └─ /home/passes/museum-pass (overlay in-place)
                     ├─ Hero (cover fill-bleed + HomeHeader overlay)
                     ├─ CTA "GET YOURS" sticky en el hero
                     ├─ PassesToolbar "Museum Pass" + search
                     ├─ Activities list (4 rows con View Website)
                     └─ BackButton floating
                        └─ tap GET YOURS
                            └─ PassShareModal
                                ├─ Header azul "MUSEUM PASS" + X close
                                ├─ QR 240×240 con logo TrueOmni
                                ├─ "SCAN THIS QR CODE TO HAVE YOUR PASS"
                                ├─ "Enter your phone number"
                                ├─ USA (+1) | 000-555-0115
                                ├─ [✓] I accept details
                                ├─ CANCEL · SEND
                                └─ NumericKeypad footer
                                   └─ tap SEND
                                       └─ dispatch console + CustomEvent
                                           └─ PassSentConfirmation
                                               ├─ Check verde + "You are all set!"
                                               ├─ "The email was successfully sent"
                                               └─ auto-close 5s → vuelve al detail
```

### Shape del dispatch

```ts
interface PassShareResult {
  timestamp: string; // ISO
  client: string; // slug
  passSlug: string;
  passTitle: string;
  phone: string; // "+1-555-0115" formateado
  bandwangoUrl: string;
}
```

## 7. Edge cases

| Caso                                             | Comportamiento                                                                     |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Módulo sin passes (array vacío)                  | Toolbar visible, grid muestra placeholder "No passes available right now."         |
| Pass sin activities                              | Detail muestra placeholder "Activities coming soon." bajo el hero                  |
| Cover roto                                       | Fallback `onError` a gradient azul con el título (patrón usado en listings)        |
| `bandwangoUrl` vacío                             | QR codifica string vacío, SEND deshabilitado con mensaje "Pass URL missing" en dev |
| Phone incompleto                                 | SEND deshabilitado (opacity 40%)                                                   |
| User tap X / Escape / backdrop con phone escrito | Confirm exit (patrón survey) — opcional; v1 cierra directo para simplificar        |
| Tap fuera del card del Share                     | Cierra modal directo (sin confirm)                                                 |
| SEND exitoso                                     | Cierra Share modal → abre Sent Confirmation → 5s → cierra todo → vuelve al detail  |
| Escape en Sent Confirmation                      | Cierra inmediato (sin esperar countdown)                                           |

## 8. Verificación end-to-end

1. `pnpm check` (typecheck + lint + format) limpio.
2. `pnpm kiosk:dev` → `/home/passes`:
   - 3 cards visibles (Museum · City Tour · Food & Drink).
   - Search overlay funciona con passes como pool.
   - Tap Museum Pass → detail con hero + GET YOURS + 4 activities.
   - Tap View Website abre enlace externo en nueva tab.
   - Tap GET YOURS → modal con QR escaneable. Verificar con lector: escanea a `https://app.bandwango.com/p/museum-pass`.
   - Escribir phone + check terms → SEND habilita.
   - Tap SEND → dispatch en consola + CustomEvent.
   - PassSentConfirmation visible con check verde lime.
   - Auto-close 5s → overlay cierra → detail visible.
   - Escape cierra modales en cada paso.
   - Back vuelve al listado.
3. `KIOSK_CLIENT=demo-cliente-a pnpm kiosk:dev` → branding naranja sin edits `.tsx`.
4. `grep -REn "#[0-9a-fA-F]{3,8}" src/components/passes/` → 0 resultados (rgba de opacidades OK).
5. Playwright MCP screenshots en `.planning/verifications/3-10-passes-*.png`: listing · detail · share-modal · sent-confirmation · search-overlay · empty-state.
6. Auditor white-label sin hallazgos críticos.
7. DevTools Console: `[kiosk:pass-share]` con shape correcto + `window.addEventListener('kiosk:pass-shared', …)` capta el detail.

## 9. Fuera de alcance (v2+)

- Fetch real a Bandwango API.
- Detail screen por activity.
- Favorites / filters / sort.
- Country code configurable por cliente (TODO i18n general).
- Backend real del SMS.
- QR con branding/color del cliente.
- Analytics de share rate / conversion.

## 10. Archivos tocados (resumen)

### Crear

- `src/components/passes/passes-module.tsx`
- `src/components/passes/passes-toolbar.tsx`
- `src/components/passes/passes-grid.tsx`
- `src/components/passes/pass-card.tsx`
- `src/components/passes/pass-detail.tsx`
- `src/components/passes/activity-row.tsx`
- `src/components/passes/pass-share-modal.tsx`
- `src/components/passes/pass-sent-confirmation.tsx`
- `src/lib/passes.ts`

### Modificar

- `src/lib/config.ts` — tipos `PassActivity` / `PassItem` / `HomePassesModule` + union.
- `clients/default/config.json` — bloque `features.home.modules.passes` + strings `passes_*` en `textos`.
- `src/app/(kiosk)/home/[module]/page.tsx` — rama `passes`.
- `src/app/(kiosk)/home/[module]/[slug]/page.tsx` — rama `passes`.
- `package.json` + `pnpm-lock.yaml` — add `qrcode.react`.

## 11. Olas atómicas previstas

**Ola 1 — Foundations** (3 tasks + commit): tipos + seed + `lib/passes.ts` + `pnpm add qrcode.react`.
**Ola 2 — Listado** (4 tasks + commit): pass-card + passes-grid + passes-toolbar + passes-module.
**Ola 3 — Detail + Activities** (3 tasks + commit): activity-row + pass-detail + ramas en routing.
**Ola 4 — Share flow + QA** (3 tasks + commit): pass-share-modal + pass-sent-confirmation + verificación visual.

Total: **13 tasks en 4 olas**, 4 commits.

## 12. Próximos pasos

1. Commit este spec con `docs(passes): spec módulo Passes fase 3.10`.
2. Invocar skill `superpowers:writing-plans` para generar `.planning/3-10-1-PLAN.md` con formato XML-task del proyecto.
3. Ejecutar en contexto fresco con `/iniciar` + plan atómico cargando skills Tier 1.
