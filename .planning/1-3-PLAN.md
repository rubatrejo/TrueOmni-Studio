# Plan 1-3 — shadcn/ui + 5 componentes base envueltos

**Fase:** Fase 1 · **Orden:** 3 · **Depende de:** 1-1 (scaffolding + Tailwind cableado a tokens). Paralelizable con 1-2.
**Cubre requerimientos:** R2 (stack: shadcn/ui), R3 (consumo de tokens por los componentes base).
**Skills necesarios:** ninguno en Fase 1 — la tarea es infraestructura de componentes, no diseño de pantalla. Tier 1 (`frontend-design`, `ui-ux-pro-max`, `theme-factory`) entrará en Fase 3. Si durante la ejecución surge duda de estética, **no cargar skills** — aplazar a Fase 3.
**Resumen:** Inicializar shadcn/ui apuntando a `@/components/ui`, generar los 5 componentes base del ROADMAP (button, card, dialog, input, badge) y **envolverlos** en `src/components/` con wrappers propios (CLAUDE.md §8 "shadcn/ui: envolver antes de customizar, no editar lo generado" + §9 "No editar directamente componentes generados por `shadcn add`"). Los wrappers son la API pública que el resto del proyecto consume; los componentes "crudos" de shadcn quedan aislados en `src/components/ui/` y se pueden regenerar sin romper nada.

---

<task type="auto">
  <name>Inicializar shadcn/ui con tokens del kiosk</name>
  <files>components.json, src/lib/utils.ts, package.json</files>
  <action>
    1. Ejecutar `pnpm dlx shadcn@latest init` con las siguientes respuestas (no interactivo si se puede, o preparadas para el prompt):
       - Style: `default`.
       - Base color: **elegir "Neutral"** (no importa mucho — vamos a sobrescribir con tokens propios inmediatamente).
       - CSS variables: **Yes** (crítico — sin esto shadcn hardcodea colores).
       - Tailwind config path: `tailwind.config.ts`.
       - CSS file path: `src/styles/globals.css`.
       - Import alias para components: `@/components`.
       - Import alias para utils: `@/lib/utils`.
       - React Server Components: **Yes**.

    2. Shadcn generará `components.json` y `src/lib/utils.ts` (con `cn()` helper). Revisar:
       - `components.json` apunta a los paths correctos.
       - `src/lib/utils.ts` exporta `cn()`.

    3. **Revisar `src/styles/globals.css` y `tailwind.config.ts`** tras `init`:
       - Shadcn puede haber AÑADIDO un bloque `:root { --background: ...; ...; }` con valores distintos a los del template. **Eliminar ese bloque duplicado** — la fuente de verdad sigue siendo `clients/_template/tokens.css` (decisión §4 del orquestador). Conservar solo los tokens nuevos que shadcn introduce y que el template NO tiene (p. ej. `--popover`, `--popover-foreground`, `--card`, `--card-foreground` si no existen). **Añadir esos tokens al `clients/_template/tokens.css`** (decisión §4 + confirmación explícita del orquestador 2026-04-19: añadirlos, no diferir). Comentar cada token nuevo con "// requerido por shadcn — card/popover/etc." para que sea obvio su origen. No detenerse a pedir confirmación: proceder y documentar los tokens añadidos en el SUMMARY del plan.
       - Asegurarse de que `tailwind.config.ts` sigue mapeando `colors.popover`, `colors.card`, etc. a `hsl(var(--...))`.
       - **Cero hex** en `globals.css` tras la limpieza.

    4. NO instalar todavía ningún componente; eso es la siguiente tarea.
  </action>
  <verify>
    - Existe `components.json` y referencia `@/components` y `@/lib/utils`.
    - Existe `src/lib/utils.ts` con `export function cn(...)`.
    - `grep -nE '#[0-9a-fA-F]{3,8}' src/styles/globals.css tailwind.config.ts` → sin resultados.
    - `grep -nE "^\s*--(background|foreground|primary)" src/styles/globals.css` → sin resultados (los tokens viven solo en el template, no duplicados).
    - Si se añadieron tokens nuevos a `clients/_template/tokens.css`, están **en el mismo commit** y tienen comentario explicando que son requeridos por shadcn (card, popover, etc.).
    - `pnpm typecheck` y `pnpm lint` siguen limpios.
  </verify>
  <done>
    shadcn inicializado, `cn()` disponible, sin duplicación de tokens.
    Cualquier token nuevo necesario para shadcn (card, popover) vive en `clients/_template/tokens.css`.
    No hay colores hardcoded introducidos por `shadcn init`.
  </done>
</task>

