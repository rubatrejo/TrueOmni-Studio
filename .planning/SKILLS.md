# SKILLS.md — Skills del proyecto y cuándo cargarlos

> **Dónde viven:** `.claude/skills/` dentro del repo. Están versionados con el proyecto; quien clone el repo los tiene automáticamente.
>
> **Regla general:** no cargues varios skills a la vez. Satura contexto. Carga solo los del tier que toque en el momento que toque.

---

## Tier 1 — Core (cargar SIEMPRE antes de cualquier tarea visual)

| Skill | Para qué |
|---|---|
| `frontend-design` | Principios de UI de alta calidad, anti-estética genérica de IA. |
| `ui-ux-pro-max` | Paletas, tipografías, estilos, componentes shadcn/ui. |
| `theme-factory` | Tokens y temas. Crítico porque nuestro white-label es tokens. |

---

## Tier 2 — De revisión (cargar solo al cerrar pantalla)

| Skill | Para qué |
|---|---|
| `web-design-guidelines` | Audit contra Web Interface Guidelines (a11y, UX, perf). |
| `vercel-react-best-practices` | Patrones correctos de Next.js + React. |

---

## Tier 3 — On-demand (cargar solo si la tarea lo pide)

| Skill | Cuándo |
|---|---|
| `senior-frontend` | Refactor grande o decisión arquitectónica de frontend. |
| `shadcn-awesome-libs` | Buscar librería compatible con shadcn para un caso concreto. |
| `ui-component-libraries` | Explorar librerías adicionales de componentes. |
| `brainstorming` | **Antes** de trabajo creativo (features, componentes nuevos). GSD "discutir". |
| `audit-website` | Auditoría amplia del kiosk desplegado (SEO, perf, a11y, seguridad). |
| `agent-browser` | Automatizar clicks/forms en verificación E2E o para scraping. |

---

## Disponibles en el repo pero fuera del flujo de kiosk

Se quedaron instalados por si los necesitas, pero **no** forman parte del flujo habitual:

| Skill | Qué hace |
|---|---|
| `constructor-persona` | Genera personas de usuario para research. |
| `agent-creator` | Crear subagentes (útil si hay que añadir otro además de los 3 del proyecto). |
| `mcp-builder` | Construir MCPs propios. |
| `pdf-processing-pro` | Procesar PDFs. |
| `nano-banana-2` | Generación de imágenes. |
| `remotion-best-practices` | Video con React — no aplica al kiosk. |

---

## Skills recomendados que faltan

Estos los mencionaba la propuesta original pero **no venían en el `skills.zip` instalado**. Si aparecen más adelante, añadirlos a `.claude/skills/` y mover la fila al tier correspondiente:

| Skill | Dónde encajaría | Por qué importa |
|---|---|---|
| `brand-guidelines` | Tier 3 | Onboarding de clientes con identidad propia fuerte. |
| `web-artifacts-builder` | Tier 3 | Prototipos HTML complejos fuera del kiosk. |
| `canvas-design` | Tier 3 | Piezas estáticas (posters, mockups marketing). |
| `webapp-testing` | Tier 2 | Playwright para screenshots del render en `/verificar-visual`. |

> **Nota:** Claude Code puede tener skills globales en `~/.claude/skills/` además de los del proyecto. Si tu instalación global los incluye, funcionan igual aunque no estén en el repo. Lo ideal para portabilidad es que todo lo crítico esté en `.claude/skills/` del repo.

---

## Orden de carga recomendado en una tarea de UI

```
[arranque]   → Tier 1 (frontend-design + ui-ux-pro-max + theme-factory)
[ejecución]  → Tier 3 puntuales si la tarea lo pide
[cierre]     → Tier 2 (web-design-guidelines + vercel-react-best-practices)
```

Si no hay trabajo visual (infra, scripts, data loaders, refactor de lógica pura), **no cargues ninguno**.

## Verificación rápida de disponibilidad

El comando `/iniciar` compara esta lista con los directorios en `.claude/skills/` y avisa si falta alguno Tier 1.
