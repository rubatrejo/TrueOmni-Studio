import { describe, expect, it } from 'vitest';

import {
  buildResyncToast,
  pinTargets,
  resyncToastVariant,
  selectableSlugs,
  summarizeResync,
  unpinTargets,
  type ResyncOutcome,
  type SelectableClientLike,
} from './bulk-selection';

const CLIENTS: SelectableClientLike[] = [
  { slug: 'default', pinned: false },
  { slug: 'acme', pinned: true },
  { slug: 'globex', pinned: false },
  { slug: 'initech', pinned: false },
];

describe('selectableSlugs', () => {
  it('excluye el cliente protegido `default`', () => {
    expect(selectableSlugs(CLIENTS)).toEqual(['acme', 'globex', 'initech']);
  });

  it('devuelve [] si solo existe default', () => {
    expect(selectableSlugs([{ slug: 'default', pinned: false }])).toEqual([]);
  });
});

describe('pinTargets / unpinTargets', () => {
  it('pin: solo los seleccionados que NO están pinned', () => {
    const sel = new Set(['acme', 'globex']);
    expect(pinTargets(CLIENTS, sel)).toEqual(['globex']);
  });

  it('unpin: solo los seleccionados que SÍ están pinned', () => {
    const sel = new Set(['acme', 'globex']);
    expect(unpinTargets(CLIENTS, sel)).toEqual(['acme']);
  });

  it('selección vacía → sin targets', () => {
    const empty = new Set<string>();
    expect(pinTargets(CLIENTS, empty)).toEqual([]);
    expect(unpinTargets(CLIENTS, empty)).toEqual([]);
  });

  it('ignora slugs seleccionados que ya no existen en la lista', () => {
    const sel = new Set(['fantasma', 'globex']);
    expect(pinTargets(CLIENTS, sel)).toEqual(['globex']);
  });
});

describe('summarizeResync', () => {
  it('cuenta cada outcome', () => {
    const outcomes: ResyncOutcome[] = ['resynced', 'skipped', 'skipped', 'failed', 'resynced'];
    expect(summarizeResync(outcomes)).toEqual({ resynced: 2, skipped: 2, failed: 1 });
  });

  it('lista vacía → todo en cero', () => {
    expect(summarizeResync([])).toEqual({ resynced: 0, skipped: 0, failed: 0 });
  });
});

describe('buildResyncToast', () => {
  it('todo resynced → solo el conteo', () => {
    expect(buildResyncToast({ resynced: 3, skipped: 0, failed: 0 })).toBe('Resynced 3');
  });

  it('expone skipped con la razón', () => {
    expect(buildResyncToast({ resynced: 1, skipped: 2, failed: 0 })).toBe(
      'Resynced 1 · skipped 2 (no filesystem template)',
    );
  });

  it('expone fallos', () => {
    expect(buildResyncToast({ resynced: 0, skipped: 1, failed: 2 })).toBe(
      'Resynced 0 · skipped 1 (no filesystem template) · 2 failed',
    );
  });
});

describe('resyncToastVariant', () => {
  it('error si hay fallos', () => {
    expect(resyncToastVariant({ resynced: 1, skipped: 1, failed: 1 })).toBe('error');
  });

  it('warning si hay skipped pero no fallos', () => {
    expect(resyncToastVariant({ resynced: 1, skipped: 1, failed: 0 })).toBe('warning');
  });

  it('success si todo se resyncó', () => {
    expect(resyncToastVariant({ resynced: 2, skipped: 0, failed: 0 })).toBe('success');
  });
});
