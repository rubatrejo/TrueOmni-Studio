# Specs de pantalla PWA — plantilla

> Copiar junto al SVG: `designs/mobile-pwa/NN-nombre.md` al lado de `designs/mobile-pwa/NN-nombre.svg`.
> NN = número con ceros a la izquierda (01, 02…).

---

## Identidad

- **Nombre interno:** `welcome` / `login` / `dashboard` / `listings` / ...
- **Ruta Next.js:** `/pwa` · `/pwa/login` · `/pwa/restaurants` · ...
- **Milestone:** PWA Mobile · Fase `PN` del `PWA-ROADMAP.md`.
- **Pantalla XD original:** `designs/mobile-pwa/NN-nombre.svg`.
- **Medidas del canvas:** **390 × 844** (mobile). Artboard XD original 375×812 → adaptar ×≈1.04.
- **Tipo de módulo:** 🔁 reutilizado (data del kiosk) · 🆕 PWA-only.

---

## Adaptación 375 → 390

Los artboards de XD están a 375×812. Al pasar coords al canvas 390×844 aplicar el factor de escala:

- Horizontal: `390 / 375 = 1.04`.
- Vertical: `844 / 812 = 1.0394`.

Por simplicidad y como el aspect ratio es casi idéntico, usar **×1.04 uniforme** salvo que un
elemento ancle al borde (en ese caso recalcular desde el borde de 390/844).

---

## Estados de la pantalla

- `default` — estado base.
- `carga` — skeleton / spinner mientras llega la data.
- `vacío` / `error` — si aplica.

---

## Jerarquía visual

De arriba hacia abajo (recordar safe-areas mobile: notch arriba, home indicator abajo):

1. **Status/Top bar** — safe-area top.
2. **Header** — título, back, acciones.
3. **Contenido** — scroll vertical.
4. **Bottom Nav** — tabs (transversal, no por pantalla) + safe-area bottom.

---

## Medidas clave

Toda medida sale del SVG (ya adaptada a 390×844).

| Bloque      | x | y | w | h | Notas |
|-------------|---|---|---|---|-------|
| Header      |   |   |   |   |       |
| Contenido   |   |   |   |   |       |
| Bottom Nav  | 0 | 760 | 390 | 84 | transversal |

---

## Tipografía / Colores por bloque

Igual que el kiosk: tipos como tokens (`--font-sans`…), **colores siempre como token**
(`hsl(var(--primary))`), nunca hex. Si el SVG trae un color que no está en `tokens.css`, añadirlo.

---

## Contenido (qué se lee de `config.json`)

Listar las claves de `config.json` que consume la pantalla (textos, branding, módulos…).
Reutiliza los mismos tipos de `src/lib/config.ts`. Si hay string hardcodeado al construir, es bug.

---

## Interacciones

- Toques, navegación entre pantallas, animaciones (trigger + duración + easing).
- Login: mock (sin backend en este milestone).

---

## Accesibilidad

- Contraste AA mínimo.
- Target táctil mínimo 44×44 px (mobile, dedos).
- Alt text en imágenes desde `config.json`.

---

## Verificación (checklist para declarar la pantalla hecha)

- [ ] SVG original abierto y comparado con el render.
- [ ] Diff visual < ±2px (`revisor-visual` / `pnpm verify:visual --ruta /pwa/...`).
- [ ] `pnpm typecheck && pnpm lint && pnpm format:check` sin errores.
- [ ] Cero hardcoded (colores, strings, paths).
- [ ] Probada con `KIOSK_CLIENT=default` y otro cliente (reacciona a tokens).
- [ ] Screenshot en `.planning/verifications/pwa-NN-nombre.png`.

---

**Notas libres:**
