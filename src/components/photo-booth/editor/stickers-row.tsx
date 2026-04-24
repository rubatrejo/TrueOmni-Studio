'use client';

import type { PhotoBoothSticker } from '@/lib/config';

interface StickersRowProps {
  stickers: Array<PhotoBoothSticker & { resolvedImage: string }>;
  onAdd: (sticker: PhotoBoothSticker & { resolvedImage: string }) => void;
}

/**
 * Fila horizontal scrollable de stickers. Verbatim del SVG
 * `4-Photo_Booth-Experience.svg` stickers row en y=467 con 11 emojis
 * de 105×105.
 *
 * Tap añade el sticker al centro de la foto (`onAdd`).
 */
export function StickersRow({ stickers, onAdd }: StickersRowProps) {
  if (stickers.length === 0) return null;
  return (
    <div
      className="absolute overflow-x-auto"
      style={{
        left: 0,
        top: 455,
        width: 1080,
        height: 140,
        display: 'flex',
        alignItems: 'center',
        gap: 48,
        padding: '16px 48px',
        background: '#1796d6',
        scrollbarWidth: 'none',
      }}
    >
      {stickers.map((s) => (
        <button
          key={s.id}
          type="button"
          aria-label={s.label}
          onClick={() => onAdd(s)}
          style={{
            flex: '0 0 auto',
            width: 105,
            height: 105,
            padding: 0,
            border: 'none',
            background: 'transparent',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.resolvedImage}
            alt=""
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </button>
      ))}
    </div>
  );
}
