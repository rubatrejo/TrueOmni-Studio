import { describe, expect, it } from 'vitest';

import {
  ClientContentSchema,
  emptyClientContent,
  idToSlug,
  isItemVisible,
  resolveEvent,
  resolveListing,
  type EventContentItem,
  type ListingContentItem,
} from './client-content';

describe('emptyClientContent', () => {
  it('produces a valid, empty document at version 0', () => {
    const doc = emptyClientContent();
    expect(doc.currentVersion).toBe(0);
    expect(doc.feeds).toEqual([]);
    expect(doc.categoryMap).toEqual([]);
    expect(doc.listings).toEqual([]);
    expect(doc.events).toEqual([]);
  });
});

describe('ClientContentSchema', () => {
  it('parses a document with a feed, a mapping and a listing item', () => {
    const parsed = ClientContentSchema.safeParse({
      feeds: [{ id: 'f1', provider: 'simpleview', config: { apiKey: 'x' } }],
      categoryMap: [
        {
          feedId: 'f1',
          feedCategory: 'Outdoor Recreation',
          moduleKey: 'things-to-do',
          label: 'Experiences',
          contentType: 'listing',
        },
      ],
      listings: [
        {
          id: 'simpleview:42',
          source: 'f1',
          type: 'listing',
          feedData: { title: 'Trailhead' },
        },
      ],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.feeds[0].provider).toBe('simpleview');
      expect(parsed.data.listings[0].status).toBe('active');
      expect(parsed.data.categoryMap[0].label).toBe('Experiences');
    }
  });

  it('rejects an unknown provider', () => {
    const parsed = ClientContentSchema.safeParse({
      feeds: [{ id: 'f1', provider: 'nope', config: {} }],
    });
    expect(parsed.success).toBe(false);
  });
});

describe('idToSlug', () => {
  it('kebab-cases provider ids', () => {
    expect(idToSlug('simpleview:Abc 123')).toBe('simpleview-abc-123');
    expect(idToSlug('manual:uuid-1')).toBe('manual-uuid-1');
  });
  it('falls back to "item" for empty/garbage', () => {
    expect(idToSlug('::')).toBe('item');
    expect(idToSlug('')).toBe('item');
  });
});

describe('resolveListing', () => {
  const base: ListingContentItem = {
    id: 'simpleview:42',
    source: 'f1',
    type: 'listing',
    feedCategory: 'Dining',
    feedData: { title: 'El Farolito', subcategory: 'Mexican' },
    override: {},
    flags: [],
    status: 'active',
  };

  it('merges feedData and derives a slug', () => {
    const resolved = resolveListing(base);
    expect(resolved).not.toBeNull();
    expect(resolved?.title).toBe('El Farolito');
    expect(resolved?.slug).toBe('simpleview-42');
  });

  it('override wins over feedData', () => {
    const resolved = resolveListing({
      ...base,
      override: { title: 'El Farolito (renamed)' },
    });
    expect(resolved?.title).toBe('El Farolito (renamed)');
  });

  it('returns null when the merge has no title', () => {
    expect(resolveListing({ ...base, feedData: {} })).toBeNull();
  });
});

describe('resolveEvent', () => {
  const base: EventContentItem = {
    id: 'wordpress:7',
    source: 'f2',
    type: 'event',
    feedCategory: 'Music',
    feedData: {
      title: 'Jazz Night',
      date: '2026-07-01',
      startTime: '18:00',
      endTime: '20:00',
    },
    override: {},
    flags: [],
    status: 'active',
  };

  it('resolves a valid event', () => {
    const resolved = resolveEvent(base);
    expect(resolved?.title).toBe('Jazz Night');
    expect(resolved?.slug).toBe('wordpress-7');
  });

  it('returns null when required fields are missing', () => {
    expect(resolveEvent({ ...base, feedData: { title: 'No date' } })).toBeNull();
  });
});

describe('isItemVisible', () => {
  it('active and flagged are visible; hidden and removed are not', () => {
    expect(isItemVisible({ status: 'active' })).toBe(true);
    expect(isItemVisible({ status: 'flagged' })).toBe(true);
    expect(isItemVisible({ status: 'hidden' })).toBe(false);
    expect(isItemVisible({ status: 'removed-upstream' })).toBe(false);
  });
});
