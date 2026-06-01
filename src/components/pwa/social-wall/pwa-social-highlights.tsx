'use client';

import { useState } from 'react';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { SocialHighlight } from '@/lib/config';

const FG = 'hsl(var(--foreground))';
const PWA = 'hsl(var(--pwa-primary))';
const OPEN_SANS = 'var(--font-open-sans)';

/** Círculo de highlight (estilo IG stories) con label opcional. */
function HighlightCircle({ item }: { item: SocialHighlight }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex w-[64px] shrink-0 flex-col items-center gap-1">
      <span
        className="flex h-[58px] w-[58px] items-center justify-center rounded-full"
        style={{ padding: 2, border: `2px solid ${PWA}` }}
      >
        {failed || !item.image ? (
          <span
            aria-hidden
            className="h-full w-full rounded-full"
            style={{
              background:
                'linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-secondary)))',
            }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveAssetUrl(item.image)}
            alt={item.label ?? ''}
            onError={() => setFailed(true)}
            className="h-full w-full rounded-full object-cover"
          />
        )}
      </span>
      {item.label ? (
        <span
          className="w-full truncate text-center"
          style={{ fontSize: 10, color: 'hsl(var(--foreground) / 0.7)', fontFamily: OPEN_SANS }}
        >
          {item.label}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Fila de Highlights + #hashtag (PWA). Bajo el sub-header: label "Highlights" +
 * círculos en scroll horizontal y el #hashtag a la derecha (como el banner del
 * kiosk, adaptado a móvil).
 */
export function PwaSocialHighlights({
  highlights,
  hashtag,
  highlightsLabel,
}: {
  highlights: SocialHighlight[];
  hashtag: string;
  highlightsLabel: string;
}) {
  return (
    <div
      className="shrink-0 border-b px-4 pb-3 pt-2.5"
      style={{ borderColor: 'hsl(var(--foreground) / 0.1)' }}
    >
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-bold" style={{ fontSize: 13, color: FG, fontFamily: OPEN_SANS }}>
          {highlightsLabel}
        </span>
        {hashtag ? (
          <span className="font-bold" style={{ fontSize: 15, color: PWA, fontFamily: OPEN_SANS }}>
            #{hashtag}
          </span>
        ) : null}
      </div>
      <div className="scrollbar-hide flex gap-3 overflow-x-auto">
        {highlights.map((h) => (
          <HighlightCircle key={h.id} item={h} />
        ))}
      </div>
    </div>
  );
}
