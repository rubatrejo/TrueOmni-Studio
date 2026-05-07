# DSS9-SUMMARY.md — Smoke E2E + cierre Milestone Signage Studio

**Fecha:** 2026-05-07
**Estado:** ✅ GATE APROBADO — Milestone Signage Studio CERRADO

## Hecho

DSS9 es la sub-fase de cierre del Milestone Signage Studio. **No introduce
código** — entrega doc de smoke E2E + handoff + actualiza roadmap maestro.

## Doc handoff

`.planning/2026-05-07-signage-studio-smoke-e2e.md` con:
- Capacidades del producto al cierre.
- Smoke E2E checklist (A automático + B visual + C producción).
- Troubleshooting common issues.
- Architecture notes (aislamiento kiosk vs signage, KV keys schema).
- Out of scope post-milestone.

## Recorrido del Milestone

10 sub-fases ejecutadas en una sola sesión continua (2026-05-07 PM):

| Sub-fase | Entrega |
|---|---|
| DSS0 | Bootstrap Studio: dropdown live + dashboard + KV namespace listo |
| DSS1 | Theme editor con 5 tabs read-only |
| DSS2 | Display editor con sidebar + preview iframe live |
| DSS3 | Bridge editor↔iframe + loader híbrido KV→fs |
| DSS4 | Playlist editable + autosave KV + drag-to-reorder + add slide |
| DSS5 | Module editors per-slot + overrides reactivos runtime |
| DSS6 | Snapshots/Versions con FIFO cap 10 + restore |
| DSS7 | Publish PR + JSON export/import + KV size advisor |
| DSS8 | Diagnostics + i18n editor + tour deferido |
| DSS9 | Smoke E2E doc + handoff (esta sub-fase) |

## Capacidades del producto al cierre

- Dashboard signage themes con cards consistentes kiosk.
- Theme editor (6 tabs): Branding · Header · Displays · i18n · Versions · Publish.
- Display editor: sidebar (settings + playlist DnD + versions + publish + kv-size) + iframe live.
- Schedule popover always/hours per-slide.
- Slot configurator inline con 6 module forms.
- Auto-snapshots cap 10 + restore git-like.
- Publish PR auto-merge (mismo patrón kiosk).
- JSON export/import + KV size advisor coloreado.
- i18n editor KV-first con merge fs+slug+locale.
- Diagnostics page system info.
- Bridge bidireccional con heartbeat + 4 status states.
- Loader híbrido KV→fs en runtime + i18n.

## Decisiones tomadas durante el milestone

- **HTML5 native drag** vs `@dnd-kit` (cero deps añadidas).
- **Sin sub-URLs en dashboard** (decisión UX): cada theme se gestiona desde
  la página única; sub-URL solo para theme editor.
- **Card visual idéntica al kiosk** para consistencia cross-product.
- **Layout dedicado inyecta tokens signage scoped** (no contamina Studio).
- **Bridge runtime emite incluso standalone** (no rompe uso directo).
- **Loader híbrido KV-first con fs fallback** en TODAS las cargas signage.
- **Working copy zustand local** + autosave 1s + bridge push 120ms.
- **Snapshot wrapper `{ meta, data }`** separa estructura del display real.
- **Restore git-like**: crea snapshot del current pre-restore (reversible).
- **AI suggest hooks deferidos** a DSS5.5 con feedback de usuario real.
- **Theme publish (branding+tokens+i18n) deferido** a DSS7.5 si surge.
- **Onboarding tour deferido** a DSS8.5 cuando haya feedback.

## Out of scope explícito (post-Milestone)

- DSS5.5 AI suggest hooks (Anthropic translate).
- DSS7.5 theme publish completo (branding + tokens + i18n).
- DSS8.5 onboarding tour.
- Lighthouse production ≥90 verification.
- Asset upload signage (Vercel Blob).
- daysOfWeek granular schedules.
- date-range schedule UI elaborada.

## Siguiente milestone candidate

Post-Milestone Studio del signage, los próximos focos productivos:

1. **Primer cliente real signage** (paralelo al Fase 4 del kiosk):
   bloqueado por negocio.
2. **Asset upload signage**: Vercel Blob para video/image assets sin
   copiar a fs manual.
3. **DSS7.5 theme publish completo**: branding + tokens + i18n.
4. **Tech debt post-Milestone Local** acumulado (definido en DS15-SUMMARY).
