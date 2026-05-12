# Tests E2E del Studio

> Smoke tests ejecutables con `agent-browser` (vercel-labs). Cero deps nuevas
> en el repo. Solo requieren `agent-browser` instalado globalmente.

## Cómo correrlos

```bash
# 1. Asegúrate de tener agent-browser y un dev server arriba.
npm i -g agent-browser && agent-browser install
pnpm kiosk:dev      # en otra terminal

# 2. Ejecuta cualquier spec JSON:
agent-browser batch --bail < tests/e2e/studio-create-client.json

# 3. Revisa los screenshots:
ls .planning/verifications/e2e-*.png
```

`--bail` aborta al primer error. Sin él, agent-browser intenta seguir todos los
pasos.

## Specs disponibles

| Spec                           | Cubre                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `studio-create-client.json`    | Crear cliente + activar DD + cambiar brand colors. Hallazgos S-09, S-10, S-11 del audit panorámico v2 (2026-05-08). |
| `video-walls-create-wall.json` | Smoke del producto Video Walls: dashboard → crear wall → editor → runtime full canvas + crops por celda (VW10).     |

## Cómo añadir uno nuevo

1. Crear `tests/e2e/<descripción>.json`.
2. Es un array de arrays. Cada sub-array es **un comando de `agent-browser`**
   con sus argumentos como strings independientes. Ver
   [skill docs](/.claude/skills/agent-browser/SKILL.md) o el README oficial:
   <https://github.com/vercel-labs/agent-browser>.
3. Guardar screenshots con prefijo `e2e-<screen>-NN-<paso>.png` en
   `.planning/verifications/`.

## Por qué no Playwright todavía

Para los smoke tests críticos del Studio (≤ 3 specs hoy), `agent-browser batch`
es suficiente:

- Sin deps nuevas en el repo.
- JSON declarativo, leíble por humanos.
- Mismo binario que `/verificar-visual`, así que el toolchain de QA es uno solo.

Si la suite crece a > 10 specs o necesitamos assertions ricas (matchers,
reporters HTML, paralelismo nativo, retries), evaluar `@playwright/test`.
Mientras tanto, el .md `.planning/tests/studio-create-client.e2e.md` se queda
como **referencia opcional** del camino Playwright, no como roadmap obligatorio.
