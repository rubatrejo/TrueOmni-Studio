# PLAN — F-PWA-3: materializar assets a Vercel Blob

> Diseño: `STUDIO-fpwa3-blob-assets-DESIGN.md`. 2 commits temáticos.

## Commit 1 — util compartido + upload route ampliado + test

```xml
<task type="auto">
  <name>Extraer uploadToBlob/useBlobAvailable + ampliar MIME del upload route</name>
  <files>
    src/app/studio/_lib/upload-to-blob.ts (nuevo),
    src/app/studio/_components/MediaField.tsx (consume el util),
    src/app/api/studio/upload/route.ts (image/x-icon + kind=doc/pdf),
    src/lib/studio/__tests__/upload-mime.test.ts (nuevo, vitest)
  </files>
  <action>
    Mover uploadToBlob (MediaField:387) a _lib/upload-to-blob.ts + extraer el probe a
      useBlobAvailable(). MediaField consume ambos (sin cambio de comportamiento).
    Upload route: ALLOWED_IMAGE += image/x-icon; nuevo kind 'doc' con ALLOWED_DOC={application/pdf};
      extender validación de kind + path docs/<slug>/...; exportar las constantes/validador puro
      para testear.
    Test vitest: el validador acepta x-icon + pdf(doc), rechaza no permitidos.
  </action>
  <verify>pnpm typecheck && pnpm lint && pnpm test (nuevo suite verde).</verify>
  <done>El util es reutilizable, MediaField intacto, el route acepta pdf/ico. Commit + push + READY.</done>
</task>
```

## Commit 2 — ImageField + PdfField adoptan Blob

```xml
<task type="auto">
  <name>ImageField y PdfField suben a Blob con fallback data-URI</name>
  <files>
    src/app/studio/_components/ImageField.tsx,
    src/app/studio/_components/PdfField.tsx
  </files>
  <action>
    ImageField: useBlobAvailable(); pickFile → si available && slug uploadToBlob(file,image) →
      onChange(url); si no, compressImage data-URI (fallback intacto).
    PdfField: useStudioSlug()+useBlobAvailable(); conteo de páginas client-side se mantiene; si
      available && slug uploadToBlob(file,doc) → onChange(url)+pageCount; si no, data-URI fallback.
  </action>
  <verify>
    pnpm typecheck && pnpm lint && pnpm test.
    QA manual de Rubén: upload en ImageField → config con URL https (no base64) → preview OK → publish conserva.
  </verify>
  <done>Uploads nuevos van a Blob; cero data-URI en el config con token. Commit + push + READY.</done>
</task>
```
