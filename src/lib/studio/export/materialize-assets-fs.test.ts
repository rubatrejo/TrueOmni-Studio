import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createFsDeps } from './materialize-assets-fs';

function tmp(prefix: string) {
  return mkdtempSync(join(tmpdir(), prefix));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createFsDeps.decodeDataUri', () => {
  it('decodifica un data: base64 a buffer + ext del mime', () => {
    const deps = createFsDeps({
      clientAssetsDir: '/x',
      defaultAssetsDir: '/y',
      destClientDir: '/z',
    });
    const png = Buffer.from('hello').toString('base64');
    const out = deps.decodeDataUri(`data:image/png;base64,${png}`);
    expect(out).not.toBeNull();
    expect(out!.ext).toBe('png');
    expect(out!.buffer.toString()).toBe('hello');
  });

  it('devuelve null para un data: inválido', () => {
    const deps = createFsDeps({
      clientAssetsDir: '/x',
      defaultAssetsDir: '/y',
      destClientDir: '/z',
    });
    expect(deps.decodeDataUri('data:nonsense')).toBeNull();
  });
});

describe('createFsDeps.readTemplateAsset', () => {
  it('lee del dir del cliente; si no existe, cae al default', async () => {
    const client = tmp('cli-');
    const def = tmp('def-');
    writeFileSync(join(def, 'logo.png'), 'defaultlogo');
    const deps = createFsDeps({
      clientAssetsDir: client,
      defaultAssetsDir: def,
      destClientDir: '/z',
    });
    const out = await deps.readTemplateAsset('assets/logo.png');
    expect(out).not.toBeNull();
    expect(out!.buffer.toString()).toBe('defaultlogo');
    expect(out!.ext).toBe('png');
  });

  it('prefiere el dir del cliente sobre el default', async () => {
    const client = tmp('cli-');
    const def = tmp('def-');
    writeFileSync(join(client, 'logo.svg'), 'clientlogo');
    writeFileSync(join(def, 'logo.svg'), 'defaultlogo');
    const deps = createFsDeps({
      clientAssetsDir: client,
      defaultAssetsDir: def,
      destClientDir: '/z',
    });
    const out = await deps.readTemplateAsset('assets/logo.svg');
    expect(out!.buffer.toString()).toBe('clientlogo');
  });

  it('devuelve null si no existe en ninguno', async () => {
    const deps = createFsDeps({
      clientAssetsDir: tmp('cli-'),
      defaultAssetsDir: tmp('def-'),
      destClientDir: '/z',
    });
    expect(await deps.readTemplateAsset('assets/missing.png')).toBeNull();
  });
});

describe('createFsDeps.writeAsset', () => {
  it('escribe el archivo creando subdirectorios', async () => {
    const dest = tmp('dest-');
    const deps = createFsDeps({
      clientAssetsDir: '/x',
      defaultAssetsDir: '/y',
      destClientDir: dest,
    });
    await deps.writeAsset('assets/feed/ab12.jpg', Buffer.from('img'));
    const written = join(dest, 'assets/feed/ab12.jpg');
    expect(existsSync(written)).toBe(true);
    expect(readFileSync(written).toString()).toBe('img');
  });
});

describe('createFsDeps.fetchUrl', () => {
  it('descarga una imagen y deriva el ext del content-type', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(Buffer.from('jpegbytes'), {
          status: 200,
          headers: { 'content-type': 'image/jpeg' },
        }),
    );
    const deps = createFsDeps({
      clientAssetsDir: '/x',
      defaultAssetsDir: '/y',
      destClientDir: '/z',
    });
    const out = await deps.fetchUrl('https://cdn/x.jpg');
    expect(out).not.toBeNull();
    expect(out!.ext).toBe('jpg');
    expect(out!.buffer.toString()).toBe('jpegbytes');
  });

  it('devuelve null si el content-type no es imagen', async () => {
    vi.stubGlobal(
      'fetch',
      async () => new Response('<html>', { status: 200, headers: { 'content-type': 'text/html' } }),
    );
    const deps = createFsDeps({
      clientAssetsDir: '/x',
      defaultAssetsDir: '/y',
      destClientDir: '/z',
    });
    expect(await deps.fetchUrl('https://example.com/page')).toBeNull();
  });

  it('devuelve null en un status no-ok', async () => {
    vi.stubGlobal('fetch', async () => new Response('', { status: 404 }));
    const deps = createFsDeps({
      clientAssetsDir: '/x',
      defaultAssetsDir: '/y',
      destClientDir: '/z',
    });
    expect(await deps.fetchUrl('https://cdn/broken.jpg')).toBeNull();
  });
});
