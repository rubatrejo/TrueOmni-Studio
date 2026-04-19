---
description: Arrancar el trabajo de una pantalla del kiosk a partir de su SVG y specs.
argument-hint: "<nombre-de-pantalla>   (ej. home, menu, info-evento)"
---

# /pantalla — Preparar trabajo de una pantalla

Claude, vamos a empezar la implementación de la pantalla **`$ARGUMENTS`**. Habla en español. NO escribas código aún — esto es fase de planeación.

## 1. Localizar los inputs

Busca:

- `designs/*{$ARGUMENTS}*.svg`
- `designs/*{$ARGUMENTS}*.md`

Si encuentras varios, lístalos y pregúntame cuál es el correcto. Si no encuentras nada, dímelo y ofrece crear un stub de `designs/NN-{$ARGUMENTS}.md` a partir de `designs/_template.md`.

## 2. Leer lo disponible

En una sola respuesta con varios `Read`:

- El SVG de la pantalla (los primeros ~200 elementos son suficientes para entender jerarquía).
- El `.md` de specs.
- `.planning/SKILLS.md` (para saber qué Tier 1 cargar).
- `clients/_template/tokens.css` (para saber qué tokens hay disponibles).
- `clients/_template/config.json` (para saber qué claves puede consumir la pantalla).

## 3. Cargar skills Tier 1

Carga los skills marcados como **Tier 1 — core** en `.planning/SKILLS.md`. No cargues Tier 2 ni Tier 3 todavía.

## 4. Detectar gaps de diseño

Antes de planear, responde:

- ¿El SVG usa colores que no están como token en `tokens.css`? Si sí, lístalos.
- ¿El `.md` de specs está completo (todos los campos de la plantilla)? Si hay huecos, márcalos.
- ¿La pantalla consume claves de `config.json` que no existen todavía? Si sí, lístalas.

Si hay gaps, pregúntame antes de planear. No los inventes.

## 5. Proponer plan XML

Crea un **borrador** de plan en `.planning/{fase}-{n}-PLAN.md` (decide el número siguiente mirando el ROADMAP y los planes existentes) con los 4 campos obligatorios:

```xml
<task type="auto">
  <name>Implementar pantalla {$ARGUMENTS}</name>
  <files>...</files>
  <action>...</action>
  <verify>
    Subagent revisor-visual contra designs/NN-{$ARGUMENTS}.svg.
    Subagent auditor-white-label sin hallazgos.
    pnpm typecheck && pnpm lint limpios.
  </verify>
  <done>
    Diff visual ±2px.
    Cambiar tokens.css cambia la pantalla sin tocar .tsx.
  </done>
</task>
```

## 6. Pedir aprobación

Muestra el plan en el mensaje y pregúntame: **"¿Apruebo el plan o lo ajustamos?"**.

NO ejecutes nada más. No escribas código. Espera.

---

**Argumento:** $ARGUMENTS
