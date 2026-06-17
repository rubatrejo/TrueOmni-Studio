import { describe, expect, it } from 'vitest';

import {
  canonicalAssetPath,
  materializeAssets,
  type MaterializeAssetsDeps,
} from './materialize-assets';
import { collectImageRefs, rewriteImageRefs } from './rewrite-config-assets';

describe('canonicalAssetPath (#7 — toda carpeta capitalizada)', () => {
  it('capitaliza carpetas code-driven en minúscula', () => {
    expect(canonicalAssetPath('assets/home/header-bg.jpg')).toBe(
      'assets/Home Dashboard/header-bg.jpg',
    );
    expect(canonicalAssetPath('assets/ai/trigger.svg')).toBe('assets/AI/trigger.svg');
    expect(canonicalAssetPath('assets/photo-booth/frames/x.png')).toBe(
      'assets/Photo Booth/frames/x.png',
    );
    expect(canonicalAssetPath('assets/feed/Eat/x.jpg')).toBe('assets/Feed/Eat/x.jpg');
    expect(canonicalAssetPath('assets/pwa/welcome.jpg')).toBe('assets/PWA/welcome.jpg');
  });
  it('cualquier billboard-N → Billboard', () => {
    expect(canonicalAssetPath('assets/billboard-0/hero.jpg')).toBe('assets/Billboard/hero.jpg');
    expect(canonicalAssetPath('assets/billboard-3/x.png')).toBe('assets/Billboard/x.png');
  });
  it('idempotente: carpetas ya capitalizadas y archivos en raíz no cambian', () => {
    expect(canonicalAssetPath('assets/Social Wall/x.jpg')).toBe('assets/Social Wall/x.jpg');
    expect(canonicalAssetPath('assets/logo.svg')).toBe('assets/logo.svg');
  });
});

/** Deps mockeadas (sin red/fs): registran las escrituras y devuelven buffers fijos. */
function makeDeps(over: Partial<MaterializeAssetsDeps> = {}) {
  const writes: Array<{ rel: string; bytes: number }> = [];
  const deps: MaterializeAssetsDeps = {
    async fetchUrl() {
      return { buffer: Buffer.from('downloaded'), ext: 'jpg' };
    },
    async readTemplateAsset() {
      return { buffer: Buffer.from('template'), ext: 'png' };
    },
    decodeDataUri() {
      return { buffer: Buffer.from('inline'), ext: 'png' };
    },
    async writeAsset(rel, buffer) {
      writes.push({ rel, bytes: buffer.byteLength });
    },
    ...over,
  };
  return { deps, writes };
}

