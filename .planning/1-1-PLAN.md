# Plan 1-1 — Scaffold Next.js + TypeScript + Tailwind + estructura kiosk

**Fase:** Fase 1 · **Orden:** 1 · **Depende de:** ninguno (requiere Fase 0 ya commiteada).
**Cubre requerimientos:** R2 (parcial — base del clonado pixel-perfect), R5 (parcial — lectura de `KIOSK_CLIENT` con fallback `default`).
**Skills necesarios:** ninguno. Fase 1 es infraestructura, no UI visual (SKILLS.md §"no trabajo visual → no cargues ninguno").
**Resumen:** Se inicializa el proyecto Next.js 14+ con App Router, TypeScript estricto y Tailwind, se fijan los path aliases (`@/components`, `@/lib`, `@/styles`), se configura la lectura de `KIOSK_CLIENT` con fallback a `default` sin romper si todavía no existe `clients/default/`, y se crea una ruta en blanco bajo `src/app/(kiosk)/` con el canvas retrato 1080×1920 para poder verificar visualmente que el scaffolding levanta. Tailwind se conecta a los tokens de `clients/_template/tokens.css` (sin duplicarlos) mediante `hsl(var(--...))`. Este plan bloquea a 1-2 y 1-3.

---

<task type="auto">
  <name>Inicializar Next.js App Router con TypeScript estricto y pnpm</name>
  <files>package.json, pnpm-lock.yaml, tsconfig.json, next.config.mjs, next-env.d.ts, .gitignore, .nvmrc</files>
  <action>
    Usar `pnpm` exclusivamente (CLAUDE.md §8, decisión del orquestador §1). Prohibido npm/yarn.

    Inicializar un proyecto Next.js 14+ (App Router) con TypeScript y Tailwind en la raíz del repo. No ejecutar `pnpm create next-app` interactivo — puede crear subcarpeta y reescribir archivos. En su lugar:

    1. Crear `package.json` manualmente con:
       - `"name": "kiosk-portrait"`, `"private": true`, `"packageManager": "pnpm@9.x"`.
       - Scripts base: `"dev": "next dev"`, `"build": "next build"`, `"start": "next start"`, `"typecheck": "tsc --noEmit"`.
       - Dependencias: `next`, `react`, `react-dom` (versiones estables más recientes compatibles con App Router).
       - Dev deps: `typescript`, `@types/node`, `@types/react`, `@types/react-dom`.
    2. Ejecutar `pnpm install` para generar `pnpm-lock.yaml`.
    3. Crear `tsconfig.json` con `strict: true`, `"moduleResolution": "bundler"`, `"jsx": "preserve"`, `"incremental": true`, y los **path aliases obligatorios** (CLAUDE.md §8, decisión §5):
       ```json
       "paths": {
         "@/*": ["./src/*"],
         "@/components/*": ["./src/components/*"],
         "@/lib/*": ["./src/lib/*"],
         "@/styles/*": ["./src/styles/*"]
       }
       ```
    4. Crear `next.config.mjs` mínimo. Exponer `KIOSK_CLIENT` en el entorno del servidor (NO como `NEXT_PUBLIC_*` — el cliente activo no se filtra al bundle del navegador).
    5. Crear `next-env.d.ts` (generado por Next en primer build, pero dejarlo trackeado).
    6. Crear/extender `.gitignore` con: `node_modules`, `.next`, `out`, `.env.local`, `.env*.local`, `*.tsbuildinfo`, `.DS_Store`, `coverage`.
    7. Opcional: crear `.nvmrc` con versión LTS (ej. `20`) para pinnear Node.

    **NO instalar** ESLint, Prettier ni shadcn aquí — eso es 1-2 y 1-3.
    **NO crear** `clients/default/` — eso es Fase 2. Solo el fallback en código.
  </action>
  <verify>
    - `pnpm install` completa sin errores.
    - `pnpm typecheck` pasa (puede no haber aún código de app — basta con que `tsc --noEmit` no lance).
    - `cat package.json | grep '"packageManager"'` muestra pnpm.
    - `node -e "const t=require('./tsconfig.json'); if(!t.compilerOptions.strict) process.exit(1)"` devuelve 0.
    - `node -e "const t=require('./tsconfig.json'); const p=t.compilerOptions.paths; ['@/*','@/components/*','@/lib/*','@/styles/*'].forEach(k=>{if(!p[k])process.exit(1)})"` devuelve 0.
    - No existen `package-lock.json` ni `yarn.lock` en la raíz.
  </verify>
  <done>
    `pnpm typecheck` pasa limpio.
    `tsconfig.json` tiene `strict:true` y los 4 path aliases.
    El repo NO contiene rastro de npm/yarn (solo `pnpm-lock.yaml`).
    `package.json` declara `packageManager: "pnpm@..."`.
  </done>
