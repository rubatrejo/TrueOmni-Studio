# Kiosk Portrait — white-label

Producto de kiosk en modo retrato, clonable pixel-perfect desde Adobe XD y reconfigurable por cliente sin tocar código.

**Stack:** Next.js (App Router) · TypeScript · Tailwind · shadcn/ui
**White-label:** tokens CSS + JSON de configuración por cliente.

---

## Arranque rápido con Claude Code

1. Abre Claude Code en la raíz de este repo.
2. Ejecuta el slash command:

   ```
   /iniciar
   ```

   Claude leerá el estado, verificará los skills de diseño y te propondrá la siguiente acción.

3. Trabaja en **plan mode** (Shift+Tab dos veces) hasta aprobar el plan, luego deja que ejecute.

4. Al acabar la sesión:

   ```
   /terminar
   ```

   Claude resume lo hecho, actualiza `STATE.md` y prepara el commit.

---

## Estructura

- **`CLAUDE.md`** — contrato del proyecto (léelo antes de tocar nada).
- **`.claude/commands/`** — slash commands (`/iniciar`, `/terminar`).
- **`.planning/`** — memoria del proyecto (visión, requirements, roadmap, estado).
- **`designs/`** — exports SVG + specs desde Adobe XD.
- **`clients/_template/`** — plantilla para crear un cliente nuevo.
- **`clients/{slug}/`** — tokens, config y assets de cada cliente.
- **`src/`** — app Next.js (se genera en la Fase 1).

---

## Crear un cliente nuevo

```bash
cp -r clients/_template clients/mi-cliente
# edita clients/mi-cliente/config.json y tokens.css
KIOSK_CLIENT=mi-cliente pnpm dev
```

Si necesitas tocar un `.tsx` para personalizar un cliente, hay un bug en el white-label. Ver `CLAUDE.md § 8`.

---

## Metodología

Este repo combina:

- **GSD** ([gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done)) — fases atómicas, XML estructurado, verificación built-in.
- **Boris Cherny** (creador de Claude Code, [tweet](https://x.com/bcherny/status/2007179832300581177)) — plan mode primero, CLAUDE.md vivo, slash commands, verify loops.

Detalle completo en `CLAUDE.md`.

---

## Contacto

Rubén · designers@trueomni.com
