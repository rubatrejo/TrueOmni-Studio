'use client';

import type { Deal } from '@/lib/config';

import { DealCard } from './deal-card';

/**
 * Grid 3-col de deals. Padding simétrico para que las cards queden centradas
 * dentro del canvas 1080. 3 × 306 + 2 × 18 (gap) = 954 → padding lateral = 63.
 */
export function DealsGrid({
  deals,
  emptyLabel,
  expiresPrefix,
}: {
  deals: readonly Deal[];
  emptyLabel: string;
  expiresPrefix: string;
}) {
  if (deals.length === 0) {
    return (
      <div
        className="flex h-full w-full items-start justify-center"
        style={{ padding: '80px 40px 0', color: '#6e6e6e' }}
      >
        <span
          className="font-sans"
          style={{ fontSize: '22px', lineHeight: '28px', fontWeight: 500, textAlign: 'center' }}
        >
          {emptyLabel}
        </span>
      </div>
    );
  }

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: 'repeat(3, 306px)',
        columnGap: '18px',
        rowGap: '20px',
        justifyContent: 'center',
        paddingTop: '24px',
        paddingBottom: '60px',
      }}
    >
      {deals.map((d) => (
        <DealCard key={d.slug} deal={d} expiresPrefix={expiresPrefix} />
      ))}
    </div>
  );
}
