# ROADMAP.md — Kiosk Portrait

Fases ordenadas. Cada fase es atómica, ejecutable en una ventana de contexto fresca.

---

## Fase 0 — Bootstrap del repo ✅ cerrada (2026-04-19)

**Cubre:** infraestructura.

- [x] CLAUDE.md raíz.
- [x] `.claude/commands/iniciar.md`, `.claude/commands/terminar.md`.
- [x] `.planning/` con PROJECT, REQUIREMENTS, ROADMAP, STATE.
- [x] `clients/_template/` con `config.json` + `tokens.css`.
- [x] `designs/_template.md` con plantilla de specs por pantalla.
- [x] `git init` + primer commit `chore: bootstrap del repo` (`8e5a3e5`).
- [x] Aún no hay Next.js — eso va en la fase 1.

> Los checks se marcan solo **después** del commit que los incorpora. Nada está "hecho" hasta que está en git.

**Verificación:** árbol de archivos correcto, CLAUDE.md se lee sin errores, `git log` muestra el primer commit.

---

## Fase 1 — Scaffolding Next.js + Tailwind + shadcn/ui ✅ cerrada (2026-04-19)

**Cubre:** R2.

- [x] Scaffold Next.js 15 + React 19 + TypeScript estricto + App Router (`04464ce`).
- [x] shadcn/ui con 5 componentes base (button, card, dialog, input, badge) + wrappers (`172dc42`).
- [x] Alias de paths (`@/components`, `@/lib`, `@/styles`).
- [x] ESLint + Prettier estrictos + scripts `check`/`format`/`lint` (`59718e1`).
- [x] Variable de entorno `KIOSK_CLIENT` con `getClientSlug()` + fallback `default`.
- [x] Script `pnpm kiosk:dev` con `cross-env KIOSK_CLIENT=default next dev`.

**Verificación:** `pnpm kiosk:dev` levanta HTTP 200, `pnpm check` limpio,
canvas 1080×1920 visible, placeholder mostrando `Cliente activo: default`.

---

## Fase 2 — Sistema de tokens + cargador de cliente ✅ cerrada (2026-04-19)

**Cubre:** R3, R4, R5, R6.

- [x] `src/lib/tokens.ts` con `TokenColor`/`TokenLayout` (`7bc72ef`).
- [x] `src/lib/config.ts` con `getConfig()` tipado + fallback (`7bc72ef`).
- [x] `src/lib/client-tokens.ts` inyecta `tokens.css` por cliente en layout (`5b44b63`).
- [x] Tailwind config extendido con `hsl(var(--...))` (desde Fase 1).
- [x] `clients/_template/README.md` documenta creación de cliente nuevo.
- [x] `clients/default/` existe como clon del template.
- [x] `clients/demo-cliente-a/` con tokens alternos (naranja + verde menta).

**Verificación:** `KIOSK_CLIENT=default` → primary azul, `KIOSK_CLIENT=demo-cliente-a` →
primary naranja, textos distintos, sin tocar ningún `.tsx`.

---

## Fase 3 — Pantallas del kiosk (pixel-perfect)

**Cubre:** R1, R2, R7, R8.

Subfases cerradas:

