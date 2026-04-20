# Coverage Billboard 1 — "Grid + Clock + Weather"

SVG fuente: `designs/TNT/Billboard/Billboard 1.svg` (se copiará a `designs/01-billboard-1.svg`).

## Layout observado (thumbnail)

- **Header**: reloj+fecha en blanco (izquierda), weather en azul con icono (derecha).
- **Grid**: 4 fotos con etiquetas categoría (THINGS TO DO, EVENTS, etc.) + una tarjeta grande con "TOUCH TO START".
- **Footer**: azul marca con logo TrueOmni (y probablemente otros elementos como B0).

## Elementos del SVG (inventario)

Grupos agrupados por función:

### Header

- [ ] `Header` — contenedor top bar.
- [ ] `Rectangle_4553` — fondo del header o reloj bg blanco.
- [ ] `Group_7355` — reloj "10:37 a.m." + fecha (Montserrat-Bold).
- [ ] `Group_7356` — weather temperatura "50°".
- [ ] `Group_7357` — weather condition "Cloudy" + icono (mask_group_3671 probablemente).
- [ ] `Mask_Group_3671` — icono weather recortado.

### Grid de tarjetas (5 cards, sufijos -1/-2/-3/-4/-5 o sin sufijo)

Por cada card:

- [ ] `Component_620_N` — contenedor de la tarjeta N.
- [ ] `Mask_Group_3670-N` — foto recortada de la tarjeta.
- [ ] `List-N` — etiqueta de categoría (texto + possibly bullet).
- [ ] `Down_Arrow-N` — flecha indicativa.

Categorías específicas (grupos nombrados):

- [ ] `Events` / `Events-2` / `Events-3` — label EVENTS.
- [ ] `Things_to_do` — label THINGS TO DO.
- [ ] `Itinerary` — label ITINERARY BUILDER.

### Botones por tarjeta (se repiten x5)

- [ ] `Button-Background-N` — fondo del botón language.
- [ ] `Button-Language-N` — botón ENGLISH ▾ amarillo-verde.
- [ ] `Button_Dropdown_Language-N` — dropdown abierto (si aplica).
- [ ] `colors_buttons_accent_green-N` — color fill del botón.
- [ ] `Group_7354-N` — contenedor del grupo botón idiomas.
- [ ] `Group_1698-N` — otro contenedor (desconocido, posiblemente botón).

### Iconos

- [ ] `click-2384` — icono "click here" (posible hint interacción).
- [ ] `route-svgrepo-com_3_` — icono de ruta (Itinerary).

### CTA grande

- [ ] "TOUCH TO START" — texto grande en la tarjeta principal.

### Footer (como Billboard 0)

- [ ] `Splash-Footer-1` — contenedor footer.
- [ ] `Billboard_Footer` — footer específico (posible variante).
- [ ] `Group_3571` — logo TrueOmni wordmark.
- [ ] `Logo-White-Footer` — logo completo del footer.
- [ ] `Group_7375` / `Group_7376` / `Group_7377` — contenido adicional (wheelchair, powered-by?).

## Imágenes embebidas (5)

Ya extraídas a `/tmp/billboard-assets/b1-img0..img2.{jpeg,png}`. Faltan 2 más (b1-img3, b1-img4) — extraer.

Paths de destino (propuesta):

- `clients/_template/assets/billboard-1/card-{1..5}.jpg`
- También los iconos (weather) si son rasters.

## Verificación

Diff visual contra `designs/01-billboard-1.svg` con `revisor-visual`, tolerancia ±2px. Todos los items del checklist en ✅ antes del commit.
