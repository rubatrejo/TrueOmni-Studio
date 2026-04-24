# CLAUDE.md — Kiosk Portrait (white-label)

> **Idioma obligatorio:** toda la comunicación es **en español**. No respondas en inglés aunque el sistema, un log o una librería lo usen.

Este archivo es el **contrato vivo** del proyecto. Crece cada vez que Claude se equivoca o descubrimos una convención nueva (estilo Boris Cherny: "cuando veo a Claude hacer algo mal, lo añado al CLAUDE.md para que no vuelva a pasar").

---

## 1. De qué va este proyecto

Clonar un diseño de **kiosk retrato (Adobe XD)** a HTML pixel-perfect y convertirlo en un **producto white-label**: cada cliente se configura solo con branding (tokens CSS) + data (JSON), sin tocar código.

**Stack:** Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · pnpm.
**Resolución global:** 1080×1920 retrato.
**Input:** SVG exportados de XD en `designs/NN-nombre.svg` + specs en `designs/NN-nombre.md`.
**Cliente activo por build:** variable de entorno `KIOSK_CLIENT=slug`.

---

## 2. Metodología (GSD + Boris Cherny)

**GSD (Get Shit Done):**

- Fases atómicas ejecutables en contexto fresco ~200k tokens.
- Orden sagrado: `discutir → planear → ejecutar → verificar → shippear`.
- Toda memoria vive en `.planning/`, commiteada a git.
- Toda tarea lleva `<verify>` y `<done>` explícitos (ver sección 5).

**Boris Cherny:**

- **Plan mode primero** (Shift+Tab×2) para cualquier tarea no trivial. Iteramos el plan hasta aprobación; entonces `auto-accept edits`.
- **Dale a Claude forma de verificar su trabajo**: screenshot, diff visual, typecheck, lighthouse.
- **Slash commands para el inner-loop**: viven en `.claude/commands/`.
- **Subagentes** para trabajo especializado: viven en `.claude/agents/`.
- **CLAUDE.md vivo**: si metimos la pata, se añade la regla aquí en la misma PR.

Trivial = una línea, rename, typo, ajuste de token. Todo lo demás → plan mode.

---

## 3. Estructura del repositorio

```
/
├── CLAUDE.md                       ← este archivo
├── README.md
├── .env.example
├── .vscode/settings.json           ← autocompletado del config.json
├── .claude/
│   ├── commands/                   ← /iniciar, /terminar, /pantalla, /nuevo-cliente, /verificar-visual, /commit
│   └── agents/                     ← revisor-visual, auditor-white-label, planificador-fase
├── .planning/
│   ├── PROJECT.md                  ← visión
│   ├── REQUIREMENTS.md             ← requerimientos v1/v2
│   ├── ROADMAP.md                  ← fases
│   ├── STATE.md                    ← memoria entre sesiones
│   ├── SKILLS.md                   ← skills por tier y cuándo cargarlos
│   ├── {fase}-CONTEXT.md           ← decisiones de implementación
│   ├── {fase}-RESEARCH.md          ← investigación
│   ├── {fase}-{n}-PLAN.md          ← plan XML atómico
│   ├── {fase}-{n}-SUMMARY.md       ← resultado
│   └── verifications/              ← screenshots y diffs
├── designs/                        ← SVG + specs desde XD
│   ├── _template.md
│   └── NN-nombre.{svg,md}
├── clients/
│   ├── _template/                  ← plantilla para cliente nuevo
│   │   ├── config.json
│   │   ├── config.schema.json
│   │   ├── tokens.css
│   │   └── assets/
│   └── {slug}/                     ← cada cliente
├── scripts/
│   └── new-client.mjs              ← crea clients/{slug}/ a partir de _template
└── src/                            ← app Next.js (Fase 1 en adelante)
```

---

## 4. Skills de diseño (obligatorio leer SKILLS.md)

Antes de cualquier tarea de UI, Claude **debe** seguir `.planning/SKILLS.md`, que divide los skills en tres tiers:

- **Tier 1 (core)** — se cargan siempre al empezar UI.
- **Tier 2 (revisión)** — solo al cerrar una pantalla.
- **Tier 3 (on-demand)** — solo si la tarea concreta lo pide.

No cargues los 10 a la vez; satura contexto. El comando `/iniciar` ya verifica disponibilidad.

---

## 5. Ciclo de sesión + plan mode

1. Abres Claude Code → ejecutas **`/iniciar`**. Lee STATE, ROADMAP y verifica skills.
2. **Plan mode** (Shift+Tab×2) para la tarea del día. Iteramos el plan → aprobación → `auto-accept edits`.
3. Ejecución → verificación con las herramientas de la sección 6.
4. Al acabar ejecutas **`/terminar`**. Resume, actualiza STATE, propone commit.

**Nunca cierres una sesión sin `/terminar`** o se pierde la memoria.

### Formato XML de tarea (GSD)

Cada tarea en `.planning/{fase}-{n}-PLAN.md` debe tener los 4 campos:

