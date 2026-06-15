import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  type DataUriDeps,
  materializeConfigDataUris,
  parseDataUri,
  shouldMaterializeDataUri,
} from './materialize-data-uris';

// data: URI grande (>20KB) = cabecera + payload base64 relleno.
const BIG_PAYLOAD = 'A'.repeat(30_000);
const BIG_URI = `data:image/png;base64,${BIG_PAYLOAD}`;
const SMALL_URI = 'data:image/png;base64,AAAABBBB';
const BLOB = 'https://store.public.blob.vercel-storage.com/kiosks/x/inline/h.png';

function fakeDeps(over: Partial<DataUriDeps> = {}): DataUriDeps & { puts: string[] } {
  const puts: string[] = [];
  return {
    puts,
    async headBlob() {
      return null;
    },
    async putBlob(pathname) {
      puts.push(pathname);
      return `https://store.public.blob.vercel-storage.com/${pathname}`;
    },
    ...over,
  };
}

describe('parseDataUri', () => {
  it('decodifica base64', () => {
    const r = parseDataUri('data:image/png;base64,aGVsbG8=');
    expect(r?.mime).toBe('image/png');
    expect(r?.buffer.toString('utf8')).toBe('hello');
  });
  it('rechaza basura', () => {
    expect(parseDataUri('https://x/y.png')).toBeNull();
    expect(parseDataUri('data:image/png;base64,')).toBeNull();
  });
});

describe('shouldMaterializeDataUri', () => {
  it('solo data: grandes', () => {
    expect(shouldMaterializeDataUri(BIG_URI)).toBe(true);
    expect(shouldMaterializeDataUri(SMALL_URI)).toBe(false);
    expect(shouldMaterializeDataUri('https://x/y.png')).toBe(false);
    expect(shouldMaterializeDataUri(undefined)).toBe(false);
  });
});

describe('materializeConfigDataUris', () => {
  const OLD = process.env.BLOB_READ_WRITE_TOKEN;
  beforeEach(() => {
    process.env.BLOB_READ_WRITE_TOKEN = 'test-token';
  });
  afterEach(() => {
    if (OLD === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = OLD;
  });

  it('sin token no cambia nada', async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const cfg = { branding: { logo: BIG_URI } };
    const r = await materializeConfigDataUris('acme', cfg, fakeDeps());
    expect(r.changed).toBe(false);
    expect(r.config).toBe(cfg);
  });

  it('materializa data: grandes anidados y deja los chicos', async () => {
    const d = fakeDeps();
    const cfg = {
      branding: { logo: BIG_URI, favicon: SMALL_URI },
      billboard: { b0: { background: { src: BIG_URI } } },
      nombre: 'Acme',
    };
    const r = await materializeConfigDataUris('acme', cfg, d);
    expect(r.changed).toBe(true);
    // mismo data: en 2 sitios → se sube una sola vez (dedup), 1 put
    expect(d.puts).toHaveLength(1);
    expect(r.config.branding.logo).toContain('.public.blob.vercel-storage.com/');
    expect(r.config.billboard.b0.background.src).toContain('.public.blob.vercel-storage.com/');
    expect(r.config.branding.favicon).toBe(SMALL_URI); // chico intacto
    expect(r.config.nombre).toBe('Acme');
  });

  it('reusa blob existente sin re-subir', async () => {
    const d = fakeDeps({
      async headBlob() {
        return BLOB;
      },
    });
    const cfg = { branding: { logo: BIG_URI } };
    const r = await materializeConfigDataUris('acme', cfg, d);
    expect(r.config.branding.logo).toBe(BLOB);
    expect(d.puts).toHaveLength(0);
  });

  it('config sin data: grandes → changed false, misma referencia', async () => {
    const d = fakeDeps();
    const cfg = { branding: { logo: 'https://cdn/x.png', favicon: SMALL_URI } };
    const r = await materializeConfigDataUris('acme', cfg, d);
    expect(r.changed).toBe(false);
    expect(r.config).toBe(cfg);
  });

  it('conserva el data: si el put falla (best-effort)', async () => {
    const d = fakeDeps({
      async putBlob() {
        throw new Error('blob down');
      },
    });
    const cfg = { branding: { logo: BIG_URI } };
    const r = await materializeConfigDataUris('acme', cfg, d);
    expect(r.changed).toBe(false);
    expect(r.config.branding.logo).toBe(BIG_URI);
  });
});
