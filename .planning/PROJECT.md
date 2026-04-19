# PROJECT.md — Kiosk Portrait white-label

## Visión

Convertir un diseño de kiosk en modo retrato (Adobe XD) en un **producto reutilizable** que se pueda desplegar para múltiples clientes **solo cambiando branding y data**, sin tocar el código de los componentes.

## ¿Por qué existe?

Hoy cada nuevo cliente implica duplicar el diseño, maquetarlo de cero, ajustar colores a mano y sincronizar textos e imágenes en varios archivos. Eso no escala. Este proyecto es la respuesta: **un kiosk white-label de alta calidad visual que se reconfigura por JSON + tokens.**

## Principios

1. **Pixel-perfect con el diseño original.** El kiosk en Next.js debe ser indistinguible del XD dentro de ±2px.
2. **Cero hardcoded.** Colores, textos, imágenes, feature flags → siempre en `clients/{slug}/`.
3. **Alta calidad visual.** No nos conformamos con "se parece". El skill `web-design-guidelines` revisa cada pantalla antes de declararla lista.
4. **Un cliente nuevo = copiar `_template/` + editar JSON/CSS.** Si alguien necesita tocar un `.tsx`, hay un bug en el white-label.
5. **Performance primero.** Kiosk corre en pantallas dedicadas; la UX no puede notarse lenta.

## Fuera de alcance (por ahora)

- Back-end propio (la data viene del JSON o de APIs externas ya existentes).
- CMS visual. Los clientes técnicos editan JSON a mano.
- Multi-idioma avanzado. v1 solo español; v2 idioma configurable via flag.
- Modo landscape. v1 es solo retrato.

## Éxito = cuando pueda

1. Generar un kiosk nuevo para un cliente en < 30 min solo tocando JSON/CSS.
2. Comparar el render con el SVG del XD y que el diff visual sea mínimo.
3. Cambiar branding con un solo PR que solo toque `clients/{slug}/`.
