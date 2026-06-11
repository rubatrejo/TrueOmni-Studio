import { describe, expect, it } from 'vitest';

import { crowdriffAdapter, parseCrowdriffAssets } from './adapters/crowdriff';
import { parseSimpleviewEvents, parseSimpleviewListings } from './adapters/simpleview';
import { simpleviewAdapter } from './adapters/simpleview';
import { tempestAdapter } from './adapters/tempest';
import { decodeBasicEntities, parseWordPressPosts, wordpressAdapter } from './adapters/wordpress';
import { getAdapter, listProviders } from './registry';

/**
 * Tests SOLO de las funciones puras de parseo y del registry. No se prueba el
 * `fetch` real (no hay red ni credenciales en CI): solo el mapeo de campos, los
 * alias alternativos, la defensividad ante campos faltantes y el array vacío.
 */

// ---------------------------------------------------------------------------
//  WordPress
// ---------------------------------------------------------------------------

describe('parseWordPressPosts', () => {
  it('mapea el shape estándar de la WP REST API', () => {
    const posts = [
      {
        id: 101,
        link: 'https://blog.cliente.com/el-farolito',
        title: { rendered: 'El Farolito &amp; Cantina' },
        content: { rendered: '<p>Great tacos</p>' },
        excerpt: { rendered: '<p>Short</p>' },
        _embedded: {
          'wp:featuredmedia': [{ source_url: 'https://blog.cliente.com/img.jpg' }],
        },
      },
    ];
    const [listing] = parseWordPressPosts(posts);
    expect(listing.providerId).toBe('101');
    expect(listing.title).toBe('El Farolito & Cantina');
    expect(listing.description).toBe('<p>Great tacos</p>');
    expect(listing.website).toBe('https://blog.cliente.com/el-farolito');
    expect(listing.image).toBe('https://blog.cliente.com/img.jpg');
  });

  it('usa el excerpt cuando falta el content y es defensivo ante campos ausentes', () => {
    const posts = [{ id: 7, title: { rendered: 'Solo título' }, excerpt: { rendered: 'Resumen' } }];
    const [listing] = parseWordPressPosts(posts);
    expect(listing.providerId).toBe('7');
    expect(listing.title).toBe('Solo título');
    expect(listing.description).toBe('Resumen');
    expect(listing.image).toBeUndefined();
    expect(listing.website).toBeUndefined();
  });

  it('descarta entradas sin id y entradas no-objeto', () => {
    const posts = [{ title: { rendered: 'Sin id' } }, null, 'basura', { id: 9 }];
    const result = parseWordPressPosts(posts);
    expect(result).toHaveLength(1);
    expect(result[0].providerId).toBe('9');
  });

  it('devuelve [] ante entrada no-array', () => {
    expect(parseWordPressPosts([])).toEqual([]);
    expect(parseWordPressPosts(undefined as unknown as unknown[])).toEqual([]);
  });
});

describe('decodeBasicEntities', () => {
  it('decodifica las entidades HTML comunes de WP', () => {
    expect(decodeBasicEntities('Tom&#8217;s &amp; Jerry')).toBe("Tom's & Jerry");
    expect(decodeBasicEntities('&#8220;quoted&#8221;')).toBe('"quoted"');
  });
});

// ---------------------------------------------------------------------------
//  Simpleview / Tempest
// ---------------------------------------------------------------------------

