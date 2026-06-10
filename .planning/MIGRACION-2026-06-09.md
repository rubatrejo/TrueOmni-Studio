# Migración de regreso a la compu original (rubenramirez) — 2026-06-09

> Plan validado en sesión de brainstorming. Ejecución **guiada paso a paso**:
> el usuario corre los comandos en su Terminal real; Claude prepara, verifica y supervisa.
> Claude NO tiene credenciales de Git ni acceso a `~/Desktop` / `~/.claude` desde su sandbox.

## Contexto / estado real detectado (no coincide con la guía PDF)

- La guía asume que esta compu está atrasada y solo hay que bajar de GitHub.
- Realidad al revisar el repo local:
  - Local `main` está en `6770136` (**1-jun**), con 14 commits PWA (25-may → 1-jun).
  - El usuario confirma: **esta compu no está actualizada desde el 1-jun** (hoy 9-jun) →
    GitHub probablemente tiene trabajo más reciente hecho en `pinchebesu`.
  - Ref cacheada `origin/main` está stale (25-may) porque el sandbox no puede hacer `fetch` (sin auth).
  - `.env.local` existe pero es del **5-may** (refrescar de Vercel).
  - `.claude/settings.local.json` **NO existe** (pendiente copiar).
  - `node_modules` existe; hay basura `.next.trash-*` que limpiar.
- Email de Git ya es el correcto: `ruba.trejo@gmail.com` ✓
- Repo: `rubatrejo/TrueOmni-Studio`.

## Reglas de seguridad

- ❌ Nada de `git push` ni `pnpm build` sin OK explícito del usuario.
- ✅ La otra compu (`pinchebesu`) queda intacta como respaldo.
- ✅ Todo en español. Verificación antes de cerrar cada fase.

## Fases (con verificación)

### Fase 0 — Diagnóstico real de Git ✅ HECHO (2026-06-09)

- Resultado: estaba **behind 30**, cero commits locales sin subir → escenario (b) fast-forward limpio.
- Incidencia: un `.git/index.lock` stale (de un fetch fallido del sandbox) bloqueó el primer pull; se borró con `rm -f .git/index.lock` y reintentó.
- `git pull --ff-only origin main` → quedó en `f4a6a25` (cierre 2026-06-08), `main...origin/main` sin behind.

### Fase 1 — Secrets (Vercel)

- `vercel link` (a `rubatrejo/TrueOmni-Studio`) + `vercel env pull .env.local`.
- Refresca Mapbox, Upstash KV, Tavus, Auth.

### Fase 2 — Memoria de Claude Code (incluida, confirmado)

- `cd ~/.claude/projects` → `tar -xzf ~/Desktop/claude-memory-kiosk.tgz`
- Renombrar carpeta `-Users-pinchebesu-...` → `-Users-rubenramirez-...`.

### Fase 3 — Permisos locales

- `cp ~/Desktop/kiosk-settings.local.json ".../.claude/settings.local.json"`.

### Fase 4 — Limpieza + dependencias

- Borrar `.next.trash-*`.
- `pnpm install` solo si la verificación lo pide.

### Fase 5 — Verificación final

- `pnpm typecheck && pnpm lint` (0 errores).
- `pnpm validate:configs` (3/3 OK).
- `pnpm kiosk:dev` → http://localhost:3000:
  - mapa carga → Mapbox OK.
  - `/studio` muestra kiosks → Upstash KV OK.
- Abrir Claude Code en la carpeta + `/iniciar` → debe leer estado y memoria recuperada.

## Bitácora de ejecución

- [x] Fase 0 — diagnóstico Git + pull (en f4a6a25, sincronizado)
- [x] Fase 1 — secrets Vercel (env pull development + TAVUS\_\* del backup; Mapbox vía config.json, REDIS_URL obsoleta)
- [x] Fase 2 — memoria Claude (FUSIÓN, no rename: ya existía carpeta rubenramirez-Old con 60 sesiones; rsync -a --update sumó 17 sesiones nuevas → 77; memory/ con versión 8-jun; backup en Escritorio)
- [x] Fase 3 — permisos locales (settings.local.json copiado, 1410 bytes)
- [x] Fase 4 — limpieza + deps (.next.trash-\* borrada; pnpm install: Already up to date)
- [x] Fase 5 — verificación final (typecheck 0 err; lint solo warnings preexistentes; validate:configs 3/3; kiosk:dev OK → mapa carga, /studio carga, Tavus 200, Upstash KV conecta)

## Cierre — MIGRACIÓN COMPLETA ✅ (2026-06-09)

Todo verificado y funcionando. Pendientes menores opcionales (limpieza):

- Borrar staging: `rm -rf ~/Desktop/kiosk-mem-staging`
- Backups de seguridad (conservar hasta confirmar varios días de uso): `~/Desktop/backup-memory-dst-2026-06-09`, `.env.local.bak-2026-06-09` (en raíz proyecto, gitignored, contiene secrets).
- Archivos de migración en Escritorio (tgz/json/sh): conservar hasta confirmar; la compu pinchebesu queda como respaldo.
- Abrir Claude Code en el proyecto y `/iniciar` para confirmar que lee estado + memoria.
- Opcional: commitear este doc de migración.
