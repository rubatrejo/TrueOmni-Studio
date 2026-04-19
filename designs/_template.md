# Specs de pantalla — plantilla

> Copiar este archivo junto al SVG: `designs/NN-nombre.md` al lado de `designs/NN-nombre.svg`.
> NN = número de pantalla con ceros a la izquierda (01, 02…), para que ordenen bien.

---

## Identidad

- **Nombre interno:** `home` / `menu` / `info-evento` / ...
- **Ruta Next.js:** `/` · `/menu` · `/info/evento` · ...
- **Fase del roadmap:** Fase 3 · Sub-fase `NN`.
- **Pantalla XD original:** `designs/NN-nombre.svg`.
- **Medidas del canvas:** `1080 × 1920` (retrato). Si este cliente usa otra resolución, indicarlo aquí.

---

## Estados de la pantalla

Lista los estados visibles. Para cada uno, una línea con qué lo distingue:

- `inactiva` — kiosk sin tocar durante > `features.inactividad_reset_seg`. Se ve X, Y, Z.
- `activa` — usuario tocando. Se ve Q.
- `error` — fallo de data/api. Se ve W.
- `carga` — mientras llega la data. Skeleton / spinner.

Si solo hay un estado, pon `default` y ya.

---

## Jerarquía visual

De arriba hacia abajo, los bloques principales con su función:

1. **Header** — logo del cliente, reloj si `features.mostrar_reloj`.
2. **Hero** — título principal + subtítulo + imagen de marca.
3. **CTA principal** — botón gigante "Empezar".
4. **Footer** — pie legal, número de versión.

---

## Medidas clave

Toda medida sale del SVG original. Si el SVG dice `x=64, y=128`, aquí va igual.

| Bloque   | x    | y    | w    | h    | Notas                             |
|----------|------|------|------|------|-----------------------------------|
| Header   | 0    | 0    | 1080 | 160  | sticky, `bg-background`           |
| Hero     | 48   | 200  | 984  | 900  | padding interno 48                |
| CTA      | 140  | 1400 | 800  | 160  | `radius-xl`, `bg-primary`         |
| Footer   | 0    | 1840 | 1080 | 80   | `text-xs`, `color-muted-foreground` |

(Mantener la tabla actualizada cuando cambie el SVG.)

---

## Tipografía por bloque

| Bloque   | Token fuente        | Tamaño       | Peso |
|----------|---------------------|--------------|------|
| Header   | `--font-sans`       | `--font-lg`  | 500  |
| Hero h1  | `--font-sans`       | `--font-4xl` | 700  |
| Hero p   | `--font-sans`       | `--font-xl`  | 400  |
| CTA      | `--font-sans`       | `--font-2xl` | 600  |
| Footer   | `--font-sans`       | `--font-xs`  | 400  |

---

## Colores por bloque

Siempre como **token**, nunca como hex. Si el SVG tiene un color que no está en `tokens.css`, se añade al template antes de construir.

| Bloque   | Fondo              | Texto                     |
|----------|--------------------|---------------------------|
| Header   | `--background`     | `--foreground`            |
| Hero     | `--background`     | `--foreground`            |
| CTA      | `--primary`        | `--primary-foreground`    |
| Footer   | `--background`     | `--muted-foreground`      |

---

## Contenido (qué se lee de `config.json`)

Lista todas las claves del `config.json` del cliente que esta pantalla consume:

- `textos.titulo_principal` → Hero h1.
- `textos.subtitulo` → Hero p.
- `textos.cta_primaria` → texto del botón CTA.
- `branding.logo.default` → `<Image src>` del header.
- `features.mostrar_reloj` → muestra/oculta reloj.
- `features.inactividad_reset_seg` → timeout del modo inactivo.

Si se detecta una cadena hardcodeada al construir, es bug.

---

## Interacciones

- **Toque en CTA primaria** → navegar a `navegacion.menu`.
- **Inactividad > N segundos** → volver a estado `inactiva` + animación de atracción.
- **Toque en cualquier parte en `inactiva`** → pasar a `activa`.

Si hay animaciones, listar cada una con trigger + duración + easing:

- Entrada del Hero: `fade-up`, 400ms, `--ease-out`.
- Pulse del CTA cuando `inactiva`: loop 2s, `--ease-in-out`.

---

## Accesibilidad

- **Contraste AA mínimo.** AAA deseable para textos > 18pt.
- **Orden de foco lógico** (aunque sea táctil, auditorías requieren foco válido).
- **Alt text** en todas las imágenes desde `config.json`.
- **Target táctil mínimo** 96×96 px (kiosk → dedos).

---

## Assets usados

- `assets/hero.jpg` — imagen de marca, 2160×1800, < 400KB, webp preferible.
- `assets/logo.svg` — logo cliente.

---

## Verificación (checklist para declarar la pantalla hecha)

- [ ] SVG original abierto y comparado con el render.
- [ ] Diff visual < ±2px en cualquier elemento.
- [ ] `pnpm typecheck && pnpm lint` sin errores.
- [ ] Cero hardcoded (ni colores, ni strings, ni paths).
- [ ] Audit con skill `web-design-guidelines` pasado.
- [ ] Probada con `KIOSK_CLIENT=default` y con al menos otro cliente para confirmar que reacciona a tokens.
- [ ] Screenshot guardado en `.planning/verifications/NN-nombre.png`.

---

**Notas libres:** cualquier detalle que no encaje arriba y sea importante.