</task>

<task type="auto">
  <name>Integrar Tailwind consumiendo tokens de clients/_template/tokens.css</name>
  <files>postcss.config.mjs, tailwind.config.ts, src/styles/globals.css</files>
  <action>
    Instalar dependencias Tailwind: `pnpm add -D tailwindcss postcss autoprefixer`.
    NO ejecutar `tailwindcss init` si genera archivos conflictivos; crear los archivos a mano.

    1. `postcss.config.mjs` con `tailwindcss` y `autoprefixer`.
    2. `tailwind.config.ts` con:
       - `content: ["./src/**/*.{ts,tsx,mdx}"]`.
       - `theme.extend.colors` mapeado a los tokens reales de `clients/_template/tokens.css` (decisión §4). Todo color se expresa como `hsl(var(--token))`:
         - `background`, `foreground`, `primary` (+ `primary-foreground`), `secondary` (+ `-foreground`), `accent` (+ `-foreground`), `muted` (+ `-foreground`), `border`, `input`, `ring`, `success`, `warning`, `destructive` (+ `-foreground`).
       - `theme.extend.fontFamily`: `sans: "var(--font-sans)"`, `serif: "var(--font-serif)"`, `mono: "var(--font-mono)"`.
       - `theme.extend.fontSize`: mapa `xs..4xl` a `var(--font-*)`.
       - `theme.extend.borderRadius`: `sm..xl` y `pill` a `var(--radius-*)`.
       - `theme.extend.spacing`: opcional — exponer `safe-area-top/bottom/x` y `kiosk-width/height` desde los tokens.
       - `theme.extend.boxShadow`: `sm..xl` a `var(--shadow-*)`.
       - `theme.extend.transitionDuration`: `fast/normal/slow` a `var(--duration-*)`.
       - `theme.extend.transitionTimingFunction`: `ease-out-kiosk` y `ease-in-out-kiosk`.
       - `darkMode: ["class"]` o `["selector", "[data-contrast=\"high\"]"]` si se quiere soportar el `data-contrast` del template. Elegir la segunda opción para respetar el modo alto contraste ya presente en tokens.css.
    3. `src/styles/globals.css`:
       - **Importar los tokens del template con `@import "../../clients/_template/tokens.css";`** (decisión §4: no duplicar tokens). Si Tailwind/PostCSS no resuelve el import fuera de `src/`, configurar `postcss-import` o usar una ruta relativa válida. Si hay fricción, documentar en SUMMARY y pedir decisión al orquestador antes de duplicar.
       - Directivas `@tailwind base; @tailwind components; @tailwind utilities;`.
       - Reglas `html, body { background: hsl(var(--background)); color: hsl(var(--foreground)); font-family: var(--font-sans); }`.
       - **Cero colores hardcoded** (CLAUDE.md §7).

    Verificar que NO se copia `tokens.css` dentro de `src/` — el template es la fuente única en Fase 1.
  </action>
  <verify>
    - `pnpm typecheck` pasa.
    - Grep negativo: no debe aparecer ningún hex/`rgb(`/`#` de color literal en `tailwind.config.ts` ni en `globals.css` (salvo comentarios). Comando sugerido: `grep -nE '#[0-9a-fA-F]{3,8}|rgb\(' tailwind.config.ts src/styles/globals.css` → sin resultados fuera de comentarios.
    - `tailwind.config.ts` referencia al menos `hsl(var(--primary))`, `hsl(var(--background))`, `hsl(var(--foreground))`.
    - `src/styles/globals.css` importa el `tokens.css` del template (confirmar con `grep -n "clients/_template/tokens.css" src/styles/globals.css`).
    - No existe `src/styles/tokens.css` (no duplicar).
  </verify>
  <done>
    Tailwind compila consumiendo las variables CSS del template.
    Cambiar un valor en `clients/_template/tokens.css` cambia el render (se verificará de verdad en Fase 2, pero el cableado ya existe).
    Ningún color está hardcoded en la config de Tailwind ni en `globals.css`.
  </done>