describe('parseSimpleviewListings', () => {
  it('mapea los campos canónicos desde un array suelto', () => {
    const json = [
      {
        id: 'sv-1',
        title: 'Desert Museum',
        category: 'Attractions',
        description: 'A nice museum',
        address: '100 Cactus Rd',
        phone: '555-0100',
        latitude: 32.1,
        longitude: -110.9,
        url: 'https://museum.example',
        image: 'https://museum.example/photo.jpg',
      },
    ];
    const [listing] = parseSimpleviewListings(json);
    expect(listing).toEqual({
      providerId: 'sv-1',
      title: 'Desert Museum',
      category: 'Attractions',
      description: 'A nice museum',
      address: '100 Cactus Rd',
      phone: '555-0100',
      lat: 32.1,
      lng: -110.9,
      website: 'https://museum.example',
      image: 'https://museum.example/photo.jpg',
    });
  });

  it('resuelve los alias alternativos de campos', () => {
    const json = {
      docs: [
        {
          listing_id: 42,
          companyName: 'Taco Stand',
          primaryCategory: 'Dining',
          listingDesc: 'Tacos',
          address1: '5 Main',
          phoneNumber: '555-0199',
          lat: '33.0',
          lon: '-111.0',
          website: 'https://tacos.example',
          imageUrl: 'https://tacos.example/i.jpg',
        },
      ],
    };
    const [listing] = parseSimpleviewListings(json);
    expect(listing.providerId).toBe('42');
    expect(listing.title).toBe('Taco Stand');
    expect(listing.category).toBe('Dining');
    expect(listing.description).toBe('Tacos');
    expect(listing.address).toBe('5 Main');
    expect(listing.phone).toBe('555-0199');
    expect(listing.lat).toBe('33.0');
    expect(listing.lng).toBe('-111.0');
    expect(listing.website).toBe('https://tacos.example');
    expect(listing.image).toBe('https://tacos.example/i.jpg');
  });

  it('extrae el array de varias envolturas (data/results/listings)', () => {
    expect(parseSimpleviewListings({ data: [{ id: 'a' }] })).toHaveLength(1);
    expect(parseSimpleviewListings({ results: [{ id: 'b' }] })).toHaveLength(1);
    expect(parseSimpleviewListings({ listings: [{ id: 'c' }] })).toHaveLength(1);
  });

  it('descarta items sin id resoluble', () => {
    const json = [{ title: 'Sin id' }, { id: 'ok', title: 'Con id' }];
    const result = parseSimpleviewListings(json);
    expect(result).toHaveLength(1);
    expect(result[0].providerId).toBe('ok');
  });

  it('es defensivo ante basura y devuelve [] para entrada vacía', () => {
    expect(parseSimpleviewListings(null)).toEqual([]);
    expect(parseSimpleviewListings('nope')).toEqual([]);
    expect(parseSimpleviewListings([])).toEqual([]);
    expect(parseSimpleviewListings({ docs: 'no-array' })).toEqual([]);
  });
});

describe('parseSimpleviewEvents', () => {
  it('mapea fecha, horas y venue con alias', () => {
    const json = [
      {
        eventId: 'ev-1',
        eventName: 'Jazz Night',
        startDate: '2026-07-01',
        start_time: '18:00',
        end_time: '21:00',
        venueName: 'The Hall',
        latitude: 32.2,
        longitude: -110.8,
      },
    ];
    const [event] = parseSimpleviewEvents(json);
    expect(event.providerId).toBe('ev-1');
    expect(event.title).toBe('Jazz Night');
    expect(event.date).toBe('2026-07-01');
    expect(event.startTime).toBe('18:00');
    expect(event.endTime).toBe('21:00');
    expect(event.venue).toBe('The Hall');
    expect(event.lat).toBe(32.2);
    expect(event.lng).toBe(-110.8);
  });

  it('descarta eventos sin id y devuelve [] para vacío', () => {
    expect(parseSimpleviewEvents([{ title: 'Sin id' }])).toEqual([]);
    expect(parseSimpleviewEvents([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
//  Crowdriff
// ---------------------------------------------------------------------------

describe('parseCrowdriffAssets', () => {
  it('mapea url y tags (tags como strings)', () => {
    const json = {
      assets: [{ url: 'https://cdn/1.jpg', tags: ['beach', 'sunset'] }],
    };
    expect(parseCrowdriffAssets(json)).toEqual([
      { url: 'https://cdn/1.jpg', tags: ['beach', 'sunset'] },
    ]);
  });

  it('acepta tags como objetos {name|tag} y alias de url', () => {
    const json = [{ imageUrl: 'https://cdn/2.jpg', tags: [{ name: 'food' }, { tag: 'dining' }] }];
    expect(parseCrowdriffAssets(json)).toEqual([
      { url: 'https://cdn/2.jpg', tags: ['food', 'dining'] },
    ]);
  });

  it('descarta assets sin url y es defensivo ante vacío/basura', () => {
    expect(parseCrowdriffAssets([{ tags: ['x'] }])).toEqual([]);
    expect(parseCrowdriffAssets([{ url: 'https://cdn/3.jpg' }])).toEqual([
      { url: 'https://cdn/3.jpg', tags: [] },
    ]);
    expect(parseCrowdriffAssets(null)).toEqual([]);
    expect(parseCrowdriffAssets([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
//  Registry
// ---------------------------------------------------------------------------

describe('getAdapter / listProviders', () => {
  it('devuelve el adaptador correcto por proveedor', () => {
    expect(getAdapter('wordpress')).toBe(wordpressAdapter);
    expect(getAdapter('simpleview')).toBe(simpleviewAdapter);
    expect(getAdapter('tempest')).toBe(tempestAdapter);
    expect(getAdapter('crowdriff')).toBe(crowdriffAdapter);
  });

  it('cada adaptador declara su propio provider', () => {
    for (const provider of listProviders()) {
      expect(getAdapter(provider).provider).toBe(provider);
    }
  });

  it('listProviders devuelve los 5 proveedores', () => {
    expect(listProviders()).toEqual(['simpleview', 'tempest', 'crowdriff', 'wordpress', 'custom']);
  });
});
