# DSS9-PLAN.md — Smoke E2E producción + doc paso a paso · GATE Milestone

Atomic plan ejecutable en sesión fresca. **DSS9 es la sub-fase de cierre
del Milestone Signage Studio.** No introduce código: entrega el checklist
E2E para smoke en producción + doc handoff + actualiza roadmap maestro.

```xml
<task type="manual-gate">
  <name>DSS9 — Smoke E2E producción signage + doc + cierre Milestone</name>
  <files>
    .planning/2026-05-07-signage-studio-smoke-e2e.md   (NUEVO — checklist E2E)
    .planning/DSS9-SUMMARY.md
    .planning/SIGNAGE-ROADMAP.md                       (DSS9 ✅ + Milestone Studio CERRADO)
    .planning/SIGNAGE-PROJECT.md                       (sección "Milestones cerrados")
    .planning/ROADMAP.md                               (sección Milestone Signage Studio CERRADO)
    .planning/STATE.md                                 (entry de sesión maratón)
  </files>
  <action>
    No se modifica código. Se ejecuta el checklist E2E con Rubén en pantalla
    + se entregan los 5 documentos.
  </action>
  <verify>
    Checklist E2E del doc handoff (ver abajo).
  </verify>
  <done>
    - Doc smoke E2E entregable.
    - SIGNAGE-PROJECT/ROADMAP marcan Milestone Studio CERRADO.
    - ROADMAP maestro actualizado.
    - STATE.md con sesión maratón documentada.
  </done>
</task>
```

## Smoke E2E checklist (resumen del doc)

### A. Verificación automática

| #   | Check            | Método                                                                                                                                        | Esperado     |
| --- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| A1  | Typecheck        | `pnpm typecheck`                                                                                                                              | exit 0       |
| A2  | Lint signage     | `pnpm exec eslint src/components/signage/ src/lib/signage/ 'src/app/(signage)/' src/app/studio/digital-displays/ src/app/api/studio/signage/` | exit 0       |
| A3  | Dev arranque     | `pnpm kiosk:dev`                                                                                                                              | Ready in <2s |
| A4  | Runtime          | `GET /signage/default/lobby-tv`                                                                                                               | HTTP 200     |
| A5  | Studio dashboard | `GET /studio/digital-displays`                                                                                                                | HTTP 200     |
| A6  | Theme editor     | `GET /studio/digital-displays/default`                                                                                                        | HTTP 200     |
| A7  | Display editor   | `GET /studio/digital-displays/default/displays/lobby-tv`                                                                                      | HTTP 200     |
| A8  | Diagnostics      | `GET /studio/digital-displays/diagnostics`                                                                                                    | HTTP 200     |
| A9  | Kiosk regression | `GET /` y `GET /studio`                                                                                                                       | ambos 200    |

### B. Verificación visual / interactiva (humano-driven)

| #   | Vector                 | Resultado esperado                                                                                          |
| --- | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| B1  | Dashboard cards        | 1 card "Default Signage Client" con gradient signage, badge "1 display", click abre theme editor            |
| B2  | Theme editor tabs      | 6 tabs (Branding · Header · Displays · i18n · Versions · Publish) navegan sin reload                        |
| B3  | i18n editor            | Locale selector cambia el bag, edit value, Save → success badge, próximo render runtime usa el string nuevo |
| B4  | Display editor         | Sidebar (Settings + Playlist + Versions + Publish + KV) + iframe live 16:9 con bridge "Connected"           |
| B5  | Edit settings          | audio toggle / duration / transition / sleep → autosave 1s → "Saved"                                        |
| B6  | Drag-to-reorder slides | DnD reorder funcional + "Saved"                                                                             |
| B7  | Add slide modal        | Template + duration + transition → confirm → slide aparece                                                  |
| B8  | Schedule popover       | Click pill "always" → cambiar a Hours 09:00–18:00 → Apply                                                   |
| B9  | Slot configurator      | Chevron expand → asignar module → form aparece → autosave                                                   |
| B10 | Push live al iframe    | Cambiar slot config → ver iframe refresca sin reload                                                        |
| B11 | Versions panel         | N saves → N-1 snapshots con timestamp; Restore con confirm → reload con state restaurado                    |
| B12 | Export JSON            | `<a download>` baja `lobby-tv.json` válido                                                                  |
| B13 | Import JSON            | upload del JSON → snapshot pre-import + reload con state importado                                          |
| B14 | Publish                | si STUDIO*GITHUB*\* configurado: PR URL clickable; sino: 503 con mensaje claro                              |
| B15 | KV size advisor        | Bar verde con bytes correctos; refresca tras saves                                                          |
| B16 | Diagnostics            | 4 cards muestran info correcta (clients=1, displays=1, KV bytes>0)                                          |

### C. Producción (deploy Vercel)

| #   | Check                                                 | Esperado                                           |
| --- | ----------------------------------------------------- | -------------------------------------------------- |
| C1  | Deploy a `trueomni-studio.vercel.app` (o equivalente) | ✅ ready                                           |
| C2  | `/signage/default/lobby-tv` en producción             | rotación 8 templates + header live                 |
| C3  | `/studio/digital-displays` en producción              | dashboard + click → editor                         |
| C4  | Save en producción                                    | KV cloud (Upstash) recibe el set; refresh persiste |
| C5  | Publish flow producción                               | PR creado en repo; auto-merge cuando checks verdes |

### D. Doc handoff

`.planning/2026-05-07-signage-studio-smoke-e2e.md` con:

- Resumen del milestone (DSS0-DSS9 con bullets).
- Checklist E2E completo.
- Troubleshooting common issues:
  - "Connecting" badge stuck en bridge → reload del iframe.
  - Publish 503 → set env STUDIO*GITHUB*\*.
  - KV miss en runtime → fs fallback (loader híbrido).
  - i18n key no aparece → check fs default + slug + KV override.
- Notas de architecture (kiosk vs signage, namespace KV, fs vs KV).

## Out of scope explícito (post-Milestone Studio)

- DSS5.5 AI suggest hooks (Anthropic translate).
- DSS7.5 theme publish completo (branding + tokens + i18n).
- DSS8.5 onboarding tour.
- Lighthouse production ≥90 (verifies en setup deploy real).
- Telemetry (DSS9.5 si hace falta).
