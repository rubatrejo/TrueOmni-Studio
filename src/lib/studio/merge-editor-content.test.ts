import { describe, expect, it } from 'vitest';

import {
  mergeEditorContent,
  suggestModuleForCategory,
  type ClientContent,
  type EventContentItem,
  type FeedConnection,
  type ListingContentItem,
} from './client-content';

/**
 * Tests del merge anti-clobber del autosave (`mergeEditorContent`). El bug:
 * el editor manda todo el ClientContent en estado local stale tras un Sync y
 * pisaba los listings/events recién sincronizados. El merge debe proteger los
 * items de feed (source != 'manual') y solo aplicar las ediciones del editor.
 */

function listing(
  id: string,
  source: string,
  over: Partial<ListingContentItem> = {},
): ListingContentItem {
  return {
    id,
    source,
    type: 'listing',
    feedCategory: 'Restaurants',
    feedData: { title: `Title ${id}` },
    override: {},
    flags: [],
    status: 'active',
    ...over,
  };
}

function feed(id: string, over: Partial<FeedConnection> = {}): FeedConnection {
  return {
    id,
    provider: 'custom',
    label: 'Custom',
    config: {},
    enabled: true,
    lastSyncStatus: 'never',
    ...over,
  };
}

function content(over: Partial<ClientContent> = {}): ClientContent {
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

describe('mergeEditorContent', () => {
  it('un editor stale (listings vacíos) NO borra los items de feed del servidor', () => {
    const server = content({
      listings: [listing('feed:1:a', 'feed:1'), listing('feed:1:b', 'feed:1')],
    });
    const incoming = content({ listings: [] }); // editor stale post-sync
    const merged = mergeEditorContent(server, incoming);
    expect(merged.listings.map((l) => l.id)).toEqual(['feed:1:a', 'feed:1:b']);
  });

  it('aplica override + status del editor sobre el item de feed (feedData del servidor)', () => {
    const server = content({ listings: [listing('feed:1:a', 'feed:1')] });
    const incoming = content({
      listings: [
        listing('feed:1:a', 'feed:1', {
          feedData: { title: 'STALE' }, // debe ignorarse (gana el servidor)
          override: { title: 'Editado por el operador' },
          status: 'hidden',
        }),
      ],
    });
    const merged = mergeEditorContent(server, incoming);
    expect(merged.listings[0].feedData.title).toBe('Title feed:1:a'); // del servidor
    expect(merged.listings[0].override.title).toBe('Editado por el operador'); // del editor
    expect(merged.listings[0].status).toBe('hidden'); // del editor
  });

  it('incluye items manuales nuevos del editor', () => {
    const server = content({ listings: [listing('feed:1:a', 'feed:1')] });
    const incoming = content({
      listings: [listing('feed:1:a', 'feed:1'), listing('manual:x', 'manual')],
    });
    const merged = mergeEditorContent(server, incoming);
    expect(merged.listings.map((l) => l.id).sort()).toEqual(['feed:1:a', 'manual:x']);
  });

  it('borra un item manual que el editor quitó (pero NO los de feed)', () => {
    const server = content({
      listings: [listing('feed:1:a', 'feed:1'), listing('manual:x', 'manual')],
    });
    const incoming = content({ listings: [listing('feed:1:a', 'feed:1')] }); // sin el manual
    const merged = mergeEditorContent(server, incoming);
    expect(merged.listings.map((l) => l.id)).toEqual(['feed:1:a']);
  });

  it('conserva el estado de sync (lastSync*) del servidor en una conexión que el editor trae stale', () => {
    const server = content({
      feeds: [feed('feed:1', { lastSyncStatus: 'ok', lastSyncedAt: '2026-06-11T00:00:00Z' })],
    });
    const incoming = content({
      feeds: [feed('feed:1', { label: 'Renombrada', lastSyncStatus: 'never' })],
    });
    const merged = mergeEditorContent(server, incoming);
    expect(merged.feeds[0].label).toBe('Renombrada'); // edición del editor
    expect(merged.feeds[0].lastSyncStatus).toBe('ok'); // del servidor
    expect(merged.feeds[0].lastSyncedAt).toBe('2026-06-11T00:00:00Z');
  });

  it('toma el categoryMap del editor', () => {
    const server = content({ categoryMap: [] });
    const incoming = content({
      categoryMap: [
        {
          feedId: 'feed:1',
          feedCategory: 'Restaurants',
          moduleKey: 'restaurants',
          label: 'Dine',
          subcategory: '',
          contentType: 'listing',
        },
      ],
    });
    const merged = mergeEditorContent(server, incoming);
    expect(merged.categoryMap).toHaveLength(1);
    expect(merged.categoryMap[0].moduleKey).toBe('restaurants');
  });

  it('events: mismo merge que listings (feed protegido, manual editable)', () => {
    const ev = (id: string, source: string): EventContentItem => ({
      id,
      source,
      type: 'event',
      feedCategory: 'Festivals',
      feedData: { title: id },
      override: {},
      flags: [],
      status: 'active',
    });
    const server = content({ events: [ev('feed:1:e1', 'feed:1')] });
    const incoming = content({ events: [] });
    const merged = mergeEditorContent(server, incoming);
    expect(merged.events.map((e) => e.id)).toEqual(['feed:1:e1']);
  });
});

describe('suggestModuleForCategory', () => {
  it('events siempre → módulo events', () => {
    expect(suggestModuleForCategory('Cualquier Cosa', 'event')).toEqual({
      moduleKey: 'events',
      label: 'Events',
    });
  });

  it('comida/bebida → restaurants/Dine', () => {
    for (const c of ['Restaurants', 'Dining', 'Food & Drink', 'Coffee Shops', 'Breweries']) {
      expect(suggestModuleForCategory(c, 'listing').moduleKey).toBe('restaurants');
    }
  });

  it('hospedaje → stay/Stay', () => {
    for (const c of ['Hotels', 'Lodging', 'Bed & Breakfast', 'Resorts', 'Campgrounds']) {
      expect(suggestModuleForCategory(c, 'listing').moduleKey).toBe('stay');
    }
  });

  it('el resto de listings → things-to-do/Experiences (default)', () => {
    for (const c of ['Attractions', 'Shopping', 'Meeting Venues', 'Outdoor Recreation', '']) {
      const s = suggestModuleForCategory(c, 'listing');
      expect(s.moduleKey).toBe('things-to-do');
      expect(s.label).toBe('Experiences');
    }
  });
});