</task>

<task type="auto">
  <name>Crear cargador mínimo de KIOSK_CLIENT con fallback default</name>
  <files>src/lib/client-env.ts, src/lib/kiosk-placeholder.ts, .env.example</files>
  <action>
    **Contexto:** en Fase 1 aún no existe `clients/default/config.json` (eso es Fase 2, decisión §7). Hay que leer `KIOSK_CLIENT` sin crashear si falta la carpeta del cliente.

    1. Crear `src/lib/client-env.ts`:
       ```ts
       // Resuelve el slug del cliente activo. Fallback obligatorio: "default" (R5, CLAUDE.md §7.7).
       export function getClientSlug(): string {
         const slug = process.env.KIOSK_CLIENT?.trim();
         return slug && slug.length > 0 ? slug : "default";
       }
       ```
       Exportar también una constante `DEFAULT_CLIENT_SLUG = "default"`.
       NO leer aún `config.json` (eso es Fase 2). NO lanzar si el cliente no existe; solo devolver el slug.

    2. Crear `src/lib/kiosk-placeholder.ts` con los textos de la página de prueba de Fase 1, **marcados como placeholder temporal que se borrará en Fase 2** (decisión §8):
       ```ts
       // [FASE 1 PLACEHOLDER] Estos textos existen solo para verificar el scaffolding.
       // Se ELIMINAN en Fase 2 cuando exista clients/default/config.json y src/lib/config.ts.
       export const KIOSK_PHASE_1_PLACEHOLDER = {
         titulo: "Scaffolding kiosk listo",
         subtitulo: "Fase 1 — pendiente conectar a config de cliente",
         nota: "Este texto se reemplaza por config.textos en Fase 2.",
       } as const;
       ```
       El archivo entero lleva el comentario `[FASE 1 PLACEHOLDER]` para que el auditor-white-label de Fase 2 sepa que hay que borrarlo. **No se importa desde ningún otro sitio que no sea la página de prueba.**

    3. Actualizar `.env.example` SOLO si falta algo — ya contiene `KIOSK_CLIENT=default` y es suficiente. No duplicar.
  </action>
  <verify>
    - `pnpm typecheck` pasa.
    - `grep -R "KIOSK_PHASE_1_PLACEHOLDER" src/` solo aparece en `kiosk-placeholder.ts` y en la página de prueba del siguiente task.
    - `grep -n "FASE 1 PLACEHOLDER" src/lib/kiosk-placeholder.ts` marca explícita.
    - `node --input-type=module -e "process.env.KIOSK_CLIENT=''; import('./src/lib/client-env.ts').then(m=>{if(m.getClientSlug()!=='default')process.exit(1)})"` o equivalente con tsx: devuelve `default` cuando la env está vacía.
  </verify>
  <done>
    `getClientSlug()` devuelve el valor de `KIOSK_CLIENT` o `"default"` si está vacío.
    El placeholder está aislado en un único archivo con marca clara de borrado en Fase 2.
    Ningún archivo fuera del placeholder contiene strings de UI hardcoded.
  </done>
