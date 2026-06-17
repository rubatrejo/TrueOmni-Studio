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

describe('collectImages (context-aware naming, estructura real plana)', () => {
  const byRef = (imgs: { ref: string; target?: { dir: string; base: string }; kind?: string }[]) =>
    Object.fromEntries(imgs.map((i) => [i.ref, i.target]));

  it('listings: módulo (label + listings) → feed/<Categoría>/<Subcat>/<naming> (estructura FS)', () => {
    const cfg = {
      features: {
        home: {
          modules: {
            restaurants: {
              label: 'Eat & Drink',
              heroImage: 'https://cdn/rest-hero.jpg',
              listings: [
                {
                  subcategory: 'Italian',
                  title: "Mario's Pizza",
                  image: 'https://cdn/mario.jpg',
                  galleryUrls: ['https://cdn/g1.jpg', 'https://cdn/g2.jpg'],
                },
              ],
            },
          },
        },
      },
    };
    const t = byRef(collectImages(cfg, { clientName: 'Hello Harford' }));
    expect(t['https://cdn/mario.jpg']).toEqual({
      dir: 'assets/feed/Eat_and_Drink/Italian',
      base: 'Hello_Harford-Eat_and_Drink-Italian-Marios_Pizza',
    });
    expect(t['https://cdn/g1.jpg']?.base).toBe(
      'Hello_Harford-Eat_and_Drink-Italian-Marios_Pizza-1',
    );
    // header del módulo → feed/<Categoría>/_header (naming por field)
    expect(t['https://cdn/rest-hero.jpg']).toEqual({
      dir: 'assets/feed/Eat_and_Drink',
      base: 'Hello_Harford-heroImage',
    });
  });

  it('events: módulo (label + events) con category por item → feed/<Cat>/<EventCategory>/...', () => {
    const cfg = {
      events: {
        label: 'Upcoming Events',
        events: [{ category: 'Music', title: 'Jazz Night', image: 'https://cdn/jazz.jpg' }],
      },
    };
    const t = byRef(collectImages(cfg, { clientName: 'Acme' }));
    expect(t['https://cdn/jazz.jpg']).toEqual({
      dir: 'assets/feed/Upcoming_Events/Music',
      base: 'Acme-Upcoming_Events-Music-Jazz_Night',
    });
  });

  it('módulo bucket (social-wall: label sin listings/events) → assets/<Label>/', () => {
    const cfg = {
      'social-wall': {
        label: 'Social Wall',
        heroImage: 'https://cdn/sw-hero.jpg',
        highlights: [{ id: 'h1', image: 'https://cdn/h1.jpg' }],
      },
    };
    const t = byRef(collectImages(cfg, { clientName: 'Acme' }));
    expect(t['https://cdn/h1.jpg']).toEqual({ dir: 'assets/Social Wall', base: 'Acme-h1' });
    expect(t['https://cdn/sw-hero.jpg']).toEqual({
      dir: 'assets/Social Wall',
      base: 'Acme-heroImage',
    });
  });

  it('branding: logos + media {kind,src} → assets/branding; colores no son assets', () => {
    const cfg = {
      branding: {
        primary: '#fff',
        logo: 'https://cdn/logo.png',
        idleBackground: { kind: 'image', src: 'https://cdn/idlebg.jpg' },
      },
    };
    const t = byRef(collectImages(cfg, { clientName: 'Acme' }));
    expect(t['https://cdn/logo.png']).toEqual({ dir: 'assets/branding', base: 'Acme-logo' });
    expect(t['https://cdn/idlebg.jpg']).toEqual({
      dir: 'assets/branding',
      base: 'Acme-idleBackground',
    });
  });

  it('branding fonts → kind:font hacia assets/branding/fonts', () => {
    const cfg = { branding: { fonts: { display: 'Poppins', body: 'Inter' } } };
    const imgs = collectImages(cfg, { clientName: 'Acme' });
    const poppins = imgs.find((i) => i.ref === 'Poppins');
    expect(poppins?.kind).toBe('font');
    expect(poppins?.target).toEqual({ dir: 'assets/branding/fonts', base: 'Poppins' });
    expect(imgs.find((i) => i.ref === 'Inter')?.kind).toBe('font');
  });

  it('tiles: salta los items con enabled === false (#4)', () => {
    const cfg = {
      modules: {
        tiles: [
          { key: 'a', enabled: true, image: 'https://cdn/a.jpg' },
          { key: 'b', enabled: false, image: 'https://cdn/b.jpg' },
        ],
      },
    };
    const refs = collectImages(cfg, { clientName: 'Acme' }).map((i) => i.ref);
    expect(refs).toContain('https://cdn/a.jpg');
    expect(refs).not.toContain('https://cdn/b.jpg');
  });

  it('photoBooth frames/backgrounds → su carpeta semántica con el id del item', () => {
    const cfg = {
      photoBooth: {
        frames: [{ id: 'frame-0', image: 'https://cdn/f0.png', thumbnail: 'https://cdn/f0t.png' }],
        backgrounds: [{ id: 'statue-of-liberty', image: 'https://cdn/sol.jpg' }],
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

  it('assets relativos → sin target (rename de carpeta lo hace materialize)', () => {
    const cfg = { branding: { logo: 'assets/logo.svg' } };
    const t = byRef(collectImages(cfg, { clientName: 'Acme' }));
    expect(t['assets/logo.svg']).toBeUndefined();
  });

  it('ads (#5): el archivo se nombra por el TIPO de ad (kind), no por el id', () => {
    const cfg = {
      advertisements: [
        { id: 'lolas-lunch', kind: 'hero', image: 'https://cdn/a1.png' },
        { id: 'uber-eats-nfl', kind: 'popup', image: 'https://cdn/a2.png' },
        { id: 'history-of-art', kind: 'bottom', image: 'https://cdn/a3.png' },
      ],
    };
    const t = byRef(collectImages(cfg, { clientName: 'Acme' }));
    expect(t['https://cdn/a1.png']).toEqual({ dir: 'assets/Ads', base: 'Acme-hero' });
    expect(t['https://cdn/a2.png']).toEqual({ dir: 'assets/Ads', base: 'Acme-popup' });
    expect(t['https://cdn/a3.png']).toEqual({ dir: 'assets/Ads', base: 'Acme-bottom' });
  });

  it('no recolecta campos de link (website)', () => {
    const cfg = { socialWall: { image: 'https://cdn/i.jpg', website: 'https://example.com' } };
    const refs = collectImages(cfg, { clientName: 'Acme' }).map((i) => i.ref);
    expect(refs).toContain('https://cdn/i.jpg');
    expect(refs).not.toContain('https://example.com');
  });

  it('módulos inactivos (#1): omite el contenido de un módulo con tile.enabled=false', () => {
    const cfg = {
      features: {
        home: {
          tiles: [
            { key: 'restaurants', enabled: true },
            { key: 'guestbook', enabled: false },
          ],
          modules: {
            restaurants: {
              label: 'Eat & Drink',
              listings: [{ subcategory: 'Italian', title: 'X', image: 'https://cdn/r.jpg' }],
            },
            guestbook: {
              label: 'Guestbook',
              heroImage: 'https://cdn/gb-hero.jpg',
              pinCatalog: [{ id: 'p1', image: 'https://cdn/gb.jpg' }],
            },
          },
        },
      },
    };
    const refs = collectImages(cfg, { clientName: 'Acme' }).map((i) => i.ref);
    expect(refs).toContain('https://cdn/r.jpg'); // restaurants activo
    expect(refs).not.toContain('https://cdn/gb.jpg'); // guestbook inactivo → omitido
    expect(refs).not.toContain('https://cdn/gb-hero.jpg');
  });

  it('tiles activos (#2): tile.image → assets/Home Dashboard/tiles/ con name=tile.key', () => {
    const cfg = {
      features: {
        home: {
          tiles: [
            { key: 'events', enabled: true, image: 'https://cdn/events-tile.jpg' },
            { key: 'map', enabled: false, image: 'https://cdn/map-tile.jpg' },
          ],
        },
      },
    };
    const imgs = collectImages(cfg, { clientName: 'Acme' });
    const byRef2 = byRef(imgs);
    expect(byRef2['https://cdn/events-tile.jpg']).toEqual({
      dir: 'assets/Home Dashboard/tiles',
      base: 'Acme-events',
    });
    // tile inactivo no se exporta
    expect(imgs.map((i) => i.ref)).not.toContain('https://cdn/map-tile.jpg');
  });
});