describe('materializeAssets', () => {
  it('descarga una URL http sin contexto a assets/Home Dashboard/<hash>.<ext>', async () => {
    const { deps, writes } = makeDeps();
    const { map, report } = await materializeAssets(['https://cdn/x.jpg'], deps);
    const local = map.get('https://cdn/x.jpg');
    expect(local).toMatch(/^assets\/Home Dashboard\/[a-f0-9]{8,}\.jpg$/);
    expect(writes).toHaveLength(1);
    expect(writes[0].rel).toBe(local);
    expect(report.downloaded).toBe(1);
  });

  it('context-aware: enruta una imagen con target a su carpeta semántica', async () => {
    const { deps, writes } = makeDeps();
    const { map } = await materializeAssets(
      [
        {
          ref: 'https://cdn/x.jpg',
          target: { dir: 'assets/feed/Restaurants', base: 'Acme-Restaurants-Italian-Marios' },
        },
      ],
      deps,
    );
    expect(map.get('https://cdn/x.jpg')).toBe(
      'assets/Feed/Restaurants/Acme-Restaurants-Italian-Marios.jpg',
    );
    expect(writes[0].rel).toBe('assets/Feed/Restaurants/Acme-Restaurants-Italian-Marios.jpg');
  });

  it('context-aware: colisión de mismo target → sufijo -2', async () => {
    const { deps } = makeDeps();
    const { map } = await materializeAssets(
      [
        {
          ref: 'https://cdn/a.jpg',
          target: { dir: 'assets/photo-booth/backgrounds', base: 'Acme-bg' },
        },
        {
          ref: 'https://cdn/b.jpg',
          target: { dir: 'assets/photo-booth/backgrounds', base: 'Acme-bg' },
        },
      ],
      deps,
    );
    const paths = [map.get('https://cdn/a.jpg'), map.get('https://cdn/b.jpg')].sort();
    expect(paths).toEqual([
      'assets/Photo Booth/backgrounds/Acme-bg-2.jpg',
      'assets/Photo Booth/backgrounds/Acme-bg.jpg',
    ]);
  });

  it('copia un asset relativo assets/... al mismo path', async () => {
    const { deps, writes } = makeDeps();
    const { map, report } = await materializeAssets(['assets/logo.png'], deps);
    expect(map.get('assets/logo.png')).toBe('assets/logo.png');
    expect(writes[0].rel).toBe('assets/logo.png');
    expect(report.copied).toBe(1);
  });

  it('relative-rename: assets/home/... → assets/Home Dashboard/... (#3)', async () => {
    const { deps, writes } = makeDeps();
    const { map } = await materializeAssets(['/assets/home/tiles/restaurants.jpg'], deps);
    expect(map.get('/assets/home/tiles/restaurants.jpg')).toBe(
      'assets/Home Dashboard/tiles/restaurants.jpg',
    );
    // se LEE del path original pero se ESCRIBE al renombrado
    expect(writes[0].rel).toBe('assets/Home Dashboard/tiles/restaurants.jpg');
  });

  it('font: kind=font usa fetchFont y va a assets/Branding/fonts (#7)', async () => {
    const { deps, writes } = makeDeps({
      async fetchFont() {
        return { buffer: Buffer.from('font'), ext: 'ttf' };
      },
    });
    const { map, report } = await materializeAssets(
      [{ ref: 'Poppins', kind: 'font', target: { dir: 'assets/branding/fonts', base: 'Poppins' } }],
      deps,
    );
    expect(map.get('Poppins')).toBe('assets/Branding/fonts/Poppins.ttf');
    expect(writes[0].rel).toBe('assets/Branding/fonts/Poppins.ttf');
    expect(report.downloaded).toBe(1);
  });

  it('font: sin fetchFont → skipped (best-effort)', async () => {
    const { deps } = makeDeps();
    const { map, report } = await materializeAssets([{ ref: 'Poppins', kind: 'font' }], deps);
    expect(map.has('Poppins')).toBe(false);
    expect(report.skipped).toBe(1);
  });

  it('normaliza /assets/... a assets/...', async () => {
    const { deps } = makeDeps();
    const { map } = await materializeAssets(['/assets/logo.png'], deps);
    expect(map.get('/assets/logo.png')).toBe('assets/logo.png');
  });

  it('decodifica un data: a assets/Inline/<hash>.<ext>', async () => {
    const { deps } = makeDeps();
    const { map, report } = await materializeAssets(['data:image/png;base64,AAAA'], deps);
    expect(map.get('data:image/png;base64,AAAA')).toMatch(/^assets\/Inline\/[a-f0-9]{8,}\.png$/);
    expect(report.inlined).toBe(1);
  });

  it('best-effort: si la descarga falla (null), NO mapea y registra el fallo', async () => {
    const { deps } = makeDeps({
      async fetchUrl() {
        return null;
      },
    });
    const { map, report } = await materializeAssets(['https://cdn/broken.jpg'], deps);
    expect(map.has('https://cdn/broken.jpg')).toBe(false);
    expect(report.failed).toEqual(['https://cdn/broken.jpg']);
    expect(report.downloaded).toBe(0);
  });

  it('best-effort: si writeAsset lanza, registra el fallo sin abortar', async () => {
    const { deps } = makeDeps({
      async writeAsset() {
        throw new Error('disk full');
      },
    });
    const { map, report } = await materializeAssets(['https://cdn/x.jpg', 'assets/ok.png'], deps);
    expect(map.size).toBe(0);
    expect(report.failed.sort()).toEqual(['assets/ok.png', 'https://cdn/x.jpg']);
  });

  it('cuenta downloaded/copied/inlined en el report', async () => {
    const { deps } = makeDeps();
    const { report } = await materializeAssets(
      ['https://cdn/a.jpg', 'assets/b.png', 'data:image/png;base64,CCCC'],
      deps,
    );
    expect(report).toMatchObject({ downloaded: 1, copied: 1, inlined: 1, failed: [] });
  });

  it('deduplica refs repetidos (una sola descarga)', async () => {
    let calls = 0;
    const { deps } = makeDeps({
      async fetchUrl() {
        calls++;
        return { buffer: Buffer.from('x'), ext: 'jpg' };
      },
    });
    await materializeAssets(['https://cdn/x.jpg', 'https://cdn/x.jpg'], deps);
    expect(calls).toBe(1);
  });

  it('determinista: la misma URL produce el mismo path local', async () => {
    const { deps } = makeDeps();
    const r1 = await materializeAssets(['https://cdn/x.jpg'], deps);
    const r2 = await materializeAssets(['https://cdn/x.jpg'], deps);
    expect(r1.map.get('https://cdn/x.jpg')).toBe(r2.map.get('https://cdn/x.jpg'));
  });
});

describe('integración Fase 1 + Fase 2', () => {
  it('collect → materialize → rewrite produce config con paths locales y links intactos', async () => {
    const cfg = {
      heroImage: 'https://cdn/hero.jpg',
      branding: { logo: 'assets/logo.svg' },
      website: 'https://example.com',
    };
    const { deps } = makeDeps();
    const { map } = await materializeAssets(collectImageRefs(cfg), deps);
    const localized = rewriteImageRefs(cfg, map);
    // collectImageRefs (legacy, sin contexto) → fallback Home Dashboard.
    expect(localized.heroImage).toMatch(/^assets\/(feed|Home Dashboard)\//);
    expect(localized.branding.logo).toBe('assets/logo.svg');
    expect(localized.website).toBe('https://example.com');
  });
});
