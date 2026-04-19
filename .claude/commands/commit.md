---
description: Generar y proponer un commit en Conventional Commits español.
argument-hint: '[nota opcional sobre el commit]'
---

# /commit — Commit en Conventional Commits español

Claude, vas a proponer un commit. Habla en español. **Nunca hagas push** sin que yo lo pida.

## 1. Revisar lo que hay staged y unstaged

En paralelo:

```bash
git status --short
git diff --stat
git diff --stat --cached
```

- Si no hay cambios, dímelo y termina.
- Si hay cambios no staged, pregúntame si los incluyo o los dejo fuera.
- **Nunca uses `git add -A` ni `git add .`**. Propón la lista explícita de archivos a stagear y pídeme OK.

## 2. Pasar el auditor white-label

Delega al subagent `auditor-white-label` con un prompt como:

> "Escanea los archivos que se van a commitear en busca de:
> (1) colores hex/rgb en código (ej. `#112233`, `rgb(...)`),
> (2) strings visibles de UI hardcodeados (texto en JSX fuera de `t(...)` o `config.textos.*`),
> (3) paths absolutos a imágenes hardcodeados.
> Devuelve hallazgos con archivo+línea o 'OK' si no hay nada."

Si hay hallazgos, **para el commit** y muéstramelos. Corrijo y lanzamos `/commit` de nuevo.

## 3. Clasificar el cambio

Según los archivos tocados:

- Solo `.planning/*` → `docs(planning)` o `chore(planning)`.
- Solo `clients/{slug}/*` → `feat({slug})` o `fix({slug})`.
- `designs/*` → `chore(designs)`.
- `src/app/(kiosk)/*` y componentes → `feat(kiosk)` o `fix(kiosk)`.
- `.claude/commands/*` o `.claude/agents/*` → `chore(claude)`.
- `package.json`, lockfiles, configs → `chore` o `build`.

Tipos válidos: `feat, fix, refactor, docs, chore, build, ci, test, perf, style, revert`.

## 4. Redactar el mensaje

Formato:

```
<tipo>(<ámbito>): <asunto en imperativo, minúsculas, <=72 chars>

<cuerpo opcional en español explicando el porqué, no el qué>
```

Ejemplos buenos:

- `feat(kiosk): añade pantalla menú con selector de categorías`
- `fix(acme): corrige radio de botones en cliente Acme`
- `docs(planning): cierra fase 1 y actualiza STATE`
- `chore(claude): añade subagent auditor-white-label`

Si `$ARGUMENTS` trae una nota, úsala para afinar el asunto o cuerpo.

## 5. Mostrar y pedir OK

Enséñame la propuesta completa:

```
📝 Commit propuesto:

   feat(kiosk): ...

   [cuerpo opcional]

Archivos (N):
  A .planning/...
  M src/...
```

Pregúntame: **"¿Commiteo así o ajusto?"**.

## 6. Ejecutar

Cuando confirme:

```bash
git add <archivos-específicos>
git commit -m "<mensaje>" -m "<cuerpo opcional>"
git status
```

NO hagas `git push`. Termina con el hash del commit y el git status limpio.

---

**Argumento:** $ARGUMENTS
