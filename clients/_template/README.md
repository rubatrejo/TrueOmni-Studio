# Plantilla de cliente — `_template`

Esta carpeta es el esqueleto que se copia para cada nuevo cliente del kiosk.

## Crear un cliente nuevo

```bash
cp -r clients/_template clients/mi-cliente
```

Después, edita **solo estos archivos** (nunca toques `.tsx` para personalizar un cliente):

1. **`config.json`** — textos, paths de assets, feature flags.
2. **`tokens.css`** — colores, tipografías, radios, sombras, espaciados.
3. **`assets/`** — logos, imágenes, posters, favicon. Crea la carpeta si no existe.

## Reglas

- El `slug` en `config.json → client.slug` debe coincidir con el nombre de la carpeta.
- Los tokens están en formato HSL sin la función `hsl()`: `"221 83% 53%"`.
- Las rutas de assets son **relativas a la carpeta del cliente**.
- Feature flags nuevos se añaden en `config.json → features` y se leen desde `src/lib/config.ts`.

## Probar el cliente

```bash
KIOSK_CLIENT=mi-cliente pnpm dev
```

Deberías ver la identidad visual de tu cliente aplicada sin haber tocado ningún componente.

## Si te hace falta tocar un `.tsx` para personalizar un cliente

**Hay un bug en el sistema white-label.** Abre un issue en lugar de parchear.
