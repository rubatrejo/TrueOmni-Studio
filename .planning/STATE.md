# STATE.md — Memoria del proyecto

Este archivo es la memoria persistente entre sesiones. Cada `/terminar` añade una entrada aquí.

---

## Estado actual

**Fase activa:** Fase 2 — Sistema de tokens + cargador de cliente (por iniciar).

**Última fase cerrada:** Fase 1 — Scaffolding Next.js + Tailwind + shadcn/ui.

**Siguiente acción concreta:** discutir con el orquestador el alcance de Fase 2 (crear `clients/default/` y `clients/demo-cliente-a/`, extender cargador a `config.json` tipado con `src/lib/config.ts`, mover placeholder de Fase 1 a config real).

**Bloqueos:** ninguno. Esperando SVGs del XD para activar Fase 3 más adelante.

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
