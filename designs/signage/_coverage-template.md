# DS<N>-<NN>-<template>-COVERAGE.md — Pixel-perfect checklist

> Crear una copia de este archivo en `.planning/DS<N>-<NN>-<template>-COVERAGE.md`
> al arrancar la sub-fase de un template signage. Marcar items conforme se cubren.

## Inventario de groups del SVG

Listado completo de `<g>` del SVG fuente. Cada group debe tener un componente o
elemento React que lo reproduce verbatim. Si un group del SVG NO aparece aquí,
falta cobertura.

- [ ] `g[id="..."]` — descripción visual
- [ ] …

## Paths verbatim

- [ ] Todos los `<path d="...">` del SVG copiados sin modificar coords.
- [ ] Los `transform="..."` del SVG preservados (rotate, translate, scale).
- [ ] Cero substituciones de iconos por librerías cuando el SVG los trae.

## Slots del template

- [ ] Cada slot del template renderea el módulo configurado (no el placeholder del SVG).
- [ ] Tipos de slot validados (`acceptedModules` rechaza slots con módulo incompatible).

## Tokens y white-label

- [ ] Cero hex hardcoded en JSX del template (auditor `auditor-white-label`).
- [ ] Cero strings UI hardcoded — todo via `t('signage.*')` o pulled del SVG verbatim.
- [ ] Cero paths de imagen hardcoded — usan `client.branding.*` o `module.asset.url`.
- [ ] Tokens `--signage-*` consumidos vía Tailwind class (`bg-signage-*`) o `hsl(var(--signage-*))`.

## No-touch

- [ ] Cero `onClick` / `onTouchStart` / `onPointerDown` en JSX del template.
- [ ] Cero focus rings (template no es interactivo).

## Diff visual

- [ ] Subagent `revisor-visual` ejecutado contra `designs/signage/NN-name.svg`.
- [ ] Diff <= ±2px @ 1080p baseline.
- [ ] Verificación @ 4K (3840×2160) — sin pixelado, transform scale 2.0 correcto.
- [ ] Letterbox correcto en aspect 32:9 (tokenizado, no negro hardcoded).

## i18n

- [ ] Strings declarados en `clients-signage/_template/i18n/{en,es,fr,de,pt,ja}.json`.
- [ ] Cambio de locale renderea texto correcto sin reload.
- [ ] Fallback literal del SVG usado cuando `t(key) === key`.

## Audit final

- [ ] `pnpm typecheck && pnpm lint` limpios.
- [ ] `pnpm kiosk:dev` arranca limpio post-commit.
- [ ] Audit `web-design-guidelines` (Tier 2) ejecutado.
- [ ] Memory check: 5 minutos de rotación incluyendo este template — sin leak.
