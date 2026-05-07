# DS15-PLAN.md — Smoke E2E + GATE del Milestone Signage Local

Atomic plan ejecutable en sesión fresca. **No introduce código nuevo**: es la
verificación final integral del Milestone Signage Local antes de declararlo
cerrado y abrir paso al Milestone Signage Studio (DSS0+).

```xml
<task type="manual-gate">
  <name>DS15 — Smoke E2E + GATE: validar que DS0..DS14 funcionan sin leaks ni regressions</name>
  <files>
    .planning/DS15-SUMMARY.md           (al cerrar)
    .planning/SIGNAGE-ROADMAP.md        (marcar DS15 ✅ + Milestone CERRADO)
    .planning/SIGNAGE-PROJECT.md        (marcar Milestone Local cerrado)
    .planning/STATE.md                  (entrada de sesión)
  </files>
  <action>
    No se modifica código. Se ejecuta el checklist visual con Rubén en pantalla.
    Cada vector debe quedar ✅ antes de declarar el Milestone cerrado.
  </action>
  <verify>
    Checklist abajo (sección "Smoke E2E checklist").
  </verify>
  <done>
    - 7 vectores del checklist validados con Rubén.
    - Sin memory leak en 5 minutos de rotación continua.
    - Sin regression del kiosk (`/` sigue HTTP 200 con KIOSK_CLIENT=default).
    - Aprobación visual final del usuario.
    - Documentos cerrados.
  </done>
</task>
```

## Smoke E2E checklist

### A. Verificación automática (script-driven)

| # | Check | Comando | Esperado |
|---|---|---|---|
| A1 | Typecheck | `pnpm typecheck` | exit 0 |
| A2 | Lint global | `pnpm lint` | exit 0 (o warnings preexistentes únicamente) |
| A3 | Dev server arranque | `pnpm kiosk:dev` | `Ready in <2s` |
| A4 | Endpoint signage | `GET /signage/default/lobby-tv` | HTTP 200 |
| A5 | Regression kiosk | `GET /` | HTTP 200 (sin romper Fase 3) |

### B. Verificación visual (humano-driven)

| # | Vector | URL / Acción | Validación |
|---|---|---|---|
| B1 | **Rotación 5 min sin leak** | `/signage/default/lobby-tv` abierto 5 min con DevTools Memory tab | Heap estable ±10% durante el ciclo. Sin acumulación de DOM. |
| B2 | **8 templates pixel-perfect** | mismo URL, observar el ciclo completo | Cada uno de los 8 templates (events, ads, video-image, video-events-ad, video-2ads, video-news-ad, video-social-ad, video-social) renderiza idéntico al SVG fuente |
| B3 | **Header live** | mismo URL, mirar el header | Logo + weather Phoenix + temp + 3 forecast cards + clock vivo (1s) + date sin glitches |
| B4 | **4 transitions** | mismo URL, observar transitions entre slides | cut, fade, slide-left, slide-up todas suaves; sin tearing del header durante slide-up |
| B5 | **Dayparting** | `?clock=20:00` vs `?clock=10:00` | A las 20:00 el slide news-ad está oculto; a las 10:00 visible. El header sigue en hora real (by design) |
| B6 | **Sleep gate** | activar `sleepSchedule.enabled:true` con ventana cubriendo ahora, refresh | pantalla negra uniforme sobre header + body |
| B7 | **Header bottom** | cambiar `client.json` `position:"bottom"`, refresh | Header en y=925..1080, body en y=0..925 |
| B8 | **Audio toggle** | en template 03 con video real, `audio:true` vs `false` | Audio audible solo con audio:true (testeable solo con un mp4 real subido) |
| B9 | **i18n locale es** | `client.json` `locale:"es"`, fuerza placeholder con dayparting fuera | Strings de placeholder en español, sin hydration mismatch |
| B10 | **Resolución 1080p / 4K** | DevTools Device Toolbar → 1920×1080 y 3840×2160 | SignageStage escala uniformemente con letterbox tokenizado, sin elementos cortados |

### C. Cleanup post-verificación

- Restaurar `client.json` a `locale:"en"` y `position:"top"` si se modificó.
- Restaurar `display.json` a `audio:false`, `sleepSchedule.enabled:false`,
  schedule del news-ad a `09:00–18:00`.
- `git status --short` debe quedar igual al pre-DS15.

## Notas

- **B1 (memory leak)**: Chrome DevTools → Memory → Take heap snapshot a t=0s y
  t=5min (5×ciclo). Heap diff debe ser <10% ó <5MB. Si crece más, sospechar
  acumulación de timers (DS13 dayparting) o slides (DS12 transitions).
- **B5 dayparting**: el `?clock` solo afecta dayparting, no el reloj del header
  (decisión documentada en DS13-SUMMARY).
- **B9 hydration**: fix en DS14 vía `normalizeIntlWhitespace`. Si reaparece,
  debug con `pnpm next:start` (build de prod hidrata estricto).
- **B10 4K**: `SignageStage` ya hace `Math.min(sx, sy)` para fit-contain con
  letterbox. Verificar que `--signage-stage-bg` se ve en las barras (negro
  por default).

## Out of scope (Milestone Studio = DSS0+)

- Editor visual (Studio) para crear/editar signage clients sin tocar fs.
- KV `signage:*` para overrides no-publicados.
- Bridge editor↔preview-iframe.
- Publish a `clients-signage/<slug>/` desde Studio.
- Lighthouse en producción Vercel.
