# MIG-AB-1 — Migración Playwright → agent-browser + higiene del repo

> **Fase:** MIG-AB (one-off, fuera de la numeración 3.x del kiosk).
> **Owner:** Rubén (designers@trueomni.com).
> **Fecha plan:** 2026-05-11.
> **Origen:** informe de mejoras del 2026-05-11. El usuario aprobó "hagamos lo
> que recomiendas". Esta es la materialización de esa aprobación.

## Objetivo

Reemplazar **Playwright / `webapp-testing` MCP** por
**[vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser)**
como herramienta primaria de verificación visual + smoke E2E, y aprovechar la
sesión para resolver tres problemas de higiene que estaban arrastrando el repo:

1. 264 PNGs sueltos en la raíz (~147 MB locales).
2. Carpeta `.playwright-mcp/` (31 MB) sin uso.
3. `tsconfig.json` sin `@/hooks` ni `@/stores` aunque los directorios existen.

## Reglas de la migración

- **No reescribir histórico.** Los `STATE.md`, `3-NN-{PLAN,SUMMARY,COVERAGE}.md`
  y planes de fases cerradas conservan sus menciones a "Playwright MCP" tal
  cual: son registro de lo que pasó en su día. Solo se tocan los archivos
  **vivos** (agentes, comandos, skills index, protocolos operativos, gitignore,
  CLAUDE.md).
- **Cero commits sin diff revisado por Rubén.** Esta sesión deja todo aplicado
  pero NO ejecuta `git add` ni `git commit`.
- **Cero borrados destructivos.** Los PNGs sueltos se **mueven** a
  `.planning/verifications/_orphans-2026-05-11/`, no se borran. La carpeta
  `.playwright-mcp/` queda en disco; lo único que cambia es que ya no se
  documenta como ruta esperada.

---

## Tareas

<task type="auto">
  <name>M1 — agent-browser como herramienta primaria del revisor-visual</name>
  <files>.claude/agents/revisor-visual.md</files>
  <action>
    Reescribir el paso 3 ("Toma screenshot") para que use `agent-browser` como
    única vía primaria a 1080×1920. Comandos exactos:

    ```bash
    agent-browser set viewport 1080 1920
    agent-browser open http://localhost:3000$ruta
    agent-browser wait --load networkidle
    agent-browser screenshot .planning/verifications/NN-nombre-YYYY-MM-DD.png
    ```

    Añadir paso 3b opcional con `agent-browser diff screenshot --baseline
    designs/NN-pantalla.png` cuando exista el PNG renderizado del SVG.

    Mantener Chrome MCP como **secundaria** (solo si está conectada al
    navegador del usuario, NO obligatoria). Quitar toda mención a
    `webapp-testing` / Playwright como fallback.

    Actualizar `allowed-tools` si hace falta: ya está restringido a Read, Bash,
    Glob, Grep — `agent-browser` corre por Bash, no se necesitan permisos extra.

  </action>
  <verify>
    grep -in -E '(playwright|webapp-testing)' .claude/agents/revisor-visual.md
    → 0 hits.

    Lectura humana: el bloque del paso 3 contiene los 4 comandos de
    `agent-browser` exactamente.

  </verify>
  <done>
    El subagente revisor-visual instruye usar `agent-browser` por defecto y
    sin fallback a Playwright.
  </done>
</task>

<task type="auto">
  <name>M2 — Promover agent-browser de Tier 3 a Tier 2 en SKILLS.md</name>
  <files>.planning/SKILLS.md</files>
  <action>
    Mover la fila `agent-browser` de Tier 3 a Tier 2, con descripción nueva:
    "Screenshots + diff visual del kiosk en `/verificar-visual` y smoke E2E
    contra dev server". Borrar la fila `webapp-testing` de "Skills recomendados
    que faltan" (ya no faltan: el rol lo cubre agent-browser).
  </action>
  <verify>
    grep -in 'webapp-testing\|playwright' .planning/SKILLS.md → 0 hits.
    grep -in 'agent-browser' .planning/SKILLS.md → debe estar en Tier 2.
  </verify>
  <done>
    SKILLS.md refleja la realidad: agent-browser es el skill de verificación
    visual oficial.
  </done>
</task>

