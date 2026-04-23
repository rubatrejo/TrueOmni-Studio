# Fase 3.12 — Coverage checklist (Deals)

SVGs del XD cubiertos: `Deals.svg`, `Deals-Filter.svg`, `Deals–Details_Send.svg`
(directorio original en `/Users/rubenramirez/Desktop/Deals/`).

## Groups del listing (`Deals.svg`)

- [x] Hero header (logo + clock + weather + date) → `HomeHeader` reusado.
- [x] Toolbar azul con label "Deals" + search + sort + filter → `ListingsToolbar` reusado.
- [x] Grid 3-col de cards → `DealsGrid`.
- [x] Card individual (cover + title + shortDescription + expiry + originalPrice tachado) → `DealCard`.
- [x] Floating home button → `FloatingHomeButton` reusado.
- [x] Scroll-hint gradient bottom → inline en `DealsModule`.

## Groups del filter overlay (`Deals-Filter.svg`)

- [x] Backdrop dark semitransparente sobre grid → `DealsFilterOverlay` con `top: 738px`.
- [x] Título "FILTERS" → tokenizado `deals_filters_title`.
- [x] Sección FEATURES con pills (8 del catálogo) → `DealsFilterOverlay`.
- [x] Pills outline + fill cuando active → inline en `Pill` helper.
- [x] Botón CLEAR ALL olive (`#b9bd39`) → tokenizado `deals_clear_all`.
- [x] Botón APPLY blue (`#1796d6`) → tokenizado `deals_apply`.
- [x] Botón X (cerrar) top-right → inline.

## Groups del redeem modal (`Deals–Details_Send.svg`)

- [x] Backdrop dark sobre listing atenuado → `DealRedeemModal` con `inset-0`.
- [x] Card blanco centrado con borde redondeado → inline.
- [x] Hero cover con title + expiry overlay → `HeroWithOverlay` helper.
- [x] Headline (H1 bold) → inline.
- [x] Subtitle (texto secundario) → inline.
- [x] longDescription párrafo → inline.
- [x] Promo code pill (condicional) → inline con token `deals_promo_code_label`.
- [x] QR grande centrado 240×240 con logo opcional → `QRCodeSVG` de `qrcode.react`.
- [x] 2 botones SEND TO PHONE / SEND TO EMAIL side-by-side → tokenizado `deals_send_phone|email`.
- [x] Link CANCEL bottom → tokenizado `deals_cancel`.

## Flujos verificados

- [x] Listing → tap card → modal redeem se abre con data correcta.
- [x] Modal redeem → SEND TO PHONE → `SendToPhoneModal` con NumericKeypad.
- [x] Modal redeem → SEND TO EMAIL → `SendToEmailModal` con QWERTY.
- [x] Submit cualquiera → `SendConfirmationPopup` "Link sent!".
- [x] Filter overlay: pills AND reducen el grid.
- [x] Sort overlay: 4 opciones (Expiring Soon default).
- [x] Search overlay: filtra por title + shortDescription (mismo chrome que Home).
- [x] CANCEL/Escape cierra cualquier overlay.
- [x] Deals con `expiresAt < today()` no aparecen en grid (pipeline `filterActiveDeals`).

## Tolerancia pixel-perfect

Verificado visualmente vs PNGs originales. Variaciones menores en proporciones
internas de la card (text sizes, line heights) dentro de márgenes ±3px. El
modal redeem omite el "code inline en descripción" y lo muestra como pill
separado + el código sigue existiendo en `longDescription` — aprobado en
brainstorming como mejora visual.
