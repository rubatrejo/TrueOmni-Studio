import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import {
  composePlaceholder,
  extractImageCandidates,
  normalizeWebsiteUrl,
  PLACEHOLDER_HEIGHT,
  PLACEHOLDER_WIDTH,
  resolveLogoBuffer,
  splitNameLines,
} from './placeholder-image';

/**
 * Tests de la generación del Fallback/Placeholder image: helpers puros de
 * parsing (sin red) + composición real con sharp (los 4 caminos: foto/gradiente
 * × logo/nombre). `resolveLogoBuffer` solo se testea en sus caminos sin red
 * (data-URI y paths fs del template).
 */

describe('normalizeWebsiteUrl', () => {
  it('adds https:// when the protocol is missing', () => {
    expect(normalizeWebsiteUrl('discoverdekalb.com')).toBe('https://discoverdekalb.com/');
  });

  it('keeps http(s) URLs as-is', () => {
    expect(normalizeWebsiteUrl('https://www.example.com/visit')).toBe(
      'https://www.example.com/visit',
    );
    expect(normalizeWebsiteUrl('http://example.com')).toBe('http://example.com/');
  });

  it('rejects empty, protocol-less junk and non-http schemes', () => {
    expect(normalizeWebsiteUrl('')).toBeNull();
    expect(normalizeWebsiteUrl('   ')).toBeNull();
    expect(normalizeWebsiteUrl('localhost')).toBeNull();
    expect(normalizeWebsiteUrl('ftp://example.com')).toBeNull();
  });
});

describe('extractImageCandidates', () => {
  const base = 'https://example.com/page';

  it('prioritizes og:image over twitter:image over <img>', () => {
    const html = `
      <html><head>
        <meta name="twitter:image" content="/tw.jpg">
        <meta property="og:image" content="https://cdn.example.com/og.jpg">
      </head><body><img src="/body.jpg"></body></html>`;
    expect(extractImageCandidates(html, base)).toEqual([
      'https://cdn.example.com/og.jpg',
      'https://example.com/tw.jpg',
      'https://example.com/body.jpg',
    ]);
  });

  it('resolves relative URLs against the base and handles swapped attr order', () => {
    const html = `<meta content="../assets/hero.png" property="og:image">`;
    expect(extractImageCandidates(html, 'https://example.com/sub/page')).toEqual([
      'https://example.com/assets/hero.png',
    ]);
  });

  it('skips data:, svg and gif candidates and dedupes', () => {
    const html = `
      <meta property="og:image" content="data:image/png;base64,xxx">
      <img src="/logo.svg"><img src="/anim.gif"><img src="/photo.jpg"><img src="/photo.jpg">`;
    expect(extractImageCandidates(html, base)).toEqual(['https://example.com/photo.jpg']);
  });

  it('picks up lazy-loaded images via data-src', () => {
    const html = `<img data-src="/lazy.jpg" class="lazyload">`;
    expect(extractImageCandidates(html, base)).toEqual(['https://example.com/lazy.jpg']);
  });

  it('returns [] for HTML without images', () => {
    expect(extractImageCandidates('<html><body><p>hi</p></body></html>', base)).toEqual([]);
  });
});

describe('splitNameLines', () => {
  it('keeps short names on a single line', () => {
    expect(splitNameLines('Dekalb')).toEqual(['Dekalb']);
    expect(splitNameLines('Visit Mesa')).toEqual(['Visit Mesa']);
  });

  it('splits long names into two balanced lines at a space', () => {
    expect(splitNameLines('Discover Dekalb Georgia')).toEqual(['Discover', 'Dekalb Georgia']);
    expect(splitNameLines('Greater Palm Springs California')).toEqual([
      'Greater Palm',
      'Springs California',
    ]);
  });

  it('never splits a single long word', () => {
    expect(splitNameLines('Supercalifragilisticexpialidocious')).toEqual([
      'Supercalifragilisticexpialidocious',
    ]);
  });
});

describe('resolveLogoBuffer (sin red)', () => {
  it('decodes base64 data-URIs', async () => {
    const png = await sharp({
      create: { width: 8, height: 8, channels: 3, background: { r: 255, g: 0, b: 0 } },
    })
      .png()
      .toBuffer();
    const dataUri = `data:image/png;base64,${png.toString('base64')}`;
    const out = await resolveLogoBuffer(dataUri);
    expect(out).not.toBeNull();
    expect((await sharp(out!).metadata()).width).toBe(8);
  });

  it('returns null for template fs paths and empty refs', async () => {
    expect(await resolveLogoBuffer('assets/logo.svg')).toBeNull();
    expect(await resolveLogoBuffer('')).toBeNull();
  });
});

describe('composePlaceholder (sharp real)', () => {
  const brand = { brandPrimaryHex: '#004f8b', brandSecondaryHex: '#1796d6' };

  async function makePhoto(): Promise<Buffer> {
    return sharp({
      create: { width: 1600, height: 900, channels: 3, background: { r: 40, g: 90, b: 60 } },
    })
      .jpeg()
      .toBuffer();
  }

  async function makeLogo(): Promise<Buffer> {
    return sharp({
      create: {
        width: 400,
        height: 200,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
  }

  async function expectJpeg1280x720(out: Buffer) {
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe('jpeg');
    expect(meta.width).toBe(PLACEHOLDER_WIDTH);
    expect(meta.height).toBe(PLACEHOLDER_HEIGHT);
  }

  it('photo + logo', async () => {
    const out = await composePlaceholder({
      photo: await makePhoto(),
      logo: await makeLogo(),
      clientName: 'Discover Dekalb',
      ...brand,
    });
    await expectJpeg1280x720(out);
  });

  it('photo + client name (no logo yet)', async () => {
    const out = await composePlaceholder({
      photo: await makePhoto(),
      logo: null,
      clientName: 'Discover Dekalb Georgia & Beyond',
      ...brand,
    });
    await expectJpeg1280x720(out);
  });

  it('brand gradient + logo (no usable photo)', async () => {
    const out = await composePlaceholder({
      photo: null,
      logo: await makeLogo(),
      clientName: 'Dekalb',
      ...brand,
    });
    await expectJpeg1280x720(out);
  });

  it('brand gradient + client name (worst case still yields a valid image)', async () => {
    const out = await composePlaceholder({
      photo: null,
      logo: null,
      clientName: 'Dekalb',
      ...brand,
    });
    await expectJpeg1280x720(out);
  });

  it('degrades a corrupt logo to the client name instead of throwing', async () => {
    const out = await composePlaceholder({
      photo: null,
      logo: Buffer.from('not-an-image'),
      clientName: 'Dekalb',
      ...brand,
    });
    await expectJpeg1280x720(out);
  });
});