<task type="auto">
  <name>Generar 5 componentes shadcn base (button, card, dialog, input, badge)</name>
  <files>src/components/ui/button.tsx, src/components/ui/card.tsx, src/components/ui/dialog.tsx, src/components/ui/input.tsx, src/components/ui/badge.tsx, package.json</files>
  <action>
    Ejecutar `pnpm dlx shadcn@latest add button card dialog input badge` (o uno a uno si falla el batch).

    Shadcn instalará automáticamente las dependencias necesarias: `@radix-ui/react-dialog`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`.

    **Regla crítica (CLAUDE.md §9):** estos archivos en `src/components/ui/` son **generados** y **NO se editan a mano**. Si algún valor está hardcoded (p. ej. un color literal dentro de `cva`), NO corregirlo aquí — se corrige en los wrappers de la siguiente tarea o en los tokens.

    Revisar tras la instalación:
    - Cada componente usa clases como `bg-primary`, `text-primary-foreground`, `bg-destructive`, etc. — todas resuelven contra los tokens mapeados en `tailwind.config.ts` (1-1).
    - **No deben existir hex en estos archivos.** Si los hay, es porque faltó un token en `tokens.css` → añadirlo al template y regenerar el componente.
  </action>
  <verify>
    - Existen los 5 archivos en `src/components/ui/`.
    - `grep -nE '#[0-9a-fA-F]{3,8}|rgb\(' src/components/ui/*.tsx` → sin resultados.
    - `pnpm typecheck` pasa.
    - `pnpm lint` pasa (con el override para `src/components/ui/**` añadido en 1-2).
    - `package.json` incluye `@radix-ui/react-dialog`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`.
  </verify>
  <done>
    Los 5 componentes shadcn están generados sin hex hardcoded y consumen tokens.
    `pnpm check` (definido en 1-2) pasa. Si 1-2 no se ha completado todavía, al menos `pnpm typecheck` + `pnpm lint` pasan.
  </done>
</task>

<task type="auto">
  <name>Crear wrappers en src/components/ para los 5 componentes base</name>
  <files>src/components/button.tsx, src/components/card.tsx, src/components/dialog.tsx, src/components/input.tsx, src/components/badge.tsx, src/components/index.ts</files>
  <action>
    Principio (CLAUDE.md §8): "shadcn/ui: **envolver antes de customizar**, no editar lo generado".

    Para cada uno de los 5 componentes, crear un wrapper en `src/components/` que:
    1. Re-exporte el componente de `@/components/ui/{nombre}` sin modificar su API por defecto.
    2. Opcional: exponga props extra específicas del kiosk cuando tenga sentido. En Fase 1 NO añadir lógica nueva — solo el re-export. La customización real llega en Fase 3.
    3. Sea el **único punto de importación** que el resto del proyecto usa. El resto del código hace `import { Button } from "@/components/button"` y nunca `"@/components/ui/button"`.

    Ejemplo `src/components/button.tsx`:
    ```tsx
    // Wrapper del kiosk para el Button de shadcn. Mantener API compatible.
    // No editar src/components/ui/button.tsx; cualquier customización va aquí.
    export { Button, buttonVariants, type ButtonProps } from '@/components/ui/button';
    ```

    Repetir patrón para `card` (re-exportar `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`), `dialog` (todos los primitives), `input`, `badge`.

    Crear `src/components/index.ts` con re-exports de los 5 wrappers para un import cómodo desde `@/components`.

    Añadir una **regla ESLint** (en el `.eslintrc.cjs` de 1-2) via `no-restricted-imports` que **prohíba importar directamente `@/components/ui/*` desde fuera de `src/components/`**, forzando el uso de los wrappers. Si 1-2 ya está mergeado, abrir un TODO en STATE o coordinar con el orquestador para añadir la regla en un commit separado. Si 1-2 y 1-3 se ejecutan en paralelo, coordinar con el orquestador para integrar la regla en 1-2 antes del commit final.

    Regla sugerida:
    ```js
    "no-restricted-imports": ["error", {
      "patterns": [{
        "group": ["@/components/ui/*"],
        "message": "Importa desde @/components/{nombre}, no desde @/components/ui/* (CLAUDE.md §8)."
      }]
    }]
    ```
    Con override en `src/components/*.ts(x)` (los wrappers) para permitirles el import directo. Y en `src/components/ui/**` para no auto-bloquearse.
  </action>
  <verify>
    - Existen los 5 wrappers en `src/components/` y un `index.ts`.
    - `grep -REn "from '@/components/ui/" src/ --exclude-dir=components/ui` solo aparece en `src/components/*.ts(x)` (los wrappers).
    - `pnpm typecheck` y `pnpm lint` pasan.
    - `pnpm check` global pasa.
    - Smoke test: modificar temporalmente `src/app/(kiosk)/page.tsx` para renderizar `<Button>Hola</Button>` importado de `@/components/button`. `pnpm kiosk:dev` levanta, el botón se renderiza con los colores primary del token. Revertir.
    - Subagent `auditor-white-label` sobre `src/` no reporta infracciones (el placeholder de 1-1 sigue siendo el único origen de strings "raros").
  </verify>
  <done>
    Los 5 componentes base tienen wrapper propio.
    Importar shadcn directo desde fuera de `src/components/` está prohibido por ESLint.
    El render de un botón confirma que los tokens llegan al componente.
    `src/components/ui/` queda intacto y regenerable.
  </done>
</task>
