---
description: Comparar visualmente una ruta del kiosk con su SVG de referencia.
argument-hint: "<ruta>   (ej. /, /menu, /info/evento)"
---

# /verificar-visual — Diff visual render vs SVG

Claude, vamos a verificar visualmente la pantalla en la ruta **`$ARGUMENTS`**. Habla en español.

## 1. Precondiciones

Comprueba:

- Existe `package.json` y hay script `dev` (`pnpm dev`).
- Existe el SVG correspondiente. Deduce el nombre de pantalla por la ruta:
  - `/` → `designs/NN-home.svg`
  - `/menu` → `designs/NN-menu.svg`
  - `/info/evento` → `designs/NN-info-evento.svg`

  Si hay ambigüedad, lístame candidatos y pregúntame cuál.

## 2. Delegar al subagent `revisor-visual`

Usa la herramienta de subagentes (`Agent` / `Task`) con `subagent_type: "revisor-visual"` y pásale un prompt como:

> "Verifica la ruta `$ARGUMENTS` del kiosk contra `designs/NN-X.svg`.
> Levanta el dev server si no está arriba (`pnpm dev`), captura screenshot de la ruta a 1080×1920,
> compara con el SVG y devuelve: (1) diff visual en px del bounding box de cada bloque principal,
> (2) hallazgos donde el diff > ±2px, (3) ruta del screenshot guardado en `.planning/verifications/`."

## 3. Reportarme el resultado

Muéstrame un resumen compacto:

```
🖼  Pantalla: $ARGUMENTS
📐 Diff máximo: X px en bloque "Hero".
✅ Bloques OK: [lista]
⚠️  Bloques fuera de tolerancia: [lista con diff en px]
📸 Screenshot: .planning/verifications/NN-X-YYYY-MM-DD.png
```

Si todo está dentro de ±2px, propón marcar la tarea como verificada en el SUMMARY de la fase.

Si hay diferencias:

- NO ajustes el código sin preguntarme. Las diferencias pueden ser intencionadas (el SVG puede estar desactualizado).
- Preséntame opciones: **(a)** ajusto el código, **(b)** actualizo el SVG de referencia, **(c)** anoto excepción en STATE.md.

---

**Argumento:** $ARGUMENTS
