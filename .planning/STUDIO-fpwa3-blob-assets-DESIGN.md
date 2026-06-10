# DESIGN — Studio Audit F-PWA-3: materializar assets a Vercel Blob

> Fecha: 2026-06-10 · Audit origen: `STUDIO-AUDIT-2026-06-09` (hallazgo **F-PWA-3**).
> Estado: diseño aprobado por Rubén (brainstorming 2026-06-10).

## 1. Problema

`ImageField` y `PdfField` del Studio emiten **data-URI base64** que se guardan inline en el config
(KV `cfg:<slug>`/`pwa:<slug>` + `config.json` publicado). Consecuencias (audit F-PWA-3):

- Lag al teclear: el bridge re-postea el slice completo por keystroke y el dirty-check hace
  `JSON.stringify` de un slice multi-MB.
- `config.json` pesado en el repo tras publish (el publish PWA mergea el slice verbatim, sin
  descartar data-URIs como sí hace el kiosk vía `skipDataUrl`).

## 2. Decisión (brainstorming)

- **Vercel Blob, reusando la infra existente.** `@vercel/blob` ya está instalado, existe
  `POST /api/studio/upload` (sube a Blob, devuelve URL `https://`) y **`MediaField` ya lo usa** (con
  fallback a data-URI sin token). Blob **está provisionado en prod** (confirmado por Rubén).
- **Alcance:** `ImageField` + `PdfField` adoptan Blob; se amplía el upload route a `image/x-icon` y
  `application/pdf`. Solo uploads nuevos (no se migran los data-URI existentes — siguen renderizando).
- Una URL `https://` de Blob atraviesa intacta `resolveStudioAsset` (preview), `resolveAssetUrl`
  (runtime) y **sobrevive el publish** (`skipDataUrl` solo descarta `data:`). No rompe el
  white-label (el proyecto ya acepta Blob).

## 3. Arquitectura

### 3.1 Util compartido — `src/app/studio/_lib/upload-to-blob.ts` (nuevo)

Hoy `uploadToBlob` es una función privada en `MediaField.tsx:387` y el probe de disponibilidad vive
inline en su `useEffect`. Se extraen para reuso por los 3 fields:

- `uploadToBlob(file, { slug, kind, product, onProgress, xhrRef }): Promise<string>` — XHR POST a
  `/api/studio/upload`, devuelve la URL pública. Movido **verbatim** desde MediaField.
- `useBlobAvailable(): boolean | null` — hook que hace `GET /api/studio/upload` una vez y cachea el
  flag `available`.
- `MediaField` se refactoriza para consumir ambos (sin cambio de comportamiento).

### 3.2 Upload route — `src/app/api/studio/upload/route.ts`

- Añadir `image/x-icon` a `ALLOWED_IMAGE` (favicons del kiosk).
- Añadir `kind=doc` con `ALLOWED_DOC = { 'application/pdf' }`; extender la validación de `kind` y el
  path determinístico (`docs/<slug>/<timestamp>-<rand>.pdf`).
- El cap de 5MB se mantiene (el PdfField actual permite 8MB en data-URI; con Blob bajamos a 5MB del
  route — aceptable, un brochure típico cabe; documentar el nuevo cap en el field).

### 3.3 `ImageField` (`src/app/studio/_components/ImageField.tsx`)

- Usa `useBlobAvailable()`.
- `pickFile`: si `available && slug` → `uploadToBlob(file, { slug, kind: 'image', product: 'kiosk' })`
  → `onChange(url)`. Si no → **fallback actual** `compressImage` → data-URI (intacto).
- Blob sube el File crudo (el route valida MIME + cap). SVG/ico pasan por Blob también.

### 3.4 `PdfField` (`src/app/studio/_components/PdfField.tsx`)

- Añade `useStudioSlug()` + `useBlobAvailable()`.
- El conteo de páginas (heurística sobre el buffer) se mantiene client-side.
- Si `available && slug` → `uploadToBlob(file, { slug, kind: 'doc', product: 'kiosk' })` →
  `onChange(url)` + `onPageCountChange`. Si no → data-URI fallback (intacto).

## 4. No-regresión

- `MediaField`: extracción pura, comportamiento idéntico (mismo `uploadToBlob`, mismo probe).
- Data-URIs ya guardados en clientes existentes siguen renderizando (`resolveStudioAsset` y
  `resolveAssetUrl` manejan `data:`).
- `skipDataUrl` del publish del kiosk se mantiene como red de seguridad para cualquier data-URI
  residual.
- Dev sin token → fallback data-URI preservado en los 3 fields (el lag solo persiste ahí).

## 5. Verificación

- `pnpm typecheck` + `pnpm lint` (0 warnings) + `pnpm validate:configs` + tests.
- **Test unitario nuevo** (`vitest`) de la validación MIME ampliada del upload route: acepta
  `image/x-icon` y `application/pdf` (kind=doc), rechaza tipos no permitidos.
- QA manual de Rubén (requiere login GitHub + Blob): subir un logo en ImageField → el config guarda
  una URL `https://` (no base64) → el preview lo muestra → publish lo conserva.

## 6. Fuera de alcance

- Migrar los data-URI existentes en KV a Blob (los viejos siguen funcionando).
- Cambiar el comportamiento de `MediaField`.
- GC de blobs huérfanos (cuando se reemplaza un asset, el anterior queda en Blob) — **deuda futura**
  anotada; no bloquea F-PWA-3.
