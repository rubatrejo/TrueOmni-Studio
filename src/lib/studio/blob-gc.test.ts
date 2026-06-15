import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { type BlobGcDeps, clientBlobPrefixes, purgeClientBlobs } from './blob-gc';

function fakeDeps(store: Record<string, string[]>): BlobGcDeps & { deleted: string[] } {
  const deleted: string[] = [];
  return {
    deleted,
    async listPrefix(prefix) {
      return store[prefix] ?? [];
    },
    async delUrls(urls) {
      deleted.push(...urls);
    },
  };
}

describe('clientBlobPrefixes', () => {
  it('cubre kiosk y signage del slug', () => {
    expect(clientBlobPrefixes('acme')).toEqual(['kiosks/acme/', 'signage/acme/']);
  });
});

describe('purgeClientBlobs', () => {
  const OLD = process.env.BLOB_READ_WRITE_TOKEN;
  beforeEach(() => {
    process.env.BLOB_READ_WRITE_TOKEN = 'test-token';
  });
  afterEach(() => {
    if (OLD === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = OLD;
  });

  it('sin token no borra nada (skipped)', async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const d = fakeDeps({ 'kiosks/acme/': ['u1'] });
    const res = await purgeClientBlobs('acme', d);
    expect(res).toEqual({ deleted: 0, skipped: true });
    expect(d.deleted).toHaveLength(0);
  });

  it('borra todos los blobs de ambos prefijos', async () => {
    const d = fakeDeps({
      'kiosks/acme/': ['https://b/kiosks/acme/image/a.jpg', 'https://b/kiosks/acme/feed/x.jpg'],
      'signage/acme/': ['https://b/signage/acme/image/s.jpg'],
    });
    const res = await purgeClientBlobs('acme', d);
    expect(res).toEqual({ deleted: 3, skipped: false });
    expect(d.deleted).toHaveLength(3);
  });

  it('cliente sin blobs → 0 borrados, no falla', async () => {
    const d = fakeDeps({});
    const res = await purgeClientBlobs('empty', d);
    expect(res).toEqual({ deleted: 0, skipped: false });
  });

  it('un fallo de borrado no aborta el resto (no-throw)', async () => {
    const d: BlobGcDeps & { deleted: string[] } = {
      deleted: [],
      async listPrefix(prefix) {
        return prefix.startsWith('kiosks/') ? ['k1'] : ['s1'];
      },
      async delUrls(urls) {
        if (urls.includes('k1')) throw new Error('blob down');
        this.deleted.push(...urls);
      },
    };
    const res = await purgeClientBlobs('acme', d);
    // kiosks falló, signage sí borró
    expect(res.deleted).toBe(1);
    expect(d.deleted).toEqual(['s1']);
  });
});
