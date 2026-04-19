# Plan 1-2 — ESLint + Prettier estrictos y scripts de DX

**Fase:** Fase 1 · **Orden:** 2 · **Depende de:** 1-1 (scaffolding Next + TS + Tailwind).
**Cubre requerimientos:** R2 (calidad del código base que clonará los diseños).
**Skills necesarios:** ninguno (no es trabajo visual, SKILLS.md §"si no hay trabajo visual, no cargues").
**Resumen:** Configurar ESLint estricto (next/core-web-vitals + TypeScript + reglas anti-hardcoded opcionales) y Prettier con convenciones del proyecto (single quote, trailing comma, 100 cols, 2 espacios — CLAUDE.md §8 implícito). Añadir scripts npm "`lint`", "`lint:fix`", "`format`", "`format:check`" y un alias "`check`" que encadene typecheck+lint+format:check. Este plan es independiente de 1-3; pueden ejecutarse en paralelo. No se tocan los archivos creados por 1-3 (shadcn) para evitar conflictos: la configuración de ESLint contempla que `src/components/ui/` puede tener reglas levemente relajadas (imports de librerías de Radix, uso de `React.forwardRef`, etc.).

---

<task type="auto">
  <name>Instalar y configurar ESLint estricto para Next + TypeScript</name>
  <files>.eslintrc.cjs, .eslintignore, package.json</files>
  <action>
    Usar `pnpm` (decisión §1).

    1. Instalar dev deps:
       `pnpm add -D eslint eslint-config-next @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-import eslint-plugin-jsx-a11y eslint-config-prettier`.
       Mantener versiones compatibles con la de `next` instalada en 1-1.

    2. Crear `.eslintrc.cjs` con:
       - `root: true`.
       - `extends`: `["next/core-web-vitals", "plugin:@typescript-eslint/recommended", "plugin:jsx-a11y/recommended", "prettier"]`. El `prettier` al final apaga reglas de formato que entren en conflicto con Prettier.
       - `parser: "@typescript-eslint/parser"`, `parserOptions: { project: "./tsconfig.json", ecmaVersion: "latest", sourceType: "module" }`.
       - Reglas estrictas:
         - `"@typescript-eslint/no-explicit-any": "error"` (CLAUDE.md §8 "Avoid any").
         - `"@typescript-eslint/consistent-type-imports": "error"`.
         - `"@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }]`.
         - `"import/order": ["error", { "newlines-between": "always", "alphabetize": { "order": "asc" } }]`.
         - `"no-console": ["warn", { "allow": ["warn", "error"] }]`.
         - `"jsx-a11y/alt-text": "error"`.
         - `"react/jsx-no-target-blank": "error"`.
       - `overrides`:
         - Para `src/components/ui/**`: `{ "rules": { "react/display-name": "off" } }` (shadcn usa `forwardRef` sin displayName).
         - Para archivos `*.config.{ts,js,mjs,cjs}`: relajar `import/no-default-export`.
       - `settings.react.version: "detect"`.

    3. `.eslintignore`: `node_modules`, `.next`, `out`, `coverage`, `designs/`, `clients/*/assets/`, `pnpm-lock.yaml`.

    4. En `package.json` añadir scripts (no sobrescribir los de 1-1):
       - `"lint": "next lint"`.
       - `"lint:fix": "next lint --fix"`.

    **NO** añadir aquí regla custom que impida todos los strings en JSX (sería ruido; el auditor-white-label lo valida semánticamente).

  </action>
  <verify>
    - `pnpm lint` termina con 0 errores sobre el código de 1-1. Warnings permitidos solo si son explícitamente aceptados (documentar cuáles en SUMMARY).
    - `pnpm lint` detecta un caso de prueba: añadir temporalmente `const x: any = 1;` a un archivo `src/`, correr `pnpm lint`, debe fallar. Revertir.
    - `node -e "const c=require('./.eslintrc.cjs'); if(!c.extends.includes('next/core-web-vitals'))process.exit(1)"` devuelve 0.
  </verify>
  <done>
    `pnpm lint` pasa limpio sobre el código existente.
    Regla `no-explicit-any` efectivamente bloquea `any`.
    `src/components/ui/**` queda cubierto por override para no pelear con shadcn (1-3 podrá añadir sus componentes sin violar lint).
  </done>
