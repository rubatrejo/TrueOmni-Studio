import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  collectImageRefs,
  collectImages,
  IMAGE_FIELDS,
  rewriteImageRefs,
} from './rewrite-config-assets';

const LINK_FIELDS = [
  'website',
  'ticketsUrl',
  'threshold360Url',
  'directionsUrl',
  'qrUrl',
  'purchaseUrl',
  'reserveUrl',
  'bandwangoUrl',
  'diningGuideUrl',
  'shareUrlTemplate',
];

describe('collectImageRefs', () => {
  it('recolecta campos de imagen directos (logo http, idleLogo relativo, heroImage)', () => {
    const cfg = {
      branding: { logo: 'https://blob/logo.png', idleLogo: 'assets/idle.svg' },
      heroImage: 'https://cdn/hero.jpg',
    };
    expect(collectImageRefs(cfg).sort()).toEqual(
      ['assets/idle.svg', 'https://blob/logo.png', 'https://cdn/hero.jpg'].sort(),
    );
  });

  it('NO recolecta campos de link (website, ticketsUrl, threshold360Url, directionsUrl)', () => {
    const cfg = {
      website: 'https://example.com',
      ticketsUrl: 'https://tix.com/x',
      threshold360Url: 'https://360.com/t',
      directionsUrl: 'https://maps.google.com/x',
      qrUrl: 'https://qr.com/x',
    };
    expect(collectImageRefs(cfg)).toEqual([]);
  });

  it('recolecta image dentro de arrays anidados (modules.events[].image)', () => {
    const cfg = {
      modules: { events: [{ image: 'https://cdn/e1.jpg' }, { image: 'https://cdn/e2.jpg' }] },
    };
    expect(collectImageRefs(cfg).sort()).toEqual(
      ['https://cdn/e1.jpg', 'https://cdn/e2.jpg'].sort(),
    );
  });

  it('recolecta galleryUrls[] (array de strings en campo de imagen)', () => {
    const cfg = { galleryUrls: ['https://cdn/g1.jpg', 'https://cdn/g2.jpg'] };
    expect(collectImageRefs(cfg).sort()).toEqual(
      ['https://cdn/g1.jpg', 'https://cdn/g2.jpg'].sort(),
    );
  });

  it('recolecta subcategoryImages{} (objeto de strings en campo de imagen)', () => {
    const cfg = { subcategoryImages: { mexican: 'https://cdn/m.jpg', italian: 'assets/it.jpg' } };
    expect(collectImageRefs(cfg).sort()).toEqual(['assets/it.jpg', 'https://cdn/m.jpg'].sort());
  });

  it('deduplica la misma URL en varios campos', () => {
    const cfg = { image: 'https://cdn/same.jpg', cover: 'https://cdn/same.jpg' };
    expect(collectImageRefs(cfg)).toEqual(['https://cdn/same.jpg']);
  });

  it('ignora valores que no son assets (vacío, gradiente, token CSS)', () => {
    const cfg = {
      image: '',
      background: 'linear-gradient(0deg, #000, #fff)',
      logo: 'hsl(var(--x))',
    };
    expect(collectImageRefs(cfg)).toEqual([]);
  });

  it('recolecta data: URIs en campos de imagen', () => {
    const cfg = { avatar: 'data:image/png;base64,AAAA' };
    expect(collectImageRefs(cfg)).toEqual(['data:image/png;base64,AAAA']);
  });

  it('IMAGE_FIELDS incluye los campos clave y excluye los de link', () => {
    expect(IMAGE_FIELDS.has('image')).toBe(true);
    expect(IMAGE_FIELDS.has('heroImage')).toBe(true);
    expect(IMAGE_FIELDS.has('galleryUrls')).toBe(true);
    expect(IMAGE_FIELDS.has('website')).toBe(false);
    expect(IMAGE_FIELDS.has('ticketsUrl')).toBe(false);
    expect(IMAGE_FIELDS.has('threshold360Url')).toBe(false);
  });
});

describe('rewriteImageRefs', () => {
  it('reemplaza refs según el map, deja links y no-mapeados intactos', () => {
    const cfg = {
      heroImage: 'https://cdn/hero.jpg',
      website: 'https://example.com',
      cover: 'https://cdn/unmapped.jpg',
    };
    const map = new Map([['https://cdn/hero.jpg', 'assets/feed/abc.jpg']]);
    expect(rewriteImageRefs(cfg, map)).toEqual({
      heroImage: 'assets/feed/abc.jpg',
      website: 'https://example.com',
      cover: 'https://cdn/unmapped.jpg',
    });
  });

  it('solo reescribe en campos de imagen, no en un link con la misma URL', () => {
    const cfg = { image: 'https://cdn/x.jpg', website: 'https://cdn/x.jpg' };
    const map = new Map([['https://cdn/x.jpg', 'assets/feed/x.jpg']]);
    expect(rewriteImageRefs(cfg, map)).toEqual({
      image: 'assets/feed/x.jpg',
      website: 'https://cdn/x.jpg',
    });
  });

  it('no muta el config original', () => {
    const cfg = { image: 'https://cdn/a.jpg' };
    const map = new Map([['https://cdn/a.jpg', 'assets/feed/a.jpg']]);
    const out = rewriteImageRefs(cfg, map);
    expect(cfg.image).toBe('https://cdn/a.jpg');
    expect(out.image).toBe('assets/feed/a.jpg');
  });

  it('reescribe dentro de arrays y galleryUrls', () => {
    const cfg = { galleryUrls: ['https://cdn/g1.jpg', 'https://cdn/g2.jpg'] };
    const map = new Map([['https://cdn/g1.jpg', 'assets/feed/g1.jpg']]);
    expect(rewriteImageRefs(cfg, map)).toEqual({
      galleryUrls: ['assets/feed/g1.jpg', 'https://cdn/g2.jpg'],
    });
  });
});

