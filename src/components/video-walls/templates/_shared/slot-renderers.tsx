'use client';

import { cellRectToPx, type CellRect } from '@/lib/video-walls/dimensions';
import type {
  VideoWallClientResolved,
  VideoWallEvent,
  VideoWallModuleInstance,
  VideoWallSlotConfig,
} from '@/lib/video-walls/schema';

/**
 * Renderers compartidos por los templates video-walls. Cada uno recibe
 * un slot (cellRect) + el módulo del slide + el client resuelto y
 * pinta SU porción del canvas total con coordenadas absolutas.
 *
 * Patrón: el template padre define los slots, este file los renderea.
 * Esto evita duplicar el JSX de video/ad/events/social en cada template.
 *
 * Asset URL resolution: si el módulo trae una URL absoluta o relativa
 * `/...`, se usa tal cual. Si trae path relativo, se resuelve a
 * `/video-wall-assets/{slug}/{path}` (endpoint que VW9 implementa; por
 * ahora cae a 404 y los templates muestran placeholder).
 *
 * Fallback: si no hay módulo asignado al slot, pinta un placeholder
 * neutro con el nombre del slot para que el editor sepa qué falta.
 */

function urlOr(clientSlug: string, raw: string | undefined, fallback: string): string {
  const u = raw && raw.length > 0 ? raw : fallback;
  return u.startsWith('/') || u.startsWith('http') ? u : `/video-wall-assets/${clientSlug}/${u}`;
}

export function findSlot(
  slots: VideoWallSlotConfig[],
  key: string,
): VideoWallModuleInstance | null {
  return slots.find((s) => s.slotKey === key)?.module ?? null;
}

/** Renderer del slot `video` (módulo kind=video-image). Muestra
 *  <video> autoplay loop muted, o <img> si el asset es imagen. */
export function VideoImageSlot({
  client,
  rect,
  module,
}: {
  client: VideoWallClientResolved;
  rect: CellRect;
  module: VideoWallModuleInstance | null;
}) {
  const px = cellRectToPx(rect, false);
  const isVideo = module?.kind === 'video-image' && module.asset.kind === 'video';
  const url =
    module?.kind === 'video-image'
      ? urlOr(client.slug, module.asset.url, 'assets/video-image/pool.png')
      : null;
  return (
    <div className="absolute overflow-hidden bg-black" style={px}>
      {url ? (
        isVideo ? (
          <video src={url} autoPlay loop muted playsInline className="h-full w-full object-cover" />
        ) : (
          <img src={url} alt="" className="h-full w-full object-cover" />
        )
      ) : (
        <PlaceholderText label="video / image" px={px} />
      )}
    </div>
  );
}

/** Renderer del slot `ad` (módulo kind=ads). Image-first; soporta video. */
export function AdSlot({
  client,
  rect,
  module,
}: {
  client: VideoWallClientResolved;
  rect: CellRect;
  module: VideoWallModuleInstance | null;
}) {
  const px = cellRectToPx(rect, false);
  const isVideo = module?.kind === 'ads' && module.asset.kind === 'video';
  const url =
    module?.kind === 'ads' ? urlOr(client.slug, module.asset.url, 'assets/ads/full-ad.png') : null;
  return (
    <div
      className="absolute overflow-hidden"
      style={{ ...px, backgroundColor: 'hsl(var(--signage-stage-bg, 222 47% 5%))' }}
    >
      {url ? (
        isVideo ? (
          <video src={url} autoPlay loop muted playsInline className="h-full w-full object-cover" />
        ) : (
          <img src={url} alt="" className="h-full w-full object-cover" />
        )
      ) : (
        <PlaceholderText label="ad" px={px} />
      )}
    </div>
  );
}

/** Renderer del slot `events` (módulo kind=events). Grid Mx2 con event
 *  cards: image + date badge + title. El layout (cols × rows) se
 *  ajusta al `colSpan/rowSpan` del slot pasando `cols` y `rows` props. */
