import { describe, expect, it } from 'vitest';

import type { ClientContent } from './client-content';
import { emptyClientContent } from './client-content';
import {
  applyContentToKiosk,
  loadClientContent,
  loadClientContentOrEmpty,
  saveClientContent,
} from './client-content-sync';
import type { KioskConfig, ListingsCatalogEntry } from './schema';

/**
 * Tests del store con KV in-memory (sin credenciales KV en CI → fallback). Cada
 * test usa un slug propio para no colisionar con el store compartido del módulo.
 */

describe('saveClientContent (optimistic concurrency)', () => {
  it('initial save bumps version to 1 and persists', async () => {
    const slug = 'test-content-init';
    const res = await saveClientContent(slug, emptyClientContent());
    expect(res.ok).toBe(true);
    expect(res.version).toBe(1);

    const loaded = await loadClientContent(slug);
    expect(loaded?.currentVersion).toBe(1);
  });

  it('matching ifVersion succeeds and increments', async () => {
    const slug = 'test-content-match';
    await saveClientContent(slug, emptyClientContent()); // v1
    const res = await saveClientContent(slug, emptyClientContent(), 1);
    expect(res.ok).toBe(true);
    expect(res.version).toBe(2);
  });

  it('stale ifVersion is a conflict and does not write', async () => {
    const slug = 'test-content-conflict';
    await saveClientContent(slug, emptyClientContent()); // v1
    await saveClientContent(slug, emptyClientContent(), 1); // v2

    const res = await saveClientContent(slug, emptyClientContent(), 1); // stale
    expect(res.ok).toBe(false);
    expect(res.conflict).toBe(true);
    expect(res.currentVersion).toBe(2);

    const loaded = await loadClientContent(slug);
    expect(loaded?.currentVersion).toBe(2); // unchanged
  });
});

