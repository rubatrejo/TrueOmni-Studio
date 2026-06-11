import { NextResponse } from 'next/server';

import { mergeItems } from '@/lib/ingest/merge';
import { dedupeById, normalizeEvent, normalizeListing } from '@/lib/ingest/normalize';
import { getAdapter } from '@/lib/ingest/registry';
import type { EventContentItem, ListingContentItem } from '@/lib/studio/client-content';
import { loadClientContentOrEmpty, saveClientContentRaw } from '@/lib/studio/client-content-sync';
import { loadClientManifest } from '@/lib/studio/client-manifest';
import { checkKvValueSize } from '@/lib/studio/kv-size-guard';
import { isValidStudioSlug } from '@/lib/studio/slug';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * `POST /api/studio/clients/[slug]/content/sync` — sincroniza UNA conexión de
 * feed: corre el adaptador (fetch) → normaliza → merge por ID sobre el contenido
 * existente → persiste. Body: `{ feedId }`.
 *
 * Conserva las ediciones manuales (override) y los items de otros feeds/manuales
 * (ver `mergeItems`). Devuelve el diff (added/updated/removed) y actualiza el
 * estado de la conexión (lastSyncedAt / lastSyncStatus / lastSyncSummary).
 */
export async function POST(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  if (!isValidStudioSlug(slug)) {
    return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
  }
  const manifest = await loadClientManifest(slug);
  if (!manifest) {
    return NextResponse.json({ error: 'client not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const feedId = (body as { feedId?: unknown })?.feedId;
  if (typeof feedId !== 'string' || !feedId) {
    return NextResponse.json({ error: 'feedId required' }, { status: 400 });
  }

  const content = await loadClientContentOrEmpty(slug);
  const feed = content.feeds.find((f) => f.id === feedId);
  if (!feed) {
    return NextResponse.json({ error: 'feed not found' }, { status: 404 });
  }

  const now = new Date().toISOString();

  // 1. Fetch del proveedor. Si falla, marca la conexión como error y persiste.
  let raw;
  try {
    raw = await getAdapter(feed.provider).fetch(feed.config);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const feeds = content.feeds.map((f) =>
      f.id === feedId
        ? { ...f, lastSyncedAt: now, lastSyncStatus: 'error' as const, lastSyncError: message }
        : f,
    );
    await saveClientContentRaw(slug, {
      ...content,
      feeds,
      currentVersion: content.currentVersion + 1,
    });
    return NextResponse.json({ error: 'feed fetch failed', message }, { status: 502 });
  }

  // 2. Normaliza + dedup.
  const normListings = dedupeById(
    raw.listings
      .map((r) => normalizeListing(r, feedId, now))
      .filter((x): x is ListingContentItem => x !== null),
  ).items;
  const normEvents = dedupeById(
    raw.events
      .map((r) => normalizeEvent(r, feedId, now))
      .filter((x): x is EventContentItem => x !== null),
  ).items;

  // 3. Merge por ID (conserva overrides, marca removed-upstream).
  const listingMerge = mergeItems(content.listings, normListings, feedId);
  const eventMerge = mergeItems(content.events, normEvents, feedId);

  const summary = {
    added: listingMerge.diff.added + eventMerge.diff.added,
    updated: listingMerge.diff.updated + eventMerge.diff.updated,
    removed: listingMerge.diff.removed + eventMerge.diff.removed,
    total: listingMerge.diff.total + eventMerge.diff.total,
  };

  const feeds = content.feeds.map((f) =>
    f.id === feedId
      ? {
          ...f,
          lastSyncedAt: now,
          lastSyncStatus: 'ok' as const,
          lastSyncError: undefined,
          lastSyncSummary: summary,
        }
      : f,
  );

  const next = {
    ...content,
    feeds,
    listings: listingMerge.merged,
    events: eventMerge.merged,
    lastSyncAt: now,
    currentVersion: content.currentVersion + 1,
  };

  // 4. Guard de tamaño antes de escribir (un feed grande puede inflar el doc).
  const size = checkKvValueSize(next);
  if (size.tooLarge) {
    return NextResponse.json(
      { error: 'content too large after sync', sizeKb: size.sizeKb, capKb: size.capKb },
      { status: 413 },
    );
  }

  await saveClientContentRaw(slug, next);

  return NextResponse.json({
    ok: true,
    version: next.currentVersion,
    diff: { listings: listingMerge.diff, events: eventMerge.diff, summary },
  });
}
