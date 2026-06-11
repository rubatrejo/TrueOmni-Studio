import { describe, expect, it } from 'vitest';

import { emptyClientContent } from './client-content';
import {
  loadClientContent,
  loadClientContentOrEmpty,
  saveClientContent,
} from './client-content-sync';

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
