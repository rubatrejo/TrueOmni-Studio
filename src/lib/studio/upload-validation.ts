/**
 * Validación pura (sin Next/Blob) del endpoint `POST /api/studio/upload`.
 * Extraída para poder testearla y para ampliar los MIME aceptados (F-PWA-3:
 * `image/x-icon` para favicons y `application/pdf` para el Digital Brochure).
 */

export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024; // 5MB

export const ALLOWED_IMAGE = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'image/x-icon',
]);
export const ALLOWED_VIDEO = new Set(['video/mp4', 'video/webm']);
export const ALLOWED_DOC = new Set(['application/pdf']);

export type UploadKind = 'image' | 'video' | 'doc';
export type UploadProduct = 'kiosk' | 'signage';

const SLUG_PATTERN = /^[a-z0-9-]+$/;

export type ValidationError = { ok: false; status: number; error: string };
type Ok = { ok: true };

/** MIME set permitido para un `kind`. */
export function allowedMimesFor(kind: UploadKind): Set<string> {
  if (kind === 'image') return ALLOWED_IMAGE;
  if (kind === 'video') return ALLOWED_VIDEO;
  return ALLOWED_DOC;
}

/** Valida slug + kind + product (los query params). */
export function validateUploadParams(params: {
  slug: string;
  kind: string;
  product: string;
}): Ok | ValidationError {
  if (!SLUG_PATTERN.test(params.slug)) {
    return { ok: false, status: 400, error: 'Invalid slug' };
  }
  if (params.kind !== 'image' && params.kind !== 'video' && params.kind !== 'doc') {
    return { ok: false, status: 400, error: 'Invalid kind' };
  }
  if (params.product !== 'kiosk' && params.product !== 'signage') {
    return { ok: false, status: 400, error: 'Invalid product' };
  }
  return { ok: true };
}

/** Valida el file: no vacío, dentro del cap, MIME permitido para el kind. */
export function validateUploadFile(file: {
  kind: UploadKind;
  mime: string;
  size: number;
}): Ok | ValidationError {
  if (file.size === 0) return { ok: false, status: 400, error: 'Empty file' };
  if (file.size > UPLOAD_MAX_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `File too large (${file.size}B). Max ${UPLOAD_MAX_BYTES}B.`,
    };
  }
  const allowed = allowedMimesFor(file.kind);
  if (!allowed.has(file.mime)) {
    return {
      ok: false,
      status: 415,
      error: `Unsupported MIME for ${file.kind}: ${file.mime || 'unknown'}.`,
    };
  }
  return { ok: true };
}

/** Extensión de archivo por MIME. */
export function mimeToExt(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/svg+xml':
      return 'svg';
    case 'image/x-icon':
      return 'ico';
    case 'video/mp4':
      return 'mp4';
    case 'video/webm':
      return 'webm';
    case 'application/pdf':
      return 'pdf';
    default:
      return 'bin';
  }
}
