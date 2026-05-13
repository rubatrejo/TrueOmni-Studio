# clients-walls/test-real

Seed de pruebas para el flow "crear cliente nuevo + editar video wall" creado
en sesión 2026-05-12 (audit Video Walls real client).

Diferencias respecto a `clients-walls/_template/`:

- `slug` `test-real` (no reservado).
- `name` `Test Real (VW seed)`.
- `walls/lobby-3x2/wall.json` con 2 slides (template `01-video-image-full` +
  `03-video-image-events`) en lugar de `_blank` con `playlist: []`.

## Dependencia signage (UNIFIED branding)

`loadVideoWallClient(slug)` lee branding/header desde
`signage:client:<slug>` (KV) cuando existe — es la fuente de verdad. En
producción, este KV se rellena vía `POST /api/studio/clients/<slug>/products/digital-displays/activate`
o por el primer save del editor de wall (`PUT /api/studio/signage/clients/<slug>`).

Para una prueba E2E sin Digital Displays activo, no es necesario crear
`clients-signage/test-real/`: la primera vez que el operador toque BrandingTab
o HeaderTab del editor de wall se hará upsert del KV signage automáticamente.

Si se quisiera el seed de events/social/news ya en fs (sin pasar por el editor),
crear adicionalmente `clients-signage/test-real/` clonando `_template`.
