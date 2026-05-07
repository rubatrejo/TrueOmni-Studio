'use client';

import { useEffect, useState } from 'react';

import type { SignageNewsItem } from '@/lib/signage/schema';

/**
 * `<SignageNewsTicker>` — slideshow rotativo de news items.
 *
 * Renderea un solo item a la vez en formato "Title: body" donde el title va en
 * bold y el body en semibold. Cambia al siguiente item cada `intervalSec`
 * segundos. Si solo hay 1 item, no rota. Si no hay items, oculta el contenedor.
 *
 * View-only — cero handlers touch/click/keyboard.
 */
export interface SignageNewsTickerProps {
  items: SignageNewsItem[];
  intervalSec: number;
}

export function SignageNewsTicker({ items, intervalSec }: SignageNewsTickerProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, intervalSec * 1000);
    return () => window.clearInterval(id);
  }, [items.length, intervalSec]);

  const item = items[index];
  if (!item) return null;

  return (
    <div className="flex h-full w-full items-center font-sans text-signage-text-on-brand">
      <p
        className="overflow-hidden"
        style={{ fontSize: 21, lineHeight: '35px' }}
      >
        <span className="font-bold">{item.title}:</span>{' '}
        <span style={{ fontWeight: 600 }}>{item.body}</span>
      </p>
    </div>
  );
}
