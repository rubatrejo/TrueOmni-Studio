import { NextResponse } from 'next/server';

import { materializeFeedImages } from '@/lib/ingest/materialize-images';
import { mergeItems } from '@/lib/ingest/merge';
import { dedupeById, normalizeEvent, normalizeListing } from '@/lib/ingest/normalize';
import { getAdapter } from '@/lib/ingest/registry';
import type { EventContentItem, ListingContentItem } from '@/lib/studio/client-content';
import {
  loadClientContentOrEmpty,
  saveClientContentRaw,
  syncContentToProducts,
} from '@/lib/studio/client-content-sync';
import { loadClientManifest } from '@/lib/studio/client-manifest';
import { checkKvValueSize } from '@/lib/studio/kv-size-guard';
import { isValidStudioSlug } from '@/lib/studio/slug';

export const dynamic = 'force-dynamic';
// El sync hace fetch de feeds externos + propagación a productos; damos margen
// para que un feed lento no tumbe la función serverless (default Vercel ~10-15s).
export const maxDuration = 60;

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/** Persiste el estado de error en la conexión (para que la UI lo muestre). */
async function markFeedError(
  slug: string,
  content: Awaited<ReturnType<typeof loadClientContentOrEmpty>>,
  feedId: string,
  message: string,
  now: string,
): Promise<void> {
  const feeds = content.feeds.map((f) =>
    f.id === feedId
      ? {
          ...f,
          lastSyncedAt: now,
          lastSyncStatus: 'error' as const,
          lastSyncError: message.slice(0, 300),
        }
      : f,
  );
  await saveClientContentRaw(slug, {
    ...content,
    feeds,
    currentVersion: content.currentVersion + 1,
  });
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
    await markFeedError(slug, content, feedId, message, now);
    return NextResponse.json({ error: 'feed fetch failed', message }, { status: 502 });
  }

  // 2-4. Normaliza → merge → guard → persiste → propaga. Todo en try/catch para
  // que un fallo NO deje la conexión en "never synced" silencioso: se persiste
  // el estado de error y se devuelve un mensaje accionable.
  try {
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

    // Materializa las imágenes externas del feed a nuestro Blob ANTES del merge,
    // así el `feedData.image` que se persiste apunta a una URL estable bajo
    // nuestro control (no al CDN del proveedor, que puede expirar/403). Gated por
    // BLOB_READ_WRITE_TOKEN e idempotente: sin token o ante un fallo conserva la
    // URL externa, nunca aborta el sync.
    const [matListings, matEvents] = await Promise.all([
      materializeFeedImages(slug, normListings),
      materializeFeedImages(slug, normEvents),
    ]);

    const listingMerge = mergeItems(content.listings, matListings, feedId);
    const eventMerge = mergeItems(content.events, matEvents, feedId);

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

    const size = checkKvValueSize(next);
    if (size.tooLarge) {
      const msg = `El feed sincronizado supera el límite de almacenamiento (${size.sizeKb} KB de ${size.capKb} KB).`;
      await markFeedError(slug, content, feedId, msg, now);
      return NextResponse.json(
        {
          error: 'content too large after sync',
          message: msg,
          sizeKb: size.sizeKb,
          capKb: size.capKb,
        },
        { status: 413 },
      );
    }

    await saveClientContentRaw(slug, next);

    // Propaga el contenido fresco al kiosk (compartido con la PWA). Best-effort.
    const propagation = await syncContentToProducts(slug);

    return NextResponse.json({
      ok: true,
      version: next.currentVersion,
      diff: { listings: listingMerge.diff, events: eventMerge.diff, summary },
      propagation,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await markFeedError(slug, content, feedId, message, now).catch(() => {});
    return NextResponse.json({ error: 'sync failed', message }, { status: 500 });
  }
}