</task>

<task type="auto">
  <name>Configurar Prettier con convenciones del proyecto</name>
  <files>.prettierrc.json, .prettierignore, package.json</files>
  <action>
    1. `pnpm add -D prettier prettier-plugin-tailwindcss`.
       El plugin de Tailwind ordena las clases — crítico para pixel-perfect y diffs limpios.

    2. `.prettierrc.json`:
       ```json
       {
         "semi": true,
         "singleQuote": true,
         "jsxSingleQuote": false,
         "trailingComma": "all",
         "printWidth": 100,
         "tabWidth": 2,
         "useTabs": false,
         "arrowParens": "always",
         "endOfLine": "lf",
         "plugins": ["prettier-plugin-tailwindcss"]
       }
       ```
       Justificación: CLAUDE.md §8 pide TS estricto, 2 espacios y limitar líneas a ~80-100 (proyecto user-level). Aquí elegimos 100.

    3. `.prettierignore`:
       `node_modules`, `.next`, `out`, `coverage`, `pnpm-lock.yaml`, `clients/*/assets/`, `designs/`, `*.svg`, `.planning/verifications/`.

    4. Añadir scripts al `package.json`:
       - `"format": "prettier --write \"**/*.{ts,tsx,js,jsx,cjs,mjs,json,md,css}\""`.
       - `"format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,cjs,mjs,json,md,css}\""`.

    5. Comprobar compatibilidad con ESLint: el `extends: ["...", "prettier"]` ya apaga reglas conflictivas (hecho en la tarea anterior).

  </action>
  <verify>
    - `pnpm format:check` pasa limpio sobre el código de 1-1 tras correr `pnpm format` una vez.
    - Prueba de ordenamiento Tailwind: crear temporalmente `<div className="text-lg p-4 flex">` → tras `pnpm format` las clases quedan reordenadas por el plugin (`flex p-4 text-lg`). Revertir.
    - `pnpm lint` sigue limpio (sin conflicto con Prettier).
  </verify>
  <done>
    `pnpm format:check` y `pnpm lint` pasan a la vez sin contradecirse.
    El plugin de Tailwind reordena clases automáticamente.
    `.prettierrc.json` refleja las convenciones acordadas.
  </done>
</task>

<task type="auto">
  <name>Añadir scripts de DX agregados y verificación end-to-end</name>
  <files>package.json</files>
  <action>
    Consolidar los scripts en `package.json` para que el inner-loop sea de un solo comando.

    Scripts finales esperados (sumados a los de 1-1):
    - `"dev": "next dev"` (ya existe).
    - `"kiosk:dev": "cross-env KIOSK_CLIENT=default next dev"` (ya existe, decisión §1).
    - `"build": "next build"`.
    - `"start": "next start"`.
    - `"typecheck": "tsc --noEmit"`.
    - `"lint": "next lint"`.
    - `"lint:fix": "next lint --fix"`.
    - `"format": "prettier --write ..."`.
    - `"format:check": "prettier --check ..."`.
    - **Nuevo:** `"check": "pnpm typecheck && pnpm lint && pnpm format:check"` — el comando que el orquestador corre antes de commitear.
    - **Nuevo:** `"clean": "rm -rf .next out coverage"`.

    Ordenar alfabéticamente los scripts para que el diff sea legible.

    No añadir `husky` ni hooks de git en Fase 1 (no está en ROADMAP Fase 1; sería scope creep).

  </action>
  <verify>
    - `pnpm check` ejecuta typecheck + lint + format:check y termina con código 0.
    - `pnpm kiosk:dev` sigue levantando (no se ha roto nada).
    - `node -e "const p=require('./package.json'); ['check','typecheck','lint','format:check','kiosk:dev'].forEach(s=>{if(!p.scripts[s])process.exit(1)})"` devuelve 0.
  </verify>
  <done>
    Un solo comando (`pnpm check`) valida el proyecto entero.
    Todos los scripts esperados existen y están ordenados.
    El orquestador puede usar `pnpm check` como gate de commit en todos los planes siguientes.
  </done>
</task>