</task>

<task type="auto">
  <name>Crear canvas 1080×1920 y página de prueba bajo src/app/(kiosk)/</name>
  <files>src/app/layout.tsx, src/app/(kiosk)/layout.tsx, src/app/(kiosk)/page.tsx, src/components/kiosk-canvas.tsx</files>
  <action>
    Rutas bajo `src/app/(kiosk)/` (decisión §6, R2).

    1. `src/app/layout.tsx` — root layout:
       - `<html lang="es">` (v1 solo español, PROJECT.md "Fuera de alcance").
       - `<body className="bg-background text-foreground font-sans antialiased">`.
       - Importar `"@/styles/globals.css"`.
       - Metadata mínima: `title: "Kiosk Portrait"` (placeholder genérico; en Fase 2 vendrá de config).
       - **Server Component** (default, CLAUDE.md §8).

    2. `src/app/(kiosk)/layout.tsx` — layout del grupo kiosk. Server Component. Renderiza `<KioskCanvas>{children}</KioskCanvas>`.

    3. `src/components/kiosk-canvas.tsx` — Server Component que envuelve el contenido en un contenedor fijo 1080×1920, centrado, con las safe areas del token. Usar las utilidades Tailwind ya mapeadas (`w-[var(--kiosk-width)]` no — preferimos `w-kiosk` si se expuso en `spacing`; si no, usar `style={{width:'var(--kiosk-width)', height:'var(--kiosk-height)'}}` que NO es hardcoded: apunta a la variable CSS del token).
       - Prohibido `w-[1080px]` o `h-[1920px]` literales (decisión §8, CLAUDE.md §7).
       - Añadir `data-kiosk-canvas` para verificación visual.

    4. `src/app/(kiosk)/page.tsx` — página de prueba. Server Component. Importa `KIOSK_PHASE_1_PLACEHOLDER` y renderiza los 3 textos en un layout básico centrado. Añade un pequeño bloque que lea `getClientSlug()` y lo muestre (útil para verificar que la env llega): "Cliente activo: {slug}". Ese label ("Cliente activo:") **también vive en el placeholder** — no inventar strings en JSX.

    5. Añadir scripts al `package.json` si faltan: `"kiosk:dev": "KIOSK_CLIENT=default next dev"` (decisión §1, ROADMAP Fase 1). En Windows hay que usar `cross-env` o documentar limitación en SUMMARY — decisión: usar `cross-env` como devDep para portabilidad (`pnpm add -D cross-env`) y que el script quede `"kiosk:dev": "cross-env KIOSK_CLIENT=default next dev"`.
  </action>
  <verify>
    - `pnpm kiosk:dev` levanta sin errores en `http://localhost:3000`.
    - Abrir `/` muestra los 3 textos del placeholder y el slug "default".
    - Screenshot con las dimensiones del viewport → el canvas mide 1080×1920 lógicos (verificar en DevTools: `document.querySelector('[data-kiosk-canvas]').getBoundingClientRect()`).
    - `pnpm typecheck` pasa.
    - Grep negativo: `grep -REn "1080px|1920px" src/` no debe encontrar literales fuera de comentarios.
    - Grep negativo: `grep -REn "#[0-9a-fA-F]{3,8}" src/` sin resultados.
    - Subagent `auditor-white-label` sobre `src/` reporta únicamente los strings del `kiosk-placeholder.ts` (que están marcados como tal) y ninguna otra infracción.
  </verify>
  <done>
    `pnpm kiosk:dev` levanta y muestra una página que confirma: canvas 1080×1920 correcto, tipografía aplicada, `KIOSK_CLIENT=default` resuelto.
    Toda la UI visible proviene o de tokens CSS (colores, tamaños) o del archivo `kiosk-placeholder.ts` (textos), que está explícitamente marcado para eliminar en Fase 2.
    No existen literales de color ni de tamaño del canvas fuera de `tokens.css`.
  </done>
</task>
