# ROADMAP.md — Kiosk Portrait

Fases ordenadas. Cada fase es atómica, ejecutable en una ventana de contexto fresca.

---

## Fase 0 — Bootstrap del repo  🟡 en progreso

**Cubre:** infraestructura.

- [ ] CLAUDE.md raíz.
- [ ] `.claude/commands/iniciar.md`, `.claude/commands/terminar.md`.
- [ ] `.planning/` con PROJECT, REQUIREMENTS, ROADMAP, STATE.
- [ ] `clients/_template/` con `config.json` + `tokens.css`.
- [ ] `designs/_template.md` con plantilla de specs por pantalla.
- [ ] `git init` + primer commit `chore: bootstrap del repo`.
- [ ] Aún no hay Next.js — eso va en la fase 1.

> Los checks se marcan solo **después** del commit que los incorpora. Nada está "hecho" hasta que está en git.

**Verificación:** árbol de archivos correcto, CLAUDE.md se lee sin errores, `git log` muestra el primer commit.

---

## Fase 1 — Scaffolding Next.js + Tailwind + shadcn/ui

**Cubre:** R2.

- [ ] `pnpm create next-app` con TypeScript + Tailwind + App Router.
- [ ] Instalar shadcn/ui y al menos 5 componentes base (button, card, dialog, input, badge).
- [ ] Configurar alias de paths (`@/components`, `@/lib`, `@/styles`).
- [ ] Configurar ESLint + Prettier con reglas estrictas.
- [ ] Variables de entorno: `KIOSK_CLIENT`.
- [ ] Script `pnpm kiosk:dev` que arranca con `KIOSK_CLIENT=default`.

**Verificación:** `pnpm dev` levanta, typecheck pasa, lint limpio, página en blanco con layout del kiosk (1080×1920).

---

## Fase 2 — Sistema de tokens + cargador de cliente

**Cubre:** R3, R4, R5, R6.

- [ ] `src/lib/tokens.ts` con el tipo `Tokens`.
- [ ] `src/lib/config.ts` que lee `clients/${KIOSK_CLIENT}/config.json` tipado.
- [ ] `clients/_template/tokens.css` aplicado en `globals.css`.
- [ ] Tailwind config extendido con `hsl(var(--...))`.
- [ ] Documentar cómo crear un cliente nuevo en `clients/_template/README.md`.
- [ ] Crear `clients/default/` como clon del template.
- [ ] Crear `clients/demo-cliente-a/` con tokens alternativos para probar que cambiar token = cambia UI.

**Verificación:** cambiar `KIOSK_CLIENT=demo-cliente-a` rebuild-ea con colores distintos sin tocar `.tsx`.

---

## Fase 3 — Pantallas del kiosk (pixel-perfect)

**Cubre:** R1, R2, R7, R8.

- Una sub-fase por pantalla. Por definir cuando Rubén entregue los SVGs.
- Cada sub-fase:
  - [ ] SVG y specs depositados en `designs/`.
  - [ ] Plan XML creado.
  - [ ] Skills `frontend-design`, `ui-ux-pro-max`, `theme-factory` cargados.
  - [ ] Componente construido.
  - [ ] Screenshot + diff visual contra SVG.
  - [ ] Audit con `web-design-guidelines`.

**Verificación por pantalla:** diff visual < 2px, accesibilidad AA mínimo, typecheck + lint limpios.

---

## Fase 4 — Primer cliente real

**Cubre:** R3, R4, R6 en producción.

- [ ] Crear `clients/{cliente-real}/` con tokens + config + assets reales.
- [ ] Build de producción con `KIOSK_CLIENT={cliente-real}`.
- [ ] Lighthouse en producción.
- [ ] Documentación de handoff para el cliente.

**Verificación:** Lighthouse > 95 en performance y accesibilidad; QA visual manual.

---

## Fase 5 — Automatización de nuevo cliente

**Cubre:** DX.

- [ ] Script `pnpm kiosk:new-client <slug>` que copia `_template/` y llena placeholders.
- [ ] Validador de `config.json` con zod/valibot para detectar configs inválidos antes de buildear.
- [ ] Slash command `/nuevo-cliente`.

**Verificación:** un cliente nuevo sale en < 10 min.

---

## v2 (después del shipping de v1)

- Fase 6 — Multi-idioma (R9).
- Fase 7 — Editor visual de tokens (R10).
- Fase 8 — Integración APIs externas (R11).
- Fase 9 — Temas adicionales (R12).

---

## Dependencias

```
Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5
```

No se pueden paralelizar hasta la Fase 3, donde cada pantalla es independiente.