export function EventsSlot({
  client,
  rect,
  module,
  cols,
  rows,
}: {
  client: VideoWallClientResolved;
  rect: CellRect;
  module: VideoWallModuleInstance | null;
  cols: number;
  rows: number;
}) {
  const px = cellRectToPx(rect, false);
  const maxItems = module?.kind === 'events' ? module.maxItems : cols * rows;
  const events = (client.events ?? []).slice(0, maxItems);
  return (
    <div className="absolute bg-black" style={px}>
      <div
        className="h-full w-full p-4"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          gap: 16,
        }}
      >
        {Array.from({ length: cols * rows }).map((_, i) => {
          const ev = events[i];
          return ev ? (
            <EventCard key={ev.id ?? i} event={ev} clientSlug={client.slug} />
          ) : (
            <div
              key={i}
              className="rounded-md"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            />
          );
        })}
      </div>
    </div>
  );
}

function EventCard({ event, clientSlug }: { event: VideoWallEvent; clientSlug: string }) {
  const url = event.image
    ? urlOr(clientSlug, event.image, 'assets/events/yoga.jpg')
    : urlOr(clientSlug, undefined, 'assets/events/yoga.jpg');
  const date = new Date(event.startsAt);
  const day = Number.isFinite(date.getTime()) ? date.getDate() : '?';
  const month = Number.isFinite(date.getTime())
    ? date.toLocaleString('en', { month: 'short' }).toUpperCase()
    : '';
  return (
    <div className="relative overflow-hidden rounded-md bg-zinc-900">
      <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute right-3 top-3 rounded bg-white px-2 py-1 text-center text-zinc-900">
        <div className="font-display text-3xl font-extrabold leading-none">{day}</div>
        <div className="font-mono text-[10px] tracking-widest">{month}</div>
      </div>
      <div
        className="absolute inset-x-0 bottom-0 px-3 py-3"
        style={{
          background:
            'linear-gradient(to top, hsl(var(--signage-brand-primary, 211 100% 25%)) 0%, hsl(var(--signage-brand-primary, 211 100% 25%) / 0) 100%)',
          color: 'white',
        }}
      >
        <div className="line-clamp-2 font-display text-sm font-semibold">{event.title}</div>
      </div>
    </div>
  );
}

/** Renderer del slot `social` (módulo kind=social). Grid N×N de
 *  posts con image + @username overlay. */
export function SocialSlot({
  client,
  rect,
  module,
  cols,
  rows,
}: {
  client: VideoWallClientResolved;
  rect: CellRect;
  module: VideoWallModuleInstance | null;
  cols: number;
  rows: number;
}) {
  const px = cellRectToPx(rect, false);
  const maxPosts = module?.kind === 'social' ? module.maxPosts : cols * rows;
  const posts = (client.social?.posts ?? []).slice(0, Math.min(maxPosts, cols * rows));
  return (
    <div className="absolute bg-black" style={px}>
      <div
        className="h-full w-full"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          gap: 0,
        }}
      >
        {Array.from({ length: cols * rows }).map((_, i) => {
          const p = posts[i];
          const url = p?.image ? urlOr(client.slug, p.image, 'assets/social/post-1.jpg') : null;
          return (
            <div key={i} className="relative overflow-hidden">
              {url ? (
                <img src={url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-zinc-800" />
              )}
              {p?.author && (
                <div
                  className="absolute inset-x-0 bottom-0 px-3 py-2 text-white"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                  }}
                >
                  <span className="font-mono text-[11px]">@{p.author}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlaceholderText({
  label,
  px,
}: {
  label: string;
  px: { x: number; y: number; w: number; h: number };
}) {
  const fontSize = Math.min(px.w, px.h) * 0.1;
  return (
    <div
      className="flex h-full w-full items-center justify-center text-white/40"
      style={{
        fontSize,
        fontFamily: 'system-ui, sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}
    >
      {label}
    </div>
  );
}
