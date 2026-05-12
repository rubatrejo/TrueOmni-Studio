'use client';

import type { SignageEvent, SignageSocialPost } from '@/lib/signage/schema';

/**
 * Renderers SVG inline pixel-perfect contra el XD para cards de Events
 * y Social usadas por los templates 3×2.
 *
 * Coords y dims verbatim del XD `designs/video-walls/3x2/*.svg`:
 *
 *   Event card (640×{745|1080}):
 *     - Image bg full card.
 *     - Bottom panel rect(0, h-200, 640, 200) fill #004f8b opacity 0.8.
 *     - Title text (52.969, h-156) fontSize 26 OpenSans-Bold #fff,
 *       2 tspans y=28 / y=64.
 *     - Subtitle text (52.969, h-71) fontSize 20 OpenSans #fff,
 *       1 tspan y=21.
 *     - Date badge rect(0, 30, 214, 185.59) fill #1796d6.
 *     - Day-name fontSize 30 OpenSans-Medium #fff, center top portion.
 *     - Day-number fontSize 92 OpenSans #fff, center bottom portion.
 *
 *   Social card (W×H):
 *     - Image bg full card.
 *     - linearGradient overlay verbatim XD: x1=0.5 x2=0.5 y2=1
 *       stop 0 #444 opacity 0, stop 1 #004f8b.
 *     - @username text bottom-left fontSize 30 (cards 640w) o 20
 *       (cards 480w) OpenSans-Bold #fff letter-spacing 0.026em.
 */

const FONT_BODY = "'Open Sans', system-ui, sans-serif";

export function resolveAssetUrl(slug: string, raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith('http') || raw.startsWith('/') || raw.startsWith('data:')) return raw;
  return `/video-wall-assets/${slug}/${raw}`;
}

function formatDay(date: Date): string {
  return Number.isFinite(date.getTime()) ? String(date.getDate()) : '—';
}

function formatDayName(date: Date, locale = 'en'): string {
  return Number.isFinite(date.getTime()) ? date.toLocaleString(locale, { weekday: 'long' }) : 'Day';
}

export function EventCardSvg({
  x,
  y,
  w,
  h,
  event,
  clientSlug,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  event: SignageEvent | null;
  clientSlug: string;
}) {
  const imageUrl = event?.image ? resolveAssetUrl(clientSlug, event.image) : null;
  const eventDate = event ? new Date(event.startsAt) : new Date(NaN);
  const day = event ? formatDay(eventDate) : '—';
  const dayName = event ? formatDayName(eventDate) : '';
  const title = event?.title ?? '';
  const subtitle = event?.location ?? '';

  return (
    <g transform={`translate(${x} ${y})`}>
      {/* Image bg */}
      <rect width={w} height={h} fill="#1a1a1a" />
      {imageUrl ? (
        <image
          href={imageUrl}
          x="0"
          y="0"
          width={w}
          height={h}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : null}

      {/* Bottom panel #004f8b opacity 0.8 */}
      <rect x="0" y={h - 200} width={w} height="200" fill="#004f8b" opacity="0.8" />

      {/* Title (2 lines max) */}
      <text
        x={52.969}
        y={h - 156}
        fill="#fff"
        fontSize="26"
        fontFamily={FONT_BODY}
        fontWeight="700"
      >
        <tspan x={52.969} dy="28">
          {truncate(title, 24)}
        </tspan>
        <tspan x={52.969} dy="36">
          {title.length > 24 ? truncate(title.slice(24), 22) : ''}
        </tspan>
      </text>

      {/* Subtitle */}
      <text x={52.969} y={h - 71} fill="#fff" fontSize="20" fontFamily={FONT_BODY}>
        <tspan x={52.969} dy="21">
          {subtitle}
        </tspan>
      </text>

      {/* Date badge */}
      <rect x="0" y="30" width="214" height="185.59" fill="#1796d6" />
      <text
        x="107"
        y="75"
        fill="#fff"
        fontSize="30"
        fontFamily={FONT_BODY}
        fontWeight="500"
        textAnchor="middle"
      >
        {dayName}
      </text>
      <text x="107" y="180" fill="#fff" fontSize="92" fontFamily={FONT_BODY} textAnchor="middle">
        {day}
      </text>
    </g>
  );
}

export function SocialCardSvg({
  x,
  y,
  w,
  h,
  post,
  clientSlug,
  largeUsername,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  post: SignageSocialPost | null;
  clientSlug: string;
  /** True para cards 640×744 (fontSize 30). False para 480×540 (fontSize 20). */
  largeUsername: boolean;
}) {
  const imageUrl = post?.image ? resolveAssetUrl(clientSlug, post.image) : null;
  const username = post?.author ?? '';
  const fontSize = largeUsername ? 30 : 20;
  const usernameX = largeUsername ? 66 : 47;
  const usernameY = largeUsername ? h - 38 : h - 32;

  return (
    <g transform={`translate(${x} ${y})`}>
      {/* Image bg */}
      <rect width={w} height={h} fill="#1a1a1a" />
      {imageUrl ? (
        <image
          href={imageUrl}
          x="0"
          y="0"
          width={w}
          height={h}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : null}

      {/* Gradient overlay top transparent → bottom #004f8b */}
      <rect width={w} height={h} fill="url(#social-gradient)" />

      {/* @username bottom-left */}
      {username ? (
        <text
          x={usernameX}
          y={usernameY}
          fill="#fff"
          fontSize={fontSize}
          fontFamily={FONT_BODY}
          fontWeight="700"
          letterSpacing="0.026em"
        >
          @{username}
        </text>
      ) : null}
    </g>
  );
}

export function SocialGradientDefs() {
  return (
    <defs>
      <linearGradient
        id="social-gradient"
        x1="0.5"
        x2="0.5"
        y2="1"
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0" stopColor="#444" stopOpacity="0" />
        <stop offset="1" stopColor="#004f8b" />
      </linearGradient>
    </defs>
  );
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}
