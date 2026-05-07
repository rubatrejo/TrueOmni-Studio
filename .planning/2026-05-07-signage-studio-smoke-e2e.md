# Signage Studio — Smoke E2E + Handoff (2026-05-07)

> Documento de referencia para validar y operar el editor signage del
> TrueOmni Studio post-Milestone Studio (DSS0-DSS9).

## Capacidades del producto al cierre

- **Dashboard signage** `/studio/digital-displays` lista signage themes
  (clients) con cards consistentes con kiosk.
- **Theme editor** `/studio/digital-displays/<slug>` con 6 tabs:
  Branding · Header · Displays · i18n · Versions · Publish.
- **Display editor** `/studio/digital-displays/<slug>/displays/<displaySlug>`:
  - Settings editables (audio / duration / transition / sleep schedule).
  - Playlist con drag-to-reorder + edit inline + delete + add slide modal.
  - Schedule popover always/hours.
  - Slot configurator inline (6 module forms: Events / Social / VideoImage /
    Ads / News / Weather).
  - Versions panel (FIFO 10) con restore.
  - Publish (PR auto-merge), Export JSON, Import JSON.
  - KV size advisor (bar verde/amber/red).
- **Diagnostics** `/studio/digital-displays/diagnostics` system info.
- **Bridge editor↔iframe** con postMessage + heartbeat 5s + status badge.
- **Loader híbrido KV→fs** en runtime y i18n.
- **Auto-snapshots** al PUT con cap 10.
- **i18n editor** con KV override sobre fs base.

## Smoke E2E

### A. Verificación automática

```bash
pnpm typecheck
pnpm exec eslint src/components/signage/ src/lib/signage/ \
  'src/app/(signage)/' src/app/studio/digital-displays/ \
  src/app/api/studio/signage/
pnpm kiosk:dev
```

URLs a validar HTTP 200:

- `/signage/default/lobby-tv` — runtime.
- `/studio/digital-displays` — dashboard.
- `/studio/digital-displays/default` — theme editor.
- `/studio/digital-displays/default/displays/lobby-tv` — display editor.
- `/studio/digital-displays/diagnostics` — system info.
- `/` y `/studio` — kiosk regression.

### B. Verificación visual / interactiva

| # | Vector | OK |
|---|---|---|
| B1 | Dashboard signage muestra theme con gradient signage | ☐ |
| B2 | Theme editor: 6 tabs navegan sin reload | ☐ |
| B3 | i18n editor: locale switcher + edit + save | ☐ |
| B4 | Display editor: sidebar + iframe live "Connected" | ☐ |
| B5 | Settings editables → autosave → "Saved" | ☐ |
| B6 | Drag-to-reorder slides | ☐ |
| B7 | Add slide modal | ☐ |
| B8 | Schedule popover always/hours | ☐ |
| B9 | Slot configurator (6 module forms) | ☐ |
| B10 | Push live al iframe sin reload | ☐ |
| B11 | Versions panel + restore con confirm | ☐ |
| B12 | Export JSON | ☐ |
| B13 | Import JSON | ☐ |
| B14 | Publish via PR (si GitHub configurado) | ☐ |
| B15 | KV size advisor | ☐ |
| B16 | Diagnostics info correcta | ☐ |

### C. Producción (Vercel deploy)

| # | Check | OK |
|---|---|---|
| C1 | Deploy `trueomni-studio.vercel.app` ready | ☐ |
| C2 | Runtime `/signage/<c>/<d>` en producción | ☐ |
| C3 | Studio editor signage en producción | ☐ |
| C4 | Save persiste en KV cloud (Upstash) | ☐ |
| C5 | Publish PR creado y auto-merged | ☐ |

## Troubleshooting

### Bridge "Connecting" stuck

El iframe del runtime no emitió handshake aún o hay race condition.
- Click "Reload" en el toolbar del PreviewFrame.
- Verifica que `<SignageBridge>` esté montado en
  `src/app/(signage)/signage/[client]/[display]/page.tsx`.

### Publish 503 "GitHub not configured"

Faltan env vars en deploy:
```
STUDIO_GITHUB_TOKEN=ghp_...
STUDIO_GITHUB_OWNER=trueomni
STUDIO_GITHUB_REPO=kiosk-portrait
STUDIO_GITHUB_BRANCH=main
```
Configurar en Vercel project settings → Environment variables.

### Save autosave no dispara

Verifica:
1. Browser console — errores fetch a `/api/studio/signage/displays/...`.
2. KV connection — `/studio/digital-displays/diagnostics` indica
   "KV cloud: yes" o "no" (in-memory).
3. Network tab — ver si PUT está saliendo.

### Runtime no refleja cambios

Loader híbrido lee KV→fs. Si KV save falló, runtime cae al fs (data
estática). Check:
- Diagnostics card "Storage" muestra bytes >0 para el display.
- Si bytes = 0 y KV cloud = yes → save no llegó.

### i18n key no aparece

Cascada: fs default+en → fs default+locale → fs slug+en → fs slug+locale → KV.
- Si la key falta en TODAS las capas, el `t(key, fallback?)` retorna
  `fallback ?? key`.
- Verifica el bag en el editor i18n tab.

## Architecture notes

### Aislamiento kiosk vs signage

| Aspecto | Kiosk | Signage |
|---|---|---|
| Folder fs | `clients/<slug>/` | `clients-signage/<slug>/` |
| KV namespace | `cfg:*`, `clients:*` | `signage:*` |
| Tokens | `--kiosk-*` (legacy) / brand- | `--signage-*` |
| Runtime URL | `/` con `KIOSK_CLIENT` env | `/signage/<client>/<display>` |
| Schema Zod | `KioskConfig` | `SignageClientFile` + `SignageDisplayConfig` |
| Editor URL | `/studio/<slug>` | `/studio/digital-displays/<slug>/displays/<d>` |
| Bridge type | `studio:*`, `kiosk:*` | `signage:*` |

### KV keys signage

```
signage:client:<slug>           — client.json
signage:display:<c>:<d>         — display.json
signage:displayRaw:<c>:<d>      — working copy raw (DSS0+ futuro)
signage:cfgSnap:<c>:<d>:<id>    — snapshot inmutable
signage:cfgSnapList:<c>:<d>     — IDs ordenados (más reciente primero)
signage:i18n:<c>:<locale>       — bag override
signage:events:<c>              — events override (futuro)
signage:social:<c>              — social override (futuro)
signage:news:<c>                — news override (futuro)
signage:clientList              — SET de clients
```

## Out of scope (post-Milestone)

- DSS5.5 AI suggest hooks (Anthropic translate).
- DSS7.5 theme publish completo (branding + tokens + i18n).
- DSS8.5 onboarding tour signage.
- Lighthouse production ≥90.
- Asset upload via Vercel Blob signage.
- daysOfWeek granular schedules.
- date-range schedule UI.
- Asset preview thumbnails en module forms.

## Next milestone candidate

Post-Milestone Studio del signage, los próximos focos productivos son:

1. **Primer cliente real signage** (paralelo al Fase 4 del kiosk):
   bloqueado por negocio.
2. **Asset upload signage**: Vercel Blob para video/image assets sin
   copiar a fs manual.
3. **Theme publish** (DSS7.5): publica también `client.json` + `tokens.css`
   + `i18n/*.json` además del display.
