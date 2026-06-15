import sharp from 'sharp';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  FRAME_HEIGHT,
  FRAME_TEMPLATES,
  FRAME_WIDTH,
  THUMB_SIZE,
  renderFramePng,
  renderFrameThumbnail,
  type FrameTemplateInput,
} from './photobooth-frame-templates';

let fakeLogo: Buffer;
let fakePhoto: Buffer;

beforeAll(async () => {
  fakeLogo = await sharp({
    create: { width: 600, height: 240, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
  })
    .png()
    .toBuffer();
  fakePhoto = await sharp({
    create: {
      width: 1200,
      height: 1600,
      channels: 4,
      background: { r: 0, g: 128, b: 255, alpha: 1 },
    },
  })
    .jpeg()
    .toBuffer();
});

const baseInput = (over: Partial<FrameTemplateInput> = {}): FrameTemplateInput => ({
  primaryHex: '#0a6cff',
  secondaryHex: '#00d4aa',
  tertiaryHex: '#ffb300',
  logoBuffer: fakeLogo,
  clientName: 'Discover Somewhere',
  photoBuffer: fakePhoto,
  text: 'Visit Discover Somewhere',
  ...over,
});

/** Alpha del pixel central (por donde se ve la persona) — debe ser 0. */
async function centerAlpha(png: Buffer): Promise<number> {
  const { data } = await sharp(png)
    .ensureAlpha()
    .extract({ left: FRAME_WIDTH / 2, top: FRAME_HEIGHT / 2, width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data[3]; // canal alpha
}

describe('photobooth-frame-templates', () => {
  it('hay 10 plantillas con ids únicos', () => {
    expect(FRAME_TEMPLATES).toHaveLength(10);
    const ids = new Set(FRAME_TEMPLATES.map((t) => t.id));
    expect(ids.size).toBe(10);
  });

  for (const tpl of FRAME_TEMPLATES) {
    it(`${tpl.id}: PNG 1080×1920 RGBA con centro transparente (con logo + foto)`, async () => {
      const png = await renderFramePng(tpl, baseInput());
      const meta = await sharp(png).metadata();
      expect(meta.format).toBe('png');
      expect(meta.width).toBe(FRAME_WIDTH);
      expect(meta.height).toBe(FRAME_HEIGHT);
      expect(meta.hasAlpha).toBe(true);
      expect(await centerAlpha(png)).toBe(0);
    });

    it(`${tpl.id}: centro transparente también SIN logo (fallback a nombre)`, async () => {
      const png = await renderFramePng(tpl, baseInput({ logoBuffer: null }));
      expect(await centerAlpha(png)).toBe(0);
      expect((await sharp(png).metadata()).width).toBe(FRAME_WIDTH);
    });

    it(`${tpl.id}: renderiza SIN foto (degrada) y mantiene centro transparente`, async () => {
      const png = await renderFramePng(tpl, baseInput({ photoBuffer: null }));
      expect(await centerAlpha(png)).toBe(0);
    });
  }

  it('Border Tab imprime el texto CENTRADO', () => {
    const tpl = FRAME_TEMPLATES.find((t) => t.id === 'branded-solid-border-tab')!;
    const svg = tpl.buildSvg({
      primaryHex: '#0a6cff',
      secondaryHex: '#00d4aa',
      tertiaryHex: '#ffb300',
      clientName: 'Discover Somewhere',
      logoDataUri: null,
      photoDataUri: null,
      text: 'Visit Discover Somewhere',
      taglineFontFamily: 'Helvetica, Arial, sans-serif',
    });
    expect(svg).toContain('text-anchor="middle"');
    expect(svg).toContain('Somewhere');
  });

  it('Diagonal imprime el texto alineado a la IZQUIERDA', () => {
    const tpl = FRAME_TEMPLATES.find((t) => t.id === 'branded-diagonal-corners')!;
    const svg = tpl.buildSvg({
      primaryHex: '#0a6cff',
      secondaryHex: '#00d4aa',
      tertiaryHex: '#ffb300',
      clientName: 'Discover Somewhere',
      logoDataUri: null,
      photoDataUri: null,
      text: 'Closer cooler',
      taglineFontFamily: 'Helvetica, Arial, sans-serif',
    });
    expect(svg).toContain('text-anchor="start"');
    expect(svg).toContain('Closer cooler');
  });

  it('el texto usa la sans del sistema y NO embebe @font-face (evita el tofu de librsvg)', () => {
    const tpl = FRAME_TEMPLATES.find((t) => t.id === 'branded-solid-border-tab')!;
    const svg = tpl.buildSvg({
      primaryHex: '#0a6cff',
      secondaryHex: '#00d4aa',
      tertiaryHex: '#ffb300',
      clientName: 'Discover Somewhere',
      logoDataUri: null,
      photoDataUri: null,
      text: 'Visit Discover Somewhere',
      taglineFontFamily: 'Helvetica, Arial, sans-serif',
    });
    expect(svg).toContain('Helvetica, Arial, sans-serif');
    expect(svg).not.toContain('@font-face');
    expect(svg).not.toContain('data:font');
  });

  it('renderFrameThumbnail devuelve PNG 256×256', async () => {
    const png = await renderFramePng(FRAME_TEMPLATES[0], baseInput());
    const thumb = await renderFrameThumbnail(png, {
      primaryHex: '#0a6cff',
      secondaryHex: '#00d4aa',
    });
    const meta = await sharp(thumb).metadata();
    expect(meta.format).toBe('png');
    expect(meta.width).toBe(THUMB_SIZE);
    expect(meta.height).toBe(THUMB_SIZE);
  });
});
