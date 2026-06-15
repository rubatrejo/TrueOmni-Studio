import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  blobPathnameFor,
  extFor,
  materializeFeedImages,
  materializeOne,
  shouldMaterialize,
  type MaterializeDeps,
} from './materialize-images';

const EXT = 'https://cdn.provider.example.com/photos/abc.jpg';
const BLOB = 'https://store123.public.blob.vercel-storage.com/kiosks/x/feed/h.jpg';

/** Deps fake: registran llamadas y no tocan red ni Blob. */
function fakeDeps(over: Partial<MaterializeDeps> = {}): MaterializeDeps & {
  fetches: string[];
  puts: string[];
  heads: string[];
} {
  const fetches: string[] = [];
  const puts: string[] = [];
  const heads: string[] = [];
  return {
    fetches,
    puts,
    heads,
    async headBlob(p) {
      heads.push(p);
      return null;
    },
    async fetchImage(url) {
      fetches.push(url);
      return { buffer: Buffer.from('img-bytes'), contentType: 'image/jpeg' };
    },
    async putBlob(p) {
      puts.push(p);
      return `https://store123.public.blob.vercel-storage.com/${p}`;
    },
    ...over,
  };
}

describe('shouldMaterialize', () => {
  it('acepta http(s) externas', () => {
    expect(shouldMaterialize(EXT)).toBe(true);
    expect(shouldMaterialize('http://x.com/a.png')).toBe(true);
  });
  it('rechaza vacías, relativas, data: y blobs de Vercel', () => {
    expect(shouldMaterialize('')).toBe(false);
    expect(shouldMaterialize(undefined)).toBe(false);
    expect(shouldMaterialize('/assets/a.jpg')).toBe(false);
    expect(shouldMaterialize('assets/a.jpg')).toBe(false);
    expect(shouldMaterialize('data:image/png;base64,AAAA')).toBe(false);
    expect(shouldMaterialize(BLOB)).toBe(false);
  });
});

describe('extFor', () => {
  it('deriva del content-type', () => {
    expect(extFor('image/png', EXT)).toBe('png');
    expect(extFor('image/webp; charset=binary', 'https://x/y')).toBe('webp');
    expect(extFor('image/jpeg', 'https://x/y')).toBe('jpg');
  });
  it('cae a la extensión de la URL y luego a jpg', () => {
    expect(extFor(null, 'https://x/y.png?q=1')).toBe('png');
    expect(extFor(null, 'https://x/y')).toBe('jpg');
    expect(extFor('text/html', 'https://x/y')).toBe('jpg');
  });
});

describe('blobPathnameFor', () => {
  it('es determinista por URL + slug', () => {
    const a = blobPathnameFor('acme', EXT, 'image/jpeg');
    const b = blobPathnameFor('acme', EXT, 'image/jpeg');
    expect(a).toBe(b);
    expect(a).toMatch(/^kiosks\/acme\/feed\/[0-9a-f]{32}\.jpg$/);
  });
  it('difiere por URL distinta', () => {
    expect(blobPathnameFor('acme', EXT, 'image/jpeg')).not.toBe(
      blobPathnameFor('acme', 'https://cdn/other.jpg', 'image/jpeg'),
    );
  });
});

describe('materializeOne', () => {
  it('descarga y sube una URL externa nueva', async () => {
    const d = fakeDeps();
    const out = await materializeOne('acme', EXT, d);
    expect(d.fetches).toEqual([EXT]);
    expect(d.puts).toHaveLength(1);
    expect(out).toContain('.public.blob.vercel-storage.com/');
  });

  it('reusa el blob existente sin re-subir (head hit)', async () => {
    const d = fakeDeps({
      async headBlob() {
        return BLOB;
      },
    });
    const out = await materializeOne('acme', EXT, d);
    expect(out).toBe(BLOB);
    expect(d.puts).toHaveLength(0); // no re-sube
  });

  it('conserva la URL original si la descarga falla', async () => {
    const d = fakeDeps({
      async fetchImage() {
        return null;
      },
    });
    const out = await materializeOne('acme', EXT, d);
    expect(out).toBe(EXT);
    expect(d.puts).toHaveLength(0);
  });

  it('conserva la URL original si el put falla', async () => {
    const d = fakeDeps({
      async putBlob() {
        throw new Error('blob down');
      },
    });
    const out = await materializeOne('acme', EXT, d);
    expect(out).toBe(EXT);
  });

  it('no toca URLs que no aplican', async () => {
    const d = fakeDeps();
    expect(await materializeOne('acme', BLOB, d)).toBe(BLOB);
    expect(await materializeOne('acme', '/assets/a.jpg', d)).toBe('/assets/a.jpg');
    expect(d.fetches).toHaveLength(0);
  });
});

describe('materializeFeedImages', () => {
  const OLD = process.env.BLOB_READ_WRITE_TOKEN;
  beforeEach(() => {
    process.env.BLOB_READ_WRITE_TOKEN = 'test-token';
  });
  afterEach(() => {
    if (OLD === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = OLD;
  });

  it('sin token devuelve los items intactos', async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const d = fakeDeps();
    const items = [{ feedData: { image: EXT } }];
    const out = await materializeFeedImages('acme', items, d);
    expect(out).toBe(items); // misma referencia, sin trabajo
    expect(d.fetches).toHaveLength(0);
  });

  it('reemplaza feedData.image por la URL del blob', async () => {
    const d = fakeDeps();
    const items = [{ id: '1', feedData: { image: EXT }, override: {} }];
    const out = await materializeFeedImages('acme', items, d);
    expect(out[0].feedData.image).toContain('.public.blob.vercel-storage.com/');
    expect(out[0]).not.toBe(items[0]); // no muta la entrada
    expect(items[0].feedData.image).toBe(EXT);
  });

  it('deduplica: la misma URL en varios items se descarga una vez', async () => {
    const d = fakeDeps();
    const items = [
      { feedData: { image: EXT } },
      { feedData: { image: EXT } },
      { feedData: { image: 'https://cdn/other.png' } },
    ];
    await materializeFeedImages('acme', items, d);
    expect(d.fetches.sort()).toEqual(['https://cdn/other.png', EXT].sort());
  });

  it('deja intactos los items sin imagen materializable', async () => {
    const d = fakeDeps();
    const items = [
      { feedData: {} },
      { feedData: { image: '/assets/local.jpg' } },
      { feedData: { image: BLOB } },
    ];
    const out = await materializeFeedImages('acme', items, d);
    expect(out[0]).toBe(items[0]);
    expect(out[1]).toBe(items[1]);
    expect(out[2]).toBe(items[2]);
    expect(d.fetches).toHaveLength(0);
  });
});
