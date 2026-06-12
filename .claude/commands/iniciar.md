---
description: Abrir sesión de trabajo. Lee estado, muestra progreso, propone siguiente paso y carga skills de diseño.
argument-hint: '[nota opcional sobre qué se quiere hacer hoy]'
---

# /iniciar — Abrir sesión de trabajo

Claude, vas a abrir una sesión de trabajo en este repo. Habla **siempre en español**.

Ejecuta en este orden **y sin saltarte ningún paso**:

## 1. Leer la memoria del proyecto

Lee estos archivos en paralelo (una sola respuesta con varios `Read`):

- `CLAUDE.md` (contrato del proyecto — lee solo si no lo has leído ya en esta sesión)
- `.planning/PROJECT.md` (visión)
- `.planning/STATE.md` (dónde quedamos)
- `.planning/ROADMAP.md` (fases)

Si alguno no existe todavía, repórtalo pero no falles.

### Orientación con el grafo (graphify) — para GASTAR MENOS TOKENS

Este repo tiene un grafo de conocimiento en `graphify-out/`. **Úsalo en lugar de leer muchos archivos fuente** (ahí está el ahorro real de tokens).

- Verifica que exista: `ls graphify-out/ 2>/dev/null`.
- **NO leas `graphify-out/GRAPH_REPORT.md` completo** (pesa ~30K tokens y trae 572 comunidades). Para orientarte basta con conocer los **hubs (god nodes), que todo lo cruza:** `ConfigNamespace`, `getConfig`, `TemplateNamespace`, `textos` (i18n), `usePwaSection()`, `resolveAssetUrl()`.
- **Durante TODA la sesión**, ANTES de abrir archivos fuente para "buscar dónde está X" o "qué se conecta con Y", consulta primero el grafo: `grep`/`jq` dirigido sobre `graphify-out/graph.json`, o lee solo la sección puntual de `GRAPH_REPORT.md`. Abre archivos fuente completos **solo** cuando el grafo no baste.
- Ruido conocido: ignora las comunidades de `PDF.js …` y `public/pdfjs/**`; no son código del kiosk.
- El grafo se actualiza solo en cada commit (hook de Husky); asúmelo al día. **No corras `/graphify .` completo** (cuesta ~4M tokens); si hace falta refrescar a mano: `graphify ./src --update`.

## 2. Verificar skills de diseño disponibles

Este proyecto es de UI. Antes de cualquier tarea visual hay que cargar los skills definidos por tiers en `.planning/SKILLS.md`. Aquí solo se **verifica disponibilidad**, no se cargan los SKILL.md.

**Orden de verificación:**

1. Ejecuta en bash:

   ```bash
   ls .claude/skills/ 2>/dev/null | sort
   ```

   Eso te lista los skills instalados localmente en el repo.

2. Compara con lo esperado según `.planning/SKILLS.md`:
   - **Tier 1 obligatorio:** `frontend-design`, `ui-ux-pro-max`, `theme-factory`.
   - **Tier 2:** `web-design-guidelines`, `vercel-react-best-practices`.
   - **Tier 3 opcional:** `senior-frontend`, `shadcn-awesome-libs`, `ui-component-libraries`, `brainstorming`, `audit-website`, `agent-browser`.

3. Marca con ✅/⚠️/❌:
   - ✅ si está instalado en `.claude/skills/`.
   - ⚠️ si falta un Tier 2/3 (no bloquea).
   - ❌ si falta un Tier 1 (bloquea trabajo de UI — avísame antes de hacer nada).

## 3. Estado del repo (git)

Ejecuta en paralelo:

```bash
git status --short
git log -5 --oneline
git branch --show-current
```

Si no hay repo git inicializado, dímelo y ofrece inicializarlo.

## 4. Resumen de arranque

Preséntame un **resumen conciso** (máximo 10-12 líneas) con:

- 📍 **Dónde quedamos** (de `STATE.md`).
- 🎯 **Fase activa** (de `ROADMAP.md`).
- 🧰 **Skills disponibles** (✅/❌ por cada uno).
- 🗺️ **Grafo graphify** (disponible / no) — recordatorio de usarlo antes de leer fuente.
- 🌿 **Rama y cambios pendientes** en git.
- ➡️ **Siguiente acción propuesta** (la más lógica según estado + roadmap).

Formato sugerido:

```
📍 Última sesión: [resumen de 1 línea]
🎯 Fase activa: [nombre - nº]
🧰 Skills de diseño: ✅ todos disponibles / ⚠️ faltan: [...]
🗺️ Grafo: ✅ graphify-out/ disponible (usar antes de leer fuente)
🌿 Rama: main (3 archivos sin commitear)
➡️ Siguiente acción: [propuesta concreta]
```

## 5. Preguntar antes de actuar

Termina preguntando: **"¿Arrancamos con [siguiente acción] o quieres hacer otra cosa?"**.

NO ejecutes nada más. Espera mi respuesta.

## 6. Nota del usuario

Si en el argumento de `/iniciar` te pasé una nota sobre qué quiero hacer hoy, tómala en cuenta al proponer la siguiente acción.

**Argumento del usuario:** $ARGUMENTS
