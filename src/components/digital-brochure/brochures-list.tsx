'use client';

import type { BrochureItem } from '@/lib/config';

import { BrochureCard } from './brochure-card';

export function BrochuresList({
  brochures,
  moduleKey,
}: {
  brochures: readonly BrochureItem[];
  moduleKey: string;
}) {
  if (brochures.length === 0) {
    return (
      <div
        className="flex items-start justify-center"
        style={{ padding: '80px 40px', color: '#6e6e6e' }}
      >
        <span className="font-sans" style={{ fontSize: '22px', fontWeight: 500 }}>
          No brochures in this category yet.
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex w-full flex-col items-start"
      style={{
        paddingTop: '28px',
        paddingBottom: '60px',
        paddingLeft: '140px',
        paddingRight: '60px',
      }}
    >
      {brochures.map((b) => (
        <BrochureCard key={b.slug} brochure={b} moduleKey={moduleKey} />
      ))}
    </div>
  );
}
