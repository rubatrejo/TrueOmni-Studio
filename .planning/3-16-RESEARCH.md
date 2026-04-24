# Fase 3.16 — Photo Booth · RESEARCH

## MediaPipe SelfieSegmenter

**Paquete:** `@mediapipe/tasks-vision@0.10.34`

**API relevante:**

```ts
import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

const vision = await FilesetResolver.forVisionTasks(
  'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite',
);
const segmenter = await ImageSegmenter.createFromOptions(vision, {
  baseOptions: { modelAssetPath: '.../selfie_segmenter.tflite' },
  runningMode: 'IMAGE',
  outputCategoryMask: false,
  outputConfidenceMasks: true,
});

const result = segmenter.segment(imageBitmap);
// result.confidenceMasks[0] → ConfidenceMask con getAsUint8Array()
// La máscara es 0..255 donde 255 = persona (foreground).
```

**Performance esperada (1080×1920 en desktop intel):**
- Warm-up primera carga: ~500–1500 ms (descarga WASM + modelo + compile).
- Inferencia por imagen: ~200–600 ms.

**Decisiones:**
- Cargar el modelo desde CDN `storage.googleapis.com` para evitar bundlear el `.tflite` (8 MB). Cache-control del CDN permite reuso.
- Singleton pattern (crear el segmenter una sola vez y reutilizar entre capturas).
- Warm-up al entrar a la ruta `/home/photo-booth` con `useEffect`, NO al disparar (para que la captura sea instant).
- Post-proceso de máscara: feather 3 px vía `ctx.filter = 'blur(3px)'` aplicado a la máscara antes de componer → edges más suaves.

## Composición canvas

**OffscreenCanvas con fallback:**

```ts
const canvas = 'OffscreenCanvas' in globalThis
  ? new OffscreenCanvas(1080, 1920)
  : document.createElement('canvas');
if (!('OffscreenCanvas' in globalThis)) {
  canvas.width = 1080; canvas.height = 1920;
}
const ctx = canvas.getContext('2d')!;
```

**Orden de capas:**

```
1. ctx.drawImage(backgroundImg, 0, 0, 1080, 1920)
2. ctx.save(); ctx.filter = 'blur(3px)'; ctx.drawImage(maskCanvas, 0, 0); ctx.restore();
   → pre-render máscara feathered
3. ctx.globalCompositeOperation = 'source-in';
   ctx.drawImage(cameraFrame, 0, 0, 1080, 1920);
4. Reset GCO, drawImage(frameOverlay)
5. drawImage(stickers[])
6. ctx.filter = cssFilter; (si hay filter, se cuece)
```

**Export:** `canvas.toBlob(blob => ...)` → `URL.createObjectURL(blob)` → src del `<img>` y URL del QR (mock).

## getUserMedia + permisos

**Constraints preferidas:**

```ts
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    aspectRatio: { ideal: 9 / 16 },
    facingMode: 'user',
  },
  audio: false,
});
```

**HTTPS requerido en prod.** En dev `localhost` funciona con HTTP.

**Permiso denegado → `permission-gate` screen** con mensaje configurable desde `textos.photo_booth_permission_denied` + botón Retry.

## QR code

Librería existente: `qrcode.react@4.2.0` (ya usada en `qr-purchase-modal`).

**Template de URL:**

```ts
config.features.home.photoBooth.shareUrlTemplate = 'https://share.arizona.com/{id}'
// v1 substituye {id} por un UUID client-side (no persiste nada real).
// Fase 5+ el backend crea el registro y el QR apunta a la URL real.
```

## Alternativas descartadas

| Lib | Motivo descarte |
|-----|-----------------|
| `@imgly/background-removal` | 5 MB bundle + 1–3 s por imagen. Mejor calidad de borde pero overkill para v1 |
| `@tensorflow-models/body-segmentation` | Deprecated (Google sunset). Reemplazado por MediaPipe Tasks |
| `onnxruntime-web + ISNet/BiRefNet` | Muy buen resultado pero 50+ MB de modelo, impráctico en kiosk |
| `background-removal.js` | Wrapper de onnxruntime, mismo problema |

## Referencias

- MediaPipe Selfie Segmentation guide: https://developers.google.com/mediapipe/solutions/vision/image_segmenter
- OffscreenCanvas on MDN: https://developer.mozilla.org/docs/Web/API/OffscreenCanvas
- QRCode.react repo: https://github.com/zpao/qrcode.react