<task type="auto">
  <name>M3 — PIXEL-PERFECT-PROTOCOL sin Playwright</name>
  <files>.planning/PIXEL-PERFECT-PROTOCOL.md</files>
  <action>
    Línea ~100 ("Tomar screenshot del render via Playwright MCP a la misma
    resolución") sustituida por:

    ```bash
    agent-browser set viewport 1080 1920
    agent-browser open http://localhost:3000/$ruta
    agent-browser wait --load networkidle
    agent-browser screenshot .planning/verifications/NN-pantalla-render.png
    agent-browser diff screenshot --baseline /tmp/thumbs/NN-pantalla.png
    ```

    Mantener el step 1 (`qlmanage -t -s 1080 -o /tmp/thumbs ...`) intacto: ese
    convierte el SVG a PNG y lo usa el `diff screenshot` como baseline.

  </action>
  <verify>
    grep -in playwright .planning/PIXEL-PERFECT-PROTOCOL.md → 0 hits.
  </verify>
  <done>
    Protocolo pixel-perfect documenta el flujo con agent-browser.
  </done>
</task>

<task type="auto">
  <name>M4 — /verificar-visual con precondición agent-browser</name>
  <files>.claude/commands/verificar-visual.md</files>
  <action>
    Añadir precondición en sección 1: comprobar `command -v agent-browser`. Si
    no está instalado, proponer al usuario:

    ```bash
    npm i -g agent-browser
    agent-browser install
    ```

    Actualizar el prompt sugerido al subagente para mencionar explícitamente
    `agent-browser` en lugar de "Playwright MCP".

  </action>
  <verify>
    grep -in playwright .claude/commands/verificar-visual.md → 0 hits.
    Lectura humana: el bloque de precondiciones incluye `agent-browser`.
  </verify>
  <done>
    El comando documenta y obliga a tener agent-browser disponible antes de
    delegar al revisor-visual.
  </done>
</task>

<task type="auto">
  <name>M5 — Spec E2E Studio convertido a batch JSON</name>
  <files>tests/e2e/studio-create-client.json, .planning/tests/studio-create-client.e2e.md</files>
  <action>
    Crear `tests/e2e/` y dentro `studio-create-client.json` con el flujo del
    spec actual (.planning/tests/studio-create-client.e2e.md) expresado como
    array de comandos válidos para `agent-browser batch --json --bail`.

    Reescribir la cabecera del `.md` para que apunte al JSON ejecutable como
    fuente de verdad. Marcar el camino Playwright como **opcional futuro**, no
    obligatorio.

  </action>
  <verify>
    Existe tests/e2e/studio-create-client.json y es JSON válido
    (`node -e "JSON.parse(require('fs').readFileSync('tests/e2e/studio-create-client.json'))"` no falla).

    El .md referencia el .json y NO instruye instalar @playwright/test como
    paso obligatorio.

  </verify>
  <done>
    Existe un spec E2E del Studio ejecutable con `agent-browser batch` sin
    deps nuevas.
  </done>
</task>

<task type="auto">
  <name>M6 — Script pnpm verify:visual</name>
  <files>scripts/verify-visual.mjs, package.json</files>
  <action>
    Crear `scripts/verify-visual.mjs` que:

    1. Tome `--ruta` y opcional `--name`.
    2. Verifique `command -v agent-browser`.
    3. Verifique que `http://localhost:3000` responde (curl).
    4. Lance `agent-browser set viewport 1080 1920 && open && wait && screenshot`.
    5. Guarde la salida en `.planning/verifications/`.

    Añadir a `package.json` el script `"verify:visual": "node scripts/verify-visual.mjs"`.

  </action>
  <verify>
    `node scripts/verify-visual.mjs --help` imprime usage sin error
    (cuando agent-browser no está instalado, falla con mensaje claro).

    `pnpm run` lista verify:visual.

  </verify>
  <done>
    Existe un comando `pnpm verify:visual --ruta /home` reproducible fuera
    de Claude Code.
  </done>
</task>

<task type="auto">
  <name>M7 — CLAUDE.md y .gitignore</name>
  <files>CLAUDE.md, .gitignore</files>
  <action>
    CLAUDE.md sección 9 ("Cosas que Claude NO debe hacer"): añadir un punto
    nuevo prohibiendo Playwright MCP / webapp-testing para screenshots y
    declarando `agent-browser` como herramienta oficial.

    .gitignore: borrar la línea `.playwright-mcp/` (aparece duplicada) y el
    bloque "Debug screenshots de Playwright". Mantener `/*.png` que ya cubre
    los PNGs sueltos en raíz.

  </action>
  <verify>
    grep -in 'playwright' .gitignore CLAUDE.md → solo la nueva prohibición
    en CLAUDE.md, nada en .gitignore.
  </verify>
  <done>
    El contrato del proyecto refleja la migración.
  </done>
</task>

<task type="auto">
  <name>M8 — scripts/clean-dev-screenshots.mjs</name>
  <files>scripts/clean-dev-screenshots.mjs, package.json</files>
  <action>
    Crear script que:

    1. Por defecto MUEVE los `*.png` de la raíz a
       `.planning/verifications/_orphans-<fecha>/`.
    2. Con `--purge` los borra.
    3. Imprime resumen (qué movió, cuántos archivos, MB).
    4. Respeta `.gitignore` (los PNGs en raíz están ignorados, pero ocupan
       disco local).

    Añadir a `package.json` el script `"clean:screenshots": "node scripts/clean-dev-screenshots.mjs"`.

  </action>
  <verify>
    `node scripts/clean-dev-screenshots.mjs --help` imprime usage.
    `pnpm run` lista clean:screenshots.
  </verify>
  <done>
    Existe un comando para limpiar PNGs dev en una sola línea.
  </done>
</task>

<task type="auto">
  <name>P1 — Aplicar M8 una vez para mover PNGs actuales</name>
  <files>.planning/verifications/_orphans-2026-05-11/*.png</files>
  <action>
    Ejecutar `node scripts/clean-dev-screenshots.mjs` (sin --purge). Confirmar
    que la raíz queda sin PNGs y que `.planning/verifications/_orphans-2026-05-11/`
    contiene los 264 archivos.
  </action>
  <verify>
    `ls *.png 2>/dev/null | wc -l` → 0.
    `ls .planning/verifications/_orphans-2026-05-11/*.png | wc -l` → ≥ 260.
  </verify>
  <done>
    Repo limpio en disco. Histórico preservado en _orphans/ por si el usuario
    lo necesita.
  </done>
</task>

<task type="auto">
  <name>P2 — tsconfig.paths añadir @/hooks y @/stores</name>
  <files>tsconfig.json</files>
  <action>
    Añadir entradas para `@/hooks/*` y `@/stores/*` (los directorios existen
    en src/ pero no estaban mapeados; lo mismo para `@/styles/*` que sí existe).
  </action>
  <verify>
    `pnpm typecheck` sigue limpio.
  </verify>
  <done>
    Imports `@/hooks/*` y `@/stores/*` resuelven sin romper build.
  </done>
</task>

<task type="auto">
  <name>VERIF — Verificación final completa</name>
  <files>n/a</files>
  <action>
    Ejecutar en orden:
    1. `pnpm typecheck`
    2. `pnpm lint` (no bloqueante por config del proyecto, pero registrar warnings).
    3. `pnpm validate:configs`
    4. Grep global confirmando que **archivos vivos** no mencionan Playwright:
       `grep -RIn -E '(playwright|webapp-testing)' CLAUDE.md .gitignore .claude/agents .claude/commands .planning/SKILLS.md .planning/PIXEL-PERFECT-PROTOCOL.md tsconfig.json package.json scripts/`
       Debe estar vacío.
    5. Confirmar que STATE.md y los planes 3-NN-* **siguen conservando** sus
       menciones (son histórico, no se tocan).
  </action>
  <verify>
    Todos los comandos del paso 1-3 con exit code 0.
    El grep del paso 4 vacío.
    El grep `grep -RIn playwright .planning/STATE.md` aún devuelve muchos hits
    (eso es correcto, es histórico).
  </verify>
  <done>
    Migración aplicada sin romper build y sin alterar histórico.
    Resumen escrito a STATE.md activa-fase: una entrada nueva con fecha
    2026-05-11 documentando MIG-AB-1.
  </done>
</task>

---

## Lo que NO se hace en este plan

- Rotar `STATE.md` (295 KB) a archivos por fase. Es un trabajo aparte y
  requiere decisión humana sobre el punto de corte. Recomendado para una
  sesión dedicada (`docs:archive` o similar).
- Cerrar el worktree `.claude/worktrees/vibrant-kirch-310f4a/`. Requiere
  confirmación de Rubén porque puede contener cambios no integrados.
- Instalar Playwright formal (`@playwright/test`). Decisión diferida: se
  reevalúa cuando los specs E2E pasen de 3 a > 10.
- Migrar `next-auth` beta → stable. Decisión separada cuando salga el stable.
- Añadir Lighthouse en CI. CLAUDE.md lo menciona pero no es bloqueante.

## Salida esperada al cierre

- 10 archivos modificados/creados (M1-M8 + P1 + P2).
- 0 commits.
- 264 PNGs movidos a `.planning/verifications/_orphans-2026-05-11/`.
- STATE.md activo con una entrada nueva referenciando este PLAN.
- Diff revisable para que Rubén decida commitear y pushear.