- [x] 3.1 — Billboards B1-B4 (2026-04-20).
- [x] 3.2 — Main Dashboard / Home (2026-04-20).
- [x] 3.3 — Listings module (Restaurants / Things to Do / Stay) + pulido V1/V2 (2026-04-20).
- [x] 3.4 — Events module (2026-04-21).
- [x] 3.5 — Social Wall (2026-04-21).
- [x] 3.6 — Digital Brochure (2026-04-21).
- [x] 3.7 — Map module (2026-04-21).
- [x] 3.8 — Advertisement system (2026-04-21).
- [x] 3.9 — Survey overlay V1-V8 (2026-04-22).
- [x] 3.10 — Passes module (2026-04-22).
- [x] 3.11 — Tickets module + iteraciones v2-v9 (2026-04-22).
- [x] 3.12 — Deals module (2026-04-23).
- [x] 3.13 — Trails module con tabs de mapa + Considerations (2026-04-23).
- [x] 3.14 — Guestbook module con Earth zoom + drag&drop + comments (2026-04-23).
- [x] 3.15 — Ask AI module (avatar IA flotante + modal con typewriter + voice) (2026-04-23).
- [x] 3.16 — Photo Booth module (green-screen MediaPipe + editor + share + modales reales + 8 stickers PNG 3D con drag&drop/resize/delete) — **aprobada por Rubén** (2026-04-27).
- [x] 3.17 — Itinerary Builder (rail unificado sobre 3 buckets de favoritos + welcome popup + tabs dinámicos + mapa con ruta + drag&drop + AI wizard config-driven + share modal con QR + Send to Email/Phone) — **aprobado por Rubén** (2026-04-28).
- [x] 3.18 — Multi-idioma (6 idiomas: en/es/fr/de/pt/ja) + teclado iOS-style + DraggableKeyboard + seed data refresh — adelantado desde Fase 6 (v2) como pre-requisito de Fase 4 (commit `b201a51`, 2026-04-28).

Pendientes:
- [ ] Map aggregator integration para trails (follow-up de 3.13).
- [ ] Backend real para Guestbook (Fase 5+).
- [ ] LLM real para Ask AI (endpoint `/api/ai` con Anthropic Claude — Fase 5+).

Cada sub-fase cumple:

- SVG y specs depositados, plan XML creado.
- Componente construido pixel-perfect.
- Screenshot + diff visual contra SVG.
- Audit con `auditor-white-label`.

**Verificación por pantalla:** diff visual ±3px, accesibilidad AA mínimo, typecheck + lint limpios.

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

---

## Milestone Studio — Plataforma de gestión de kiosks (Kiosk Studio) ✅ CERRADO 2026-05-06

> Detalles completos en `.planning/STUDIO-PROJECT.md` y `.planning/STUDIO-ROADMAP.md`.
> Plan brainstormeado y aprobado: `/Users/rubenramirez/.claude/plans/wild-weaving-key.md`.

Editor visual white-label para crear y mantener kiosks sin tocar código. Vive como subruta `/studio` en el mismo repo. Live preview siempre visible vía iframe + postMessage. Storage híbrido: Upstash KV durante edición + "publish" exporta a `clients/<slug>/`. **Producción:** `https://trueomni-studio.vercel.app`.

Fases:

- [x] **S0** — Shell + clientes + preview + persistencia (MVP).
- [x] **S1** — Branding tab (3 brand tokens + logos + fonts).
- [x] **S2** — Módulos tab (toggle + reorder + labels).
- [x] **S3** — Contenido / Data (CRUD listings/events/passes/deals/trails/brochures).
- [x] **S4** — i18n editor (6 locales, AI translation con DeepL primario + Anthropic fallback).
- [x] **S5** — Ads system (subir, calendarizar, emplazar).
- [x] **S6** — Integraciones (clima, APIs, Mapbox, Analytics, Tavus, Bandwango, CrowdRiff, Viator, Satisfi).
- [x] **S7** — Auth NextAuth GitHub + Vercel + GitHub PR-publish con approval gate (`ruben@trueomni.com`).
- [x] **Audit panorámico** (2026-05-05/06) — 32/32 hallazgos cerrados en código.

---

## v2 (después del shipping de v1)

- ~~Fase 6 — Multi-idioma (R9).~~ ✅ adelantado a v1 como sub-fase 3.18 (2026-04-28).
- ~~Fase 7 — Editor visual de tokens (R10).~~ ✅ cubierto por Studio Branding tab (S1).
- ~~Fase 8 — Integración APIs externas (R11).~~ ✅ cubierto por Studio S6 Integrations.
- ~~Fase 9 — Temas adicionales (R12).~~ ✅ catálogo definido `_lib/starters.ts` (2026-05-06). UI cableo en NewClientModal pendiente como sub-fase S.

---

## Dependencias

```
Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5
```

No se pueden paralelizar hasta la Fase 3, donde cada pantalla es independiente.
