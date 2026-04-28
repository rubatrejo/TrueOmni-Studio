# STUDIO-PROJECT.md — Kiosk Studio

## Visión

Convertir la creación de un kiosk nuevo en una experiencia **visual, sin código y con preview en vivo siempre visible**. Cualquier persona del equipo TrueOmni (PM, designer, account manager) abre el Studio, elige un cliente y configura branding + módulos + contenido + ads + idiomas + integraciones viendo los cambios en tiempo real sobre el kiosk renderizado.

## ¿Por qué existe?

Hoy montar un cliente nuevo requiere editar a mano un `config.json` de ~13K líneas, 6 archivos `i18n/<locale>.json`, `tokens.css` con HSL, scripts de seed data y commits a git. Solo Rubén (perfil técnico) lo puede hacer. Eso bloquea ventas, retrasa onboarding y convierte cada cliente nuevo en un proyecto de ingeniería. El Studio elimina ese cuello de botella.

## Principios

1. **El Theme oficial no se toca.** Todos los componentes del kiosk en `src/components/**` están aprobados pixel-perfect. El Studio escribe a `clients/<slug>/`, nunca a `src/`.
2. **Live preview siempre visible.** El editor y el render del kiosk conviven en la misma pantalla. Cada cambio se ve en <500 ms sin reload.
3. **White-label estricto.** Lo que produce el Studio son archivos en `clients/<slug>/{config.json, tokens.css, i18n/*.json, assets/}`. El subagent `auditor-white-label` debe pasar igual que ahora.
4. **Approval gate.** Cualquier `@trueomni.com` edita; solo `ruben@trueomni.com` aprueba publishes.
5. **Versiones inmutables + changelog.** Cada publish aprobado = nueva versión + entrada en `clients/<slug>/CHANGELOG.md`.
6. **Local primero, Vercel después.** Construimos en local sin auth para iterar rápido. Cuando el visual esté aprobado, va a Vercel con login.

## Fuera de alcance (v1)

- Editor visual de los componentes del kiosk (`src/components/**` no se toca; eso seguirá siendo trabajo de Rubén con plan mode + skills).
- Edición simultánea por dos usuarios sobre el mismo cliente (v1 = "último en guardar gana", con indicador de quién está editando). Locking optimista en v2.
- Multi-tenant para clientes externos (v1 = uso interno TrueOmni).

## Éxito = cuando pueda

1. Crear un kiosk nuevo desde el Studio en < 30 min sin tocar código.
2. Cambiar los 3 brand tokens y ver TODO el kiosk recolorearse en < 200 ms.
3. Equipo TrueOmni edita kiosks desde Vercel; Rubén aprueba publishes desde el navegador; aparecen como PRs automáticos en GitHub.
4. Audit `auditor-white-label` sigue pasando sin cambios en `src/`.

## Métricas que vamos a perseguir

- **Time to first kiosk**: tiempo desde "creo cliente" hasta "primer publish aprobado". Objetivo: < 1h.
- **Edits por sesión**: heatmap de qué tabs se usan más; informa decisiones de UX y orden de fases siguientes.
- **% de fields editados desde el Studio vs. PR manual**: queremos > 90% en Studio para considerar que reemplaza al flujo manual.