describe('integración contra el config real (clients/default/config.json)', () => {
  const raw = readFileSync(join(process.cwd(), 'clients/default/config.json'), 'utf8');
  const cfg = JSON.parse(raw) as unknown;

  it('recolecta cientos de imágenes', () => {
    // `image` solo ya son ~494 URLs http en el config default.
    expect(collectImageRefs(cfg).length).toBeGreaterThan(400);
  });

  it('NO filtra ninguna URL de campo de link (website, ticketsUrl, threshold360Url…)', () => {
    const refs = new Set(collectImageRefs(cfg));
    const linkUrls: string[] = [];
    const walk = (v: unknown, key: string) => {
      if (typeof v === 'string') {
        if (LINK_FIELDS.includes(key) && /^https?:\/\//i.test(v)) linkUrls.push(v);
      } else if (Array.isArray(v)) {
        v.forEach((x) => walk(x, key));
      } else if (v && typeof v === 'object') {
        for (const [k, val] of Object.entries(v)) walk(val, k);
      }
    };
    walk(cfg, '');
    // sanity: el config TIENE muchos links (si no, el test no probaría nada).
    expect(linkUrls.length).toBeGreaterThan(100);
    // ninguna URL de link debe haberse recolectado como imagen.
    expect(linkUrls.filter((u) => refs.has(u))).toEqual([]);
  });
});

describe('collectImages (context-aware naming)', () => {
  const byRef = (imgs: { ref: string; target?: { dir: string; base: string } }[]) =>
    Object.fromEntries(imgs.map((i) => [i.ref, i.target]));

  it('imágenes de un listing → feed/<Category>/<Client>-<Category>-<Subcat>-<Name>', () => {
    const cfg = {
      features: {
        home: {
          restaurants: {
            listings: [
              {
                category: 'Restaurants',
                subcategory: 'Italian',
                title: "Mario's Pizza",
                image: 'https://cdn/mario.jpg',
                galleryUrls: ['https://cdn/g1.jpg', 'https://cdn/g2.jpg'],
              },
            ],
          },
        },
      },
    };
    const t = byRef(collectImages(cfg, { clientName: 'Hello Harford' }));
    expect(t['https://cdn/mario.jpg']).toEqual({
      dir: 'assets/feed/Restaurants',
      base: 'Hello_Harford-Restaurants-Italian-Marios_Pizza',
    });
    expect(t['https://cdn/g1.jpg']?.base).toBe('Hello_Harford-Restaurants-Italian-Marios_Pizza-1');
    expect(t['https://cdn/g2.jpg']?.base).toBe('Hello_Harford-Restaurants-Italian-Marios_Pizza-2');
  });

  it('photoBooth frames/backgrounds → su carpeta semántica con el id del item', () => {
    const cfg = {
      features: {
        home: {
          photoBooth: {
            frames: [
              { id: 'frame-0', image: 'https://cdn/f0.png', thumbnail: 'https://cdn/f0t.png' },
            ],
            backgrounds: [{ id: 'statue-of-liberty', image: 'https://cdn/sol.jpg' }],
          },
        },
      },
    };
    const t = byRef(collectImages(cfg, { clientName: 'Acme' }));
    expect(t['https://cdn/f0.png']).toEqual({
      dir: 'assets/photo-booth/frames',
      base: 'Acme-frame-0',
    });
    expect(t['https://cdn/f0t.png']?.base).toBe('Acme-frame-0-thumbnail');
    expect(t['https://cdn/sol.jpg']).toEqual({
      dir: 'assets/photo-booth/backgrounds',
      base: 'Acme-statue-of-liberty',
    });
  });

  it('assets relativos → sin target (conservan su path del template)', () => {
    const cfg = { branding: { logo: 'assets/logo.svg' } };
    const t = byRef(collectImages(cfg, { clientName: 'Acme' }));
    expect(t['assets/logo.svg']).toBeUndefined();
  });

  it('no recolecta campos de link (website)', () => {
    const cfg = { features: { x: { image: 'https://cdn/i.jpg', website: 'https://example.com' } } };
    const refs = collectImages(cfg, { clientName: 'Acme' }).map((i) => i.ref);
    expect(refs).toContain('https://cdn/i.jpg');
    expect(refs).not.toContain('https://example.com');
  });
});
