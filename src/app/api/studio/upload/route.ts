import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

/**
 * `POST /api/studio/upload?slug=<slug>&kind=image|video&product=<kiosk|signage>`
 *
 * Sube un archivo a Vercel Blob storage con path determinístico
 * `<product>s/<slug>/<kind>/<timestamp>-<rand>.<ext>` y devuelve la URL pública.
 * Si `product` se omite, default `kiosk` (compat con call sites previos).
 *
 * Pensado para hero/B0 backgrounds del kiosk y para video/image/ads del
 * signage — cualquier asset > ~500KB que no encaja en el cap del KV
 * (950KB total por config). Reemplaza el flow antiguo de `MediaField` que
 * metía data URLs en el config.
 *
 * Auth: el middleware de NextAuth ya protege `/api/studio/*` con
 * allowlist de emails — aquí no hace falta gate adicional.
 *
 * Si no hay `BLOB_READ_WRITE_TOKEN` (típico en dev local sin token),
 * devolvemos 503 con `{ available: false }` para que el cliente haga
 * fallback a data URL inline.
 */

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_IMAGE = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
]);
const ALLOWED_VIDEO = new Set(['video/mp4', 'video/webm']);

const SLUG_PATTERN = /^[a-z0-9-]+$/;

export async function GET() {
  return NextResponse.json({
    available: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    maxBytes: MAX_BYTES,
  });
}

export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        available: false,
        error:
          'Vercel Blob no configurado. Conecta un Blob store al proyecto o establece BLOB_READ_WRITE_TOKEN.',
      },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get('slug') ?? '';
  const kindParam = url.searchParams.get('kind') ?? '';
  const productParam = url.searchParams.get('product') ?? 'kiosk';

  if (!SLUG_PATTERN.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }
  if (kindParam !== 'image' && kindParam !== 'video') {
    return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
  }
  if (productParam !== 'kiosk' && productParam !== 'signage') {
    return NextResponse.json({ error: 'Invalid product' }, { status: 400 });
  }
  const kind = kindParam as 'image' | 'video';
  const product = productParam as 'kiosk' | 'signage';

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing file field' }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'Empty file' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (${file.size}B). Max ${MAX_BYTES}B.` },
      { status: 413 },
    );
  }

  const allowed = kind === 'image' ? ALLOWED_IMAGE : ALLOWED_VIDEO;
  if (!allowed.has(file.type)) {
    return NextResponse.json(
      {
        error: `Unsupported MIME for ${kind}: ${file.type || 'unknown'}.`,
        allowed: Array.from(allowed),
      },
      { status: 415 },
    );
  }

  const ext = mimeToExt(file.type);
  const filename = formData.get('filename');
  const safeName =
    typeof filename === 'string' && filename.length > 0
      ? sanitizeFilename(filename, ext)
      : `${Date.now()}-${randomId()}.${ext}`;

  // `kiosks/<slug>/...` para kiosk (compat); `signage/<slug>/...` para signage.
  const productPrefix = product === 'signage' ? 'signage' : 'kiosks';
  const pathname = `${productPrefix}/${slug}/${kind}/${safeName}`;

  try {
    const blob = await put(pathname, file, {
      access: 'public',
      contentType: file.type,
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType ?? file.type,
      size: file.size,
    });
  } catch (err) {
    console.error('[api/studio/upload]', err);
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/svg+xml':
      return 'svg';
    case 'video/mp4':
      return 'mp4';
    case 'video/webm':
      return 'webm';
    default:
      return 'bin';
  }
}

function sanitizeFilename(name: string, fallbackExt: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const hasExt = /\.[a-z0-9]{2,5}$/i.test(base);
  const stem = (hasExt ? base.replace(/\.[a-z0-9]{2,5}$/i, '') : base).slice(0, 60);
  const ext = hasExt ? base.split('.').pop() : fallbackExt;
  return `${Date.now()}-${randomId()}-${stem || 'asset'}.${ext}`;
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}
