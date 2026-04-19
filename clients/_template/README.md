# Plantilla de cliente — `_template`

Esta carpeta es el esqueleto que se copia para cada nuevo cliente del kiosk.

## Crear un cliente nuevo

```bash
pnpm kiosk:new-client mi-cliente
```

Eso copia `clients/_template/` a `clients/mi-cliente/`. Alternativa manual:

```bash
cp -r clients/_template clients/mi-cliente
```

Después, edita **solo estos archivos** (nunca toques `.tsx` para personalizar un cliente):

1. **`config.json`** — textos, paths de assets, feature flags.
2. **`tokens.css`** — colores, tipografías, radios, sombras, espaciados.
3. **`assets/`** — logos, imágenes, posters, favicon. Crea la carpeta si no existe.

## Qué puede sobreescribir cada cliente

| Archivo       | Qué controla                                                        | Ejemplos                                                                              |
| ------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `tokens.css`  | Identidad visual entera. Cualquier `--var` del template.            | `--primary`, `--font-serif`, `--radius-md`, `--safe-area-top`.                        |
| `config.json` | Textos de UI, branding, navegación, assets referenciados, features. | `textos.titulo_principal`, `branding.logo.default`, `features.inactividad_reset_seg`. |
| `assets/`     | Binarios del cliente (logos, posters, favicon).                     | `assets/logo.svg`, `assets/hero.jpg`.                                                 |

Ver `clients/demo-cliente-a/` como referencia de un cliente con identidad distinta al template.

## Reglas

- El `slug` en `config.json → client.slug` debe coincidir con el nombre de la carpeta.
- Los tokens están en formato HSL sin la función `hsl()`: `"221 83% 53%"`.
- Las rutas de assets son **relativas a la carpeta del cliente**.
- Feature flags nuevos se añaden en `config.json → features` y se leen desde `src/lib/config.ts`.
- El cliente `default` existe y actúa como fallback cuando `KIOSK_CLIENT` no coincide.

## Probar el cliente

```bash
KIOSK_CLIENT=mi-cliente pnpm kiosk:dev
```

Deberías ver la identidad visual de tu cliente aplicada sin haber tocado ningún componente.

## Si te hace falta tocar un `.tsx` para personalizar un cliente

**Hay un bug en el sistema white-label.** Abre un issue en lugar de parchear.