describe('loadClientContentOrEmpty', () => {
  it('returns an empty doc for an unknown client', async () => {
    const doc = await loadClientContentOrEmpty('test-content-unknown');
    expect(doc.currentVersion).toBe(0);
    expect(doc.listings).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
//  applyContentToKiosk (propagación pura)
// ---------------------------------------------------------------------------

function content(over: Partial<ClientContent>): ClientContent {
  return {
    feeds: [],
    categoryMap: [],
    listings: [],
    events: [],
    contentEnabled: true,
    placeholderImage: '',
    currentVersion: 0,
    ...over,
  };
}

function emptyCfg(over: Partial<KioskConfig> = {}): KioskConfig {
  return { listings: [], events: undefined, ...over } as unknown as KioskConfig;
}

function manualModule(key: string): ListingsCatalogEntry {
  return {
    key,
    label: key,
    iconKey: 'MapPin',
    enabled: true,
    catalog: { heroImage: '', subcategories: [], features: [], listings: [] },
  };
}

describe('applyContentToKiosk', () => {
  it('groups mapped listings into a feed-connected module with the renamed label', () => {
    const doc = content({
      categoryMap: [
        {
          feedId: 'f1',
          feedCategory: 'Dining',
          moduleKey: 'restaurants',
          label: 'Dine',
          subcategory: '',
          contentType: 'listing',
        },
      ],
      listings: [
        {
          id: 'f1:1',
          source: 'f1',
          type: 'listing',
          feedCategory: 'Dining',
          feedData: { title: 'Taco Spot', subcategory: 'Mexican' },
          override: {},
          flags: [],
          status: 'active',
        },
      ],
    });
    const out = applyContentToKiosk(emptyCfg(), doc);
    const mod = out.listings!.find((m) => m.key === 'restaurants')!;
    expect(mod.label).toBe('Dine');
    expect(mod.feedConnected).toBe(true);
    expect(mod.catalog.listings[0].title).toBe('Taco Spot');
    expect(mod.catalog.subcategories).toContain('Mexican');
  });

  it('toggle OFF (contentEnabled=false) ignores feed data and keeps the seed cfg', () => {
    const doc = content({
      contentEnabled: false,
      categoryMap: [
        {
          feedId: 'f1',
          feedCategory: 'Dining',
          moduleKey: 'restaurants',
          label: 'Dine',
          subcategory: '',
          contentType: 'listing',
        },
      ],
      listings: [
        {
          id: 'f1:1',
          source: 'f1',
          type: 'listing',
          feedCategory: 'Dining',
          feedData: { title: 'Taco Spot', subcategory: 'Mexican' },
          override: {},
          flags: [],
          status: 'active',
        },
      ],
    });
    const seed = emptyCfg({ listings: [manualModule('shopping')] });
    const out = applyContentToKiosk(seed, doc);
    // Early return → el config seed queda intacto, sin la data del feed.
    expect(out).toBe(seed);
    expect(out.listings!.map((m) => m.key)).toEqual(['shopping']);
  });

  it('fills listings without image using the global placeholderImage', () => {
    const doc = content({
      placeholderImage: 'https://cdn/placeholder.jpg',
      categoryMap: [
        {
          feedId: 'f1',
          feedCategory: 'Dining',
          moduleKey: 'restaurants',
          label: 'Dine',
          subcategory: '',
          contentType: 'listing',
        },
      ],
      listings: [
        {
          id: 'f1:1',
          source: 'f1',
          type: 'listing',
          feedCategory: 'Dining',
          feedData: { title: 'No Photo', subcategory: 'Mexican' },
          override: {},
          flags: ['missing-image'],
          status: 'active',
        },
        {
          id: 'f1:2',
          source: 'f1',
          type: 'listing',
          feedCategory: 'Dining',
          feedData: { title: 'Has Photo', subcategory: 'Mexican', image: 'https://cdn/real.jpg' },
          override: {},
          flags: [],
          status: 'active',
        },
      ],
    });
    const out = applyContentToKiosk(emptyCfg(), doc);
    const mod = out.listings!.find((m) => m.key === 'restaurants')!;
    const noPhoto = mod.catalog.listings.find((l) => l.title === 'No Photo')!;
    const hasPhoto = mod.catalog.listings.find((l) => l.title === 'Has Photo')!;
    expect(noPhoto.image).toBe('https://cdn/placeholder.jpg');
    expect(hasPhoto.image).toBe('https://cdn/real.jpg');
  });

  it('mapping subcategory overrides the item subcategory and feeds the grid', () => {
    const doc = content({
      categoryMap: [
        {
          feedId: 'f1',
          feedCategory: 'Eat & Drink',
          moduleKey: 'restaurants',
          label: 'Dine',
          subcategory: 'Casual',
          contentType: 'listing',
        },
        {
          feedId: 'f1',
          feedCategory: 'Fine Dining',
          moduleKey: 'restaurants',
          label: 'Dine',
          subcategory: '', // vacío = respeta la del item del feed
          contentType: 'listing',
        },
      ],
      listings: [
        {
          id: 'f1:1',
          source: 'f1',
          type: 'listing',
          feedCategory: 'Eat & Drink',
          feedData: { title: 'Burger Joint', subcategory: 'Ignored' },
          override: {},
          flags: [],
          status: 'active',
        },
        {
          id: 'f1:2',
          source: 'f1',
          type: 'listing',
          feedCategory: 'Fine Dining',
          feedData: { title: 'Le Posh', subcategory: 'Upscale' },
          override: {},
          flags: [],
          status: 'active',
        },
      ],
    });
    const out = applyContentToKiosk(emptyCfg(), doc);
    const mod = out.listings!.find((m) => m.key === 'restaurants')!;
    const burger = mod.catalog.listings.find((l) => l.title === 'Burger Joint')!;
    const posh = mod.catalog.listings.find((l) => l.title === 'Le Posh')!;
    // Mapping con subcategoría → override la del item.
    expect(burger.subcategory).toBe('Casual');
    // Mapping con subcategoría vacía → respeta la del item del feed.
    expect(posh.subcategory).toBe('Upscale');
    // Ambas alimentan el grid de sub-categorías del módulo.
    expect(mod.catalog.subcategories).toEqual(expect.arrayContaining(['Casual', 'Upscale']));
  });

  it('does not propagate unmapped or hidden items', () => {
    const doc = content({
      categoryMap: [], // sin mapeo
      listings: [
        {
          id: 'f1:1',
          source: 'f1',
          type: 'listing',
          feedCategory: 'Dining',
          feedData: { title: 'Unmapped' },
          override: {},
          flags: [],
          status: 'active',
        },
        {
          id: 'f1:2',
          source: 'f1',
          type: 'listing',
          feedCategory: 'Dining',
          feedData: { title: 'Hidden' },
          override: {},
          flags: [],
          status: 'hidden',
        },
      ],
    });
    const out = applyContentToKiosk(emptyCfg(), doc);
    expect(out.listings).toEqual([]);
  });

  it('preserves a manual module not fed by any feed', () => {
    const doc = content({
      categoryMap: [
        {
          feedId: 'f1',
          feedCategory: 'Dining',
          moduleKey: 'restaurants',
          label: '',
          subcategory: '',
          contentType: 'listing',
        },
      ],
      listings: [
        {
          id: 'f1:1',
          source: 'f1',
          type: 'listing',
          feedCategory: 'Dining',
          feedData: { title: 'Taco Spot' },
          override: {},
          flags: [],
          status: 'active',
        },
      ],
    });
    const out = applyContentToKiosk(emptyCfg({ listings: [manualModule('shopping')] }), doc);
    const keys = out.listings!.map((m) => m.key).sort();
    expect(keys).toEqual(['restaurants', 'shopping']);
    expect(out.listings!.find((m) => m.key === 'shopping')!.feedConnected).toBeUndefined();
  });

  it('propagates visible events into a feed-connected events module', () => {
    const doc = content({
      events: [
        {
          id: 'f2:1',
          source: 'f2',
          type: 'event',
          feedCategory: 'Music',
          feedData: {
            title: 'Jazz Night',
            category: 'Music',
            date: '2026-07-01',
            startTime: '18:00',
            endTime: '20:00',
            venue: 'The Hall',
          },
          override: {},
          flags: [],
          status: 'active',
        },
      ],
    });
    const out = applyContentToKiosk(emptyCfg(), doc);
    expect(out.events!.feedConnected).toBe(true);
    expect(out.events!.events[0].title).toBe('Jazz Night');
    expect(out.events!.categories).toContain('Music');
    expect(out.events!.venues).toContain('The Hall');
  });

  it('preserves operator-uploaded subcategoryImages across a re-sync (merge by name)', () => {
    const doc = content({
      categoryMap: [
        {
          feedId: 'f1',
          feedCategory: 'Dining',
          moduleKey: 'restaurants',
          label: 'Dine',
          subcategory: '',
          contentType: 'listing',
        },
      ],
      listings: [
        {
          id: 'f1:1',
          source: 'f1',
          type: 'listing',
          feedCategory: 'Dining',
          feedData: { title: 'Taco Spot', subcategory: 'Mexican' },
          override: {},
          flags: [],
          status: 'active',
        },
        {
          id: 'f1:2',
          source: 'f1',
          type: 'listing',
          feedCategory: 'Dining',
          feedData: { title: 'Pasta Place', subcategory: 'Italian' },
          override: {},
          flags: [],
          status: 'active',
        },
      ],
    });
    // El cfg previo ya tiene fotos de sub-categoría subidas por el operador en
    // el módulo restaurants (que es alimentado por feed).
    const prev = manualModule('restaurants');
    prev.feedConnected = true;
    prev.catalog.subcategories = ['Mexican', 'Italian'];
    prev.catalog.subcategoryImages = {
      Mexican: '/uploads/mexican.jpg',
      Italian: '/uploads/italian.jpg',
    };
    const out = applyContentToKiosk(emptyCfg({ listings: [prev] }), doc);
    const mod = out.listings!.find((m) => m.key === 'restaurants')!;
    // Las fotos subidas se conservan tras el re-sync.
    expect(mod.catalog.subcategoryImages).toEqual({
      Mexican: '/uploads/mexican.jpg',
      Italian: '/uploads/italian.jpg',
    });
  });

  it('prunes subcategoryImages for subcategories no longer present in the feed', () => {
    const doc = content({
      categoryMap: [
        {
          feedId: 'f1',
          feedCategory: 'Dining',
          moduleKey: 'restaurants',
          label: 'Dine',
          subcategory: '',
          contentType: 'listing',
        },
      ],
      // El feed nuevo solo trae 'Mexican' — 'Italian' desapareció.
      listings: [
        {
          id: 'f1:1',
          source: 'f1',
          type: 'listing',
          feedCategory: 'Dining',
          feedData: { title: 'Taco Spot', subcategory: 'Mexican' },
          override: {},
          flags: [],
          status: 'active',
        },
      ],
    });
    const prev = manualModule('restaurants');
    prev.feedConnected = true;
    prev.catalog.subcategories = ['Mexican', 'Italian'];
    prev.catalog.subcategoryImages = {
      Mexican: '/uploads/mexican.jpg',
      Italian: '/uploads/italian.jpg',
    };
    const out = applyContentToKiosk(emptyCfg({ listings: [prev] }), doc);
    const mod = out.listings!.find((m) => m.key === 'restaurants')!;
    // La foto de Mexican se conserva; la de Italian (sub-categoría podada) se elimina.
    expect(mod.catalog.subcategoryImages).toEqual({ Mexican: '/uploads/mexican.jpg' });
    expect(mod.catalog.subcategories).toContain('Mexican');
    expect(mod.catalog.subcategories).not.toContain('Italian');
  });

  it('de-duplicates colliding slugs', () => {
    const mk = (id: string) => ({
      id,
      source: 'f1',
      type: 'listing' as const,
      feedCategory: 'Dining',
      feedData: { title: 'Same' },
      override: {},
      flags: [],
      status: 'active' as const,
    });
    const doc = content({
      categoryMap: [
        {
          feedId: 'f1',
          feedCategory: 'Dining',
          moduleKey: 'restaurants',
          label: 'Dine',
          subcategory: '',
          contentType: 'listing',
        },
      ],
      // Ambos ids colapsan al mismo slug 'f1-x' tras idToSlug? Usamos ids que
      // producen el mismo slug para forzar la colisión.
      listings: [mk('f1:dup'), mk('f1:dup ')],
    });
    const out = applyContentToKiosk(emptyCfg(), doc);
    const slugs = out
      .listings!.find((m) => m.key === 'restaurants')!
      .catalog.listings.map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length); // todos únicos
  });
});
