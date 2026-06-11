import { describe, expect, it } from 'vitest';

import { parseCustomEvents, parseCustomListings } from './custom';

/**
 * Fixtures basados en el shape real de los feeds custom de Discover DeKalb
 * (`/feeds/partners/` y `/feeds/events/`): JSON `{ entries: [...] }` con campos
 * `entry_id`, `category_name`, `address1..3`, `latitude/longitude`,
 * `contact_phone`, `images` (array), `website_url`, `start_date`, `categories`.
 */

const LISTINGS_FIXTURE = {
  entries: [
    {
      entry_id: 1132277,
      title: 'Georgia Piedmont Tech',
      category_name: 'Meeting Venues',
      description: '<p>A modern, high-capacity venue.</p>',
      address1: '495 N Indian Creek Dr',
      address2: 'Building C',
      latitude: 33.795,
      longitude: -84.234,
      contact_phone: '404-555-0100',
      website_url: 'https://example.com/gptc',
      logo_url: '',
      images: ['https://cdn.example.com/gptc-1.jpg', 'https://cdn.example.com/gptc-2.jpg'],
    },
    {
      // imagen como objeto + sin website (cae a `link`)
      entry_id: 'abc-9',
      title: 'Cafe DeKalb',
      category_name: 'Restaurants',
      address1: '1 Main St',
      latitude: '33.7',
      longitude: '-84.2',
      contact_phone: '',
      contact_phone_alt: '404-555-0199',
      link: 'https://example.com/cafe',
      images: [{ url: 'https://cdn.example.com/cafe.jpg' }],
    },
    { title: 'Sin ID — se descarta' },
  ],
};

const EVENTS_FIXTURE = {
  entries: [
    {
      entry_id: 1143087,
      title: 'Buford Highway Restaurant Month',
      description: '<p>Every June…</p>',
      latitude: 33.88,
      longitude: -84.3,
      address1: '3000 Buford Hwy',
      location_name: 'Buford Highway',
      start_date: '2026-06-01',
      end_date: '2026-06-30',
      contact_phone: '404-555-0123',
      website_url: 'https://example.com/event',
      ticket_url: 'https://example.com/tickets',
      images: ['https://cdn.example.com/bh.jpg'],
      categories: ['Food & Drink', 'Festivals'],
    },
  ],
  meta: { pagination: { total: 1 } },
};

describe('parseCustomListings', () => {
  const out = parseCustomListings(LISTINGS_FIXTURE);

  it('descarta entradas sin entry_id', () => {
    expect(out).toHaveLength(2);
  });

  it('mapea los campos clave del primer listing', () => {
    expect(out[0]).toMatchObject({
      providerId: '1132277',
      title: 'Georgia Piedmont Tech',
      category: 'Meeting Venues',
      phone: '404-555-0100',
      lat: 33.795,
      lng: -84.234,
      website: 'https://example.com/gptc',
    });
  });

  it('une address1 + address2', () => {
    expect(out[0].address).toBe('495 N Indian Creek Dr, Building C');
  });

  it('toma la primera imagen del array de strings', () => {
    expect(out[0].image).toBe('https://cdn.example.com/gptc-1.jpg');
  });

  it('imagen como objeto, phone alterno y website desde link', () => {
    expect(out[1]).toMatchObject({
      providerId: 'abc-9',
      phone: '404-555-0199',
      website: 'https://example.com/cafe',
      image: 'https://cdn.example.com/cafe.jpg',
    });
  });

  it('coords como string se conservan (las normaliza el normalizer)', () => {
    expect(out[1].lat).toBe('33.7');
    expect(out[1].lng).toBe('-84.2');
  });

  it('acepta también un array suelto sin envoltura', () => {
    const arr = parseCustomListings([{ entry_id: 5, title: 'X' }]);
    expect(arr).toEqual([{ providerId: '5', title: 'X' }]);
  });
});

describe('parseCustomEvents', () => {
  const out = parseCustomEvents(EVENTS_FIXTURE);

  it('mapea los campos clave del evento', () => {
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      providerId: '1143087',
      title: 'Buford Highway Restaurant Month',
      date: '2026-06-01',
      venue: 'Buford Highway',
      phone: '404-555-0123',
      website: 'https://example.com/event',
      image: 'https://cdn.example.com/bh.jpg',
    });
  });

  it('toma la primera categoría del array `categories`', () => {
    expect(out[0].category).toBe('Food & Drink');
  });

  it('lista vacía / shape desconocido → []', () => {
    expect(parseCustomEvents({})).toEqual([]);
    expect(parseCustomEvents(null)).toEqual([]);
  });
});
