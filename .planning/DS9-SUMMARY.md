# DS9-SUMMARY.md — Template `07-video-social-ad`

**Fecha:** 2026-05-07
**Estado:** ✅ aprobado visualmente

## Hecho

- **8 imágenes extraídas del SVG** + 3 mock de Unsplash:
  - `clients-signage/default/assets/social/post-{1..6}.jpg` extraídas del XD (dimensiones naturales 2448×3264 a 5464×8192).
  - `post-{7..9}.jpg` bajadas de Unsplash (4000×~2500, horizontales).
  - `avatar-jane.png` (65×65) y `featured-tweet-image.jpg` (2110×3752) extraídas (no usadas en este template tras refactor — quedan disponibles para DS10).
- **Template `07-video-social-ad.tsx`**:
  - Video top-left (1144×644) reusa pool.png + Play_Icon en (497, 247).
  - **Social Wall: 3×3 grid de 9 tiles** (decisión de diseño post-DS9, ver abajo).
  - Bottom horizontal ad (1144×281) reusa bottom-banner.jpg.
- **Patterns con viewBox = dimensiones naturales del image** + `preserveAspectRatio="xMidYMid slice"` en el pattern (verbatim del SVG fuente). Esto produce centrado + crop al fill el rect — sin letterbox.
- **Linear gradient azul brand-primary**: el SVG fuente usa `#004f8b` (--signage-brand-primary), no negro. Stop transparente arriba → opaco abajo, en `gradientUnits="objectBoundingBox"`.
- **`POST_NATURAL_DIMS` array** declara las dimensiones de cada post-N.jpg para evitar acople entre código y filenames.
- **Schema**: `SignageFeaturedTweetSchema` ganó campo `avatar` opcional.

## Verificado

- `pnpm typecheck` ✅
- 9 GETs `/signage-assets/default/assets/social/post-{1..9}.jpg` → HTTP 200
- Aprobación visual de Rubén ✅ (gradient azul OK, 9 tiles con imágenes a anchura completa OK, layout sin tweet card OK)

## Decisiones

- **3×3 grid en lugar de 6 tiles + featured tweet**: el SVG fuente tenía 6 tiles + tweet card (Jane Doe). El usuario prefirió un grid 3×3 más uniforme, eliminando el tweet card. Razón: carga visual más consistente y editor podrá decidir si activa el tweet destacado como toggle separado en DSS5.
- **Pattern viewBox = image natural dims** (no 258×308): el bug visible en review previa fue que con `viewBox="0 0 258 308"` y un image natural 4500×5500, `preserveAspectRatio` del image (default `meet`) producía letterbox lateral. Replicando el SVG fuente al pie de la letra (viewBox = source dims, slice en pattern) resuelve el centrado/cropping uniforme.
- **3 mock Unsplash horizontales**: las 3 fotos extra (post-7..9) son 4000×~2500 (horizontales). Con slice se centra-recortan al tile 258×308 sin distorsión. Aceptable para mock data de default cliente.
- **Cleanup**: eliminé `<XLogo>`, `<TweetBody>`, avatar y featured-tweet-image patterns del template. Los assets quedan en disk por si DS10 (`08-video-social`) los reusa.

## Pendiente / siguiente

- **DS10 — `08-video-social`** (último template): video izq + Social Wall der (sin ad bottom). Decidir si mantiene 6 + tweet o también 3×3 grid.
- **Compactación de imágenes**: post-2.jpg pesa 5MB, post-5.jpg 3MB. Optimización (compresión + max-width 1500px) reduciría el bundle inicial. Diferido — sub-fase post-DS15.
