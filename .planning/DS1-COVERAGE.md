# DS1-COVERAGE.md — Pixel-perfect del header signage

> SVG fuente: `designs/signage/01-full-events.svg` (group `Display_Info_Header`).
> Header común a los 8 templates. Diff visual ±2px obligatorio.

## Inventario de elementos del SVG (18)

### Background

- [ ] `Header_Background` rect 1920×155 fill `#004f8b` → `hsl(var(--signage-header-bg))`

### Display_Time_Info (translate 1693, 29) — clock derecha

- [ ] `date_copy` text "3:08 PM" Montserrat Bold 40 fill #fff → dynamic `clockText`
- [ ] `_20_` text "Mon Apr 15" Montserrat Medium 28 fill #fff → dynamic `dateText` (translate 0,56)

### Display_Weather_Info (translate 388, 0) — weather center

#### Current temp + 3 icons + 2 dividers (orden L→R en SVG, posiciones absolutas dentro del group)

- [ ] text `_50_4` "20°" Open Sans Semibold 70 (translate 201, 104) → dynamic `currentTempText`
- [ ] path `icon` (sun rays around circle) at translate(428.5, 37.86) — fill #fff
- [ ] rect `Rectangle_Copy-2` divider 2×113 at translate(518.64, 19) — fill #fff
- [ ] Group_4 (sun+cloud composite) at translate(641.25, 36.39) — clipPath, 6 paths verbatim, fill #fff
- [ ] rect `Rectangle_Copy` divider 2×113 at translate(756, 19) — fill #fff
- [ ] path `ic_weather` (cloud only, no fill, stroke #fff stroke-width 5) at translate(878, 56.68)

#### Group_1 — FRI card (translate -345.5, 41 dentro de Display_Weather_Info)

- [ ] text `date_copy` "FRI" Montserrat Bold 40 (translate 713.75, 26 → x=-34.04 y=0)
- [ ] text `_50_` "50°" Montserrat Bold 22 (translate 670.25, 77 → x=0 y=0)
- [ ] text `_20_2` "20°" Montserrat Light 22 (translate 722.25, 77 → x=0 y=0)
- [ ] rect `Rectangle_Copy_2` divider 2×90 rx=1 (translate 758.75, 39, rotate 90) fill #fff

#### Group_8 — SAT card (translate -195.36, -28 dentro de Display_Weather_Info)

- [ ] text `date_copy-3` "SAT" Montserrat Bold 40 (translate 781.36, 95 → x=-39.74 y=0)
- [ ] text `_50_2` "50°" Montserrat Bold 22 (translate 737.86, 146 → x=0 y=0)
- [ ] text `_20_3` "20°" Montserrat Light 22 (translate 789.86, 146 → x=0 y=0)
- [ ] rect `Rectangle_Copy_2-2` divider 2×90 rx=1 (translate 826.36, 108, rotate 90) fill #fff

#### Group_9 — SUN card (translate -66.75, -60.5 dentro de Display_Weather_Info)

- [ ] text `date_copy-4` "SUN" Montserrat Bold 40 (translate 884.75, 127.5 → x=-44.68 y=0)
- [ ] Group_3759 sub-group (translate -0.25, -3):
  - [ ] text `_50_3` "50°" Montserrat Bold 22 (translate 841, 181.5)
  - [ ] text `_20_4` "20°" Montserrat Light 22 (translate 893, 181.5)
- [ ] rect `Rectangle_Copy_2-3` divider 2×90 rx=1 (translate 929.75, 140.5, rotate 90) fill #fff

### Group_12 — TrueOmni logo (translate 18, -15.67)

- [ ] Group_4-2 (translate 32, 64) wrapping logo paths
  - [ ] Group_2 → Group_1-2 con clipPath y 13 paths del wordmark "TrueOmni" + isotipo
  - [ ] Path_12 + Path_13 — 2 puntos color `#0088ce` (parte del logo TrueOmni)
  - [ ] Rectangle_1 (separator 2.6×27.041 dentro del wordmark)

## Verificación pixel-perfect

- [ ] `pnpm typecheck && pnpm lint` limpios
- [ ] `pnpm kiosk:dev` arranca limpio
- [ ] GET `/signage/default/lobby-tv` → header visible con todos los elementos
- [ ] Background `--signage-header-bg` se aplica (azul oscuro)
- [ ] Clock + date refrescan en vivo (timezone Phoenix aplicado)
- [ ] Forecast cards muestran 3 días reales del API Open-Meteo (skip today, take 1..3)
- [ ] Cero `onClick`/`onTouchStart`/`onPointerDown`/`onKeyDown` en árbol header
- [ ] Cero hex hardcoded en JSX (#0088ce del logo es interno al SVG paths verbatim, exento)
- [ ] Cero strings UI hardcoded en componente (los que vienen del SVG son labels de muestra que se reemplazan dinámicamente)
- [ ] Diff visual contra el header del SVG ±2px

## Audit final

- [ ] Auditor white-label no flagea nada nuevo
- [ ] Subagent `revisor-visual` puede correr (opcional en DS1; obligatorio en sub-fases de template completo)
- [ ] Header height token `--signage-header-height: 155px` actualizado en \_template y default
