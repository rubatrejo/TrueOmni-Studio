# Fase 3.16 — Photo Booth module · CONTEXT

## Decisiones cerradas en brainstorm (2026-04-24)

1. **Green-screen post-captura, no live.** Durante live preview + countdown se ve la cámara cruda. Al disparar se captura el frame, se segmenta UNA vez, y el editor muestra la foto ya con fondo reemplazado. Motivación: 1 inferencia ML por foto (no 30–60 fps) → viable en hardware de kiosk sin GPU.

2. **Share es UI mock en v1.** QR con URL placeholder tokenizada, Email/Text con OnScreenKeyboard + confirmación "Sent!" sin envío real. Fase 5+ conecta QR upload, SMTP, SMS. Consistente con Ask AI (typewriter mock → LLM real en v2).

3. **Stickers posicionables drag&drop en v1.** Cada sticker = overlay PNG pequeño. Tap añade en centro; drag reposiciona. Reutiliza patrón de `guestbook-pin-rail`. Scale/rotate queda para v2 si hay tiempo.

4. **Single shot (no burst).** Las 5 pantallas entregadas asumen 1 foto. No hay collage ni burst mode.

5. **Retake:** back arrow del editor descarta la foto y vuelve a `'live'`.

6. **Auto-return a Home** tras share con countdown 10 s (patrón Survey/Send-to-email).

7. **Dep ML:** `@mediapipe/tasks-vision` (SelfieSegmenter, WASM + WebGL). ~1–2 MB. Lazy-loaded solo en `/home/photo-booth`.

8. **Pipeline de composición** (canvas 1080×1920):
   1. Background (imagen del cliente 1080×1920).
   2. Cutout persona (máscara alpha de MediaPipe aplicada al frame capturado).
   3. Frame overlay (PNG transparente 1080×1920).
   4. Stickers (PNG pequeños con transform state del editor).
   5. CSS filter (cocido en canvas con `ctx.filter`).

9. **Mock mode** `NEXT_PUBLIC_KIOSK_PHOTO_MOCK=1` → `use-camera` sirve un video/imagen estática para verificación visual + Playwright.

10. **HTTPS en prod** requerido por `getUserMedia`. En dev localhost funciona sin HTTPS. Documentado para handoff.

## Inputs entregados por Rubén

- 5 pantallas SVG + PNGs en `/Users/rubenramirez/Desktop/Photo Booth/`:
  - 0-Photo_Booth-Start (intro + live + carrusel + timer + EXPERIENCE)
  - 1/2/3-Photo_Booth-Countdown-{3,2,1} (overlay fullscreen)
  - 4-Photo_Booth-Experience (editor con tabs + stickers + foto)
  - 5-Photo_Booth-Share (QR + social + email/text)
- 5 frames PNG (Frame_0..Frame_4) — copiados a `clients/default/assets/photo-booth/frames/`.

**NO entregados** (a resolver en planning):

- Assets separados para backgrounds (los vi renderizados en el SVG 4-Experience pero no como archivos). Para v1 uso placeholders visuales diversos (Van Gogh SVG del SVG ya existente; LEGO tile de home; paisajes generados) hasta que Rubén entregue el set final.
- Stickers PNG individuales. Para v1 uso un set reducido de emoji-PNG renderizados al vuelo (Twemoji) o emojis Unicode en `<span>` con `font-size` grande como fallback tokenizado.

## Tokens `--photo-*`

Añadidos a los 3 `tokens.css` (default, \_template, demo-cliente-a):

| Token                       | Valor default         | Uso                                              |
| --------------------------- | --------------------- | ------------------------------------------------ |
| `--photo-bg`                | `0 0% 100%`           | Fondo general editor                             |
| `--photo-text`              | `218 35% 14%`         | Texto principal                                  |
| `--photo-tabs-bg`           | `201 100% 40%`        | Fondo barra de tabs (Backgrounds/Frames/Filters) |
| `--photo-tab-active`        | `0 0% 100%`           | Tab seleccionado (blanco)                        |
| `--photo-tab-inactive`      | `201 100% 40%`        | Tab no seleccionado (primary)                    |
| `--photo-tab-text-active`   | `218 35% 14%`         | Texto tab activo                                 |
| `--photo-tab-text-inactive` | `0 0% 100%`           | Texto tab inactivo                               |
| `--photo-sidebar-bg`        | `201 100% 40% / 0.85` | Barra lateral derecha del editor                 |
| `--photo-sidebar-icon`      | `0 0% 100%`           | Flechas e icono QR                               |
| `--photo-countdown-bg`      | `0 0% 0% / 0.55`      | Overlay 3-2-1 (capa oscura)                      |
| `--photo-countdown-number`  | `0 0% 100%`           | Número 3/2/1                                     |
| `--photo-share-bg`          | `0 0% 0%`             | Fondo negro pantalla Share                       |
| `--photo-share-title`       | `0 0% 100%`           | "SHARE YOUR MEMORIES"                            |
| `--photo-cta-border`        | `0 0% 100%`           | Borde botones EMAIL/TEXT                         |
| `--photo-accent-from`       | `201 95% 46%`         | Gradient accent (mic / loader)                   |
| `--photo-accent-to`         | `173 81% 30%`         | Gradient accent                                  |

## Verificación (criterios por pantalla)

Ver `3-16-COVERAGE.md` (checklist de groups SVG por pantalla).

## Riesgos conocidos

Ver `plan`. Los principales: lazy-load MediaPipe (warm-up), permisos cámara, edges pixelados (feather), compose performance.