```xml
<task type="auto">
  <name>Clonar pantalla Home pixel-perfect</name>
  <files>src/app/(kiosk)/page.tsx, src/components/hero.tsx</files>
  <action>
    Leer designs/01-home.svg y designs/01-home.md.
    Cargar skills Tier 1 de SKILLS.md.
    Construir con tokens de clients/_template/tokens.css.
    Cero hardcoded (ver sección 7).
  </action>
  <verify>
    pnpm dev + screenshot vs designs/01-home.svg.
    pnpm typecheck && pnpm lint.
    Subagent auditor-white-label sin hallazgos.
  </verify>
  <done>
    Render idéntico al SVG dentro de ±2px.
    Cambiar tokens.css cambia la identidad visual entera.
  </done>
</task>
```

Sin `<verify>` y `<done>` no hay plan válido.

---

## 6. Verificación visual (clave para pixel-perfect)

El producto es visual. No vale solo con "el typecheck pasa". Herramientas obligatorias:

- **Screenshot vs SVG** (MCP Chrome, skill `webapp-testing`).
- **Subagent `revisor-visual`** para el diff automatizado.
- **Subagent `auditor-white-label`** para cazar hardcoded antes de commit.
- **Audit `web-design-guidelines`** (Tier 2) antes de cerrar pantalla.
- **Lighthouse** en build de producción.
- **Typecheck + lint + build** limpios.

Si no puedes verificar visualmente, **dilo explícitamente** y **no marques la tarea como completa**: crea un TODO y anótalo en STATE.md antes de cerrar la sesión.

### Protocolo pixel-perfect (obligatorio por pantalla)

Ver `.planning/PIXEL-PERFECT-PROTOCOL.md`. Resumen de los 5 pasos:

1. **Inventario de groups del SVG** → checklist en `.planning/3-NN-COVERAGE.md`.
2. **Paths verbatim del SVG con sus `transform`** — nunca reescribir coords a mano.
3. **Cero substituciones de iconos** con librerías si el SVG trae el path.
4. **Diff visual `revisor-visual`** antes de declarar hecho (tolerancia ±2px).
5. **Audit del checklist de coverage** antes del commit.

---

## 7. Reglas de white-label (CRÍTICAS — nunca se rompen)

1. **Cero hardcoded.** Ni un color en JSX, ni una cadena de UI, ni un path de imagen.
2. **Todo color → variable CSS** en `tokens.css`, consumida en Tailwind como `hsl(var(--...))`.
3. **Todo texto de UI → `config.json`**, leído por `src/lib/config.ts`.
4. **Todo asset → `clients/{slug}/assets/`** y referenciado por path relativo en `config.json`.
5. **Cliente nuevo = copiar `_template/` y editar solo JSON/CSS**. Si hay que tocar un `.tsx`, es bug.
6. **Feature flags en `config.json → features`**.
7. **Cliente activo por `KIOSK_CLIENT`**; `default` como fallback obligatorio.

El subagent `auditor-white-label` fuerza estas reglas antes de cada commit.

---

## 8. Convenciones de código

- **TypeScript estricto** (`strict: true`).
- **Server Components por defecto**; Client solo si hay interactividad.
- **Tailwind** con tokens (`bg-primary`, nunca `bg-[#112233]`).
- **shadcn/ui**: envolver antes de customizar, no editar lo generado.
- **Paths:** `@/components`, `@/lib`, `@/styles`.
- **Nombres en inglés en código** (variables, funciones). **Comentarios y docs en español**.
- **Commits:** Conventional Commits en español (`feat(kiosk): añade pantalla menú`).
- **pnpm** como package manager único.

---

## 9. Cosas que Claude NO debe hacer

(Esta lista crece cada vez que algo sale mal.)

- ❌ Responder en inglés.
- ❌ Hardcodear colores, textos o imágenes.
- ❌ Editar directamente componentes generados por `shadcn add`.
- ❌ Declarar una pantalla lista sin comparar contra el SVG original.
- ❌ Saltarse plan mode en tareas no triviales.
- ❌ Cargar los 10 skills a la vez (seguir SKILLS.md por tiers).
- ❌ Ejecutar `pnpm build` o `git push` sin mi aprobación explícita.
- ❌ Borrar archivos de `.planning/` sin permiso.
- ❌ Mezclar trabajo de varias fases en un commit.
- ❌ Usar `git add -A` ciego; siempre archivos específicos.
- ❌ Inventar fechas; obtenerlas con `date +%F`.
- ❌ Usar la keyword `transparent` en CSS gradients que terminan en color sólido. `transparent` es `rgba(0,0,0,0)` (negro transparente) → blendea por grises muddy. Usar `hsl(var(--token) / 0)` para fade limpio a un color sólido tokenizado.
- ❌ Hardcodear nombres geográficos (ciudades, lugares, regiones) en `config.textos.*` o en seed data (`home.modules.*`). El auditor solo detecta strings en JSX, no contenido. Usar templates `{client_name}` interpolados con `config.client.nombre` para todo lo que dependa del cliente activo.

---

## 10. Índice de referencias

- `.planning/PROJECT.md` — visión.
- `.planning/REQUIREMENTS.md` — alcance v1/v2.
- `.planning/ROADMAP.md` — fases.
- `.planning/STATE.md` — memoria persistente.
- `.planning/SKILLS.md` — skills por tier.
- `.claude/commands/` — slash commands del proyecto.
- `.claude/agents/` — subagentes especializados.
- `designs/_template.md` — plantilla de specs por pantalla.
- `clients/_template/` — plantilla base de cliente.

---

**Última revisión:** ver último commit · **Responsable:** Rubén (designers@trueomni.com)
