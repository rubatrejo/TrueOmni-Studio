import { describe, expect, it } from 'vitest';

import { resolveEvent, resolveListing } from '@/lib/studio/client-content';

import {
  dedupeById,
  looksLikeHtml,
  mapPriceRange,
  normalizeEvent,
  normalizeListing,
  normalizePhone,
  parseCoord,
  parseDateIso,
  parseTimeHm,
  stripHtml,
} from './normalize';
import type { RawEvent, RawListing } from './types';

const NOW = '2026-06-11T00:00:00.000Z';

describe('stripHtml / looksLikeHtml', () => {
  it('removes tags and decodes common entities', () => {
    expect(stripHtml('<p>Hello&nbsp;&amp; <b>world</b></p>')).toBe('Hello & world');
    expect(stripHtml('Line<br/>two')).toBe('Line two');
  });
  it('detects markup', () => {
    expect(looksLikeHtml('<p>x</p>')).toBe(true);
    expect(looksLikeHtml('plain text')).toBe(false);
    expect(looksLikeHtml('a &amp; b')).toBe(true);
  });
});

describe('normalizePhone', () => {
  it('keeps digits and common separators, drops junk', () => {
    expect(normalizePhone('Call: (555) 123-4567 ext')).toBe('(555) 123-4567');
  });
});

describe('parseCoord', () => {
  it('parses number and numeric string, rejects garbage', () => {
    expect(parseCoord(33.5)).toBe(33.5);
    expect(parseCoord('-112.07')).toBeCloseTo(-112.07);
    expect(parseCoord('')).toBeNull();
    expect(parseCoord('abc')).toBeNull();
    expect(parseCoord(undefined)).toBeNull();
  });
});

describe('mapPriceRange', () => {
  it('maps numbers, dollar signs and falls back to 2', () => {
    expect(mapPriceRange(3)).toBe(3);
    expect(mapPriceRange('$$')).toBe(2);
    expect(mapPriceRange('$$$$$')).toBe(4);
    expect(mapPriceRange('weird')).toBe(2);
    expect(mapPriceRange(undefined)).toBe(2);
  });
});

describe('parseDateIso / parseTimeHm', () => {
  it('normalizes dates to YYYY-MM-DD', () => {
    expect(parseDateIso('2026-07-01')).toBe('2026-07-01');
    expect(parseDateIso('2026-07-01T18:00:00Z')).toBe('2026-07-01');
    expect(parseDateIso('garbage')).toBeNull();
    expect(parseDateIso(undefined)).toBeNull();
  });
  it('normalizes times to HH:MM with fallback', () => {
    expect(parseTimeHm('9:05', '00:00')).toBe('09:05');
    expect(parseTimeHm('18:30', '00:00')).toBe('18:30');
    expect(parseTimeHm(undefined, '23:59')).toBe('23:59');
  });
});

describe('normalizeListing', () => {
  const full: RawListing = {
    providerId: '42',
    title: 'El Farolito',
    category: 'Dining',
    subcategory: 'Mexican',
    description: '<p>Great <b>tacos</b></p>',
    image: 'https://x/img.jpg',
    address: '123 Main St',
    phone: '(555) 123-4567',
    lat: 33.5,
    lng: -112.07,
    website: 'https://x',
    priceLevel: '$$',
  };

  it('produces an active, resolvable item from clean data', () => {
    const item = normalizeListing(full, 'feed1', NOW);
    expect(item).not.toBeNull();
    expect(item?.id).toBe('feed1:42');
    expect(item?.source).toBe('feed1');
    expect(item?.feedCategory).toBe('Dining');
    expect(item?.status).toBe('active');
    expect(item?.feedData.description).toBe('Great tacos');
    expect(item?.flags).toContain('html-stripped');
    // Resolvable into a real ListingItem.
    expect(resolveListing(item!)?.title).toBe('El Farolito');
  });

  it('flags missing image and coords as serious -> flagged', () => {
    const item = normalizeListing({ providerId: '7', title: 'No media' }, 'feed1', NOW);
    expect(item?.status).toBe('flagged');
    expect(item?.flags).toEqual(
      expect.arrayContaining([
        'missing-image',
        'missing-coords',
        'missing-address',
        'missing-phone',
      ]),
    );
  });

  it('drops items without a title', () => {
    expect(normalizeListing({ providerId: '9' }, 'feed1', NOW)).toBeNull();
  });

  it('treats 0,0 coords as missing', () => {
    const item = normalizeListing({ providerId: '1', title: 'x', lat: 0, lng: 0 }, 'feed1', NOW);
    expect(item?.flags).toContain('missing-coords');
  });
});

describe('normalizeEvent', () => {
  const full: RawEvent = {
    providerId: '7',
    title: 'Jazz Night',
    category: 'Music',
    image: 'https://x/e.jpg',
    date: '2026-07-01T18:00:00Z',
    startTime: '18:00',
    endTime: '20:00',
    venue: 'The Hall',
    lat: 33.5,
    lng: -112.07,
  };

  it('produces a resolvable event', () => {
    const item = normalizeEvent(full, 'feed2', NOW);
    expect(item?.status).toBe('active');
    expect(item?.feedData.date).toBe('2026-07-01');
    expect(resolveEvent(item!)?.title).toBe('Jazz Night');
  });

  it('flags missing date and defaults times', () => {
    const item = normalizeEvent(
      { providerId: '8', title: 'No date', image: 'https://x/e.jpg', lat: 1, lng: 1 },
      'feed2',
      NOW,
    );
    expect(item?.flags).toContain('missing-date');
    expect(item?.status).toBe('flagged');
    expect(item?.feedData.startTime).toBe('00:00');
    expect(item?.feedData.endTime).toBe('23:59');
  });

  it('drops events without a title', () => {
    expect(normalizeEvent({ providerId: '9' }, 'feed2', NOW)).toBeNull();
  });
});

describe('dedupeById', () => {
  it('keeps the first occurrence and counts duplicates', () => {
    const { items, duplicates } = dedupeById([{ id: 'a' }, { id: 'b' }, { id: 'a' }]);
    expect(items.map((i) => i.id)).toEqual(['a', 'b']);
    expect(duplicates).toBe(1);
  });
});
