---
description: Cerrar sesión. Resume lo hecho, actualiza STATE.md, propone y hace commit.
argument-hint: "[nota opcional sobre qué cerramos]"
---

# /terminar — Cerrar sesión de trabajo

Claude, vas a cerrar la sesión de trabajo. Habla **siempre en español**.

Ejecuta en este orden:

## 1. Revisar qué se hizo

Ejecuta en paralelo:

```bash
git status --short
git diff --stat
git log --since="4 hours ago" --oneline
```

Identifica:

- Archivos modificados, creados o borrados.
- Cambios aún sin commitear.
- Commits hechos durante la sesión.

## 2. Resumir la sesión

Genera un **resumen conciso** (máximo 12-15 líneas) con:

- ✅ **Qué se completó** (lista corta de entregables reales).
- 🧪 **Qué se verificó** (screenshots, tests, lighthouse, diff visual).
- ⚠️ **Qué quedó a medias** (bloqueos, TODOs abiertos).
- 💡 **Decisiones tomadas** que merezca recordar (arquitectura, convenciones).

## 3. Actualizar `.planning/STATE.md`

Antes de editar:

1. Obtén la fecha real de hoy ejecutando:
   ```bash
   date +%F
   ```
   Usa **exactamente** ese valor como `YYYY-MM-DD`. No inventes la fecha ni uses la que recuerdes del contexto — suele estar desfasada.

2. Lee `.planning/STATE.md` y añade una entrada al final del **historial de sesiones** (antes de la sección de "Plantilla de entrada" si existe) siguiendo este formato:

   ```markdown
   ### Sesión YYYY-MM-DD — [título breve]

   **Hecho:**
   - [punto 1]
   - [punto 2]

   **Verificado:**
   - [qué se comprobó y cómo]

   **Pendiente / siguiente:**
   - [qué retomar la próxima vez]

   **Decisiones:**
   - [decisión + razón, si aplica]

   **Fase:** [fase activa del roadmap]
   ```

3. Actualiza también la sección "Estado actual" del principio de `STATE.md` (fase activa, siguiente acción, bloqueos) si cambiaron.

Si `STATE.md` no existe, créalo con la estructura adecuada antes de añadir la entrada.

## 4. Actualizar el CLAUDE.md vivo (Boris Cherny rule)

Si durante la sesión:

- Te corregí varias veces sobre lo mismo.
- Descubrimos una convención que no estaba escrita.
- Metiste la pata de una forma que podría repetirse.

…propón añadir una línea a la sección **11. Cosas que Claude NO debe hacer** o a la sección **9. Convenciones de código**. Muéstrame el diff exacto y pídeme confirmación. Si confirmo, edítalo.

## 5. Preparar el commit

Agrupa los cambios en uno o varios commits coherentes. Usa **Conventional Commits en español**:

- `feat(kiosk): añade pantalla menú`
- `fix(tokens): corrige radio de botones en cliente X`
- `docs: actualiza STATE con resumen de sesión`
- `chore(planning): cierra fase 1`

Muéstrame la propuesta de commit(s) con el mensaje completo. **No hagas commit todavía.**

## 6. Pedir confirmación y commitear

Pregúntame: **"¿Hago el commit así o ajustamos el mensaje?"**

Cuando confirme:

1. `git add` solo de los archivos pertinentes (nunca `git add -A` ciego).
2. `git commit -m "..."` con el mensaje acordado.
3. `git status` final para ver que todo quedó limpio.

**No hagas `git push` a menos que te lo pida explícitamente.**

## 7. Cierre

Presenta el resumen final de la sesión así:

```
🏁 Sesión cerrada.

Commits creados: [lista]
STATE.md actualizado: ✅
CLAUDE.md actualizado: ✅/— (si aplicó)

Siguiente vez: arranca con /iniciar, retomamos por [X].
```

## 8. Nota del usuario

**Argumento del usuario:** $ARGUMENTS
