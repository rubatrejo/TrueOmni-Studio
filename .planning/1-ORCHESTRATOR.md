# Orchestrator Fase 1 — Scaffolding Next.js + Tailwind + shadcn/ui

Coordina los tres planes atómicos de la fase. Cada plan se ejecuta en una ventana de contexto fresca.

---

## Grafo de dependencias

```
          ┌──────────────┐
          │  Fase 0 OK   │  (bootstrap commiteado)
          └──────┬───────┘
                 │
                 ▼
        ┌────────────────┐
        │   Plan 1-1     │  Scaffold Next + TS + Tailwind + canvas 1080×1920
        │   (bloqueante) │
        └───┬────────┬───┘
            │        │
            ▼        ▼
    ┌──────────┐   ┌────────────────────┐
    │ Plan 1-2 │   │     Plan 1-3        │
    │ ESLint + │   │  shadcn + wrappers  │
    │ Prettier │   │                     │
    └────┬─────┘   └──────────┬──────────┘
         │                    │
         └────────┬───────────┘
                  ▼
          ┌───────────────┐
          │  Cierre Fase  │  (/terminar + update STATE.md + ROADMAP)
          └───────────────┘
```

## Paralelización

- **1-1 es bloqueante.** No se puede empezar 1-2 ni 1-3 sin los path aliases, Tailwind cableado a tokens y el cargador `getClientSlug()` listo.
- **1-2 y 1-3 son paralelizables entre sí**, pero coordinar dos detalles:
  1. La **regla ESLint `no-restricted-imports`** que prohíbe importar desde `@/components/ui/*` la define 1-3 conceptualmente pero vive físicamente en `.eslintrc.cjs` (archivo de 1-2). Solución: si se ejecutan en paralelo, el plan que se cierre primero **deja el archivo en un estado compatible** y el segundo añade la regla sin reescribir lo anterior. Si lo hace 1-3 solo, coordinar con el orquestador para editar `.eslintrc.cjs` de forma aditiva.
  2. El script `pnpm check` de 1-2 incluye `lint`, que fallará si 1-3 introduce archivos con warnings. El orden de **commit** recomendado es: 1-1 → 1-2 → 1-3. El orden de **ejecución** puede ser 1-1 → (1-2 y 1-3 a la vez) → commit 1-2 → commit 1-3.

## Orden de commits (CLAUDE.md §9: un commit por plan, Conventional Commits en español)

1. `feat(kiosk): scaffold next.js con tailwind y canvas retrato 1080×1920` → cierra 1-1.
2. `chore(dx): configura eslint y prettier estrictos con pnpm check` → cierra 1-2.
3. `feat(kiosk): añade shadcn/ui con 5 componentes base y wrappers` → cierra 1-3.

Archivos explícitos por commit (CLAUDE.md §9 prohíbe `git add -A`). Cada SUMMARY lista su conjunto exacto de archivos.

## Criterio de cierre de Fase 1 (para `/terminar`)

La fase se da por **cerrada** cuando:

- [ ] Los tres planes 1-1, 1-2, 1-3 tienen su SUMMARY correspondiente en `.planning/`.
- [ ] `pnpm check` pasa limpio (typecheck + lint + format:check).
- [ ] `pnpm kiosk:dev` levanta en `http://localhost:3000` y muestra el canvas 1080×1920 con el placeholder de fase.
- [ ] `pnpm build` se ha ejecutado al menos una vez con éxito (requiere aprobación explícita del humano, CLAUDE.md §9).
- [ ] Grep global sin resultados:
      `grep -REn '#[0-9a-fA-F]{3,8}|rgb\(' src/ tailwind.config.ts` → vacío.
      `grep -REn "1080px|1920px" src/` → vacío (las dimensiones viven en tokens).
- [ ] El subagent `auditor-white-label` corre sobre `src/` y solo reporta los strings de `src/lib/kiosk-placeholder.ts` (marcados como placeholder temporal de Fase 2).
- [ ] `ROADMAP.md` tiene los 6 checkboxes de "Fase 1" marcados.
- [ ] `STATE.md` tiene tres entradas nuevas (una por plan) con el historial de sesión.
- [ ] Commits 1, 2 y 3 están en `git log` con sus mensajes Conventional.

Cuando los 8 checks estén verdes, el orquestador puede pasar a planificar Fase 2.

## Decisiones cerradas (orquestador 2026-04-19)

1. ✅ **Tokens extra de shadcn (card, popover).** Se añaden a `clients/_template/tokens.css` dentro de 1-3. Cada token nuevo lleva comentario "requerido por shadcn". Motivo: coherencia con decisión §4 (tokens.css es la fuente) y con el principio de cero hardcoded. No se difiere a Fase 2.

2. ✅ **`cross-env` como devDep.** Se instala en 1-1. `kiosk:dev` queda portable Unix/Windows (`cross-env KIOSK_CLIENT=default next dev`). Motivo: evitar ruido futuro cuando alguien clone el repo en Windows.

3. ℹ️ **R8 (pantallas del kiosk v1).** Diferido a Fase 3, se activará al recibir los SVGs de Adobe XD. No es gap de Fase 1.

## Gaps abiertos (no bloqueantes)

4. **Linter anti-hardcoded semántico.** No existe regla ESLint que detecte strings en JSX (sería ruidosa). Se confía en el subagent `auditor-white-label`. Si en Fase 2/3 crecen los falsos positivos, considerar una regla custom.

5. **`no-restricted-imports` compartido entre 1-2 y 1-3.** Ver nota de paralelización. No es bloqueante, pero conviene decidir antes de arrancar si ambos planes corren a la vez.

## Siguiente acción para el orquestador

Ejecutar **Plan 1-1** en contexto fresco. Cuando termine y esté commiteado, lanzar **1-2 y 1-3 en paralelo** (dos ventanas distintas) o secuenciales si se prefiere simplicidad. Al cerrar los tres, ejecutar `/terminar` con los 8 checks del criterio de cierre.
