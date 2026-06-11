import { describe, expect, it } from 'vitest';

import type { ListingContentItem } from '@/lib/studio/client-content';

import { mergeItems } from './merge';

function listing(
  id: string,
  source: string,
  over: Partial<ListingContentItem> = {},
): ListingContentItem {
  return {
    id,
    source,
    type: 'listing',
    feedCategory: 'Dining',
    feedData: { title: id },
    override: {},
    flags: [],
    status: 'active',
    firstSeenAt: '2026-01-01T00:00:00.000Z',
    lastSyncedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

describe('mergeItems', () => {
  it('adds new items', () => {
    const { merged, diff } = mergeItems([], [listing('feed1:a', 'feed1')], 'feed1');
    expect(merged).toHaveLength(1);
    expect(diff).toMatchObject({ added: 1, updated: 0, removed: 0, total: 1 });
  });

  it('updates existing item preserving override and firstSeenAt', () => {
    const existing = [
      listing('feed1:a', 'feed1', {
        override: { title: 'Manually renamed' },
        firstSeenAt: '2025-12-01T00:00:00.000Z',
        feedData: { title: 'Old name' },
      }),
    ];
    const incoming = [listing('feed1:a', 'feed1', { feedData: { title: 'Fresh name' } })];
    const { merged, diff } = mergeItems(existing, incoming, 'feed1');

    expect(diff.updated).toBe(1);
    const item = merged.find((m) => m.id === 'feed1:a')!;
    expect(item.feedData.title).toBe('Fresh name'); // feed refreshed
    expect(item.override.title).toBe('Manually renamed'); // override preserved
    expect(item.firstSeenAt).toBe('2025-12-01T00:00:00.000Z'); // original kept
  });

  it('preserves operator-hidden status across re-sync', () => {
    const existing = [listing('feed1:a', 'feed1', { status: 'hidden' })];
    const incoming = [listing('feed1:a', 'feed1', { status: 'active' })];
    const { merged } = mergeItems(existing, incoming, 'feed1');
    expect(merged.find((m) => m.id === 'feed1:a')!.status).toBe('hidden');
  });

  it('marks disappeared feed items as removed-upstream (not deleted)', () => {
    const existing = [listing('feed1:a', 'feed1'), listing('feed1:b', 'feed1')];
    const incoming = [listing('feed1:a', 'feed1')];
    const { merged, diff } = mergeItems(existing, incoming, 'feed1');

    expect(diff.removed).toBe(1);
    expect(merged.find((m) => m.id === 'feed1:b')!.status).toBe('removed-upstream');
    expect(merged).toHaveLength(2); // nothing deleted
  });

  it('reactivates an item that returns from removed-upstream', () => {
    const existing = [listing('feed1:a', 'feed1', { status: 'removed-upstream' })];
    const incoming = [listing('feed1:a', 'feed1', { status: 'active' })];
    const { merged } = mergeItems(existing, incoming, 'feed1');
    expect(merged.find((m) => m.id === 'feed1:a')!.status).toBe('active');
  });

  it('leaves items from other feeds and manual items untouched', () => {
    const existing = [
      listing('feed2:x', 'feed2'),
      listing('manual:1', 'manual'),
      listing('feed1:a', 'feed1'),
    ];
    const incoming = [listing('feed1:a', 'feed1')];
    const { merged, diff } = mergeItems(existing, incoming, 'feed1');

    expect(merged.find((m) => m.id === 'feed2:x')!.status).toBe('active');
    expect(merged.find((m) => m.id === 'manual:1')!.status).toBe('active');
    expect(diff.removed).toBe(0); // other-feed/manual not counted as removed
  });
});
