import { describe, expect, it } from 'vitest';

import {
  UPLOAD_MAX_BYTES,
  allowedMimesFor,
  mimeToExt,
  validateUploadFile,
  validateUploadParams,
} from './upload-validation';

describe('validateUploadParams', () => {
  it('acepta kinds image/video/doc', () => {
    for (const kind of ['image', 'video', 'doc']) {
      expect(validateUploadParams({ slug: 'acme', kind, product: 'kiosk' }).ok).toBe(true);
    }
  });

  it('rechaza kind desconocido', () => {
    const r = validateUploadParams({ slug: 'acme', kind: 'audio', product: 'kiosk' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(400);
  });

  it('rechaza slug inválido y product inválido', () => {
    expect(validateUploadParams({ slug: 'BAD slug', kind: 'image', product: 'kiosk' }).ok).toBe(
      false,
    );
    expect(validateUploadParams({ slug: 'acme', kind: 'image', product: 'tablet' }).ok).toBe(false);
  });
});

describe('validateUploadFile', () => {
  it('acepta image/x-icon (favicons, F-PWA-3)', () => {
    expect(validateUploadFile({ kind: 'image', mime: 'image/x-icon', size: 1024 }).ok).toBe(true);
  });

  it('acepta application/pdf bajo kind=doc (F-PWA-3)', () => {
    expect(validateUploadFile({ kind: 'doc', mime: 'application/pdf', size: 2048 }).ok).toBe(true);
  });

  it('rechaza pdf bajo kind=image', () => {
    const r = validateUploadFile({ kind: 'image', mime: 'application/pdf', size: 2048 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(415);
  });

  it('rechaza MIME no permitido (gif)', () => {
    expect(validateUploadFile({ kind: 'image', mime: 'image/gif', size: 1024 }).ok).toBe(false);
  });

  it('rechaza file vacío y file sobre el cap', () => {
    const empty = validateUploadFile({ kind: 'image', mime: 'image/png', size: 0 });
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.status).toBe(400);

    const tooBig = validateUploadFile({
      kind: 'image',
      mime: 'image/png',
      size: UPLOAD_MAX_BYTES + 1,
    });
    expect(tooBig.ok).toBe(false);
    if (!tooBig.ok) expect(tooBig.status).toBe(413);
  });
});

describe('mimeToExt', () => {
  it('mapea los nuevos MIME (ico, pdf)', () => {
    expect(mimeToExt('image/x-icon')).toBe('ico');
    expect(mimeToExt('application/pdf')).toBe('pdf');
  });

  it('cae a bin para desconocidos', () => {
    expect(mimeToExt('application/zip')).toBe('bin');
  });
});

describe('allowedMimesFor', () => {
  it('doc solo permite pdf', () => {
    expect(allowedMimesFor('doc').has('application/pdf')).toBe(true);
    expect(allowedMimesFor('doc').has('image/png')).toBe(false);
  });
});
