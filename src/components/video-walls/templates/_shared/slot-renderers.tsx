'use client';

import { type CSSProperties } from 'react';

import { cellRectToPx, type CellRect, type PixelRect } from '@/lib/video-walls/dimensions';
import type {
  VideoWallClientResolved,
  VideoWallEvent,
  VideoWallModuleInstance,
  VideoWallSlotConfig,
} from '@/lib/video-walls/schema';

/** Convierte PixelRect (`{x, y, w, h}`) a CSS válido (`left/top/width/height`).
 *  Crítico: pasar el PixelRect directo como `style` rompe el render porque
 *  `x/y/w/h` no son keys CSS — el div queda sin dimensiones y los hijos
 *  toman su tamaño natural. */
function pxToCss(px: PixelRect): CSSProperties {
  return { left: px.x, top: px.y, width: px.w, height: px.h };
}

/**
 * Renderers compartidos por los templates video-walls (3x2/4x2/2x2).
 * Cada uno recibe un slot (cellRect) + el módulo del slide + el client
 * resuelto y pinta SU porción del canvas total con coordenadas absolutas.
 *
 * **Events / Social cards** replican el design pixel-perfect del 3x2 pero
 * con dimensiones fluidas — el card adapta layout (horizontal vs portrait)
 * según el aspect del cell para que la información quede legible en
 * cualquier grid del catálogo.
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
  pxOverride,
}: {
  client: VideoWallClientResolved;
  rect: CellRect;
  module: VideoWallModuleInstance | null;
  pxOverride?: { x: number; y: number; w: number; h: number };
}) {
  const px = pxOverride ?? cellRectToPx(rect, false);
  const isVideo = module?.kind === 'video-image' && module.asset.kind === 'video';
  const url =
    module?.kind === 'video-image'
      ? urlOr(client.slug, module.asset.url, 'assets/video-image/pool.png')
      : null;
  return (
    <div className="absolute overflow-hidden bg-black" style={pxToCss(px)}>
      {url ? (
        isVideo ? (
          <video src={url} autoPlay loop muted playsInline className="h-full w-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- asset dinámico del cliente; next/image no aplica (src arbitrario en runtime)
          <img src={url} alt="" className="h-full w-full object-cover" />
        )
      ) : (
        <PlaceholderText label="video / image" px={px} />
      )}
    </div>
  );
}

/** Renderer del slot `ad` (módulo kind=ads). Image-first; soporta video.
 *  Si `pxOverride` viene definido se usa tal cual (sub-cell rects para
 *  composiciones donde no hay grid alignment, e.g. ad/social stack
 *  dentro de un solo TV). */
export function AdSlot({
  client,
  rect,
  module,
  pxOverride,
}: {
  client: VideoWallClientResolved;
  rect: CellRect;
  module: VideoWallModuleInstance | null;
  pxOverride?: { x: number; y: number; w: number; h: number };
}) {
  const px = pxOverride ?? cellRectToPx(rect, false);
  const isVideo = module?.kind === 'ads' && module.asset.kind === 'video';
  const url =
    module?.kind === 'ads' ? urlOr(client.slug, module.asset.url, 'assets/ads/full-ad.png') : null;
  return (
    <div
      className="absolute overflow-hidden"
      style={{ ...pxToCss(px), backgroundColor: 'hsl(var(--signage-stage-bg, 222 47% 5%))' }}
    >
      {url ? (
        isVideo ? (
          <video src={url} autoPlay loop muted playsInline className="h-full w-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- asset dinámico del cliente; next/image no aplica (src arbitrario en runtime)
          <img src={url} alt="" className="h-full w-full object-cover" />
        )
      ) : (
        <PlaceholderText label="ad" px={px} />
      )}
    </div>
  );
}

/** Renderer del slot `events` (módulo kind=events). Grid cols×rows con
 *  event cards que replican el design del 3x2 (image bg + date badge
 *  accent + bottom panel secondary con title/subtitle). Las dimensiones
 *  de cada card se pasan al EventCard para que adapte fuentes/spacing
 *  fluidamente — mismo design en cualquier aspect.
 *
 *  Si el cell es muy landscape (aspect > 1.8), cada card usa layout
 *  horizontal: date badge a la IZQUIERDA + texto a la derecha sobre la
 *  imagen. Si es cuadrado/portrait, usa layout estilo 3x2: badge top-left,
 *  title bottom-overlay. */
