---
description: Crear una carpeta de cliente nueva a partir de clients/_template.
argument-hint: '<slug>   (ej. acme, museo-thyssen — minúsculas y guiones)'
---

# /nuevo-cliente — Crear cliente white-label nuevo

Claude, vamos a crear el cliente **`$ARGUMENTS`**. Habla en español.

## 1. Validar el slug

- Debe coincidir con el regex del schema: `^(_[a-z][a-z0-9-]*|[a-z0-9][a-z0-9-]*)$`.
- Los slugs que empiezan por `_` están reservados para plantillas → **rechaza** y pide otro.
- Si ya existe `clients/$ARGUMENTS/`, **no sobreescribas**. Di que existe y ofrece abortar o usar otro nombre.

## 2. Verificar que la plantilla está presente

`clients/_template/` debe existir con al menos:

- `config.json`
- `config.schema.json`
- `tokens.css`
- `README.md`
- `assets/` (aunque solo tenga `.gitkeep`)

Si falta algo, para y avísame.

## 3. Ejecutar el script oficial

Preferir siempre el script del proyecto, no copiar a mano:

```bash
pnpm kiosk:new-client $ARGUMENTS
```

Si el script no existe todavía (Fase 0), cae al fallback:

```bash
cp -r clients/_template "clients/$ARGUMENTS"
```

Y luego edita `clients/$ARGUMENTS/config.json` para cambiar:

- `client.slug` → `"$ARGUMENTS"`
- `client.nombre` → placeholder `"Cliente $ARGUMENTS"`
- `meta.creado_en` → valor de `date +%F`

## 4. Validar contra el schema

```bash
pnpm validate:configs
```

Si el script aún no existe, valida manualmente con:

```bash
python3 -c "import json, jsonschema; jsonschema.validate(json.load(open('clients/$ARGUMENTS/config.json')), json.load(open('clients/_template/config.schema.json'))); print('OK')"
```

Si no valida, reporta el error y **no commitees**.

## 5. Resumir y pedir siguientes pasos

Preséntame:

- Qué se creó (árbol breve de `clients/$ARGUMENTS/`).
- Qué placeholders quedan por llenar (slug ya hecho, nombre, logo, textos, colores).
- Propón: _"¿Abrimos `clients/$ARGUMENTS/config.json` y `tokens.css` para rellenar branding real, o lo dejas para luego?"_.

NO hagas commit todavía; eso va por `/commit` cuando el cliente esté listo.

---

**Argumento:** $ARGUMENTS