export function EventsSlot({
  client,
  rect,
  module,
  cols,
  rows,
  pxOverride,
}: {
  client: VideoWallClientResolved;
  rect: CellRect;
  module: VideoWallModuleInstance | null;
  cols: number;
  rows: number;
  pxOverride?: { x: number; y: number; w: number; h: number };
}) {
  const px = pxOverride ?? cellRectToPx(rect, false);
  const maxItems = module?.kind === 'events' ? module.maxItems : cols * rows;
  const events = (client.events ?? []).slice(0, maxItems);

  const padding = 16;
  const gap = 16;
  const cellW = (px.w - padding * 2 - gap * (cols - 1)) / cols;
  const cellH = (px.h - padding * 2 - gap * (rows - 1)) / rows;

  return (
    <div className="absolute bg-black" style={pxToCss(px)}>
      <div
        className="h-full w-full"
        style={{
          padding,
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          gap,
        }}
      >
        {Array.from({ length: cols * rows }).map((_, i) => {
          const ev = events[i];
          return ev ? (
            <EventCard key={ev.id ?? i} event={ev} clientSlug={client.slug} w={cellW} h={cellH} />
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

function EventCard({
  event,
  clientSlug,
  w,
  h,
}: {
  event: VideoWallEvent;
  clientSlug: string;
  w: number;
  h: number;
}) {
  const url = event.image
    ? urlOr(clientSlug, event.image, 'assets/events/yoga.jpg')
    : urlOr(clientSlug, undefined, 'assets/events/yoga.jpg');
  const date = new Date(event.startsAt);
  const day = Number.isFinite(date.getTime()) ? String(date.getDate()) : '?';
  const dayName = Number.isFinite(date.getTime())
    ? date.toLocaleString('en', { weekday: 'short' }).toUpperCase()
    : '';

  const aspect = w / h;
  const minDim = Math.min(w, h);
  // Layout switch: muy landscape → row layout (badge izq + texto centro);
  // cuadrado/portrait → 3x2-style con badge top-left + title bottom panel.
  const isHorizontal = aspect > 1.8;

  if (isHorizontal) {
    // Row layout — badge cuadrado izquierda, image fills rest, title bottom strip.
    const badgeSize = Math.min(h * 0.78, w * 0.22);
    const dayFs = Math.round(badgeSize * 0.42);
    const dayNameFs = Math.round(badgeSize * 0.16);
    const titleFs = Math.round(minDim * 0.13);
    const subtitleFs = Math.round(minDim * 0.085);

    return (
      <div className="relative overflow-hidden rounded-md bg-zinc-900">
        {/* eslint-disable-next-line @next/next/no-img-element -- asset dinámico del cliente; next/image no aplica (src arbitrario en runtime) */}
        <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {/* Date badge — accent color, square, anchored top-left con margen. */}
        <div
          className="absolute flex flex-col items-center justify-center font-display text-white shadow-lg"
          style={{
            left: 12,
            top: 12,
            width: badgeSize,
            height: badgeSize,
            background: 'hsl(var(--signage-brand-accent, 200 78% 47%))',
            lineHeight: 1,
          }}
        >
          <div style={{ fontSize: dayNameFs, fontWeight: 500, letterSpacing: '0.04em' }}>
            {dayName}
          </div>
          <div style={{ fontSize: dayFs, fontWeight: 700, marginTop: 2 }}>{day}</div>
        </div>
        {/* Bottom strip — secondary brand color con title + subtitle. */}
        <div
          className="absolute inset-x-0 bottom-0 flex flex-col justify-center text-white"
          style={{
            padding: '8px 16px',
            background: 'hsl(var(--signage-brand-secondary, 210 100% 27%) / 0.92)',
          }}
        >
          <div
            className="line-clamp-1 font-display font-semibold"
            style={{ fontSize: titleFs, lineHeight: 1.2 }}
          >
            {event.title}
          </div>
          {event.location ? (
            <div
              className="line-clamp-1 opacity-90"
              style={{ fontSize: subtitleFs, lineHeight: 1.2 }}
            >
              {event.location}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // Portrait/square layout — 3x2 style.
  const badgeW = Math.min(w * 0.35, 220);
  const badgeH = badgeW * 0.87;
  const dayFs = Math.round(badgeH * 0.5);
  const dayNameFs = Math.round(badgeH * 0.16);
  const titleFs = Math.round(minDim * 0.075);
  const subtitleFs = Math.round(minDim * 0.058);
  const bottomPanelH = Math.round(h * 0.27);

  return (
    <div className="relative overflow-hidden rounded-md bg-zinc-900">
      {/* eslint-disable-next-line @next/next/no-img-element -- asset dinámico del cliente; next/image no aplica (src arbitrario en runtime) */}
      <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {/* Date badge — accent color, top-left. */}
      <div
        className="absolute flex flex-col items-center justify-center font-display text-white shadow-lg"
        style={{
          left: 0,
          top: 16,
          width: badgeW,
          height: badgeH,
          background: 'hsl(var(--signage-brand-accent, 200 78% 47%))',
          lineHeight: 1,
        }}
      >
        <div style={{ fontSize: dayNameFs, fontWeight: 500, letterSpacing: '0.04em' }}>
          {dayName}
        </div>
        <div style={{ fontSize: dayFs, fontWeight: 700, marginTop: 4 }}>{day}</div>
      </div>
      {/* Bottom panel — secondary brand color, ~27% del card height. */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col justify-center text-white"
        style={{
          height: bottomPanelH,
          padding: '12px 18px',
          background: 'hsl(var(--signage-brand-secondary, 210 100% 27%) / 0.92)',
        }}
      >
        <div
          className="line-clamp-2 font-display font-semibold"
          style={{ fontSize: titleFs, lineHeight: 1.2 }}
        >
          {event.title}
        </div>
        {event.location ? (
          <div
            className="line-clamp-1 opacity-90"
            style={{ fontSize: subtitleFs, lineHeight: 1.2, marginTop: 4 }}
          >
            {event.location}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Renderer del slot `social` (módulo kind=social). Grid de posts con
 *  image + @username overlay y gradient brand-primary. Las dimensiones
 *  se pasan a cada SocialCard para que el username se escale fluidamente.
 *
 *  Cuando el cell es muy estrecho (cols=1 con muchas rows) y el aspect
 *  resultante de cada tile es extremo (>3 o <0.33), se recomputan
 *  cols/rows automáticamente para mantener tiles más cuadrados. */
export function SocialSlot({
  client,
  rect,
  module,
  cols,
  rows,
  pxOverride,
}: {
  client: VideoWallClientResolved;
  rect: CellRect;
  module: VideoWallModuleInstance | null;
  cols: number;
  rows: number;
  pxOverride?: { x: number; y: number; w: number; h: number };
}) {
  const px = pxOverride ?? cellRectToPx(rect, false);

  // Auto-fix de cols/rows cuando el resultado es ultra-stretched. Mantiene
  // el total cols*rows lo más cercano posible al original. Ej: cols=1
  // rows=3 en cell 1920×1080 → tiles 1920×360 aspect 5.3 → recomputa
  // cols=3 rows=2 para 640×540 aspect 1.18.
  const tileAspectInitial = px.w / cols / (px.h / rows);
  let effectiveCols = cols;
  let effectiveRows = rows;
  if (tileAspectInitial > 3) {
    // Tiles muy wide — añadir columnas.
    effectiveCols = Math.max(cols, Math.round(Math.sqrt((cols * rows * px.w) / px.h)));
    effectiveRows = Math.max(1, Math.round((cols * rows) / effectiveCols));
  } else if (tileAspectInitial < 0.33) {
    // Tiles muy tall — añadir rows.
    effectiveRows = Math.max(rows, Math.round(Math.sqrt((cols * rows * px.h) / px.w)));
    effectiveCols = Math.max(1, Math.round((cols * rows) / effectiveRows));
  }

  const maxPosts = module?.kind === 'social' ? module.maxPosts : effectiveCols * effectiveRows;
  const slots = effectiveCols * effectiveRows;
  const posts = (client.social?.posts ?? []).slice(0, Math.min(maxPosts, slots));
  const tileW = px.w / effectiveCols;
  const tileH = px.h / effectiveRows;

  return (
    <div className="absolute bg-black" style={pxToCss(px)}>
      <div
        className="h-full w-full"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${effectiveCols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${effectiveRows}, minmax(0, 1fr))`,
          gap: 0,
        }}
      >
        {Array.from({ length: slots }).map((_, i) => {
          const p = posts[i];
          const url = p?.image ? urlOr(client.slug, p.image, 'assets/social/post-1.jpg') : null;
          const author = p?.author?.replace(/^@+/, '') ?? '';
          const usernameFs = Math.max(12, Math.round(Math.min(tileW, tileH) * 0.06));
          return (
            <div key={i} className="relative overflow-hidden">
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element -- asset dinámico del cliente; next/image no aplica (src arbitrario en runtime)
                <img src={url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-zinc-800" />
              )}
              {/* Gradient overlay brand-primary, bottom→top. */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, hsl(var(--signage-brand-primary, 210 100% 27%)) 0%, hsl(var(--signage-brand-primary, 210 100% 27%) / 0) 50%)',
                }}
              />
              {author && (
                <div
                  className="absolute inset-x-0 bottom-0 px-3 py-2 text-white"
                  style={{ fontFamily: "'Open Sans', system-ui, sans-serif" }}
                >
                  <span
                    style={{
                      fontSize: usernameFs,
                      fontWeight: 700,
                      letterSpacing: '0.026em',
                    }}
                  >
                    @{author}
                  </span>
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
